import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { PrismaService } from '../prisma/prisma.service'
import { OrdersService } from '../orders/orders.service'

@Injectable()
export class OrderTimeoutService {
  private readonly logger = new Logger(OrderTimeoutService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly ordersService: OrdersService,
  ) {}

  @Cron('*/15 * * * *')
  async cancelStaleOrders() {
    const cutoff = new Date(Date.now() - 60 * 60 * 1000)

    const staleOrders = await this.prisma.order.findMany({
      where: { status: 'PENDING_PAYMENT', createdAt: { lt: cutoff } },
      select: { id: true },
    })

    if (staleOrders.length === 0) return

    this.logger.log(`Cancelling ${staleOrders.length} stale order(s)`)

    for (const { id } of staleOrders) {
      await this.prisma.$transaction(async (tx) => {
        await tx.order.update({ where: { id }, data: { status: 'CANCELLED' } })
        await this.ordersService.restoreStock(id, tx as any)
      })
      this.logger.log(`Order ${id} cancelled, stock restored`)
    }
  }
}
