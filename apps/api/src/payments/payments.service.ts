import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '../prisma/prisma.service'
import { OrdersService } from '../orders/orders.service'
import { Przelewy24Strategy, P24WebhookPayload } from './strategies/przelewy24.strategy'

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly ordersService: OrdersService,
    private readonly p24: Przelewy24Strategy,
    private readonly eventEmitter: EventEmitter2,
    private readonly config: ConfigService,
  ) {}

  async initiatePayment(orderId: string, userId?: string): Promise<{ paymentUrl: string }> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    })

    if (!order) throw new NotFoundException('Order not found')
    if (order.userId && order.userId !== userId) throw new UnauthorizedException('Access denied')
    if (order.status !== 'PENDING_PAYMENT') {
      throw new BadRequestException(`Order is already ${order.status}`)
    }

    const shippingAddress = order.shippingAddress as Record<string, string>
    const p24SessionId = `order-${order.id}-${Date.now()}`

    await this.prisma.order.update({ where: { id: orderId }, data: { p24SessionId } })

    const apiBaseUrl = this.config.get<string>('API_BASE_URL') ?? 'http://localhost:3333'
    const storefrontUrl = this.config.get<string>('STOREFRONT_URL') ?? 'http://localhost:3000'

    const paymentUrl = await this.p24.registerTransaction(
      p24SessionId,
      Number(order.total),
      'PLN',
      `Zamówienie #${order.id}`,
      shippingAddress.email,
      `${storefrontUrl}/order-confirmation/${order.id}`,
      `${apiBaseUrl}/api/payments/p24/webhook`,
    )

    return { paymentUrl }
  }

  async handleP24Webhook(payload: P24WebhookPayload): Promise<void> {
    if (!this.p24.verifyWebhookSignature(payload)) {
      throw new UnauthorizedException('Invalid P24 signature')
    }

    const order = await this.prisma.order.findFirst({
      where: { p24SessionId: payload.sessionId },
      include: { items: true },
    })

    if (!order) {
      this.logger.warn(`No order found for p24SessionId: ${payload.sessionId}`)
      return
    }

    if (order.status === 'PAID') {
      this.logger.log(`Order ${order.id} already PAID — idempotent skip`)
      return
    }

    await this.p24.verifyTransaction(
      payload.sessionId,
      payload.orderId,
      Number(order.total),
      'PLN',
    )

    await this.prisma.order.update({
      where: { id: order.id },
      data: { status: 'PAID', p24OrderId: String(payload.orderId) },
    })

    const updatedOrder = await this.prisma.order.findUnique({
      where: { id: order.id },
      include: { items: true },
    })

    this.eventEmitter.emit('order.paid', updatedOrder)
    this.logger.log(`Order ${order.id} marked PAID, order.paid event emitted`)
  }

  async handleCancellationWebhook(sessionId: string): Promise<void> {
    const order = await this.prisma.order.findFirst({
      where: { p24SessionId: sessionId, status: 'PENDING_PAYMENT' },
    })
    if (!order) return

    await this.prisma.$transaction(async (tx) => {
      await tx.order.update({ where: { id: order.id }, data: { status: 'CANCELLED' } })
      await this.ordersService.restoreStock(order.id, tx as any)
    })

    this.logger.log(`Order ${order.id} cancelled via P24 webhook, stock restored`)
  }
}
