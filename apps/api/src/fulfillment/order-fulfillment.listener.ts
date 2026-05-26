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
    this.logger.log(`\n${'─'.repeat(60)}\n🔔 ORDER FULFILLMENT — order.paid caught for order ${order.id}\n   Step 1: Calling FakturowniaService.generateInvoice...\n${'─'.repeat(60)}`)
    const invoiceResult = await this.fakturownia.generateInvoice(order)
    const address = parseShippingAddress(order.shippingAddress)

    let pdfBuffer: Buffer | null = null
    if (invoiceResult) {
      this.logger.log(`   Step 2: Downloading invoice PDF (fakturowniaId=${invoiceResult.fakturowniaId})...`)
      pdfBuffer = await this.fakturownia.downloadInvoicePdf(invoiceResult.fakturowniaId)
    }

    if (invoiceResult && pdfBuffer) {
      this.logger.log(`\n${'─'.repeat(60)}\n✅ FULFILLMENT COMPLETE — order ${order.id}\n   invoiceUrl: ${invoiceResult.url}\n   PDF: ${pdfBuffer.length} bytes — will be attached to email\n   Sending confirmation email to: ${address.email}\n${'─'.repeat(60)}`)
    } else if (invoiceResult && !pdfBuffer) {
      this.logger.error(`\n${'─'.repeat(60)}\n⚠️  FULFILLMENT PARTIAL — order ${order.id}\n   Invoice generated (${invoiceResult.url}) but PDF download FAILED\n   Sending email without attachment to: ${address.email}\n${'─'.repeat(60)}`)
    } else {
      this.logger.error(`\n${'─'.repeat(60)}\n⚠️  FULFILLMENT PARTIAL — order ${order.id}\n   INVOICE GENERATION FAILED (see FakturowniaService error above)\n   Sending email without attachment to: ${address.email}\n${'─'.repeat(60)}`)
    }

    void this.mail.sendOrderConfirmation(address.email, order, invoiceResult?.url ?? null, pdfBuffer)
  }
}
