export interface ShippingAddress {
  firstName: string
  lastName: string
  email: string
  street: string
  city: string
  postalCode: string
  phone: string
}

export function parseShippingAddress(raw: unknown): ShippingAddress {
  const d = (raw ?? {}) as Record<string, unknown>
  return {
    firstName: String(d.firstName ?? ''),
    lastName: String(d.lastName ?? ''),
    email: String(d.email ?? ''),
    street: String(d.street ?? ''),
    city: String(d.city ?? ''),
    postalCode: String(d.postalCode ?? ''),
    phone: String(d.phone ?? ''),
  }
}

export interface BillingAddress {
  accountType: 'PRIVATE' | 'COMPANY'
  firstName: string
  lastName: string
  street: string
  city: string
  postalCode: string
  companyName?: string
  nip?: string
}

export function parseBillingAddress(raw: unknown): BillingAddress {
  const d = (raw ?? {}) as Record<string, unknown>
  return {
    accountType: d.accountType === 'COMPANY' ? 'COMPANY' : 'PRIVATE',
    firstName: String(d.firstName ?? ''),
    lastName: String(d.lastName ?? ''),
    street: String(d.street ?? ''),
    city: String(d.city ?? ''),
    postalCode: String(d.postalCode ?? ''),
    companyName: d.companyName ? String(d.companyName) : undefined,
    nip: d.nip ? String(d.nip) : undefined,
  }
}
