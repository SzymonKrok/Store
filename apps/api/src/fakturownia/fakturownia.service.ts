import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '../prisma/prisma.service'
import axios from 'axios'
import { parseShippingAddress, parseBillingAddress } from '../common/shipping-address'

@Injectable()
export class FakturowniaService {
  private readonly logger = new Logger(FakturowniaService.name)
  private readonly apiToken: string
  private readonly subdomain: string
  private readonly sellerName: string
  private readonly sellerTaxNo: string

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.apiToken = config.get<string>('FAKTUROWNIA_API_TOKEN') ?? ''
    this.subdomain = config.get<string>('FAKTUROWNIA_SUBDOMAIN') ?? ''
    this.sellerName = config.get<string>('FAKTUROWNIA_SELLER_NAME') ?? 'Sklep Testowy'
    this.sellerTaxNo = config.get<string>('FAKTUROWNIA_SELLER_TAX_NO') ?? ''
  }

  async generateInvoice(order: {
    id: string
    wantsInvoice: boolean
    companyName: string | null
    taxId: string | null
    shippingAddress: unknown
    billingAddress?: unknown
    items: Array<{
      productName: string
      quantity: number
      priceAtPurchase: unknown
    }>
  }): Promise<{ url: string; fakturowniaId: string } | null> {
    if (!this.apiToken || !this.subdomain) {
      this.logger.error(
        `❌ INVOICE ABORTED for order ${order.id} — FAKTUROWNIA_API_TOKEN or FAKTUROWNIA_SUBDOMAIN is not configured`,
      )
      return null
    }

    if (!order.items || order.items.length === 0) {
      this.logger.error(
        `❌ INVOICE ABORTED for order ${order.id} — order has no items to invoice`,
      )
      return null
    }

    const address = parseShippingAddress(order.shippingAddress)
    if (!address.email) {
      this.logger.error(
        `❌ INVOICE ABORTED for order ${order.id} — shippingAddress is missing email (parsed: ${JSON.stringify(address)})`,
      )
      return null
    }

    // Billing address is always present (backend copies shipping when no separate billing provided)
    const billing = parseBillingAddress(order.billingAddress ?? order.shippingAddress)

    // B2B billing path takes priority; legacy wantsInvoice path is fallback for backward compat
    let buyerName: string
    let buyerTaxNo: string | null = null

    if (billing.accountType === 'COMPANY' && billing.companyName) {
      buyerName = billing.companyName
      buyerTaxNo = billing.nip ?? null
    } else if (order.wantsInvoice && order.companyName) {
      buyerName = order.companyName
      buyerTaxNo = order.taxId ?? null
    } else {
      buyerName = `${billing.firstName} ${billing.lastName}`
    }

    const positions = order.items.map((item, idx) => {
      const priceGross = Number(item.priceAtPurchase)
      if (!Number.isFinite(priceGross) || priceGross <= 0) {
        this.logger.error(
          `❌ INVOICE position ${idx} for order ${order.id} has invalid priceAtPurchase: ${String(item.priceAtPurchase)}`,
        )
      }
      const totalGross = +(priceGross * item.quantity).toFixed(2)
      return {
        name: item.productName,
        quantity: item.quantity,
        total_price_gross: totalGross,
        tax: 'zw',
      }
    })

    const invoiceData: Record<string, unknown> = {
      kind: 'vat',
      seller_name: this.sellerName,
      buyer_name: buyerName,
      buyer_email: address.email,
      buyer_street: billing.street,
      buyer_city: billing.city,
      buyer_post_code: billing.postalCode,
      positions,
    }

    if (this.sellerTaxNo) {
      invoiceData.seller_tax_no = this.sellerTaxNo
    }

    if (buyerTaxNo) {
      invoiceData.buyer_tax_no = buyerTaxNo
    }

    try {
      this.logger.log(`\n${'·'.repeat(60)}\n📄 FAKTUROWNIA — generating invoice for order ${order.id}\n   URL: https://${this.subdomain}.fakturownia.pl/invoices.json\n${'·'.repeat(60)}`)
      const { data } = await axios.post(
        `https://${this.subdomain}.fakturownia.pl/invoices.json`,
        { invoice: invoiceData, api_token: `${this.apiToken}/${this.subdomain}` },
      )

      const invoiceUrl: string = data.view_url ?? data.invoice_pdf
      const fakturowniaId: string = String(data.id)
      if (!invoiceUrl) {
        this.logger.error(`Fakturownia returned no invoice URL for order ${order.id}. Response: ${JSON.stringify(data)}`)
        return null
      }

      await this.prisma.order.update({
        where: { id: order.id },
        data: { invoiceUrl, fakturowniaId },
      })

      this.logger.log(`Invoice generated for order ${order.id}: ${invoiceUrl} (fakturowniaId: ${fakturowniaId})`)
      return { url: invoiceUrl, fakturowniaId }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: unknown; status?: number }; message?: string }
      this.logger.error(
        `Fakturownia API error for order ${order.id} — status: ${axiosErr.response?.status ?? 'no response'}, body: ${JSON.stringify(axiosErr.response?.data ?? axiosErr.message)}`,
      )
      return null
    }
  }

  async downloadInvoicePdf(fakturowniaId: string): Promise<Buffer | null> {
    const url = `https://${this.subdomain}.fakturownia.pl/invoices/${fakturowniaId}.pdf?api_token=${this.apiToken}/${this.subdomain}`
    try {
      this.logger.log(`Downloading invoice PDF: fakturowniaId=${fakturowniaId}`)
      const response = await axios.get<ArrayBuffer>(url, { responseType: 'arraybuffer' })
      const buffer = Buffer.from(response.data)
      this.logger.log(`PDF downloaded — ${buffer.length} bytes`)
      return buffer
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number }; message?: string }
      this.logger.error(
        `❌ PDF download failed for fakturowniaId=${fakturowniaId} — status: ${axiosErr.response?.status ?? 'no response'}, message: ${axiosErr.message ?? ''}`,
      )
      return null
    }
  }
}
