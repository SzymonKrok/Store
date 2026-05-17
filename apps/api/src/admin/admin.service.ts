import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { OrderStatus } from '@prisma/client'
import { startOfMonth, subDays, format } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'

const WARSAW_TZ = 'Europe/Warsaw'

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
        this.prisma.productVariant.count({ where: { stock: { lte: 5 }, isActive: true } }),
        this.prisma.$queryRaw<Array<{ date: string; revenue: number }>>`
          SELECT
            DATE("createdAt" AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Warsaw') as date,
            COALESCE(SUM(total), 0)::float as revenue
          FROM "Order"
          WHERE status = 'PAID'
            AND "createdAt" >= NOW() - INTERVAL '30 days'
          GROUP BY DATE("createdAt" AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Warsaw')
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
    // GDPR: hard delete — Order.userId nullified by onDelete: SetNull
    await this.prisma.user.delete({ where: { id } })
  }
}
