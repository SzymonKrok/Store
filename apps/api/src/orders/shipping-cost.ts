import { DeliveryMethod } from '@prisma/client'

export interface ShippingRates {
  freeShipping: boolean
  shippingCourierCost: unknown
  shippingLockerCost: unknown
  freeShippingThreshold: unknown
}

/**
 * Single source of truth for delivery cost. Precedence:
 *   1. freeShipping flag → always 0.
 *   2. freeShippingThreshold (> 0) reached by the order subtotal → 0.
 *   3. otherwise the per-method price from StoreSettings.
 * An undefined method falls back to courier (the Order default). The threshold
 * is measured against the product subtotal (before coupon discount).
 */
export function resolveShippingCost(
  rates: ShippingRates,
  method: DeliveryMethod | undefined,
  subtotal: number,
): number {
  if (rates.freeShipping) return 0

  const threshold = rates.freeShippingThreshold == null ? 0 : Number(rates.freeShippingThreshold)
  if (threshold > 0 && subtotal >= threshold) return 0

  const cost =
    method === 'PARCEL_LOCKER' ? rates.shippingLockerCost : rates.shippingCourierCost
  return Number(cost)
}
