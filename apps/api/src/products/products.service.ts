import { Injectable, ConflictException, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateProductDto } from './dto/create-product.dto'
import { UpdateProductDto } from './dto/update-product.dto'
import { ProductQueryDto, SortBy } from './dto/product-query.dto'
import { Prisma } from '@store/db'

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ProductQueryDto) {
    const { categoryId, minPrice, maxPrice, sortBy = SortBy.NEWEST, page = 1, limit = 20 } = query
    const skip = (page - 1) * limit

    const where: Prisma.ProductWhereInput = {
      ...(categoryId ? { categoryId } : {}),
      ...((minPrice !== undefined || maxPrice !== undefined)
        ? {
            basePrice: {
              ...(minPrice !== undefined ? { gte: minPrice } : {}),
              ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
            },
          }
        : {}),
    }

    const orderBy: Prisma.ProductOrderByWithRelationInput =
      sortBy === SortBy.PRICE_ASC ? { basePrice: 'asc' }
      : sortBy === SortBy.PRICE_DESC ? { basePrice: 'desc' }
      : { createdAt: 'desc' }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          category: true,
          variants: true,
          images: { orderBy: { position: 'asc' }, take: 1 },
        },
      }),
      this.prisma.product.count({ where }),
    ])

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async findOne(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        variants: true,
        images: { orderBy: { position: 'asc' } },
      },
    })
    if (!product) throw new NotFoundException('Product not found')

    const variantsWithOmnibus = await Promise.all(
      product.variants.map(async (variant) => {
        const rows = await this.prisma.$queryRaw<{ min_price: number | null }[]>`
          SELECT MIN(price)::float AS min_price
          FROM "PriceHistory"
          WHERE "variantId" = ${variant.id}
            AND "recordedAt" >= NOW() - INTERVAL '30 days'
        `
        return { ...variant, omnibusPrice: rows[0]?.min_price ?? null }
      }),
    )

    return { ...product, variants: variantsWithOmnibus }
  }

  async create(dto: CreateProductDto) {
    const existing = await this.prisma.product.findUnique({ where: { slug: dto.slug } })
    if (existing) throw new ConflictException('Slug already exists')

    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          name: dto.name,
          slug: dto.slug,
          description: dto.description,
          basePrice: dto.basePrice,
          categoryId: dto.categoryId,
          variants: {
            create: dto.variants.map((v) => ({
              sku: v.sku,
              price: v.price,
              stock: v.stock,
              attributes: v.attributes as Prisma.InputJsonValue,
            })),
          },
          images: {
            create: (dto.images ?? []).map((img, i) => ({
              url: img.url,
              altText: img.altText,
              position: img.position ?? i,
            })),
          },
        },
        include: { variants: true, images: true },
      })

      await tx.priceHistory.createMany({
        data: product.variants.map((v) => ({
          productId: product.id,
          variantId: v.id,
          price: v.price,
        })),
      })

      return product
    })
  }

  async update(id: string, dto: UpdateProductDto) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { variants: true },
    })
    if (!product) throw new NotFoundException('Product not found')

    if (dto.slug && dto.slug !== product.slug) {
      const conflict = await this.prisma.product.findFirst({ where: { slug: dto.slug, NOT: { id } } })
      if (conflict) throw new ConflictException('Slug already exists')
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.product.update({
        where: { id },
        data: {
          ...(dto.name !== undefined ? { name: dto.name } : {}),
          ...(dto.slug !== undefined ? { slug: dto.slug } : {}),
          ...(dto.description !== undefined ? { description: dto.description } : {}),
          ...(dto.basePrice !== undefined ? { basePrice: dto.basePrice } : {}),
          ...(dto.categoryId !== undefined ? { categoryId: dto.categoryId } : {}),
        },
        include: { variants: true },
      })

      if (dto.variants) {
        for (const variantDto of dto.variants) {
          const existing = product.variants.find((v) => v.sku === variantDto.sku)
          if (existing && Number(existing.price) !== variantDto.price) {
            await tx.productVariant.update({
              where: { id: existing.id },
              data: { price: variantDto.price, stock: variantDto.stock },
            })
            await tx.priceHistory.create({
              data: { productId: id, variantId: existing.id, price: variantDto.price },
            })
          }
        }
      }

      return updated
    })
  }

  async remove(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } })
    if (!product) throw new NotFoundException('Product not found')
    await this.prisma.product.delete({ where: { id } })
  }
}
