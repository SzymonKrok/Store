import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { OrderStatus, DeliveryMethod } from '@prisma/client'
import { startOfMonth, subDays, subHours, format } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'

const WARSAW_TZ = 'Europe/Warsaw'

// Orders past the payment step — what we count as "real" sales activity.
const FULFILLED_STATUSES: OrderStatus[] = [
  OrderStatus.PAID,
  OrderStatus.PROCESSING,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED,
]

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const now = new Date()
    const warsawNow = toZonedTime(now, WARSAW_TZ)
    const monthStart = startOfMonth(warsawNow)
    // Convert Warsaw month start back to UTC for DB query
    const monthStartUtc = new Date(monthStart.getTime() - monthStart.getTimezoneOffset() * 60000)

    const [revenueResult, totalOrders, pendingPaymentOrders, lowStockVariants, rawChart] =
      await Promise.all([
        this.prisma.order.aggregate({
          _sum: { total: true },
          where: {
            status: OrderStatus.PAID,
            createdAt: { gte: monthStartUtc },
          },
        }),
        this.prisma.order.count(),
        this.prisma.order.count({ where: { status: OrderStatus.PENDING_PAYMENT } }),
        this.prisma.productVariant.count({ where: { stock: { lte: 3 }, isActive: true } }),
        this.prisma.$queryRaw<Array<{ date: string; revenue: number }>>`
          SELECT
            TO_CHAR("createdAt" AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Warsaw', 'YYYY-MM-DD') as date,
            COALESCE(SUM(total), 0)::float as revenue
          FROM "Order"
          WHERE status = 'PAID'
            AND "createdAt" >= NOW() - INTERVAL '30 days'
          GROUP BY TO_CHAR("createdAt" AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Warsaw', 'YYYY-MM-DD')
          ORDER BY date ASC
        `,
      ])

    // Fill zero-revenue days for the full 30-day window
    const chartMap = new Map(rawChart.map((r) => [String(r.date).slice(0, 10), Number(r.revenue)]))
    const chart: Array<{ date: string; revenue: number }> = []
    for (let i = 29; i >= 0; i--) {
      const d = subDays(warsawNow, i)
      const key = format(d, 'yyyy-MM-dd')
      chart.push({ date: key, revenue: chartMap.get(key) ?? 0 })
    }

    return {
      kpis: {
        revenueThisMonth: Number(revenueResult._sum.total ?? 0),
        totalOrders,
        pendingPaymentOrders,
        lowStockVariants,
      },
      chart,
    }
  }

  async getUsers(page: number, limit: number) {
    const skip = (page - 1) * limit
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          role: true,
          createdAt: true,
          _count: { select: { orders: true } },
        },
      }),
      this.prisma.user.count(),
    ])
    return {
      users: users.map((u) => ({ ...u, orderCount: u._count.orders })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    }
  }

  async getUserWithOrders(id: string) {
    return this.prisma.user.findUniqueOrThrow({
      where: { id },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        orders: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            status: true,
            total: true,
            createdAt: true,
          },
        },
      },
    })
  }

  async toggleUserRole(id: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id } })
    const newRole = user.role === 'ADMIN' ? 'USER' : 'ADMIN'
    return this.prisma.user.update({ where: { id }, data: { role: newRole } })
  }

  async deleteUser(id: string) {
    // GDPR: hard delete — Order.userId nullified by onDelete: SetNull; Cart has no cascade rule so delete it first
    await this.prisma.$transaction([
      this.prisma.cart.deleteMany({ where: { userId: id } }),
      this.prisma.user.delete({ where: { id } }),
    ])
  }

  async getInsights() {
    const now = new Date()
    const thirtyDaysAgo = subDays(now, 30)
    const twoHoursAgo = subHours(now, 2)

    const [
      aovAgg,
      newCustomers30d,
      pendingReviews,
      pendingReturns,
      statusGroups,
      deliveryGroups,
      topProductsRaw,
      topViewed,
      topCitiesRaw,
      couponsRaw,
      abandonedCartsRaw,
      lowStockVariantsRaw,
    ] = await Promise.all([
      this.prisma.order.aggregate({
        _avg: { total: true },
        where: { status: { in: FULFILLED_STATUSES }, createdAt: { gte: thirtyDaysAgo } },
      }),
      this.prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      this.prisma.review.count({ where: { approved: false } }),
      this.prisma.returnRequest.count({ where: { status: 'RETURN_REQUESTED' } }),
      this.prisma.order.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.order.groupBy({
        by: ['deliveryMethod'],
        _count: { _all: true },
        where: { status: { in: FULFILLED_STATUSES } },
      }),
      this.prisma.$queryRaw<Array<{ productName: string; totalSold: bigint; totalRevenue: number }>>`
        SELECT
          oi."productName" as "productName",
          SUM(oi.quantity)::bigint as "totalSold",
          SUM(oi.quantity * oi."priceAtPurchase")::float as "totalRevenue"
        FROM "OrderItem" oi
        INNER JOIN "Order" o ON o.id = oi."orderId"
        WHERE o.status IN ('PAID','PROCESSING','SHIPPED','DELIVERED')
          AND o."createdAt" >= ${thirtyDaysAgo}
        GROUP BY oi."productName"
        ORDER BY "totalSold" DESC
        LIMIT 10
      `,
      this.prisma.product.findMany({
        where: { isActive: true, viewCount: { gt: 0 } },
        orderBy: { viewCount: 'desc' },
        take: 10,
        select: { id: true, name: true, slug: true, viewCount: true },
      }),
      this.prisma.$queryRaw<Array<{ city: string; count: bigint }>>`
        SELECT
          "shippingAddress"->>'city' as city,
          COUNT(*)::bigint as count
        FROM "Order"
        WHERE status IN ('PAID','PROCESSING','SHIPPED','DELIVERED')
          AND "shippingAddress"->>'city' IS NOT NULL
          AND "shippingAddress"->>'city' <> ''
        GROUP BY "shippingAddress"->>'city'
        ORDER BY count DESC
        LIMIT 10
      `,
      this.prisma.coupon.findMany({
        where: { usedCount: { gt: 0 } },
        orderBy: { usedCount: 'desc' },
        take: 10,
        select: {
          code: true,
          type: true,
          value: true,
          usedCount: true,
          orders: {
            where: { status: { in: FULFILLED_STATUSES } },
            select: { discountAmount: true },
          },
        },
      }),
      this.prisma.cart.findMany({
        where: {
          updatedAt: { lt: twoHoursAgo },
          items: { some: {} },
        },
        orderBy: { updatedAt: 'desc' },
        take: 20,
        include: {
          user: { select: { email: true } },
          items: {
            select: {
              quantity: true,
              variant: { select: { price: true, product: { select: { name: true } } } },
            },
          },
        },
      }),
      this.prisma.productVariant.findMany({
        where: { isActive: true, stock: { lte: 3 }, product: { isActive: true } },
        orderBy: [{ stock: 'asc' }, { sku: 'asc' }],
        take: 20,
        select: {
          id: true,
          sku: true,
          stock: true,
          attributes: true,
          product: { select: { id: true, name: true } },
        },
      }),
    ])

    // Normalize order-status counts: ensure every status appears, even with 0 count
    const orderStatusBreakdown: Record<OrderStatus, number> = {
      PENDING_PAYMENT: 0, PAID: 0, PROCESSING: 0, SHIPPED: 0, DELIVERED: 0, CANCELLED: 0, REFUNDED: 0,
    }
    for (const g of statusGroups) orderStatusBreakdown[g.status] = g._count._all

    const deliveryMethodSplit: Record<DeliveryMethod, number> = { COURIER: 0, PARCEL_LOCKER: 0 }
    for (const g of deliveryGroups) deliveryMethodSplit[g.deliveryMethod] = g._count._all

    const couponPerformance = couponsRaw.map((c) => ({
      code: c.code,
      type: c.type,
      value: Number(c.value),
      redemptions: c.usedCount,
      totalDiscount: c.orders.reduce((sum, o) => sum + Number(o.discountAmount), 0),
    }))

    const abandonedCarts = abandonedCartsRaw.map((cart) => {
      const itemCount = cart.items.reduce((s, i) => s + i.quantity, 0)
      const totalValue = cart.items.reduce((s, i) => s + Number(i.variant.price) * i.quantity, 0)
      const itemPreview = cart.items.slice(0, 3).map((i) => i.variant.product.name).join(', ')
      return {
        id: cart.id,
        identifier: cart.user?.email ?? 'Gość',
        itemCount,
        totalValue,
        itemPreview: cart.items.length > 3 ? `${itemPreview}…` : itemPreview,
        updatedAt: cart.updatedAt,
      }
    })

    const lowStockVariants = lowStockVariantsRaw.map((v) => ({
      productId: v.product.id,
      productName: v.product.name,
      sku: v.sku,
      stock: v.stock,
      attributes: (v.attributes ?? {}) as Record<string, string>,
    }))

    return {
      averageOrderValue: Number(aovAgg._avg.total ?? 0),
      newCustomers30d,
      pendingReviews,
      pendingReturns,
      orderStatusBreakdown,
      deliveryMethodSplit,
      topProducts: topProductsRaw.map((p) => ({
        productName: p.productName,
        totalSold: Number(p.totalSold),
        totalRevenue: p.totalRevenue,
      })),
      topViewed,
      topCities: topCitiesRaw.map((c) => ({ city: c.city, count: Number(c.count) })),
      couponPerformance,
      abandonedCarts,
      lowStockVariants,
    }
  }
}
