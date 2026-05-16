import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '../prisma/prisma.service'
import axios from 'axios'

@Injectable()
export class FakturowniaService {
  private readonly logger = new Logger(FakturowniaService.name)
  private readonly apiToken: string
  private readonly subdomain: string
  private readonly vatRate: number

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.apiToken = config.get<string>('FAKTUROWNIA_API_TOKEN') ?? ''
    this.subdomain = config.get<string>('FAKTUROWNIA_SUBDOMAIN') ?? ''
    this.vatRate = Number(config.get<string>('FAKTUROWNIA_VAT_RATE') ?? '23')
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
  }): Promise<string | null> {
    const address = order.shippingAddress as Record<string, string>
    const buyerName = order.wantsInvoice && order.companyName
      ? order.companyName
      : `${address.firstName} ${address.lastName}`

    const positions = order.items.map((item) => ({
      name: item.productName,
      quantity: item.quantity,
      price_net: Number(item.priceAtPurchase),
      tax: this.vatRate,
    }))

    const invoiceData: Record<string, unknown> = {
      kind: 'vat',
      buyer_name: buyerName,
      buyer_email: address.email,
      positions,
    }

    if (order.wantsInvoice && order.taxId) {
      invoiceData.buyer_tax_no = order.taxId
    }

    try {
      const { data } = await axios.post(
        `https://app.fakturownia.pl/invoices.json`,
        { invoice: invoiceData, api_token: this.apiToken },
      )

      const invoiceUrl: string = data.view_url ?? data.invoice_pdf
      await this.prisma.order.update({
        where: { id: order.id },
        data: { invoiceUrl, fakturowniaId: String(data.id) },
      })

      this.logger.log(`Invoice generated for order ${order.id}: ${invoiceUrl}`)
      return invoiceUrl
    } catch (err) {
      this.logger.error(`Fakturownia invoice generation failed for order ${order.id}`, err)
      return null
    }
  }
}
