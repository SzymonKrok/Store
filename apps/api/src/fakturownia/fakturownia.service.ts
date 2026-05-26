import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '../prisma/prisma.service'
import axios from 'axios'
import { parseShippingAddress } from '../common/shipping-address'

@Injectable()
export class FakturowniaService {
  private readonly logger = new Logger(FakturowniaService.name)
  private readonly apiToken: string
  private readonly subdomain: string
  private readonly vatRate: number
  private readonly sellerName: string
  private readonly sellerTaxNo: string

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.apiToken = config.get<string>('FAKTUROWNIA_API_TOKEN') ?? ''
    this.subdomain = config.get<string>('FAKTUROWNIA_SUBDOMAIN') ?? ''
    this.vatRate = Number(config.get<string>('FAKTUROWNIA_VAT_RATE') ?? '23')
    this.sellerName = config.get<string>('FAKTUROWNIA_SELLER_NAME') ?? 'Sklep Testowy'
    this.sellerTaxNo = config.get<string>('FAKTUROWNIA_SELLER_TAX_NO') ?? ''
  }

  async generateInvoice(order: {
    id: string
    wantsInvoice: boolean
    companyName: string | null
    taxId: string | null
    shippingAddress: unknown
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

    const buyerName = order.wantsInvoice && order.companyName
      ? order.companyName
      : `${address.firstName} ${address.lastName}`

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
        tax: this.vatRate,
      }
    })

    const invoiceData: Record<string, unknown> = {
      kind: 'vat',
      seller_name: this.sellerName,
      buyer_name: buyerName,
      buyer_email: address.email,
      positions,
    }

    if (this.sellerTaxNo) {
      invoiceData.seller_tax_no = this.sellerTaxNo
    }

    if (order.wantsInvoice && order.taxId) {
      invoiceData.buyer_tax_no = order.taxId
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
