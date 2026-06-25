import { resolveShippingCost } from './shipping-cost'

const rates = { freeShipping: false, shippingCourierCost: '14.99', shippingLockerCost: '9.99' }

describe('resolveShippingCost', () => {
  it('returns courier cost for COURIER', () => {
    expect(resolveShippingCost(rates, 'COURIER')).toBe(14.99)
  })

  it('returns locker cost for PARCEL_LOCKER', () => {
    expect(resolveShippingCost(rates, 'PARCEL_LOCKER')).toBe(9.99)
  })

  it('defaults undefined method to courier', () => {
    expect(resolveShippingCost(rates, undefined)).toBe(14.99)
  })

  it('returns 0 when freeShipping is enabled', () => {
    expect(resolveShippingCost({ ...rates, freeShipping: true }, 'COURIER')).toBe(0)
  })
})
