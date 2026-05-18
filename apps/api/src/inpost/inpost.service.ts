import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '../prisma/prisma.service'
import { UploadService } from '../upload/upload.service'
import { GenerateLabelDto } from './dto/generate-label.dto'
import { randomUUID } from 'crypto'
import axios from 'axios'
import { parseShippingAddress } from '../common/shipping-address'

const PARCEL_DIMENSIONS: Record<'A' | 'B' | 'C', { length: number; width: number; height: number }> = {
  A: { length: 38, width: 64, height: 8 },
  B: { length: 38, width: 64, height: 19 },
  C: { length: 38, width: 64, height: 41 },
}

@Injectable()
export class InpostService {
  private readonly logger = new Logger(InpostService.name)
  private readonly apiToken: string
  private readonly orgId: string
  private readonly apiUrl: string

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly uploadService: UploadService,
  ) {
    this.apiToken = config.get<string>('INPOST_API_TOKEN') ?? ''
    this.orgId = config.get<string>('INPOST_ORG_ID') ?? ''
    this.apiUrl = config.get<string>('INPOST_API_URL') ?? 'https://api-shipx-pl.easypack24.net'
  }

  private get headers() {
    return { Authorization: `Bearer ${this.apiToken}`, 'Content-Type': 'application/json' }
  }

  private senderDetails() {
    return {
      name: this.config.get<string>('STORE_NAME') ?? '',
      email: this.config.get<string>('STORE_EMAIL') ?? '',
      phone: this.config.get<string>('STORE_PHONE') ?? '',
      address: {
        street: this.config.get<string>('STORE_STREET') ?? '',
        city: this.config.get<string>('STORE_CITY') ?? '',
        post_code: this.config.get<string>('STORE_POSTAL_CODE') ?? '',
        country_code: 'PL',
      },
    }
  }

  async generateLabel(orderId: string, dto: GenerateLabelDto) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } })
    if (!order) throw new NotFoundException('Order not found')
    if (order.status !== 'PAID') throw new BadRequestException('Order must be PAID to generate a label')
    if (order.inpostShipmentId) throw new BadRequestException('Label already generated for this order')

    const address = parseShippingAddress(order.shippingAddress)
    const dimensions = PARCEL_DIMENSIONS[dto.parcelSize]

    const isLocker = order.deliveryMethod === 'PARCEL_LOCKER'

    const receiver = isLocker
      ? { name: `${address.firstName} ${address.lastName}`, email: address.email, phone: address.phone }
      : {
          name: `${address.firstName} ${address.lastName}`,
          email: address.email,
          phone: address.phone,
          address: {
            street: address.street,
            city: address.city,
            post_code: address.postalCode,
            country_code: 'PL',
          },
        }

    const shipmentPayload: Record<string, unknown> = {
      receiver,
      sender: this.senderDetails(),
      parcels: [
        {
          dimensions: { ...dimensions, unit: 'mm' },
          weight: { amount: dto.parcelWeight, unit: 'kg' },
        },
      ],
      service: isLocker ? 'inpost_locker_standard' : 'inpost_courier_standard',
    }

    if (isLocker && order.lockerCode) {
      shipmentPayload.custom_attributes = { target_point: order.lockerCode }
    }

    const { data: shipment } = await axios.post(
      `${this.apiUrl}/v1/organizations/${this.orgId}/shipments`,
      shipmentPayload,
      { headers: this.headers },
    )

    const shipmentId: string = shipment.id
    const trackingNumber: string = shipment.tracking_number

    // Fetch label PDF
    const { data: labelBuffer } = await axios.get<Buffer>(
      `${this.apiUrl}/v1/shipments/${shipmentId}/label`,
      { headers: { ...this.headers, Accept: 'application/pdf' }, responseType: 'arraybuffer' },
    )

    const labelKey = `labels/${orderId}-${randomUUID()}.pdf`
    const shippingLabelUrl = await this.uploadService.uploadBuffer(
      Buffer.from(labelBuffer),
      labelKey,
      'application/pdf',
    )

    await this.prisma.order.update({
      where: { id: orderId },
      data: { inpostShipmentId: shipmentId, trackingNumber, shippingLabelUrl },
    })

    this.logger.log(`Label generated for order ${orderId}: ${trackingNumber}`)
    return { trackingNumber, shippingLabelUrl }
  }
}
