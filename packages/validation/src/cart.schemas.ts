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
  street: z.string().optional().default(''),
  city: z.string().optional().default(''),
  postalCode: z.string().optional().default(''),
  phone: z.string().min(9, 'Numer telefonu jest wymagany'),
})
export type ShippingAddress = z.infer<typeof shippingAddressSchema>

export const billingAddressSchema = z.object({
  accountType: z.enum(['PRIVATE', 'COMPANY']).default('PRIVATE'),
  firstName: z.string().min(1, 'Imię jest wymagane'),
  lastName: z.string().min(1, 'Nazwisko jest wymagane'),
  street: z.string().min(1, 'Ulica jest wymagana'),
  city: z.string().min(1, 'Miasto jest wymagane'),
  postalCode: z.string().regex(/^\d{2}-\d{3}$/, 'Format: 00-000'),
  companyName: z.string().optional(),
  nip: z.string().regex(/^\d{10}$/, 'NIP musi zawierać 10 cyfr').optional(),
})
export type BillingAddress = z.infer<typeof billingAddressSchema>

export const checkoutSchema = z
  .object({
    shippingAddress: shippingAddressSchema,
    couponCode: z.string().optional(),
    acceptTerms: z.literal(true, {
      errorMap: () => ({ message: 'Musisz zaakceptować regulamin' }),
    }),
    sessionId: z.string().optional(),
    deliveryMethod: z.enum(['COURIER', 'PARCEL_LOCKER']),
    lockerCode: z.string().optional(),
    wantsInvoice: z.boolean().default(false),
    companyName: z.string().optional(),
    taxId: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.deliveryMethod === 'COURIER') {
      if (!data.shippingAddress.street) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Ulica jest wymagana', path: ['shippingAddress', 'street'] })
      }
      if (!data.shippingAddress.city) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Miasto jest wymagane', path: ['shippingAddress', 'city'] })
      }
      if (!data.shippingAddress.postalCode || !/^\d{2}-\d{3}$/.test(data.shippingAddress.postalCode)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'shippingAddress.postalCode must be in format 00-000', path: ['shippingAddress', 'postalCode'] })
      }
    }
    if (data.deliveryMethod === 'PARCEL_LOCKER' && !data.lockerCode) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Wybierz paczkomat',
        path: ['lockerCode'],
      })
    }
    if (data.wantsInvoice) {
      if (!data.companyName) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Nazwa firmy jest wymagana',
          path: ['companyName'],
        })
      }
      if (!data.taxId || !/^\d{10}$/.test(data.taxId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'NIP musi zawierać 10 cyfr',
          path: ['taxId'],
        })
      }
    }
  })
export type CheckoutDto = z.infer<typeof checkoutSchema>

export const generateLabelSchema = z.object({
  parcelSize: z.enum(['A', 'B', 'C']),
  parcelWeight: z.number().positive(),
})
export type GenerateLabelDto = z.infer<typeof generateLabelSchema>
