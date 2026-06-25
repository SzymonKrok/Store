import { Injectable, Logger } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { FakturowniaService } from '../fakturownia/fakturownia.service'
import { InpostService } from '../inpost/inpost.service'
import { MailService } from '../mail/mail.service'
import { parseShippingAddress } from '../common/shipping-address'

interface OrderPaidEvent {
  id: string
  total: unknown
  discountAmount: unknown
  shippingCost: unknown
  deliveryMethod: string
  lockerCode: string | null
  shippingAddress: unknown
  billingAddress?: unknown
  wantsInvoice: boolean
  companyName: string | null
  taxId: string | null
  items: Array<{
    productName: string
    variantSku: string
    quantity: number
    priceAtPurchase: unknown
  }>
}

@Injectable()
export class OrderFulfillmentListener {
  private readonly logger = new Logger(OrderFulfillmentListener.name)

  constructor(
    private readonly fakturownia: FakturowniaService,
    private readonly inpost: InpostService,
    private readonly mail: MailService,
  ) {}

  @OnEvent('order.paid')
  async handleOrderPaid(order: OrderPaidEvent) {
    this.logger.log(
      `\n${'─'.repeat(60)}\n` +
      `🔔 ORDER FULFILLMENT — order.paid caught for order ${order.id}\n` +
      `   delivery: ${order.deliveryMethod}  locker: ${order.lockerCode ?? '—'}\n` +
      `${'─'.repeat(60)}`,
    )

    // ── Step 1: InPost shipment (PARCEL_LOCKER orders only) ──────────────────
    // TODO: enable auto-shipment creation once InPost credentials are configured.
    // When enabled, this will pre-register the shipment so the admin only needs
    // to print the label, not re-create the shipment from scratch.
    if (order.deliveryMethod === 'PARCEL_LOCKER') {
      this.logger.log(`   [InPost] PARCEL_LOCKER order detected — auto-shipment is currently a TODO`)
      // void this.inpost.createShipment(order)
    }

    // ── Step 2: Invoice (Fakturownia) ────────────────────────────────────────
    this.logger.log(`   [Fakturownia] Step 2: generating invoice...`)
    const invoiceResult = await this.fakturownia.generateInvoice(order)
    const address = parseShippingAddress(order.shippingAddress)

    let pdfBuffer: Buffer | null = null
    if (invoiceResult) {
      this.logger.log(`   [Fakturownia] Step 3: downloading PDF (id=${invoiceResult.fakturowniaId})...`)
      pdfBuffer = await this.fakturownia.downloadInvoicePdf(invoiceResult.fakturowniaId)
    }

    if (invoiceResult && pdfBuffer) {
      this.logger.log(
        `\n${'─'.repeat(60)}\n` +
        `✅ FULFILLMENT COMPLETE — order ${order.id}\n` +
        `   invoiceUrl: ${invoiceResult.url}\n` +
        `   PDF: ${pdfBuffer.length} bytes — will be attached to email\n` +
        `   Sending confirmation to: ${address.email}\n` +
        `${'─'.repeat(60)}`,
      )
    } else if (invoiceResult && !pdfBuffer) {
      this.logger.error(
        `\n${'─'.repeat(60)}\n` +
        `⚠️  FULFILLMENT PARTIAL — order ${order.id}\n` +
        `   Invoice generated (${invoiceResult.url}) but PDF download FAILED\n` +
        `   Sending email without attachment to: ${address.email}\n` +
        `${'─'.repeat(60)}`,
      )
    } else {
      this.logger.error(
        `\n${'─'.repeat(60)}\n` +
        `⚠️  FULFILLMENT PARTIAL — order ${order.id}\n` +
        `   INVOICE GENERATION FAILED (see FakturowniaService error above)\n` +
        `   Sending email without attachment to: ${address.email}\n` +
        `${'─'.repeat(60)}`,
      )
    }

    // ── Step 3: Confirmation email ───────────────────────────────────────────
    void this.mail.sendOrderConfirmation(address.email, order, invoiceResult?.url ?? null, pdfBuffer)
  }
}
