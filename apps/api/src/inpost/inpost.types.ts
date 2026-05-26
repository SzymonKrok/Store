// InPost ShipX API — request and response shapes

export interface InpostAddress {
  street: string
  city: string
  post_code: string
  country_code: string
}

export interface InpostContact {
  name: string
  email: string
  phone: string
  address?: InpostAddress
}

export interface InpostParcelDimensions {
  length: number
  width: number
  height: number
  unit: 'mm' | 'cm'
}

export interface InpostParcel {
  dimensions: InpostParcelDimensions
  weight: { amount: number; unit: 'kg' }
}

export interface InpostCustomAttributes {
  /** Destination paczkomat ID for locker-to-locker / courier-to-locker delivery */
  target_point?: string
  sending_method?: 'parcel_locker' | 'dispatch_order'
}

export type InpostService =
  | 'inpost_locker_standard'
  | 'inpost_locker_economy'
  | 'inpost_courier_standard'
  | 'inpost_courier_express_standard'

export interface CreateShipmentPayload {
  receiver: InpostContact
  sender: InpostContact
  parcels: InpostParcel[]
  service: InpostService
  custom_attributes?: InpostCustomAttributes
  /** Order ID used as external reference so InPost can trace it back to our system */
  reference?: string
  comments?: string
}

export interface InpostShipmentResponse {
  id: string
  href: string
  status: string
  tracking_number: string
  service: InpostService
  reference: string | null
  comments: string | null
  receiver: InpostContact
  sender: InpostContact
  parcels: InpostParcel[]
  custom_attributes: InpostCustomAttributes
  created_at: string
  updated_at: string
}

export interface InpostApiErrorDetail {
  [field: string]: string[]
}

export interface InpostApiError {
  status: number
  error: string
  message: string
  details?: InpostApiErrorDetail
}
