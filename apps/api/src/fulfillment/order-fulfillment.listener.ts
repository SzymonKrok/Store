import { Injectable, Logger } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { FakturowniaService } from '../fakturownia/fakturownia.service'
import { MailService } from '../mail/mail.service'
import { parseShippingAddress } from '../common/shipping-address'

@Injectable()
export class OrderFulfillmentListener {
  private readonly logger = new Logger(OrderFulfillmentListener.name)

  constructor(
    private readonly fakturownia: FakturowniaService,
    private readonly mail: MailService,
  ) {}

  @OnEvent('order.paid')
  async handleOrderPaid(order: {
    id: string
    total: unknown
    discountAmount: unknown
    wantsInvoice: boolean
    companyName: string | null
    taxId: string | null
    shippingAddress: unknown
    items: Array<{
      productName: string
      variantSku: string
      quantity: number
      priceAtPurchase: unknown
    }>
  }) {
    const invoiceUrl = await this.fakturownia.generateInvoice(order)
    const address = parseShippingAddress(order.shippingAddress)
    this.logger.log(`Order ${order.id} paid — sending confirmation to ${address.email}`)
    void this.mail.sendOrderConfirmation(address.email, order, invoiceUrl)
  }
}
