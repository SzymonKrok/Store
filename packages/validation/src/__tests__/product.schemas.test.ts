import { createProductSchema, productQuerySchema, presignSchema } from '../product.schemas'

describe('createProductSchema', () => {
  it('accepts a valid product', () => {
    const result = createProductSchema.safeParse({
      name: 'T-Shirt',
      slug: 't-shirt',
      basePrice: 99.99,
      categoryId: 'cat1',
      variants: [{ sku: 'SKU-001', price: 99.99, stock: 10, attributes: { size: 'M' } }],
    })
    expect(result.success).toBe(true)
  })

  it('rejects slug with uppercase letters', () => {
    const result = createProductSchema.safeParse({
      name: 'T-Shirt', slug: 'T-Shirt', basePrice: 99,
      categoryId: 'cat1', variants: [{ sku: 'S', price: 99, stock: 0, attributes: {} }],
    })
    expect(result.success).toBe(false)
  })

  it('rejects negative basePrice', () => {
    const result = createProductSchema.safeParse({
      name: 'T-Shirt', slug: 't-shirt', basePrice: -1,
      categoryId: 'cat1', variants: [{ sku: 'S', price: 99, stock: 0, attributes: {} }],
    })
    expect(result.success).toBe(false)
  })
})

describe('productQuerySchema', () => {
  it('applies defaults', () => {
    const result = productQuerySchema.parse({})
    expect(result.sortBy).toBe('newest')
    expect(result.page).toBe(1)
    expect(result.limit).toBe(20)
  })

  it('rejects invalid sortBy', () => {
    const result = productQuerySchema.safeParse({ sortBy: 'invalid' })
    expect(result.success).toBe(false)
  })
})

describe('presignSchema', () => {
  it('rejects non-image content types', () => {
    const result = presignSchema.safeParse({ filename: 'file.pdf', contentType: 'application/pdf' })
    expect(result.success).toBe(false)
  })
})
