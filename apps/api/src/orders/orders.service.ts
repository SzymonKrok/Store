import {
  Injectable,
  BadRequestException,
  ConflictException,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CouponsService } from '../coupons/coupons.service'
import { FakturowniaService } from '../fakturownia/fakturownia.service'
import { CreateOrderDto } from './dto/create-order.dto'

const ACTIONABLE_STATUSES = ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'] as const

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly couponsService: CouponsService,
    private readonly fakturownia: FakturowniaService,
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

    const createdOrder = await this.prisma.$transaction(async (tx) => {
      // Atomic stock decrement — WHERE and UPDATE are one row-locked operation, preventing overselling
      for (const item of cart.items) {
        const result = await tx.productVariant.updateMany({
          where: { id: item.variantId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        })
        if (result.count === 0) {
          throw new ConflictException(
            `Insufficient stock for "${item.variant.product.name}" (SKU: ${item.variant.sku})`,
          )
        }
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
          deliveryMethod: dto.deliveryMethod ?? 'COURIER',
          lockerCode: dto.lockerCode ?? null,
          wantsInvoice: dto.wantsInvoice ?? false,
          companyName: dto.companyName ?? null,
          taxId: dto.taxId ?? null,
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

      // Record coupon usage with atomic cap enforcement
      if (couponResult) {
        await tx.couponUsage.create({
          data: {
            couponId: couponResult.coupon.id,
            orderId: order.id,
            userId: userId ?? null,
            guestEmail: userId ? null : dto.shippingAddress.email,
          },
        })
        const capWhere =
          couponResult.coupon.maxUses !== null
            ? { id: couponResult.coupon.id, usedCount: { lt: couponResult.coupon.maxUses } }
            : { id: couponResult.coupon.id }
        const couponUpdate = await tx.coupon.updateMany({
          where: capWhere,
          data: { usedCount: { increment: 1 } },
        })
        if (couponUpdate.count === 0) {
          throw new ConflictException('Coupon usage limit reached')
        }
      }

      // Clear cart
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } })
      await tx.cart.delete({ where: { id: cart.id } })

      return order
    })

    // Auto-save profile on first order — outside transaction so it never blocks the order
    if (userId) {
      const existing = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { firstName: true },
      })
      if (!existing?.firstName) {
        await this.prisma.user.update({
          where: { id: userId },
          data: {
            firstName: dto.shippingAddress.firstName,
            lastName: dto.shippingAddress.lastName,
            phone: dto.shippingAddress.phone,
            ...(dto.shippingAddress.street
              ? {
                  defaultAddress: {
                    street: dto.shippingAddress.street,
                    city: dto.shippingAddress.city,
                    postalCode: dto.shippingAddress.postalCode,
                  },
                }
              : {}),
          },
        }).catch((err) => this.logger.warn(`Profile auto-save failed for user ${userId}: ${err.message}`))
      }
    }

    return createdOrder
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
    if (!isAdmin) {
      if (order.userId) {
        // user-owned order — require matching authenticated caller
        if (order.userId !== userId) throw new ForbiddenException('Access denied')
      }
      // guest order (userId === null) — allow anyone with the CUID (unguessable)
    }
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

  async restoreStock(orderId: string, tx?: Parameters<Parameters<PrismaService['$transaction']>[0]>[0]) {
    const db = tx ?? this.prisma
    const items = await db.orderItem.findMany({ where: { orderId } })
    for (const item of items) {
      const result = await db.productVariant.updateMany({
        where: { id: item.variantId },
        data: { stock: { increment: item.quantity } },
      })
      if (result.count === 0) {
        this.logger.warn(`restoreStock: variant ${item.variantId} not found — skipping (product may have been soft/hard deleted)`)
      }
    }
  }

  async regenerateInvoice(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true },
    })
    if (!order) throw new NotFoundException('Order not found')
    if (!(ACTIONABLE_STATUSES as readonly string[]).includes(order.status)) {
      throw new BadRequestException(`Cannot generate invoice for order in status ${order.status}`)
    }
    const invoiceUrl = await this.fakturownia.generateInvoice(order)
    return { invoiceUrl }
  }
}
