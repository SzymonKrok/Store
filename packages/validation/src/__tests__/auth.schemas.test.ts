import { registerSchema, loginSchema } from '../auth.schemas'

describe('registerSchema', () => {
  it('accepts valid email and password', () => {
    const result = registerSchema.safeParse({ email: 'user@example.com', password: 'password123' })
    expect(result.success).toBe(true)
  })

  it('rejects invalid email format', () => {
    const result = registerSchema.safeParse({ email: 'not-an-email', password: 'password123' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].path).toContain('email')
  })

  it('rejects password shorter than 8 characters', () => {
    const result = registerSchema.safeParse({ email: 'user@example.com', password: 'short' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].path).toContain('password')
  })

  it('rejects password longer than 100 characters', () => {
    const result = registerSchema.safeParse({ email: 'user@example.com', password: 'a'.repeat(101) })
    expect(result.success).toBe(false)
  })

  it('rejects missing fields', () => {
    const result = registerSchema.safeParse({})
    expect(result.success).toBe(false)
    expect(result.error?.issues.length).toBeGreaterThanOrEqual(2)
  })
})

describe('loginSchema', () => {
  it('accepts valid credentials', () => {
    const result = loginSchema.safeParse({ email: 'user@example.com', password: 'anypassword' })
    expect(result.success).toBe(true)
  })

  it('rejects empty password', () => {
    const result = loginSchema.safeParse({ email: 'user@example.com', password: '' })
    expect(result.success).toBe(false)
  })

  it('rejects invalid email', () => {
    const result = loginSchema.safeParse({ email: 'bad', password: 'password123' })
    expect(result.success).toBe(false)
  })
})
