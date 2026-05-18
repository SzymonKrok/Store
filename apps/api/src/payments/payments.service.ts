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
import { StripeStrategy } from './strategies/stripe.strategy'

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly ordersService: OrdersService,
    private readonly stripe: StripeStrategy,
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

    const storefrontUrl = this.config.get<string>('STOREFRONT_URL') ?? 'http://localhost:3000'
    const shippingAddress = order.shippingAddress as Record<string, string>

    const { sessionId, url } = await this.stripe.createCheckoutSession({
      orderId: order.id,
      items: order.items.map((item) => ({
        name: item.productName,
        sku: item.variantSku,
        unitAmount: Math.round(Number(item.priceAtPurchase) * 100),
        quantity: item.quantity,
      })),
      discountAmount: Math.round(Number(order.discountAmount) * 100),
      currency: 'pln',
      customerEmail: shippingAddress.email,
      successUrl: `${storefrontUrl}/order-confirmation/${order.id}`,
      cancelUrl: `${storefrontUrl}/checkout`,
    })

    await this.prisma.order.update({
      where: { id: orderId },
      data: { stripeSessionId: sessionId },
    })

    return { paymentUrl: url }
  }

  async handleStripeWebhook(rawBody: Buffer, signature: string): Promise<void> {
    let event: ReturnType<StripeStrategy['constructWebhookEvent']>
    try {
      event = this.stripe.constructWebhookEvent(rawBody, signature)
    } catch {
      throw new UnauthorizedException('Invalid Stripe webhook signature')
    }

    if (event.type !== 'checkout.session.completed') return

    const session = event.data.object
    const orderId = session.metadata?.orderId
    if (!orderId) {
      this.logger.warn('Stripe webhook: checkout.session.completed missing metadata.orderId')
      return
    }

    // Atomic conditional update — only the first webhook call wins; concurrent retries return count=0
    const result = await this.prisma.order.updateMany({
      where: { id: orderId, status: 'PENDING_PAYMENT' },
      data: { status: 'PAID' },
    })

    if (result.count === 0) {
      this.logger.log(`Order ${orderId} already processed or not found — idempotent skip`)
      return
    }

    const updatedOrder = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    })

    this.eventEmitter.emit('order.paid', updatedOrder)
    this.logger.log(`Order ${orderId} marked PAID via Stripe webhook, order.paid event emitted`)
  }
}
