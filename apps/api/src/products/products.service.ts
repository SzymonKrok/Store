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
    const { categoryId, minPrice, maxPrice, sortBy = SortBy.NEWEST, page = 1, limit = 20, showArchived } = query
    const skip = (page - 1) * limit

    const where: Prisma.ProductWhereInput = {
      ...(showArchived ? {} : { isActive: true }),
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

  async findById(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        variants: { orderBy: { sku: 'asc' } },
        images: { orderBy: { position: 'asc' } },
      },
    })
    if (!product) throw new NotFoundException('Product not found')
    return product
  }

  async findOne(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug, isActive: true },
      include: {
        category: true,
        variants: { where: { isActive: true } },
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
              compareAtPrice: v.compareAtPrice ?? null,
              stock: v.stock,
              attributes: v.attributes as Prisma.InputJsonValue,
              isActive: v.isActive ?? true,
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
      const updateData: Prisma.ProductUpdateInput = {}
      if (dto.name !== undefined) updateData.name = dto.name
      if (dto.slug !== undefined) updateData.slug = dto.slug
      if (dto.description !== undefined) updateData.description = dto.description
      if (dto.basePrice !== undefined) updateData.basePrice = dto.basePrice
      if (dto.categoryId !== undefined) updateData.category = { connect: { id: dto.categoryId } }
      const dtoAny = dto as Record<string, unknown>
      if (typeof dtoAny['isActive'] === 'boolean') updateData.isActive = dtoAny['isActive'] as boolean

      const updated = await tx.product.update({
        where: { id },
        data: updateData,
        include: { variants: true },
      })

      if (dto.images !== undefined) {
        await tx.productImage.deleteMany({ where: { productId: id } })
        if (dto.images.length > 0) {
          await tx.productImage.createMany({
            data: dto.images.map((img, i) => ({
              productId: id,
              url: img.url,
              altText: img.altText ?? null,
              position: img.position ?? i,
            })),
          })
        }
      }

      if (dto.variants) {
        for (const variantDto of dto.variants) {
          const existing = product.variants.find((v) => v.sku === variantDto.sku)
          if (existing) {
            const priceChanged = Number(existing.price) !== variantDto.price
            await tx.productVariant.update({
              where: { id: existing.id },
              data: {
                price: variantDto.price,
                compareAtPrice: variantDto.compareAtPrice ?? null,
                stock: variantDto.stock,
                isActive: variantDto.isActive ?? true,
              },
            })
            if (priceChanged) {
              await tx.priceHistory.create({
                data: { productId: id, variantId: existing.id, price: variantDto.price },
              })
            }
          } else {
            const newVariant = await tx.productVariant.create({
              data: {
                productId: id,
                sku: variantDto.sku,
                price: variantDto.price,
                compareAtPrice: variantDto.compareAtPrice ?? null,
                stock: variantDto.stock,
                attributes: variantDto.attributes as Prisma.InputJsonValue,
                isActive: variantDto.isActive ?? true,
              },
            })
            await tx.priceHistory.create({
              data: { productId: id, variantId: newVariant.id, price: variantDto.price },
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
    // Soft-delete: OrderItem.variant has onDelete: Restrict so hard-delete fails on any historical order
    return this.prisma.product.update({ where: { id }, data: { isActive: false } })
  }
}
