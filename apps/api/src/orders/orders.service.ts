import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CouponsService } from '../coupons/coupons.service'
import { CreateOrderDto } from './dto/create-order.dto'

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly couponsService: CouponsService,
  ) {}

  async create(userId: string | undefined, dto: CreateOrderDto) {
    const sessionId = dto.sessionId
    const cartWhere = userId ? { userId } : { sessionId }

    const cart = await this.prisma.cart.findFirst({
      where: cartWhere,
      include: {
        items: {
          include: {
            variant: {
              include: { product: true },
            },
          },
        },
      },
    })

    if (!cart || cart.items.length === 0) throw new BadRequestException('Cart is empty')

    const subtotal = cart.items.reduce(
      (sum, item) => sum + Number(item.variant.price) * item.quantity,
      0,
    )

    // Pre-validate coupon before entering transaction
    let couponResult: Awaited<ReturnType<CouponsService['validate']>> | null = null
    if (dto.couponCode) {
      couponResult = await this.couponsService.validate(dto.couponCode, subtotal, userId)
    }

    const discountAmount = couponResult?.discountAmount ?? 0
    const total = subtotal - discountAmount

    return this.prisma.$transaction(async (tx) => {
      // Hard stock check — all items must have sufficient stock
      for (const item of cart.items) {
        const variant = await tx.productVariant.findUnique({ where: { id: item.variantId } })
        if (!variant || variant.stock < item.quantity) {
          throw new ConflictException(
            `Insufficient stock for "${item.variant.product.name}" (SKU: ${item.variant.sku})`,
          )
        }
      }

      // Decrement stock
      for (const item of cart.items) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { decrement: item.quantity } },
        })
      }

      // Create order with snapshots
      const order = await tx.order.create({
        data: {
          userId: userId ?? null,
          guestEmail: userId ? null : dto.shippingAddress.email,
          guestName: userId ? null : `${dto.shippingAddress.firstName} ${dto.shippingAddress.lastName}`,
          guestPhone: userId ? null : dto.shippingAddress.phone,
          status: 'PENDING_PAYMENT',
          subtotal,
          discountAmount,
          total,
          couponId: couponResult?.coupon.id ?? null,
          shippingAddress: dto.shippingAddress as object,
          items: {
            create: cart.items.map((item) => ({
              variantId: item.variantId,
              quantity: item.quantity,
              priceAtPurchase: item.variant.price,
              productName: item.variant.product.name,
              variantSku: item.variant.sku,
              variantAttributes: item.variant.attributes as object,
            })),
          },
        },
        include: { items: true },
      })

      // Record coupon usage
      if (couponResult) {
        await tx.couponUsage.create({
          data: {
            couponId: couponResult.coupon.id,
            orderId: order.id,
            userId: userId ?? null,
            guestEmail: userId ? null : dto.shippingAddress.email,
          },
        })
        await tx.coupon.update({
          where: { id: couponResult.coupon.id },
          data: { usedCount: { increment: 1 } },
        })
      }

      // Clear cart
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } })
      await tx.cart.delete({ where: { id: cart.id } })

      return order
    })
  }

  async findAll(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit
    const [items, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { items: true },
      }),
      this.prisma.order.count({ where: { userId } }),
    ])
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async findOne(id: string, userId?: string, isAdmin = false) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true, coupon: true },
    })
    if (!order) throw new NotFoundException('Order not found')
    if (!isAdmin && order.userId !== userId) throw new ForbiddenException('Access denied')
    return order
  }

  async findAllAdmin(page = 1, limit = 20, status?: string) {
    const skip = (page - 1) * limit
    const where = status ? { status: status as any } : {}
    const [items, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { items: true, user: { select: { email: true } } },
      }),
      this.prisma.order.count({ where }),
    ])
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async updateStatus(id: string, status: string) {
    const order = await this.prisma.order.findUnique({ where: { id } })
    if (!order) throw new NotFoundException('Order not found')
    return this.prisma.order.update({ where: { id }, data: { status: status as any } })
  }
}
