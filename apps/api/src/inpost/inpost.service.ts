import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '../prisma/prisma.service'
import { UploadService } from '../upload/upload.service'
import { GenerateLabelDto } from './dto/generate-label.dto'
import { randomUUID } from 'crypto'
import axios, { AxiosError } from 'axios'
import { parseShippingAddress } from '../common/shipping-address'
import type {
  CreateShipmentPayload,
  InpostContact,
  InpostShipmentResponse,
  InpostApiError,
  InpostService as InpostServiceName,
} from './inpost.types'

const PARCEL_DIMENSIONS: Record<'A' | 'B' | 'C', { length: number; width: number; height: number }> = {
  A: { length: 38, width: 64, height: 8 },
  B: { length: 38, width: 64, height: 19 },
  C: { length: 38, width: 64, height: 41 },
}

// Default size for auto-created shipments — admin can re-generate with a specific size if needed
const AUTO_PARCEL_SIZE = 'A' as const
const AUTO_PARCEL_WEIGHT_KG = 1

/**
 * Normalises a Polish phone number to the +48XXXXXXXXX format required by InPost.
 * Accepts: "123456789", "48123456789", "+48 123 456 789", "+48123456789"
 */
function normalizePhone(raw: string): string {
  const stripped = raw.replace(/[^+\d]/g, '')
  if (/^\+48\d{9}$/.test(stripped)) return stripped
  if (/^48\d{9}$/.test(stripped)) return `+${stripped}`
  if (/^\d{9}$/.test(stripped)) return `+48${stripped}`
  return stripped // pass through; InPost will return a clear validation error
}

/**
 * Splits a Polish street string (e.g. "ul. Kwiatowa 12/4") into the
 * { street, building_number } pair that InPost requires.
 * Street prefix (ul., al., os., pl.) is stripped from the street name.
 */
function splitStreet(full: string): { street: string; building_number: string } {
  const trimmed = full.trim()
  // Match last token that looks like a building number: digits + optional letter + optional /floor
  const match = trimmed.match(/^(.*?)\s+(\d+[a-zA-Z]?(?:\/\d+[a-zA-Z]?)?)$/)
  if (match) {
    const streetName = match[1].replace(/^(ul\.|al\.|os\.|pl\.)\s*/i, '').trim()
    return { street: streetName, building_number: match[2] }
  }
  // Fallback: no building number detected — send full string as street; InPost will validate
  return { street: trimmed.replace(/^(ul\.|al\.|os\.|pl\.)\s*/i, '').trim(), building_number: '' }
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
    this.apiUrl = config.get<string>('INPOST_API_URL') ?? 'https://sandbox-api-shipx-pl.easypack24.net'
  }

  private get headers() {
    return { Authorization: `Bearer ${this.apiToken}`, 'Content-Type': 'application/json' }
  }

  private senderContact(): InpostContact {
    return {
      name: this.config.get<string>('STORE_NAME') ?? '',
      email: this.config.get<string>('STORE_EMAIL') ?? '',
      phone: normalizePhone(this.config.get<string>('STORE_PHONE') ?? ''),
      address: {
        street: this.config.get<string>('STORE_STREET') ?? '',
        building_number: this.config.get<string>('STORE_BUILDING_NUMBER') ?? '1',
        city: this.config.get<string>('STORE_CITY') ?? '',
        post_code: this.config.get<string>('STORE_POSTAL_CODE') ?? '',
        country_code: 'PL',
      },
    }
  }

  private buildReceiverContact(
    address: ReturnType<typeof parseShippingAddress>,
    isLocker: boolean,
  ): InpostContact {
    const base = {
      name: `${address.firstName} ${address.lastName}`,
      email: address.email,
      phone: normalizePhone(address.phone),
    }
    if (isLocker) return base
    const { street, building_number } = splitStreet(address.street)
    return {
      ...base,
      address: {
        street,
        building_number,
        city: address.city,
        post_code: address.postalCode,
        country_code: 'PL',
      },
    }
  }

  private buildPayload(
    receiver: InpostContact,
    service: InpostServiceName,
    lockerCode: string | null,
    parcelSize: 'A' | 'B' | 'C',
    parcelWeightKg: number,
    orderId: string,
  ): CreateShipmentPayload {
    const payload: CreateShipmentPayload = {
      receiver,
      sender: this.senderContact(),
      parcels: [
        {
          dimensions: { ...PARCEL_DIMENSIONS[parcelSize], unit: 'mm' },
          weight: { amount: parcelWeightKg, unit: 'kg' },
        },
      ],
      service,
      reference: orderId,
    }
    if (service.startsWith('inpost_locker') && lockerCode) {
      payload.custom_attributes = { target_point: lockerCode }
    }
    return payload
  }

  private logApiError(context: string, err: unknown): void {
    const axiosErr = err as AxiosError<InpostApiError>
    const status = axiosErr.response?.status ?? 'no response'
    const body = axiosErr.response?.data
    if (body && typeof body === 'object') {
      this.logger.error(
        `❌ ${context} — HTTP ${status}\n` +
        `   error: ${body.error ?? ''}\n` +
        `   message: ${body.message ?? ''}\n` +
        `   details: ${JSON.stringify(body.details ?? {})}`,
      )
    } else {
      this.logger.error(`❌ ${context} — HTTP ${status}: ${axiosErr.message}`)
    }
  }

  /**
   * Auto-creates a shipment on order.paid for PARCEL_LOCKER orders.
   * Uses default parcel size (A) and weight (1 kg) — admin can re-generate via the
   * manual generate-label endpoint if actual dimensions differ.
   */
  async createShipment(order: {
    id: string
    deliveryMethod: string
    lockerCode: string | null
    shippingAddress: unknown
  }): Promise<{ shipmentId: string; trackingNumber: string } | null> {
    if (!this.apiToken || !this.orgId) {
      this.logger.warn(
        `⚠️  INPOST SKIPPED for order ${order.id} — INPOST_API_TOKEN or INPOST_ORG_ID is not configured`,
      )
      return null
    }

    const isLocker = order.deliveryMethod === 'PARCEL_LOCKER'
    if (!isLocker || !order.lockerCode) {
      this.logger.warn(
        `⚠️  createShipment called for order ${order.id} but deliveryMethod=${order.deliveryMethod} lockerCode=${order.lockerCode ?? 'null'} — skipping`,
      )
      return null
    }

    const address = parseShippingAddress(order.shippingAddress)
    const receiver = this.buildReceiverContact(address, true)
    const payload = this.buildPayload(
      receiver,
      'inpost_locker_standard',
      order.lockerCode,
      AUTO_PARCEL_SIZE,
      AUTO_PARCEL_WEIGHT_KG,
      order.id,
    )

    this.logger.log(
      `\n${'·'.repeat(60)}\n📦 INPOST — creating shipment for order ${order.id}\n` +
      `   URL: ${this.apiUrl}/v1/organizations/${this.orgId}/shipments\n` +
      `   target_point: ${order.lockerCode}\n` +
      `   receiver: ${receiver.name} <${receiver.email}> ${receiver.phone}\n` +
      `${'·'.repeat(60)}`,
    )

    try {
      const { data: shipment } = await axios.post<InpostShipmentResponse>(
        `${this.apiUrl}/v1/organizations/${this.orgId}/shipments`,
        payload,
        { headers: this.headers },
      )

      this.logger.log(
        `✅ Shipment created — id=${shipment.id} tracking=${shipment.tracking_number} status=${shipment.status}`,
      )

      await this.prisma.order.update({
        where: { id: order.id },
        data: { inpostShipmentId: shipment.id, trackingNumber: shipment.tracking_number },
      })

      return { shipmentId: shipment.id, trackingNumber: shipment.tracking_number }
    } catch (err: unknown) {
      this.logApiError(`InPost createShipment for order ${order.id}`, err)
      return null
    }
  }

  /**
   * Admin-triggered: creates shipment + downloads label PDF + uploads to R2.
   * Allows specifying the exact parcel size and weight.
   */
  async generateLabel(orderId: string, dto: GenerateLabelDto) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } })
    if (!order) throw new NotFoundException('Order not found')
    if (order.status !== 'PAID') throw new BadRequestException('Order must be PAID to generate a label')
    if (order.inpostShipmentId) throw new BadRequestException('Label already generated for this order')

    const address = parseShippingAddress(order.shippingAddress)
    const isLocker = order.deliveryMethod === 'PARCEL_LOCKER'
    const service: InpostServiceName = isLocker ? 'inpost_locker_standard' : 'inpost_courier_standard'

    const receiver = this.buildReceiverContact(address, isLocker)
    const payload = this.buildPayload(
      receiver,
      service,
      order.lockerCode,
      dto.parcelSize,
      dto.parcelWeight,
      orderId,
    )

    this.logger.log(
      `\n${'·'.repeat(60)}\n📦 INPOST — generating label for order ${orderId}\n` +
      `   service: ${service}  size: ${dto.parcelSize}  weight: ${dto.parcelWeight}kg\n` +
      `${'·'.repeat(60)}`,
    )

    let shipmentId: string
    let trackingNumber: string

    try {
      const { data: shipment } = await axios.post<InpostShipmentResponse>(
        `${this.apiUrl}/v1/organizations/${this.orgId}/shipments`,
        payload,
        { headers: this.headers },
      )
      shipmentId = shipment.id
      trackingNumber = shipment.tracking_number
      this.logger.log(`   Shipment created — id=${shipmentId} tracking=${trackingNumber}`)
    } catch (err: unknown) {
      this.logApiError(`InPost createShipment (admin) for order ${orderId}`, err)
      throw new BadRequestException('InPost shipment creation failed — see server logs')
    }

    let shippingLabelUrl: string
    try {
      const { data: labelBuffer } = await axios.get<ArrayBuffer>(
        `${this.apiUrl}/v1/shipments/${shipmentId}/label`,
        { headers: { ...this.headers, Accept: 'application/pdf' }, responseType: 'arraybuffer' },
      )
      const labelKey = `labels/${orderId}-${randomUUID()}.pdf`
      shippingLabelUrl = await this.uploadService.uploadBuffer(
        Buffer.from(labelBuffer),
        labelKey,
        'application/pdf',
      )
      this.logger.log(`   Label PDF uploaded: ${shippingLabelUrl}`)
    } catch (err: unknown) {
      this.logApiError(`InPost label download for shipment ${shipmentId}`, err)
      throw new BadRequestException('InPost label download failed — see server logs')
    }

    await this.prisma.order.update({
      where: { id: orderId },
      data: { inpostShipmentId: shipmentId, trackingNumber, shippingLabelUrl },
    })

    this.logger.log(`Label generated for order ${orderId}: ${trackingNumber}`)
    return { trackingNumber, shippingLabelUrl }
  }
}
