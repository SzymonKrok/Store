import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateCouponDto } from './dto/create-coupon.dto'
import { UpdateCouponDto } from './dto/update-coupon.dto'

@Injectable()
export class CouponsService {
  constructor(private readonly prisma: PrismaService) {}

  async validate(code: string, subtotal: number, userId?: string) {
    const coupon = await this.prisma.coupon.findUnique({ where: { code } })

    if (!coupon || !coupon.isActive) throw new NotFoundException('Kupon nie istnieje lub jest nieaktywny')
    if (coupon.expiresAt && coupon.expiresAt < new Date()) throw new BadRequestException('Kupon wygasł')
    if (coupon.minOrderValue && subtotal < Number(coupon.minOrderValue)) {
      throw new BadRequestException(`Minimalna wartość zamówienia powinna wynosić ${Number(coupon.minOrderValue).toFixed(2)} zł`)
    }
    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
      throw new BadRequestException('Limit użyć kuponu został wyczerpany')
    }
    if (userId && coupon.limitPerUser !== null) {
      const usageCount = await this.prisma.couponUsage.count({ where: { couponId: coupon.id, userId } })
      if (usageCount >= coupon.limitPerUser) throw new BadRequestException('Osiągnięto limit użyć kuponu na konto')
    }

    const discountAmount =
      coupon.type === 'PERCENTAGE'
        ? Math.round(((subtotal * Number(coupon.value)) / 100) * 100) / 100
        : Math.min(Number(coupon.value), subtotal)

    return { coupon, discountAmount, finalTotal: Math.max(0, subtotal - discountAmount) }
  }

  async create(dto: CreateCouponDto) {
    return this.prisma.coupon.create({
      data: {
        code: dto.code,
        type: dto.type,
        value: dto.value,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        minOrderValue: dto.minOrderValue ?? null,
        maxUses: dto.maxUses ?? null,
        limitPerUser: dto.limitPerUser ?? null,
        isActive: dto.isActive ?? true,
      },
    })
  }

  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit
    const [items, total] = await this.prisma.$transaction([
      this.prisma.coupon.findMany({ skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.coupon.count(),
    ])
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async update(id: string, dto: UpdateCouponDto) {
    const coupon = await this.prisma.coupon.findUnique({ where: { id } })
    if (!coupon) throw new NotFoundException('Coupon not found')
    return this.prisma.coupon.update({
      where: { id },
      data: {
        ...(dto.code !== undefined ? { code: dto.code } : {}),
        ...(dto.type !== undefined ? { type: dto.type } : {}),
        ...(dto.value !== undefined ? { value: dto.value } : {}),
        ...(dto.expiresAt !== undefined ? { expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null } : {}),
        ...(dto.minOrderValue !== undefined ? { minOrderValue: dto.minOrderValue } : {}),
        ...(dto.maxUses !== undefined ? { maxUses: dto.maxUses } : {}),
        ...(dto.limitPerUser !== undefined ? { limitPerUser: dto.limitPerUser } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
    })
  }

  async deactivate(id: string) {
    const coupon = await this.prisma.coupon.findUnique({ where: { id } })
    if (!coupon) throw new NotFoundException('Coupon not found')
    return this.prisma.coupon.update({ where: { id }, data: { isActive: false } })
  }
}
