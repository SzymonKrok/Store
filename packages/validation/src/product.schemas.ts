import { z } from 'zod'

export const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens only'),
  parentId: z.string().optional(),
})
export type CreateCategoryDto = z.infer<typeof createCategorySchema>
export const updateCategorySchema = createCategorySchema.partial()
export type UpdateCategoryDto = z.infer<typeof updateCategorySchema>

export const createVariantSchema = z.object({
  sku: z.string().min(1).max(100),
  price: z.number().positive(),
  stock: z.number().int().min(0),
  attributes: z.record(z.string()),
})
export type CreateVariantDto = z.infer<typeof createVariantSchema>

export const createProductImageSchema = z.object({
  url: z.string().url(),
  altText: z.string().max(255).optional(),
  position: z.number().int().min(0).default(0),
})
export type CreateProductImageDto = z.infer<typeof createProductImageSchema>

export const createProductSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens only'),
  description: z.string().optional(),
  basePrice: z.number().positive(),
  categoryId: z.string().min(1),
  variants: z.array(createVariantSchema).min(1, 'At least one variant required'),
  images: z.array(createProductImageSchema).default([]),
})
export type CreateProductDto = z.infer<typeof createProductSchema>
export const updateProductSchema = createProductSchema.partial()
export type UpdateProductDto = z.infer<typeof updateProductSchema>

export const productQuerySchema = z.object({
  categoryId: z.string().optional(),
  minPrice: z.coerce.number().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  sortBy: z.enum(['price_asc', 'price_desc', 'newest']).default('newest'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})
export type ProductQueryDto = z.infer<typeof productQuerySchema>

export const presignSchema = z.object({
  filename: z.string().min(1).max(255),
  contentType: z.string().regex(/^image\/(jpeg|png|webp|gif)$/, 'Only image/jpeg, image/png, image/webp, image/gif allowed'),
})
export type PresignDto = z.infer<typeof presignSchema>
