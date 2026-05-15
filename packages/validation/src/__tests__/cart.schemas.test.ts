import {
  addCartItemSchema,
  updateCartItemSchema,
  validateCouponSchema,
  createCouponSchema,
  shippingAddressSchema,
  checkoutSchema,
} from '../cart.schemas'

describe('addCartItemSchema', () => {
  it('accepts valid input', () => {
    expect(addCartItemSchema.parse({ variantId: 'v1', quantity: 2 })).toEqual({ variantId: 'v1', quantity: 2 })
  })
  it('rejects quantity < 1', () => {
    expect(() => addCartItemSchema.parse({ variantId: 'v1', quantity: 0 })).toThrow()
  })
  it('rejects non-integer quantity', () => {
    expect(() => addCartItemSchema.parse({ variantId: 'v1', quantity: 1.5 })).toThrow()
  })
})

describe('updateCartItemSchema', () => {
  it('accepts valid quantity', () => {
    expect(updateCartItemSchema.parse({ quantity: 3 })).toEqual({ quantity: 3 })
  })
  it('rejects quantity < 1', () => {
    expect(() => updateCartItemSchema.parse({ quantity: 0 })).toThrow()
  })
})

describe('validateCouponSchema', () => {
  it('accepts valid input', () => {
    expect(validateCouponSchema.parse({ code: 'SAVE10', subtotal: 100 })).toEqual({ code: 'SAVE10', subtotal: 100 })
  })
  it('rejects negative subtotal', () => {
    expect(() => validateCouponSchema.parse({ code: 'SAVE10', subtotal: -1 })).toThrow()
  })
})

describe('createCouponSchema', () => {
  it('accepts valid PERCENTAGE coupon', () => {
    const result = createCouponSchema.parse({ code: 'SAVE10', type: 'PERCENTAGE', value: 10 })
    expect(result.isActive).toBe(true)
  })
  it('rejects lowercase code', () => {
    expect(() => createCouponSchema.parse({ code: 'save10', type: 'FLAT', value: 20 })).toThrow()
  })
  it('rejects invalid type', () => {
    expect(() => createCouponSchema.parse({ code: 'SAVE10', type: 'INVALID', value: 10 })).toThrow()
  })
})

describe('shippingAddressSchema', () => {
  const valid = {
    firstName: 'Jan', lastName: 'Kowalski', email: 'jan@example.com',
    street: 'ul. Kwiatowa 1', city: 'Warszawa', postalCode: '00-001', phone: '123456789',
  }
  it('accepts valid address', () => {
    expect(shippingAddressSchema.parse(valid)).toMatchObject(valid)
  })
  it('rejects invalid postal code', () => {
    expect(() => shippingAddressSchema.parse({ ...valid, postalCode: '00001' })).toThrow()
  })
  it('rejects invalid email', () => {
    expect(() => shippingAddressSchema.parse({ ...valid, email: 'not-an-email' })).toThrow()
  })
})

describe('checkoutSchema', () => {
  const valid = {
    shippingAddress: {
      firstName: 'Jan', lastName: 'Kowalski', email: 'jan@example.com',
      street: 'ul. Kwiatowa 1', city: 'Warszawa', postalCode: '00-001', phone: '123456789',
    },
    acceptTerms: true as const,
  }
  it('accepts valid checkout', () => {
    expect(checkoutSchema.parse(valid)).toMatchObject({ acceptTerms: true })
  })
  it('rejects acceptTerms = false', () => {
    expect(() => checkoutSchema.parse({ ...valid, acceptTerms: false })).toThrow()
  })
  it('rejects missing acceptTerms', () => {
    expect(() => checkoutSchema.parse({ shippingAddress: valid.shippingAddress })).toThrow()
  })
})
