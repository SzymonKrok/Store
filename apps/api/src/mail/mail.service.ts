import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Resend } from 'resend'

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

  constructor(config: ConfigService) {
    this.resend = new Resend(config.get<string>('RESEND_API_KEY'))
    this.from = config.get<string>('RESEND_FROM_EMAIL') ?? 'zamowienia@store.pl'
    this.storefrontUrl = config.get<string>('STOREFRONT_URL') ?? 'http://localhost:3000'
  }

  // ─── Order confirmation (fires on order.paid event) ───────────────────────

  async sendOrderConfirmation(
    email: string,
    order: OrderConfirmationData,
    invoiceUrl: string | null,
  ): Promise<void> {
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
        ? `<tr>
            <td colspan="2" style="padding:8px 0;color:#15803d;">Rabat</td>
            <td style="padding:8px 0;text-align:right;color:#15803d;">−${discount.toFixed(2)} zł</td>
          </tr>`
        : ''

    const invoiceButton = invoiceUrl
      ? `<p style="margin:24px 0 0;">
          <a href="${invoiceUrl}" style="background:#1C1917;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:14px;">
            Pobierz fakturę
          </a>
        </p>`
      : ''

    await this.send({
      to: email,
      subject: `Potwierdzenie zamówienia #${order.id}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1c1917;">
          <h2 style="font-size:24px;margin-bottom:4px;">Dziękujemy za zamówienie!</h2>
          <p style="color:#78716c;margin-bottom:24px;">
            Numer zamówienia: <code style="font-family:monospace;background:#f5f5f4;padding:2px 6px;border-radius:4px;">${order.id}</code>
          </p>
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
  }

  // ─── Guest order acknowledged (fires immediately at order creation) ────────

  async sendGuestOrderAcknowledged(
    email: string,
    orderId: string,
    items: OrderItem[],
    total: unknown,
    discountAmount: unknown,
  ): Promise<void> {
    const itemsHtml = items
      .map(
        (i) =>
          `<tr>
            <td style="padding:8px 0;border-bottom:1px solid #e7e5e4;">${i.productName}</td>
            <td style="padding:8px 0;border-bottom:1px solid #e7e5e4;color:#78716c;">× ${i.quantity}</td>
            <td style="padding:8px 0;border-bottom:1px solid #e7e5e4;text-align:right;">
              ${(Number(i.priceAtPurchase) * i.quantity).toFixed(2)} zł
            </td>
          </tr>`,
      )
      .join('')

    const discount = Number(discountAmount)
    const discountRow =
      discount > 0
        ? `<tr>
            <td colspan="2" style="padding:8px 0;color:#15803d;">Rabat</td>
            <td style="padding:8px 0;text-align:right;color:#15803d;">−${discount.toFixed(2)} zł</td>
          </tr>`
        : ''

    await this.send({
      to: email,
      subject: `Przyjęliśmy Twoje zamówienie #${orderId}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1c1917;">
          <h2 style="font-size:24px;margin-bottom:4px;">Zamówienie przyjęte!</h2>
          <p style="color:#78716c;margin-bottom:8px;">
            Numer zamówienia: <code style="font-family:monospace;background:#f5f5f4;padding:2px 6px;border-radius:4px;">${orderId}</code>
          </p>
          <p style="color:#78716c;margin-bottom:24px;">
            Twoje zamówienie oczekuje na płatność. Po jej potwierdzeniu wyślemy osobną wiadomość z podsumowaniem.
          </p>
          <table style="width:100%;border-collapse:collapse;">
            ${itemsHtml}
            ${discountRow}
            <tr>
              <td colspan="2" style="padding:12px 0;font-weight:600;">Razem</td>
              <td style="padding:12px 0;text-align:right;font-weight:600;">${Number(total).toFixed(2)} zł</td>
            </tr>
          </table>
          <p style="margin-top:32px;font-size:13px;color:#78716c;">
            Chcesz śledzić zamówienie?
            <a href="${this.storefrontUrl}/order-confirmation/${orderId}" style="color:#1c1917;">Kliknij tutaj</a>.
          </p>
        </div>
      `,
    })
  }

  // ─── Order status changed (SHIPPED / DELIVERED) ───────────────────────────

  async sendOrderStatusChanged(
    email: string,
    orderId: string,
    status: 'SHIPPED' | 'DELIVERED',
    trackingNumber?: string | null,
  ): Promise<void> {
    const isShipped = status === 'SHIPPED'
    const heading = isShipped ? 'Twoje zamówienie zostało wysłane!' : 'Twoje zamówienie zostało dostarczone!'
    const body = isShipped
      ? 'Twoja paczka jest już w drodze.'
      : 'Twoja paczka dotarła na miejsce. Miłego korzystania!'

    const trackingSection =
      isShipped && trackingNumber
        ? `<p style="margin:16px 0;padding:12px 16px;background:#f5f5f4;border-radius:8px;font-size:14px;">
            Numer śledzenia: <code style="font-family:monospace;">${trackingNumber}</code>
          </p>`
        : ''

    await this.send({
      to: email,
      subject: `${isShipped ? 'Wysłano' : 'Dostarczono'} zamówienie #${orderId}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1c1917;">
          <h2 style="font-size:24px;margin-bottom:8px;">${heading}</h2>
          <p style="color:#78716c;margin-bottom:8px;">
            Zamówienie: <code style="font-family:monospace;background:#f5f5f4;padding:2px 6px;border-radius:4px;">${orderId}</code>
          </p>
          <p style="color:#78716c;">${body}</p>
          ${trackingSection}
          <p style="margin-top:32px;">
            <a href="${this.storefrontUrl}/order-confirmation/${orderId}" style="background:#1C1917;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:14px;">
              Szczegóły zamówienia
            </a>
          </p>
        </div>
      `,
    })
  }

  // ─── Welcome email (after registration) ───────────────────────────────────

  async sendWelcomeEmail(email: string, firstName?: string | null): Promise<void> {
    const greeting = firstName ? `Cześć, ${firstName}!` : 'Witaj!'
    await this.send({
      to: email,
      subject: 'Witaj w Store!',
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1c1917;">
          <h2 style="font-size:24px;margin-bottom:8px;">${greeting}</h2>
          <p style="color:#78716c;margin-bottom:24px;">
            Twoje konto zostało pomyślnie utworzone. Możesz teraz śledzić swoje zamówienia i zarządzać kontem.
          </p>
          <p>
            <a href="${this.storefrontUrl}/konto" style="background:#1C1917;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:14px;">
              Przejdź do konta
            </a>
          </p>
        </div>
      `,
    })
  }

  // ─── Guest-to-user conversion welcome ─────────────────────────────────────

  async sendGuestConversionWelcome(email: string, firstName?: string | null): Promise<void> {
    const greeting = firstName ? `Cześć, ${firstName}!` : 'Witaj!'
    await this.send({
      to: email,
      subject: 'Konto zostało utworzone',
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1c1917;">
          <h2 style="font-size:24px;margin-bottom:8px;">${greeting}</h2>
          <p style="color:#78716c;margin-bottom:24px;">
            Twoje konto zostało pomyślnie utworzone na podstawie danych z zamówienia.
            Możesz teraz śledzić wszystkie swoje zamówienia w jednym miejscu.
          </p>
          <p>
            <a href="${this.storefrontUrl}/konto/zamowienia" style="background:#1C1917;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:14px;">
              Zobacz moje zamówienia
            </a>
          </p>
        </div>
      `,
    })
  }

  // ─── Abandoned cart recovery ──────────────────────────────────────────────

  async sendAbandonedCartRecovery(email: string, items: AbandonedCartItem[]): Promise<void> {
    const itemsList = items
      .map((i) => `<li>${i.variant.product.name} &times; ${i.quantity}</li>`)
      .join('')

    await this.send({
      to: email,
      subject: 'Zapomniałeś o swoim koszyku!',
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1c1917;">
          <h2 style="font-size:24px;margin-bottom:8px;">Masz produkty w koszyku!</h2>
          <p style="color:#78716c;margin-bottom:16px;">Zostawiłeś coś w swoim koszyku:</p>
          <ul style="color:#1c1917;margin-bottom:24px;">${itemsList}</ul>
          <p>
            <a href="${this.storefrontUrl}/sklep" style="background:#1C1917;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:14px;">
              Wróć do sklepu
            </a>
          </p>
        </div>
      `,
    })
  }

  // ─── Internal send helper ─────────────────────────────────────────────────

  private async send(params: { to: string; subject: string; html: string }): Promise<void> {
    try {
      await this.resend.emails.send({
        from: `Store <${this.from}>`,
        to: params.to,
        subject: params.subject,
        html: params.html,
      })
      this.logger.log(`Email sent → ${params.to} [${params.subject}]`)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      this.logger.error(`Email failed → ${params.to} [${params.subject}]: ${message}`, err instanceof Error ? err.stack : undefined)
    }
  }
}
