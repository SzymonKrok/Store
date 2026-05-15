import { z } from 'zod'

export const addCartItemSchema = z.object({
  variantId: z.string().min(1),
  quantity: z.number().int().min(1),
})
export type AddCartItemDto = z.infer<typeof addCartItemSchema>

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(1),
})
export type UpdateCartItemDto = z.infer<typeof updateCartItemSchema>

export const mergeCartSchema = z.object({
  sessionId: z.string().min(1),
})
export type MergeCartDto = z.infer<typeof mergeCartSchema>

export const validateCouponSchema = z.object({
  code: z.string().min(1),
  subtotal: z.number().positive(),
})
export type ValidateCouponDto = z.infer<typeof validateCouponSchema>

export const createCouponSchema = z.object({
  code: z.string().min(1).max(50).regex(/^[A-Z0-9_-]+$/, 'Uppercase letters, numbers, _ and - only'),
  type: z.enum(['PERCENTAGE', 'FLAT']),
  value: z.number().positive(),
  expiresAt: z.string().datetime().optional(),
  minOrderValue: z.number().positive().optional(),
  maxUses: z.number().int().positive().optional(),
  limitPerUser: z.number().int().positive().optional(),
  isActive: z.boolean().default(true),
})
export type CreateCouponDto = z.infer<typeof createCouponSchema>

export const updateCouponSchema = createCouponSchema.partial()
export type UpdateCouponDto = z.infer<typeof updateCouponSchema>

export const shippingAddressSchema = z.object({
  firstName: z.string().min(1, 'Imię jest wymagane'),
  lastName: z.string().min(1, 'Nazwisko jest wymagane'),
  email: z.string().email('Nieprawidłowy adres email'),
  street: z.string().min(1, 'Ulica jest wymagana'),
  city: z.string().min(1, 'Miasto jest wymagane'),
  postalCode: z.string().regex(/^\d{2}-\d{3}$/, 'Format: 00-000'),
  phone: z.string().min(9, 'Numer telefonu jest wymagany'),
})
export type ShippingAddress = z.infer<typeof shippingAddressSchema>

export const checkoutSchema = z.object({
  shippingAddress: shippingAddressSchema,
  couponCode: z.string().optional(),
  acceptTerms: z.literal(true, {
    errorMap: () => ({ message: 'Musisz zaakceptować regulamin' }),
  }),
  sessionId: z.string().optional(),
})
export type CheckoutDto = z.infer<typeof checkoutSchema>
