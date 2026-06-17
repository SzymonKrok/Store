import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '../prisma/prisma.service'
import { GenerateLabelDto } from './dto/generate-label.dto'
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

const AUTO_PARCEL_SIZE = 'A' as const
const AUTO_PARCEL_WEIGHT_KG = 1

function normalizePhone(raw: string): string {
  const stripped = raw.replace(/[^+\d]/g, '')
  if (/^\+48\d{9}$/.test(stripped)) return stripped
  if (/^48\d{9}$/.test(stripped)) return `+${stripped}`
  if (/^\d{9}$/.test(stripped)) return `+48${stripped}`
  return stripped
}

function splitStreet(full: string): { street: string; building_number: string } {
  const trimmed = full.trim()
  const match = trimmed.match(/^(.*?)\s+(\d+[a-zA-Z]?(?:\/\d+[a-zA-Z]?)?)$/)
  if (match) {
    const streetName = match[1].replace(/^(ul\.|al\.|os\.|pl\.)\s*/i, '').trim()
    return { street: streetName, building_number: match[2] }
  }
  return { street: trimmed.replace(/^(ul\.|al\.|os\.|pl\.)\s*/i, '').trim(), building_number: '' }
}

function normalizePostalCode(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.length === 5) return `${digits.slice(0, 2)}-${digits.slice(2)}`
  return raw
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
  ) {
    this.apiToken = config.get<string>('INPOST_API_TOKEN') ?? ''
    this.orgId = config.get<string>('INPOST_ORG_ID') ?? ''
    this.apiUrl = config.get<string>('INPOST_API_URL') ?? 'https://sandbox-api-shipx-pl.easypack24.net'
  }

  private get headers() {
    return { Authorization: `Bearer ${this.apiToken}`, 'Content-Type': 'application/json' }
  }

  private senderContact(isCourier = false): InpostContact {
    const storeName = this.config.get<string>('STORE_NAME') ?? ''
    const base = {
      email: this.config.get<string>('STORE_EMAIL') ?? '',
      phone: normalizePhone(this.config.get<string>('STORE_PHONE') ?? ''),
      address: {
        street: this.config.get<string>('STORE_STREET') ?? '',
        building_number: this.config.get<string>('STORE_BUILDING_NUMBER') ?? '1',
        city: this.config.get<string>('STORE_CITY') ?? '',
        post_code: normalizePostalCode(this.config.get<string>('STORE_POSTAL_CODE') ?? ''),
        country_code: 'PL',
      },
    }
    return isCourier ? { ...base, company_name: storeName } : { ...base, name: storeName }
  }

  private buildReceiverContact(
    address: ReturnType<typeof parseShippingAddress>,
    isLocker: boolean,
  ): InpostContact {
    const phone = normalizePhone(address.phone)
    if (isLocker) {
      return { name: `${address.firstName} ${address.lastName}`, email: address.email, phone }
    }
    const { street, building_number } = splitStreet(address.street)
    return {
      first_name: address.firstName,
      last_name: address.lastName,
      email: address.email,
      phone,
      address: {
        street,
        building_number,
        city: address.city,
        post_code: normalizePostalCode(address.postalCode),
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
    const isCourier = service.startsWith('inpost_courier')
    const payload: CreateShipmentPayload = {
      receiver,
      sender: this.senderContact(isCourier),
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
    } else if (isCourier) {
      payload.custom_attributes = { sending_method: 'dispatch_order' }
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
   * InPost assigns a tracking number asynchronously after confirming the shipment.
   * It's typically available within milliseconds, so one follow-up GET is enough.
   */
  private async resolveTrackingNumber(shipmentId: string): Promise<string | null> {
    try {
      const { data } = await axios.get<InpostShipmentResponse>(
        `${this.apiUrl}/v1/shipments/${shipmentId}`,
        { headers: this.headers },
      )
      return data.tracking_number ?? null
    } catch {
      return null
    }
  }

  /**
   * Auto-creates a shipment on order.paid for PARCEL_LOCKER orders.
   */
  async createShipment(order: {
    id: string
    deliveryMethod: string
    lockerCode: string | null
    shippingAddress: unknown
  }): Promise<{ shipmentId: string; trackingNumber: string | null } | null> {
    if (!this.apiToken || !this.orgId) {
      this.logger.warn(`⚠️  INPOST SKIPPED for order ${order.id} — INPOST_API_TOKEN or INPOST_ORG_ID is not configured`)
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
    const payload = this.buildPayload(receiver, 'inpost_locker_standard', order.lockerCode, AUTO_PARCEL_SIZE, AUTO_PARCEL_WEIGHT_KG, order.id)

    this.logger.log(
      `\n${'·'.repeat(60)}\n📦 INPOST — creating shipment for order ${order.id}\n` +
      `   target_point: ${order.lockerCode}  receiver: ${receiver.name} <${receiver.email}>\n` +
      `${'·'.repeat(60)}`,
    )

    try {
      const { data: shipment } = await axios.post<InpostShipmentResponse>(
        `${this.apiUrl}/v1/organizations/${this.orgId}/shipments`,
        payload,
        { headers: this.headers },
      )
      const sid = String(shipment.id)
      const tn = shipment.tracking_number ?? await this.resolveTrackingNumber(sid)
      this.logger.log(`✅ Shipment created — id=${sid} tracking=${tn} status=${shipment.status}`)
      await this.prisma.order.update({ where: { id: order.id }, data: { inpostShipmentId: sid, trackingNumber: tn } })
      return { shipmentId: sid, trackingNumber: tn }
    } catch (err: unknown) {
      this.logApiError(`InPost createShipment for order ${order.id}`, err)
      return null
    }
  }

  /**
   * Admin-triggered: creates a shipment in InPost ShipX and saves the shipment ID.
   * Label download/printing is done manually via the InPost Web Manager.
   */
  async generateLabel(orderId: string, dto: GenerateLabelDto) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } })
    if (!order) throw new NotFoundException('Order not found')
    if (order.status !== 'PAID') throw new BadRequestException('Order must be PAID to generate a label')
    if (order.inpostShipmentId) throw new BadRequestException('Shipment already created for this order')

    const address = parseShippingAddress(order.shippingAddress)
    const isLocker = order.deliveryMethod === 'PARCEL_LOCKER'
    const service: InpostServiceName = isLocker ? 'inpost_locker_standard' : 'inpost_courier_standard'
    const receiver = this.buildReceiverContact(address, isLocker)
    const payload = this.buildPayload(receiver, service, order.lockerCode, dto.parcelSize, dto.parcelWeight, orderId)

    this.logger.log(
      `📦 INPOST — creating shipment for order ${orderId} ` +
      `(service=${service} size=${dto.parcelSize} weight=${dto.parcelWeight}kg)`,
    )

    try {
      const { data: shipment } = await axios.post<InpostShipmentResponse>(
        `${this.apiUrl}/v1/organizations/${this.orgId}/shipments`,
        payload,
        { headers: this.headers },
      )
      const shipmentId = String(shipment.id)
      const trackingNumber = shipment.tracking_number ?? await this.resolveTrackingNumber(shipmentId)
      this.logger.log(`✅ Shipment created — id=${shipmentId} tracking=${trackingNumber} status=${shipment.status}`)

      await this.prisma.order.update({
        where: { id: orderId },
        data: { inpostShipmentId: shipmentId, trackingNumber },
      })

      return { shipmentId, trackingNumber }
    } catch (err: unknown) {
      this.logApiError(`InPost createShipment (admin) for order ${orderId}`, err)
      throw new BadRequestException('InPost shipment creation failed — see server logs')
    }
  }
}
