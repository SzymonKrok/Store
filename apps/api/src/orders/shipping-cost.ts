import { DeliveryMethod } from '@prisma/client'

export interface ShippingRates {
  freeShipping: boolean
  shippingCourierCost: unknown
  shippingLockerCost: unknown
}

/**
 * Single source of truth for delivery cost. When freeShipping is on, every
 * method costs 0. Otherwise the per-method price from StoreSettings applies.
 * An undefined method falls back to courier (the Order default).
 */
export function resolveShippingCost(
  rates: ShippingRates,
  method: DeliveryMethod | undefined,
): number {
  if (rates.freeShipping) return 0
  const cost =
    method === 'PARCEL_LOCKER' ? rates.shippingLockerCost : rates.shippingCourierCost
  return Number(cost)
}
