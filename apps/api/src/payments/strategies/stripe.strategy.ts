import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Stripe from 'stripe'

@Injectable()
export class StripeStrategy {
  private readonly client: InstanceType<typeof Stripe>
  private readonly webhookSecret: string

  constructor(private readonly config: ConfigService) {
    this.client = new Stripe(config.get<string>('STRIPE_SECRET_KEY') ?? 'sk_test_placeholder')
    this.webhookSecret = config.get<string>('STRIPE_WEBHOOK_SECRET') ?? ''
  }

  async createCheckoutSession(params: {
    orderId: string
    items: Array<{ name: string; sku: string; unitAmount: number; quantity: number }>
    discountAmount: number
    currency: string
    customerEmail: string
    successUrl: string
    cancelUrl: string
  }): Promise<{ sessionId: string; url: string }> {
    const lineItems = params.items.map((item) => ({
      price_data: {
        currency: params.currency,
        product_data: { name: item.name, description: item.sku },
        unit_amount: item.unitAmount,
      },
      quantity: item.quantity,
    }))

    let discounts: Array<{ coupon: string }> | undefined
    if (params.discountAmount > 0) {
      const coupon = await this.client.coupons.create({
        amount_off: params.discountAmount,
        currency: params.currency,
        duration: 'once',
      })
      discounts = [{ coupon: coupon.id }]
    }

    const session = await this.client.checkout.sessions.create({
      payment_method_types: ['card', 'p24', 'blik'],
      line_items: lineItems,
      discounts,
      mode: 'payment',
      customer_email: params.customerEmail,
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      metadata: { orderId: params.orderId },
    })

    return { sessionId: session.id, url: session.url! }
  }

  constructWebhookEvent(rawBody: Buffer, signature: string) {
    return this.client.webhooks.constructEvent(rawBody, signature, this.webhookSecret)
  }
}
