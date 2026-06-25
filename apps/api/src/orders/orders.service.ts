import {
  Injectable,
  BadRequestException,
  ConflictException,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { CouponsService } from '../coupons/coupons.service'
import { FakturowniaService } from '../fakturownia/fakturownia.service'
import { MailService } from '../mail/mail.service'
import { SettingsService } from '../settings/settings.service'
import { CreateOrderDto } from './dto/create-order.dto'
import { resolveShippingCost } from './shipping-cost'

const ACTIONABLE_STATUSES = ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'] as const

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly couponsService: CouponsService,
    private readonly fakturownia: FakturowniaService,
    private readonly mail: MailService,
    private readonly settings: SettingsService,
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

    const storeSettings = await this.settings.getSettings()
    const shippingCost = resolveShippingCost(storeSettings, dto.deliveryMethod)
    const total = subtotal - discountAmount + shippingCost

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
      const billingAddress = dto.billingAddress ?? {
        firstName: dto.shippingAddress.firstName,
        lastName: dto.shippingAddress.lastName,
        street: dto.shippingAddress.street,
        city: dto.shippingAddress.city,
        postalCode: dto.shippingAddress.postalCode,
      }
      const order = await tx.order.create({
        data: {
          userId: userId ?? null,
          guestEmail: userId ? null : dto.shippingAddress.email,
          guestName: userId ? null : `${dto.shippingAddress.firstName} ${dto.shippingAddress.lastName}`,
          guestPhone: userId ? null : dto.shippingAddress.phone,
          status: 'PENDING_PAYMENT',
          subtotal,
          discountAmount,
          shippingCost,
          total,
          couponId: couponResult?.coupon.id ?? null,
          shippingAddress: dto.shippingAddress as object,
          billingAddress: billingAddress as object,
          deliveryMethod: dto.deliveryMethod ?? 'COURIER',
          lockerCode: dto.lockerCode ?? null,
          shippingPointDetails: dto.shippingPointDetails as object ?? null,
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

    // Acknowledge guest orders immediately — before Stripe payment is confirmed
    if (!userId && dto.shippingAddress.email) {
      void this.mail.sendGuestOrderAcknowledged(
        dto.shippingAddress.email,
        createdOrder.id,
        createdOrder.items,
        createdOrder.total,
        createdOrder.discountAmount,
        createdOrder.shippingCost,
      )
    }

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
        include: { items: true, returnRequest: { select: { status: true } } },
      }),
      this.prisma.order.count({ where: { userId } }),
    ])
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async findOne(id: string, userId?: string, isAdmin = false) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        coupon: true,
        user: { select: { email: true, firstName: true, lastName: true, phone: true } },
        returnRequest: { select: { status: true } },
      },
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

  async findAllAdmin(
    page = 1,
    limit = 20,
    status?: string,
    search?: string,
    dateFrom?: string,
    dateTo?: string,
    productName?: string,
  ) {
    const skip = (page - 1) * limit
    const where: Prisma.OrderWhereInput = {}

    if (status) {
      const statuses = status.split(',').filter(Boolean)
      if (statuses.length === 1) {
        where.status = statuses[0] as Prisma.EnumOrderStatusFilter
      } else if (statuses.length > 1) {
        where.status = { in: statuses as any[] }
      }
    }

    if (search) {
      where.OR = [
        { id: { contains: search, mode: 'insensitive' } },
        { guestEmail: { contains: search, mode: 'insensitive' } },
        { guestName: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { user: { firstName: { contains: search, mode: 'insensitive' } } },
      ]
    }

    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) where.createdAt.gte = new Date(dateFrom)
      if (dateTo) {
        const to = new Date(dateTo)
        to.setHours(23, 59, 59, 999)
        where.createdAt.lte = to
      }
    }

    if (productName) {
      where.items = {
        some: { productName: { contains: productName, mode: 'insensitive' } },
      }
    }

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
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { user: { select: { email: true } } },
    })
    if (!order) throw new NotFoundException('Order not found')
    const updated = await this.prisma.order.update({ where: { id }, data: { status: status as any } })

    if (status === 'SHIPPED' || status === 'DELIVERED') {
      const customerEmail = order.user?.email ?? order.guestEmail
      if (customerEmail) {
        if (status === 'SHIPPED') {
          void this.mail.sendOrderShipped(customerEmail, id, order.trackingNumber)
        } else {
          void this.mail.sendOrderDelivered(customerEmail, id)
        }
      }
    }

    return updated
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
    const result = await this.fakturownia.generateInvoice(order)
    return { invoiceUrl: result?.url ?? null }
  }
}
