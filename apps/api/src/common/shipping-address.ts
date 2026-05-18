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
