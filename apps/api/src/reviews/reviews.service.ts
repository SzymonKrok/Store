import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateReviewDto } from './dto/create-review.dto'

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateReviewDto) {
    const product = await this.prisma.product.findUnique({ where: { id: dto.productId } })
    if (!product) throw new NotFoundException('Produkt nie istnieje')

    return this.prisma.review.create({
      data: {
        productId: dto.productId,
        authorName: dto.authorName,
        rating: dto.rating,
        comment: dto.comment,
      },
    })
  }

  async findApproved(productId: string) {
    return this.prisma.review.findMany({
      where: { productId, approved: true },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        authorName: true,
        rating: true,
        comment: true,
        createdAt: true,
      },
    })
  }

  async findAll(page = 1, limit = 20, approved?: boolean) {
    const skip = (page - 1) * limit
    const where = approved !== undefined ? { approved } : {}
    const [items, total] = await this.prisma.$transaction([
      this.prisma.review.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { product: { select: { id: true, name: true, slug: true } } },
      }),
      this.prisma.review.count({ where }),
    ])
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async approve(id: string) {
    const review = await this.prisma.review.findUnique({ where: { id } })
    if (!review) throw new NotFoundException('Opinia nie istnieje')
    return this.prisma.review.update({ where: { id }, data: { approved: true } })
  }

  async reject(id: string) {
    const review = await this.prisma.review.findUnique({ where: { id } })
    if (!review) throw new NotFoundException('Opinia nie istnieje')
    return this.prisma.review.delete({ where: { id } })
  }
}
