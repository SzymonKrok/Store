import { resolveShippingCost } from './shipping-cost'

const rates = {
  freeShipping: false,
  shippingCourierCost: '14.99',
  shippingLockerCost: '9.99',
  freeShippingThreshold: null,
}

describe('resolveShippingCost', () => {
  it('returns courier cost for COURIER', () => {
    expect(resolveShippingCost(rates, 'COURIER', 100)).toBe(14.99)
  })

  it('returns locker cost for PARCEL_LOCKER', () => {
    expect(resolveShippingCost(rates, 'PARCEL_LOCKER', 100)).toBe(9.99)
  })

  it('defaults undefined method to courier', () => {
    expect(resolveShippingCost(rates, undefined, 100)).toBe(14.99)
  })

  it('returns 0 when freeShipping is enabled', () => {
    expect(resolveShippingCost({ ...rates, freeShipping: true }, 'COURIER', 100)).toBe(0)
  })

  it('returns 0 when subtotal reaches the free-shipping threshold', () => {
    expect(resolveShippingCost({ ...rates, freeShippingThreshold: '299' }, 'COURIER', 299)).toBe(0)
  })

  it('charges the method cost when subtotal is below the threshold', () => {
    expect(resolveShippingCost({ ...rates, freeShippingThreshold: '299' }, 'COURIER', 298.99)).toBe(14.99)
  })

  it('ignores a threshold of 0 (treated as disabled)', () => {
    expect(resolveShippingCost({ ...rates, freeShippingThreshold: '0' }, 'COURIER', 100)).toBe(14.99)
  })
})
