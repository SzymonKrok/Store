import { Injectable, Logger } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { ConfigService } from '@nestjs/config'
import { Resend } from 'resend'
import { FakturowniaService } from '../fakturownia/fakturownia.service'

@Injectable()
export class OrderFulfillmentListener {
  private readonly logger = new Logger(OrderFulfillmentListener.name)
  private readonly resend: Resend
  private readonly fromEmail: string
  private readonly storefrontUrl: string

  constructor(
    private readonly fakturownia: FakturowniaService,
    private readonly config: ConfigService,
  ) {
    this.resend = new Resend(config.get<string>('RESEND_API_KEY'))
    this.fromEmail = config.get<string>('RESEND_FROM_EMAIL') ?? 'zamowienia@store.pl'
    this.storefrontUrl = config.get<string>('STOREFRONT_URL') ?? 'http://localhost:3000'
  }

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
    // 1. Generate invoice (awaited so URL is available for the email)
    const invoiceUrl = await this.fakturownia.generateInvoice(order)

    // 2. Send confirmation email with the invoice link if available
    const address = order.shippingAddress as Record<string, string>
    await this.sendConfirmationEmail(order, address.email, invoiceUrl)
  }

  private async sendConfirmationEmail(
    order: {
      id: string
      total: unknown
      discountAmount: unknown
      items: Array<{ productName: string; variantSku: string; quantity: number; priceAtPurchase: unknown }>
    },
    email: string,
    invoiceUrl: string | null,
  ) {
    const itemsHtml = order.items
      .map(
        (i) =>
          `<tr>
            <td style="padding:8px 0;border-bottom:1px solid #e7e5e4;">${i.productName}</td>
            <td style="padding:8px 0;border-bottom:1px solid #e7e5e4;color:#78716c;">${i.variantSku} × ${i.quantity}</td>
            <td style="padding:8px 0;border-bottom:1px solid #e7e5e4;text-align:right;">
              ${(Number(i.priceAtPurchase) * i.quantity).toFixed(2)} zł
            </td>
          </tr>`,
      )
      .join('')

    const discount = Number(order.discountAmount)
    const discountRow =
      discount > 0
        ? `<tr><td colspan="2" style="padding:8px 0;color:#15803d;">Rabat</td><td style="padding:8px 0;text-align:right;color:#15803d;">−${discount.toFixed(2)} zł</td></tr>`
        : ''

    const invoiceButton = invoiceUrl
      ? `<p style="margin:24px 0 0;">
          <a href="${invoiceUrl}" style="background:#1C1917;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-family:sans-serif;font-size:14px;">
            Pobierz fakturę
          </a>
        </p>`
      : ''

    try {
      await this.resend.emails.send({
        from: `Store <${this.fromEmail}>`,
        to: email,
        subject: `Potwierdzenie zamówienia #${order.id}`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1c1917;">
            <h2 style="font-size:24px;margin-bottom:4px;">Dziękujemy za zamówienie!</h2>
            <p style="color:#78716c;margin-bottom:24px;">Numer zamówienia: <code style="font-family:monospace;background:#f5f5f4;padding:2px 6px;border-radius:4px;">${order.id}</code></p>
            <table style="width:100%;border-collapse:collapse;">
              ${itemsHtml}
              ${discountRow}
              <tr>
                <td colspan="2" style="padding:12px 0;font-weight:600;">Razem</td>
                <td style="padding:12px 0;text-align:right;font-weight:600;">${Number(order.total).toFixed(2)} zł</td>
              </tr>
            </table>
            ${invoiceButton}
            <p style="margin-top:32px;">
              <a href="${this.storefrontUrl}/sklep" style="color:#1c1917;">Kontynuuj zakupy →</a>
            </p>
          </div>
        `,
      })
      this.logger.log(`Order confirmation email sent to ${email} for order ${order.id}`)
    } catch (err) {
      this.logger.error(`Failed to send confirmation email for order ${order.id}`, err)
    }
  }
}
