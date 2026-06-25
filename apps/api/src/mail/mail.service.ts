import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Resend } from 'resend'
import { render } from '@react-email/render'
import { OrderConfirmationEmail } from './templates/OrderConfirmationEmail'
import { WelcomeEmail } from './templates/WelcomeEmail'
import { GuestOrderAcknowledgedEmail } from './templates/GuestOrderAcknowledgedEmail'
import { OrderStatusShippedEmail } from './templates/OrderStatusShippedEmail'
import { OrderStatusDeliveredEmail } from './templates/OrderStatusDeliveredEmail'
import { AbandonedCartEmail } from './templates/AbandonedCartEmail'
import { ReturnRequestEmail } from './templates/ReturnRequestEmail'
import { ReturnApprovedEmail } from './templates/ReturnApprovedEmail'
import { ReturnRefundedEmail } from './templates/ReturnRefundedEmail'
import { ReturnRequestAdminEmail } from './templates/ReturnRequestAdminEmail'
import { BackInStockEmail } from './templates/BackInStockEmail'

interface OrderItem {
  productName: string
  variantSku: string
  quantity: number
  priceAtPurchase: unknown
}

interface OrderConfirmationData {
  id: string
  total: unknown
  discountAmount: unknown
  items: OrderItem[]
}

interface AbandonedCartItem {
  quantity: number
  variant: { product: { name: string } }
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name)
  private readonly resend: Resend
  private readonly from: string
  private readonly storefrontUrl: string
  private readonly returnAddress: string | null

  constructor(config: ConfigService) {
    this.resend = new Resend(config.get<string>('RESEND_API_KEY'))
    this.from = config.get<string>('RESEND_FROM_EMAIL') ?? 'zamowienia@store.pl'
    this.storefrontUrl = config.get<string>('STOREFRONT_URL') ?? 'http://localhost:3000'

    // Adres do odsyłania zwrotów — składany z danych sklepu (te same co InPost).
    const name = config.get<string>('STORE_NAME')
    const street = config.get<string>('STORE_STREET')
    const building = config.get<string>('STORE_BUILDING_NUMBER')
    const postal = config.get<string>('STORE_POSTAL_CODE')
    const city = config.get<string>('STORE_CITY')
    if (name && street && city) {
      this.returnAddress = `${name}\n${street} ${building ?? ''}`.trim() + `\n${postal ?? ''} ${city}`.trimEnd()
    } else {
      this.returnAddress = null
    }
  }

  // ─── Order confirmation (fires on order.paid event) ───────────────────────

  async sendOrderConfirmation(
    email: string,
    order: OrderConfirmationData,
    invoiceUrl: string | null,
    pdfBuffer: Buffer | null = null,
  ): Promise<void> {
    const html = await render(
      OrderConfirmationEmail({
        orderId: order.id,
        items: order.items.map((i) => ({
          name: i.productName,
          sku: i.variantSku,
          quantity: i.quantity,
          priceGross: Number(i.priceAtPurchase),
        })),
        total: Number(order.total),
        discountAmount: Number(order.discountAmount),
        storefrontUrl: this.storefrontUrl,
        hasPdfAttachment: pdfBuffer !== null,
      }),
    )

    await this.sendWithAttachments({
      to: email,
      subject: `Potwierdzenie zamówienia #${order.id.slice(-8).toUpperCase()}`,
      html,
      attachments: pdfBuffer ? [{ filename: 'Faktura_VAT.pdf', content: pdfBuffer }] : [],
    })
  }

  // ─── Guest order acknowledged (fires immediately at order creation) ────────

  async sendGuestOrderAcknowledged(
    email: string,
    orderId: string,
    items: OrderItem[],
    total: unknown,
    discountAmount: unknown,
  ): Promise<void> {
    const html = await render(
      GuestOrderAcknowledgedEmail({
        orderId,
        items: items.map((i) => ({
          name: i.productName,
          sku: i.variantSku,
          quantity: i.quantity,
          priceGross: Number(i.priceAtPurchase),
        })),
        total: Number(total),
        discountAmount: Number(discountAmount),
        storefrontUrl: this.storefrontUrl,
      }),
    )

    await this.send({
      to: email,
      subject: `Zamówienie #${orderId.slice(-8).toUpperCase()} — oczekuje na płatność`,
      html,
    })
  }

  // ─── Order status: SHIPPED ────────────────────────────────────────────────

  async sendOrderShipped(
    email: string,
    orderId: string,
    trackingNumber?: string | null,
  ): Promise<void> {
    const html = await render(
      OrderStatusShippedEmail({
        orderId,
        trackingNumber,
        storefrontUrl: this.storefrontUrl,
      }),
    )

    await this.send({
      to: email,
      subject: `Zamówienie #${orderId.slice(-8).toUpperCase()} zostało wysłane`,
      html,
    })
  }

  // ─── Order status: DELIVERED ──────────────────────────────────────────────

  async sendOrderDelivered(email: string, orderId: string): Promise<void> {
    const html = await render(
      OrderStatusDeliveredEmail({
        orderId,
        storefrontUrl: this.storefrontUrl,
      }),
    )

    await this.send({
      to: email,
      subject: `Zamówienie #${orderId.slice(-8).toUpperCase()} zostało dostarczone`,
      html,
    })
  }

  // ─── Welcome email (after registration) ───────────────────────────────────

  async sendWelcomeEmail(email: string, firstName?: string | null): Promise<void> {
    const html = await render(
      WelcomeEmail({ firstName, variant: 'new', storefrontUrl: this.storefrontUrl }),
    )

    await this.send({ to: email, subject: 'Witaj w Sklepie!', html })
  }

  // ─── Guest-to-user conversion welcome ─────────────────────────────────────

  async sendGuestConversionWelcome(email: string, firstName?: string | null): Promise<void> {
    const html = await render(
      WelcomeEmail({ firstName, variant: 'conversion', storefrontUrl: this.storefrontUrl }),
    )

    await this.send({ to: email, subject: 'Konto zostało utworzone', html })
  }

  // ─── Abandoned cart recovery ──────────────────────────────────────────────

  async sendAbandonedCartRecovery(email: string, items: AbandonedCartItem[]): Promise<void> {
    const html = await render(
      AbandonedCartEmail({
        items: items.map((i) => ({ name: i.variant.product.name, quantity: i.quantity })),
        storefrontUrl: this.storefrontUrl,
      }),
    )

    await this.send({ to: email, subject: 'Produkty czekają w Twoim koszyku', html })
  }

  // ─── Return request confirmation ──────────────────────────────────────────

  async sendReturnRequestConfirmation(
    email: string,
    orderId: string,
    reason: string,
  ): Promise<void> {
    const html = await render(
      ReturnRequestEmail({ orderId, reason, storefrontUrl: this.storefrontUrl }),
    )

    await this.send({
      to: email,
      subject: `Wniosek zwrotu #${orderId.slice(-8).toUpperCase()} — przyjęty`,
      html,
    })
  }

  // ─── Return: admin notification (new request) ─────────────────────────────

  async sendReturnRequestAdminNotification(
    adminEmail: string,
    orderId: string,
    reason: string,
    items: Array<{ name: string; sku: string; quantity: number }>,
    customerEmail: string,
  ): Promise<void> {
    const html = await render(
      ReturnRequestAdminEmail({ orderId, reason, items, customerEmail, storefrontUrl: this.storefrontUrl }),
    )

    await this.send({
      to: adminEmail,
      subject: `Nowy wniosek zwrotu #${orderId.slice(-8).toUpperCase()}`,
      html,
    })
  }

  // ─── Return: approved (instructions to send back) ─────────────────────────

  async sendReturnApproved(email: string, orderId: string): Promise<void> {
    const html = await render(
      ReturnApprovedEmail({ orderId, returnAddress: this.returnAddress, storefrontUrl: this.storefrontUrl }),
    )

    await this.send({
      to: email,
      subject: `Zwrot #${orderId.slice(-8).toUpperCase()} zatwierdzony`,
      html,
    })
  }

  // ─── Return: refunded ─────────────────────────────────────────────────────

  async sendReturnRefunded(email: string, orderId: string, amount: number): Promise<void> {
    const html = await render(
      ReturnRefundedEmail({ orderId, amount, storefrontUrl: this.storefrontUrl }),
    )

    await this.send({
      to: email,
      subject: `Zwrot środków za zamówienie #${orderId.slice(-8).toUpperCase()}`,
      html,
    })
  }

  async sendBackInStock(
    email: string,
    productName: string,
    productSlug: string,
    variantLabel?: string | null,
  ): Promise<void> {
    const productUrl = `${this.storefrontUrl}/sklep/${productSlug}`
    const html = await render(
      BackInStockEmail({ productName, variantLabel, productUrl, storefrontUrl: this.storefrontUrl }),
    )
    await this.send({ to: email, subject: `${productName} jest znów dostępny`, html })
  }

  // ─── Internal send helpers ────────────────────────────────────────────────

  private async send(params: { to: string; subject: string; html: string }): Promise<void> {
    return this.sendWithAttachments({ ...params, attachments: [] })
  }

  private async sendWithAttachments(params: {
    to: string
    subject: string
    html: string
    attachments: Array<{ filename: string; content: Buffer }>
  }): Promise<void> {
    try {
      await this.resend.emails.send({
        from: `Store <${this.from}>`,
        to: params.to,
        subject: params.subject,
        html: params.html,
        attachments: params.attachments.map((a) => ({
          filename: a.filename,
          content: a.content,
        })),
      })
      const attachNote = params.attachments.length > 0
        ? ` (+${params.attachments.length} attachment)`
        : ''
      this.logger.log(`Email sent → ${params.to} [${params.subject}]${attachNote}`)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      this.logger.error(
        `Email failed → ${params.to} [${params.subject}]: ${message}`,
        err instanceof Error ? err.stack : undefined,
      )
    }
  }
}
