// InPost ShipX API — request and response shapes

export interface InpostAddress {
  street: string
  building_number: string
  city: string
  post_code: string
  country_code: string
}

export interface InpostContact {
  // Locker services accept a single name field.
  // Courier services require first_name + last_name (person) or company_name (business).
  name?: string
  first_name?: string
  last_name?: string
  company_name?: string
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
  id: string | number
  href: string
  status: string
  tracking_number: string | null
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
