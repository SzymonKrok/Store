# Phase 2: Product Catalog — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the full product catalog — backend CRUD API, R2 pre-signed image uploads, storefront Product Grid + Product Detail pages, and dynamic SEO.

**Architecture:** Three NestJS modules (categories, products, upload) with ADMIN-protected writes. RSC pages for SSR/SEO with TanStack Query client components for interactive filtering. Price history tracked at variant level for Omnibus compliance.

**Tech Stack:** NestJS 10, Prisma 6, @aws-sdk/client-s3, Next.js 15 App Router, TanStack Query 5, Tailwind CSS, next/image.

---

## File Map

**Modified:**
- `packages/db/prisma/schema.prisma` — Add ProductImage, update PriceHistory with variantId
- `packages/validation/src/index.ts` — Export product schemas
- `apps/api/src/app.module.ts` — Import CategoriesModule, ProductsModule, UploadModule
- `apps/api/package.json` — Add @nestjs/mapped-types, @aws-sdk/* deps
- `apps/storefront/next.config.ts` — Add R2 image domain
- `apps/storefront/lib/axios.ts` — Export named `apiClient` alias
- `.env.example` — Add R2 and NEXT_PUBLIC_SITE_URL vars

**Created (packages):**
- `packages/validation/src/product.schemas.ts`

**Created (api):**
- `apps/api/src/categories/categories.module.ts`
- `apps/api/src/categories/categories.service.ts`
- `apps/api/src/categories/categories.service.spec.ts`
- `apps/api/src/categories/categories.controller.ts`
- `apps/api/src/categories/dto/create-category.dto.ts`
- `apps/api/src/categories/dto/update-category.dto.ts`
- `apps/api/src/upload/upload.module.ts`
- `apps/api/src/upload/upload.service.ts`
- `apps/api/src/upload/upload.service.spec.ts`
- `apps/api/src/upload/upload.controller.ts`
- `apps/api/src/products/products.module.ts`
- `apps/api/src/products/products.service.ts`
- `apps/api/src/products/products.service.spec.ts`
- `apps/api/src/products/products.controller.ts`
- `apps/api/src/products/dto/create-product.dto.ts`
- `apps/api/src/products/dto/update-product.dto.ts`
- `apps/api/src/products/dto/product-query.dto.ts`

**Created (storefront):**
- `apps/storefront/lib/api/products.ts`
- `apps/storefront/lib/api/categories.ts`
- `apps/storefront/app/sklep/page.tsx`
- `apps/storefront/app/sklep/loading.tsx`
- `apps/storefront/app/sklep/[slug]/page.tsx`
- `apps/storefront/app/sklep/[slug]/loading.tsx`
- `apps/storefront/app/sitemap.ts`
- `apps/storefront/components/products/ProductGrid.tsx`
- `apps/storefront/components/products/ProductCard.tsx`
- `apps/storefront/components/products/ProductFilters.tsx`
- `apps/storefront/components/products/VariantSelector.tsx`
- `apps/storefront/components/products/OmnibusPrice.tsx`
- `apps/storefront/components/products/ImageGallery.tsx`

---

### Task 1: Update Prisma schema + run migration

**Files:**
- Modify: `packages/db/prisma/schema.prisma`

- [ ] **Step 1: Update schema.prisma**

Replace the full contents of `packages/db/prisma/schema.prisma` with:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  USER
  ADMIN
}

model User {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String
  role         Role     @default(USER)
  refreshToken String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  carts        Cart[]
}

model Category {
  id       String     @id @default(cuid())
  name     String
  slug     String     @unique
  parentId String?
  parent   Category?  @relation("Subcategories", fields: [parentId], references: [id])
  children Category[] @relation("Subcategories")
  products Product[]
}

model Product {
  id           String           @id @default(cuid())
  name         String
  slug         String           @unique
  description  String?
  basePrice    Decimal          @db.Decimal(10, 2)
  categoryId   String
  category     Category         @relation(fields: [categoryId], references: [id])
  variants     ProductVariant[]
  images       ProductImage[]
  priceHistory PriceHistory[]
  createdAt    DateTime         @default(now())
  updatedAt    DateTime         @updatedAt

  @@index([categoryId])
}

model ProductVariant {
  id           String         @id @default(cuid())
  productId    String
  product      Product        @relation(fields: [productId], references: [id], onDelete: Cascade)
  sku          String         @unique
  price        Decimal        @db.Decimal(10, 2)
  stock        Int            @default(0)
  attributes   Json
  cartItems    CartItem[]
  priceHistory PriceHistory[]
}

model ProductImage {
  id        String  @id @default(cuid())
  productId String
  product   Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  url       String
  altText   String?
  position  Int     @default(0)

  @@index([productId])
}

/// Omnibus Directive — tracks price per variant for 30-day lowest price display
model PriceHistory {
  id         String         @id @default(cuid())
  productId  String
  product    Product        @relation(fields: [productId], references: [id], onDelete: Cascade)
  variantId  String
  variant    ProductVariant @relation(fields: [variantId], references: [id], onDelete: Cascade)
  price      Decimal        @db.Decimal(10, 2)
  recordedAt DateTime       @default(now())

  @@index([variantId, recordedAt])
  @@index([productId])
}

model Cart {
  id        String     @id @default(cuid())
  userId    String?
  user      User?      @relation(fields: [userId], references: [id])
  sessionId String?
  items     CartItem[]
  updatedAt DateTime   @updatedAt

  @@index([userId])
  @@index([sessionId])
}

model CartItem {
  id        String         @id @default(cuid())
  cartId    String
  cart      Cart           @relation(fields: [cartId], references: [id], onDelete: Cascade)
  variantId String
  variant   ProductVariant @relation(fields: [variantId], references: [id])
  quantity  Int

  @@index([variantId])
}
```

- [ ] **Step 2: Generate client + run migration**

```bash
export $(grep -v '^#' .env | xargs) && pnpm db:generate && pnpm --filter @store/db exec prisma migrate dev --name add_product_images_variant_price_history
```

Expected: Migration `YYYYMMDDHHMMSS_add_product_images_variant_price_history` applied, Prisma Client regenerated.

- [ ] **Step 3: Verify typecheck still passes**

```bash
pnpm --filter @store/db typecheck
```

Expected: clean output, exit 0.

- [ ] **Step 4: Commit**

```bash
git add packages/db/prisma/schema.prisma packages/db/prisma/migrations
git commit -m "feat(db): add ProductImage, variant-level PriceHistory for Omnibus compliance"
```

---

### Task 2: Add product/category Zod schemas to @store/validation

**Files:**
- Create: `packages/validation/src/product.schemas.ts`
- Modify: `packages/validation/src/index.ts`

- [ ] **Step 1: Write failing test**

Add to `packages/validation/src/__tests__/auth.schemas.test.ts` a new `describe` block (or create `packages/validation/src/__tests__/product.schemas.test.ts`):

```typescript
// packages/validation/src/__tests__/product.schemas.test.ts
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
```

- [ ] **Step 2: Run to confirm it fails**

```bash
cd packages/validation && pnpm test 2>&1 | tail -10
```

Expected: FAIL — `Cannot find module '../product.schemas'`

- [ ] **Step 3: Create product.schemas.ts**

```typescript
// packages/validation/src/product.schemas.ts
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
```

- [ ] **Step 4: Export from index.ts**

Add to `packages/validation/src/index.ts`:

```typescript
export * from './auth.schemas'
export * from './product.schemas'
```

- [ ] **Step 5: Run tests**

```bash
cd packages/validation && pnpm test
```

Expected: all tests pass including the 3 new describe blocks (7 new tests).

- [ ] **Step 6: Commit**

```bash
git add packages/validation/src/product.schemas.ts packages/validation/src/index.ts packages/validation/src/__tests__/product.schemas.test.ts
git commit -m "feat(validation): add product, category, and presign Zod schemas"
```

---

### Task 3: NestJS CategoriesModule

**Files:**
- Create: `apps/api/src/categories/dto/create-category.dto.ts`
- Create: `apps/api/src/categories/dto/update-category.dto.ts`
- Create: `apps/api/src/categories/categories.service.ts`
- Create: `apps/api/src/categories/categories.service.spec.ts`
- Create: `apps/api/src/categories/categories.controller.ts`
- Create: `apps/api/src/categories/categories.module.ts`

- [ ] **Step 1: Install @nestjs/mapped-types**

```bash
pnpm --filter @store/api add @nestjs/mapped-types
```

Expected: package added, pnpm-lock.yaml updated.

- [ ] **Step 2: Create DTOs**

```typescript
// apps/api/src/categories/dto/create-category.dto.ts
import { IsString, IsOptional, Matches, MaxLength, MinLength } from 'class-validator'

export class CreateCategoryDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string

  @IsString()
  @Matches(/^[a-z0-9-]+$/, { message: 'Slug must be lowercase letters, numbers, and hyphens' })
  @MaxLength(100)
  slug!: string

  @IsString()
  @IsOptional()
  parentId?: string
}
```

```typescript
// apps/api/src/categories/dto/update-category.dto.ts
import { PartialType } from '@nestjs/mapped-types'
import { CreateCategoryDto } from './create-category.dto'

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}
```

- [ ] **Step 3: Write failing service test**

```typescript
// apps/api/src/categories/categories.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing'
import { CategoriesService } from './categories.service'
import { PrismaService } from '../prisma/prisma.service'
import { ConflictException, NotFoundException } from '@nestjs/common'

const mockPrisma = {
  category: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}

describe('CategoriesService', () => {
  let service: CategoriesService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile()
    service = module.get<CategoriesService>(CategoriesService)
    jest.clearAllMocks()
  })

  describe('findAll', () => {
    it('returns root categories with nested children', async () => {
      mockPrisma.category.findMany.mockResolvedValue([
        { id: '1', name: 'Tops', slug: 'tops', parentId: null, children: [] },
      ])
      const result = await service.findAll()
      expect(result).toHaveLength(1)
      expect(mockPrisma.category.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { parentId: null } }),
      )
    })
  })

  describe('create', () => {
    it('creates a category when slug is unique', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(null)
      mockPrisma.category.create.mockResolvedValue({ id: '1', name: 'Tops', slug: 'tops', parentId: null })
      const result = await service.create({ name: 'Tops', slug: 'tops' })
      expect(result.slug).toBe('tops')
    })

    it('throws ConflictException when slug already exists', async () => {
      mockPrisma.category.findUnique.mockResolvedValue({ id: '1' })
      await expect(service.create({ name: 'Tops', slug: 'tops' })).rejects.toThrow(ConflictException)
    })
  })

  describe('update', () => {
    it('throws NotFoundException when category does not exist', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(null)
      await expect(service.update('nonexistent', { name: 'New' })).rejects.toThrow(NotFoundException)
    })

    it('throws ConflictException when new slug is taken by another category', async () => {
      mockPrisma.category.findUnique.mockResolvedValue({ id: '1', name: 'Old', slug: 'old' })
      mockPrisma.category.findFirst.mockResolvedValue({ id: '2' })
      await expect(service.update('1', { slug: 'taken' })).rejects.toThrow(ConflictException)
    })
  })

  describe('remove', () => {
    it('throws NotFoundException when category does not exist', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(null)
      await expect(service.remove('nonexistent')).rejects.toThrow(NotFoundException)
    })

    it('deletes category when it exists', async () => {
      mockPrisma.category.findUnique.mockResolvedValue({ id: '1' })
      mockPrisma.category.delete.mockResolvedValue({ id: '1' })
      await service.remove('1')
      expect(mockPrisma.category.delete).toHaveBeenCalledWith({ where: { id: '1' } })
    })
  })
})
```

- [ ] **Step 4: Run to confirm it fails**

```bash
cd apps/api && pnpm test --testPathPattern=categories 2>&1 | tail -5
```

Expected: FAIL — `Cannot find module './categories.service'`

- [ ] **Step 5: Create CategoriesService**

```typescript
// apps/api/src/categories/categories.service.ts
import { Injectable, ConflictException, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateCategoryDto } from './dto/create-category.dto'
import { UpdateCategoryDto } from './dto/update-category.dto'

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.category.findMany({
      include: { children: true },
      where: { parentId: null },
    })
  }

  async create(dto: CreateCategoryDto) {
    const existing = await this.prisma.category.findUnique({ where: { slug: dto.slug } })
    if (existing) throw new ConflictException('Slug already exists')
    return this.prisma.category.create({ data: dto })
  }

  async update(id: string, dto: UpdateCategoryDto) {
    await this.findOneOrThrow(id)
    if (dto.slug) {
      const conflict = await this.prisma.category.findFirst({
        where: { slug: dto.slug, NOT: { id } },
      })
      if (conflict) throw new ConflictException('Slug already exists')
    }
    return this.prisma.category.update({ where: { id }, data: dto })
  }

  async remove(id: string) {
    await this.findOneOrThrow(id)
    await this.prisma.category.delete({ where: { id } })
  }

  private async findOneOrThrow(id: string) {
    const category = await this.prisma.category.findUnique({ where: { id } })
    if (!category) throw new NotFoundException('Category not found')
    return category
  }
}
```

- [ ] **Step 6: Create CategoriesController**

```typescript
// apps/api/src/categories/categories.controller.ts
import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common'
import { CategoriesService } from './categories.service'
import { CreateCategoryDto } from './dto/create-category.dto'
import { UpdateCategoryDto } from './dto/update-category.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'
import { Role } from '@store/db'

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  findAll() {
    return this.categoriesService.findAll()
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  create(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(dto)
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoriesService.update(id, dto)
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id)
  }
}
```

- [ ] **Step 7: Create CategoriesModule**

```typescript
// apps/api/src/categories/categories.module.ts
import { Module } from '@nestjs/common'
import { CategoriesService } from './categories.service'
import { CategoriesController } from './categories.controller'

@Module({
  controllers: [CategoriesController],
  providers: [CategoriesService],
  exports: [CategoriesService],
})
export class CategoriesModule {}
```

- [ ] **Step 8: Run tests**

```bash
cd apps/api && pnpm test --testPathPattern=categories
```

Expected: 6 tests pass.

- [ ] **Step 9: Commit**

```bash
git add apps/api/src/categories apps/api/package.json pnpm-lock.yaml
git commit -m "feat(api): add CategoriesModule with CRUD and ADMIN guards"
```

---

### Task 4: NestJS UploadModule (Cloudflare R2)

**Files:**
- Create: `apps/api/src/upload/upload.service.ts`
- Create: `apps/api/src/upload/upload.service.spec.ts`
- Create: `apps/api/src/upload/upload.controller.ts`
- Create: `apps/api/src/upload/upload.module.ts`
- Modify: `.env.example`

- [ ] **Step 1: Install AWS SDK packages**

```bash
pnpm --filter @store/api add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

Expected: packages added.

- [ ] **Step 2: Write failing service test**

```typescript
// apps/api/src/upload/upload.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing'
import { UploadService } from './upload.service'
import { ConfigService } from '@nestjs/config'

const mockConfig: Record<string, string> = {
  R2_BUCKET_NAME: 'test-bucket',
  R2_PUBLIC_URL: 'https://cdn.example.com',
  R2_ACCOUNT_ID: 'abc123',
  R2_ACCESS_KEY_ID: 'key',
  R2_SECRET_ACCESS_KEY: 'secret',
}

describe('UploadService', () => {
  let service: UploadService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadService,
        {
          provide: ConfigService,
          useValue: { getOrThrow: jest.fn((k: string) => mockConfig[k]) },
        },
      ],
    }).compile()
    service = module.get<UploadService>(UploadService)
  })

  it('getPublicUrl builds correct URL from key', () => {
    expect(service.getPublicUrl('products/abc.jpg')).toBe('https://cdn.example.com/products/abc.jpg')
  })

  it('getPresignedUrl returns key with products/ prefix and correct extension', async () => {
    const { key, uploadUrl } = await service.getPresignedUrl('photo.jpg', 'image/jpeg')
    expect(key).toMatch(/^products\/[0-9a-f-]{36}\.jpg$/)
    expect(uploadUrl).toContain('X-Amz-Signature')
  })
})
```

- [ ] **Step 3: Run to confirm it fails**

```bash
cd apps/api && pnpm test --testPathPattern=upload 2>&1 | tail -5
```

Expected: FAIL — `Cannot find module './upload.service'`

- [ ] **Step 4: Create UploadService**

```typescript
// apps/api/src/upload/upload.service.ts
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { randomUUID } from 'crypto'

@Injectable()
export class UploadService {
  private readonly s3: S3Client
  private readonly bucket: string
  private readonly publicUrl: string

  constructor(private readonly config: ConfigService) {
    this.bucket = config.getOrThrow<string>('R2_BUCKET_NAME')
    this.publicUrl = config.getOrThrow<string>('R2_PUBLIC_URL')
    this.s3 = new S3Client({
      region: 'auto',
      endpoint: `https://${config.getOrThrow<string>('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.getOrThrow<string>('R2_ACCESS_KEY_ID'),
        secretAccessKey: config.getOrThrow<string>('R2_SECRET_ACCESS_KEY'),
      },
    })
  }

  async getPresignedUrl(filename: string, contentType: string): Promise<{ uploadUrl: string; key: string }> {
    const ext = filename.split('.').pop() ?? 'jpg'
    const key = `products/${randomUUID()}.${ext}`
    const command = new PutObjectCommand({ Bucket: this.bucket, Key: key, ContentType: contentType })
    const uploadUrl = await getSignedUrl(this.s3, command, { expiresIn: 300 })
    return { uploadUrl, key }
  }

  getPublicUrl(key: string): string {
    return `${this.publicUrl}/${key}`
  }
}
```

- [ ] **Step 5: Create UploadController**

```typescript
// apps/api/src/upload/upload.controller.ts
import { Controller, Post, Body, UseGuards } from '@nestjs/common'
import { IsString, Matches } from 'class-validator'
import { UploadService } from './upload.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'
import { Role } from '@store/db'

class PresignDto {
  @IsString()
  filename!: string

  @IsString()
  @Matches(/^image\/(jpeg|png|webp|gif)$/, { message: 'contentType must be an image MIME type' })
  contentType!: string
}

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('presign')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  presign(@Body() dto: PresignDto) {
    return this.uploadService.getPresignedUrl(dto.filename, dto.contentType)
  }
}
```

- [ ] **Step 6: Create UploadModule**

```typescript
// apps/api/src/upload/upload.module.ts
import { Module } from '@nestjs/common'
import { UploadService } from './upload.service'
import { UploadController } from './upload.controller'

@Module({
  controllers: [UploadController],
  providers: [UploadService],
  exports: [UploadService],
})
export class UploadModule {}
```

- [ ] **Step 7: Update .env.example**

Append to the root `.env.example`:

```env
# Cloudflare R2 — get from R2 dashboard: Account ID, API token with Object Read & Write
R2_ACCOUNT_ID="your-cloudflare-account-id"
R2_ACCESS_KEY_ID="your-r2-access-key-id"
R2_SECRET_ACCESS_KEY="your-r2-secret-access-key"
R2_BUCKET_NAME="store-assets"
R2_PUBLIC_URL="https://pub-XXXX.r2.dev"

# Storefront public URL (used for sitemap)
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

- [ ] **Step 8: Run tests**

```bash
cd apps/api && pnpm test --testPathPattern=upload
```

Expected: 2 tests pass.

- [ ] **Step 9: Commit**

```bash
git add apps/api/src/upload apps/api/package.json pnpm-lock.yaml .env.example
git commit -m "feat(api): add UploadModule with R2 pre-signed URL generation"
```

---

### Task 5: NestJS ProductsModule

**Files:**
- Create: `apps/api/src/products/dto/create-product.dto.ts`
- Create: `apps/api/src/products/dto/update-product.dto.ts`
- Create: `apps/api/src/products/dto/product-query.dto.ts`
- Create: `apps/api/src/products/products.service.ts`
- Create: `apps/api/src/products/products.service.spec.ts`
- Create: `apps/api/src/products/products.controller.ts`
- Create: `apps/api/src/products/products.module.ts`

- [ ] **Step 1: Create DTOs**

```typescript
// apps/api/src/products/dto/create-product.dto.ts
import { Type } from 'class-transformer'
import {
  IsString, IsNumber, IsPositive, IsOptional, IsArray,
  ValidateNested, IsInt, Min, Matches, IsUrl,
} from 'class-validator'

export class CreateVariantDto {
  @IsString()
  sku!: string

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  price!: number

  @IsInt()
  @Min(0)
  stock!: number

  attributes!: Record<string, string>
}

export class CreateProductImageDto {
  @IsUrl()
  url!: string

  @IsString()
  @IsOptional()
  altText?: string

  @IsInt()
  @Min(0)
  @IsOptional()
  position?: number
}

export class CreateProductDto {
  @IsString()
  name!: string

  @IsString()
  @Matches(/^[a-z0-9-]+$/, { message: 'Slug must be lowercase letters, numbers, and hyphens' })
  slug!: string

  @IsString()
  @IsOptional()
  description?: string

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  basePrice!: number

  @IsString()
  categoryId!: string

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVariantDto)
  variants!: CreateVariantDto[]

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductImageDto)
  @IsOptional()
  images?: CreateProductImageDto[]
}
```

```typescript
// apps/api/src/products/dto/update-product.dto.ts
import { PartialType } from '@nestjs/mapped-types'
import { CreateProductDto } from './create-product.dto'

export class UpdateProductDto extends PartialType(CreateProductDto) {}
```

```typescript
// apps/api/src/products/dto/product-query.dto.ts
import { IsOptional, IsString, IsNumber, IsPositive, IsEnum, IsInt, Min, Max } from 'class-validator'
import { Type } from 'class-transformer'

export enum SortBy {
  PRICE_ASC = 'price_asc',
  PRICE_DESC = 'price_desc',
  NEWEST = 'newest',
}

export class ProductQueryDto {
  @IsString()
  @IsOptional()
  categoryId?: string

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @IsOptional()
  minPrice?: number

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @IsOptional()
  maxPrice?: number

  @IsEnum(SortBy)
  @IsOptional()
  sortBy?: SortBy = SortBy.NEWEST

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 20
}
```

- [ ] **Step 2: Write failing service test**

```typescript
// apps/api/src/products/products.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing'
import { ProductsService } from './products.service'
import { PrismaService } from '../prisma/prisma.service'
import { ConflictException, NotFoundException } from '@nestjs/common'
import { SortBy } from './dto/product-query.dto'

const mockPrisma = {
  product: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  $transaction: jest.fn(),
  $queryRaw: jest.fn(),
}

describe('ProductsService', () => {
  let service: ProductsService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile()
    service = module.get<ProductsService>(ProductsService)
    jest.clearAllMocks()
  })

  describe('findAll', () => {
    it('returns paginated products with metadata', async () => {
      mockPrisma.$transaction.mockResolvedValue([
        [{ id: '1', name: 'T-Shirt', variants: [], images: [] }],
        1,
      ])
      const result = await service.findAll({ sortBy: SortBy.NEWEST, page: 1, limit: 20 })
      expect(result.total).toBe(1)
      expect(result.items).toHaveLength(1)
      expect(result.totalPages).toBe(1)
    })

    it('calculates correct skip for page 2', async () => {
      mockPrisma.$transaction.mockResolvedValue([[], 0])
      await service.findAll({ sortBy: SortBy.NEWEST, page: 2, limit: 10 })
      const findManyCall = mockPrisma.$transaction.mock.calls[0]
      // transaction is called with array of promises, we verify it was called
      expect(mockPrisma.$transaction).toHaveBeenCalled()
    })
  })

  describe('findOne', () => {
    it('throws NotFoundException for unknown slug', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null)
      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException)
    })

    it('attaches omnibusPrice to each variant', async () => {
      mockPrisma.product.findUnique.mockResolvedValue({
        id: '1', slug: 'test', name: 'T-Shirt', description: null,
        basePrice: 99, category: { id: 'c1', name: 'Tops', slug: 'tops' },
        variants: [{ id: 'v1', sku: 'SKU-1', price: 99, stock: 5, attributes: {} }],
        images: [],
      })
      mockPrisma.$queryRaw.mockResolvedValue([{ min_price: 79 }])
      const result = await service.findOne('test')
      expect(result.variants[0].omnibusPrice).toBe(79)
    })

    it('sets omnibusPrice to null when no price history exists', async () => {
      mockPrisma.product.findUnique.mockResolvedValue({
        id: '1', slug: 'test', name: 'T-Shirt', description: null,
        basePrice: 99, category: { id: 'c1', name: 'Tops', slug: 'tops' },
        variants: [{ id: 'v1', sku: 'SKU-1', price: 99, stock: 5, attributes: {} }],
        images: [],
      })
      mockPrisma.$queryRaw.mockResolvedValue([{ min_price: null }])
      const result = await service.findOne('test')
      expect(result.variants[0].omnibusPrice).toBeNull()
    })
  })

  describe('create', () => {
    it('throws ConflictException when slug already exists', async () => {
      mockPrisma.product.findUnique.mockResolvedValue({ id: '1' })
      await expect(
        service.create({
          name: 'T-Shirt', slug: 'test', basePrice: 99, categoryId: 'cat1',
          variants: [{ sku: 'SKU', price: 99, stock: 10, attributes: { size: 'M' } }],
        }),
      ).rejects.toThrow(ConflictException)
    })
  })

  describe('remove', () => {
    it('throws NotFoundException for unknown id', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null)
      await expect(service.remove('nonexistent')).rejects.toThrow(NotFoundException)
    })

    it('deletes the product when it exists', async () => {
      mockPrisma.product.findUnique.mockResolvedValue({ id: '1' })
      mockPrisma.product.delete.mockResolvedValue({ id: '1' })
      await service.remove('1')
      expect(mockPrisma.product.delete).toHaveBeenCalledWith({ where: { id: '1' } })
    })
  })
})
```

- [ ] **Step 3: Run to confirm it fails**

```bash
cd apps/api && pnpm test --testPathPattern=products.service 2>&1 | tail -5
```

Expected: FAIL — `Cannot find module './products.service'`

- [ ] **Step 4: Create ProductsService**

```typescript
// apps/api/src/products/products.service.ts
import { Injectable, ConflictException, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateProductDto } from './dto/create-product.dto'
import { UpdateProductDto } from './dto/update-product.dto'
import { ProductQueryDto, SortBy } from './dto/product-query.dto'
import { Prisma } from '@store/db'

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ProductQueryDto) {
    const { categoryId, minPrice, maxPrice, sortBy = SortBy.NEWEST, page = 1, limit = 20 } = query
    const skip = (page - 1) * limit

    const where: Prisma.ProductWhereInput = {
      ...(categoryId ? { categoryId } : {}),
      ...((minPrice !== undefined || maxPrice !== undefined)
        ? {
            basePrice: {
              ...(minPrice !== undefined ? { gte: minPrice } : {}),
              ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
            },
          }
        : {}),
    }

    const orderBy: Prisma.ProductOrderByWithRelationInput =
      sortBy === SortBy.PRICE_ASC ? { basePrice: 'asc' }
      : sortBy === SortBy.PRICE_DESC ? { basePrice: 'desc' }
      : { createdAt: 'desc' }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          category: true,
          variants: true,
          images: { orderBy: { position: 'asc' }, take: 1 },
        },
      }),
      this.prisma.product.count({ where }),
    ])

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async findOne(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        variants: true,
        images: { orderBy: { position: 'asc' } },
      },
    })
    if (!product) throw new NotFoundException('Product not found')

    const variantsWithOmnibus = await Promise.all(
      product.variants.map(async (variant) => {
        const rows = await this.prisma.$queryRaw<{ min_price: number | null }[]>`
          SELECT MIN(price)::float AS min_price
          FROM "PriceHistory"
          WHERE "variantId" = ${variant.id}
            AND "recordedAt" >= NOW() - INTERVAL '30 days'
        `
        return { ...variant, omnibusPrice: rows[0]?.min_price ?? null }
      }),
    )

    return { ...product, variants: variantsWithOmnibus }
  }

  async create(dto: CreateProductDto) {
    const existing = await this.prisma.product.findUnique({ where: { slug: dto.slug } })
    if (existing) throw new ConflictException('Slug already exists')

    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          name: dto.name,
          slug: dto.slug,
          description: dto.description,
          basePrice: dto.basePrice,
          categoryId: dto.categoryId,
          variants: {
            create: dto.variants.map((v) => ({
              sku: v.sku,
              price: v.price,
              stock: v.stock,
              attributes: v.attributes as Prisma.InputJsonValue,
            })),
          },
          images: {
            create: (dto.images ?? []).map((img, i) => ({
              url: img.url,
              altText: img.altText,
              position: img.position ?? i,
            })),
          },
        },
        include: { variants: true, images: true },
      })

      await tx.priceHistory.createMany({
        data: product.variants.map((v) => ({
          productId: product.id,
          variantId: v.id,
          price: v.price,
        })),
      })

      return product
    })
  }

  async update(id: string, dto: UpdateProductDto) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { variants: true },
    })
    if (!product) throw new NotFoundException('Product not found')

    if (dto.slug && dto.slug !== product.slug) {
      const conflict = await this.prisma.product.findFirst({ where: { slug: dto.slug, NOT: { id } } })
      if (conflict) throw new ConflictException('Slug already exists')
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.product.update({
        where: { id },
        data: {
          ...(dto.name !== undefined ? { name: dto.name } : {}),
          ...(dto.slug !== undefined ? { slug: dto.slug } : {}),
          ...(dto.description !== undefined ? { description: dto.description } : {}),
          ...(dto.basePrice !== undefined ? { basePrice: dto.basePrice } : {}),
          ...(dto.categoryId !== undefined ? { categoryId: dto.categoryId } : {}),
        },
        include: { variants: true },
      })

      if (dto.variants) {
        for (const variantDto of dto.variants) {
          const existing = product.variants.find((v) => v.sku === variantDto.sku)
          if (existing && Number(existing.price) !== variantDto.price) {
            await tx.productVariant.update({
              where: { id: existing.id },
              data: { price: variantDto.price, stock: variantDto.stock },
            })
            await tx.priceHistory.create({
              data: { productId: id, variantId: existing.id, price: variantDto.price },
            })
          }
        }
      }

      return updated
    })
  }

  async remove(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } })
    if (!product) throw new NotFoundException('Product not found')
    await this.prisma.product.delete({ where: { id } })
  }
}
```

- [ ] **Step 5: Create ProductsController**

```typescript
// apps/api/src/products/products.controller.ts
import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common'
import { ProductsService } from './products.service'
import { CreateProductDto } from './dto/create-product.dto'
import { UpdateProductDto } from './dto/update-product.dto'
import { ProductQueryDto } from './dto/product-query.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'
import { Role } from '@store/db'

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAll(@Query() query: ProductQueryDto) {
    return this.productsService.findAll(query)
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.productsService.findOne(slug)
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto)
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto)
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.productsService.remove(id)
  }
}
```

- [ ] **Step 6: Create ProductsModule**

```typescript
// apps/api/src/products/products.module.ts
import { Module } from '@nestjs/common'
import { ProductsService } from './products.service'
import { ProductsController } from './products.controller'

@Module({
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}
```

- [ ] **Step 7: Run tests**

```bash
cd apps/api && pnpm test --testPathPattern=products.service
```

Expected: 7 tests pass.

- [ ] **Step 8: Commit**

```bash
git add apps/api/src/products
git commit -m "feat(api): add ProductsModule with CRUD, Omnibus variant price history, and pagination"
```

---

### Task 6: Wire all modules into AppModule

**Files:**
- Modify: `apps/api/src/app.module.ts`

- [ ] **Step 1: Update app.module.ts**

```typescript
// apps/api/src/app.module.ts
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { PrismaModule } from './prisma/prisma.module'
import { UsersModule } from './users/users.module'
import { AuthModule } from './auth/auth.module'
import { CategoriesModule } from './categories/categories.module'
import { ProductsModule } from './products/products.module'
import { UploadModule } from './upload/upload.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    UsersModule,
    AuthModule,
    CategoriesModule,
    ProductsModule,
    UploadModule,
  ],
})
export class AppModule {}
```

- [ ] **Step 2: Run full API test suite**

```bash
cd apps/api && pnpm test
```

Expected: all test suites pass (PrismaService, UsersService, AuthService, CategoriesService, UploadService, ProductsService).

- [ ] **Step 3: Run API typecheck**

```bash
pnpm --filter @store/api typecheck
```

Expected: clean, exit 0.

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/app.module.ts
git commit -m "feat(api): register CategoriesModule, ProductsModule, UploadModule in AppModule"
```

---

### Task 7: Storefront dependencies + API client hooks

**Files:**
- Modify: `apps/storefront/next.config.ts`
- Modify: `apps/storefront/lib/axios.ts`
- Create: `apps/storefront/lib/api/products.ts`
- Create: `apps/storefront/lib/api/categories.ts`

- [ ] **Step 1: Install storefront dependencies**

```bash
pnpm --filter @store/storefront add framer-motion lucide-react
```

Expected: packages added.

- [ ] **Step 2: Update next.config.ts to allow R2 images**

```typescript
// apps/storefront/next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@store/db', '@store/validation'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.r2.dev',
      },
      {
        protocol: 'https',
        hostname: '**.cloudflarestorage.com',
      },
    ],
  },
}

export default nextConfig
```

- [ ] **Step 3: Add apiClient export alias to axios.ts**

The existing `lib/axios.ts` exports `api`. Add an alias so both names work:

```typescript
// apps/storefront/lib/axios.ts
import axios from 'axios'

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api',
  withCredentials: true,
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const { data } = await axios.post<{ accessToken: string }>(
          `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api'}/auth/refresh`,
          {},
          { withCredentials: true },
        )
        original.headers['Authorization'] = `Bearer ${data.accessToken}`
        return api(original)
      } catch {
        return Promise.reject(error)
      }
    }
    return Promise.reject(error)
  },
)

export const apiClient = api
```

- [ ] **Step 4: Create products API hook**

```typescript
// apps/storefront/lib/api/products.ts
import { useQuery } from '@tanstack/react-query'
import { api } from '../axios'

export interface ProductImage {
  id: string
  url: string
  altText: string | null
  position: number
}

export interface ProductVariant {
  id: string
  sku: string
  price: number
  stock: number
  attributes: Record<string, string>
  omnibusPrice?: number | null
}

export interface ProductCategory {
  id: string
  name: string
  slug: string
}

export interface Product {
  id: string
  name: string
  slug: string
  description: string | null
  basePrice: number
  updatedAt: string
  category: ProductCategory
  variants: ProductVariant[]
  images: ProductImage[]
}

export interface ProductsResponse {
  items: Product[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ProductQuery {
  categoryId?: string
  minPrice?: number
  maxPrice?: number
  sortBy?: 'price_asc' | 'price_desc' | 'newest'
  page?: number
  limit?: number
}

export function useProducts(query: ProductQuery = {}) {
  return useQuery({
    queryKey: ['products', query],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (query.categoryId) params.set('categoryId', query.categoryId)
      if (query.minPrice !== undefined) params.set('minPrice', String(query.minPrice))
      if (query.maxPrice !== undefined) params.set('maxPrice', String(query.maxPrice))
      if (query.sortBy) params.set('sortBy', query.sortBy)
      if (query.page) params.set('page', String(query.page))
      if (query.limit) params.set('limit', String(query.limit))
      const { data } = await api.get<ProductsResponse>(`/products?${params}`)
      return data
    },
  })
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: ['product', slug],
    queryFn: async () => {
      const { data } = await api.get<Product>(`/products/${slug}`)
      return data
    },
    enabled: !!slug,
  })
}
```

- [ ] **Step 5: Create categories API hook**

```typescript
// apps/storefront/lib/api/categories.ts
import { useQuery } from '@tanstack/react-query'
import { api } from '../axios'

export interface Category {
  id: string
  name: string
  slug: string
  parentId: string | null
  children: Category[]
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await api.get<Category[]>('/categories')
      return data
    },
    staleTime: 5 * 60 * 1000,
  })
}
```

- [ ] **Step 6: Typecheck storefront**

```bash
pnpm --filter @store/storefront typecheck
```

Expected: clean, exit 0.

- [ ] **Step 7: Commit**

```bash
git add apps/storefront/next.config.ts apps/storefront/lib/ pnpm-lock.yaml
git commit -m "feat(storefront): add API hooks for products/categories, allow R2 image domains"
```

---

### Task 8: Product Grid page + components

**Files:**
- Create: `apps/storefront/app/sklep/page.tsx`
- Create: `apps/storefront/app/sklep/loading.tsx`
- Create: `apps/storefront/components/products/ProductGrid.tsx`
- Create: `apps/storefront/components/products/ProductCard.tsx`
- Create: `apps/storefront/components/products/ProductFilters.tsx`

- [ ] **Step 1: Create ProductCard**

```typescript
// apps/storefront/components/products/ProductCard.tsx
import Link from 'next/link'
import Image from 'next/image'
import type { Product } from '@/lib/api/products'

export default function ProductCard({ product }: { product: Product }) {
  const firstImage = product.images[0]
  const minPrice = product.variants.length > 0
    ? Math.min(...product.variants.map((v) => Number(v.price)))
    : Number(product.basePrice)

  return (
    <Link href={`/sklep/${product.slug}`} className="group block">
      <div className="relative aspect-square bg-zinc-900 rounded-xl overflow-hidden mb-3 transition-shadow duration-300 group-hover:shadow-[0_0_20px_rgba(59,130,246,0.15)]">
        {firstImage ? (
          <Image
            src={firstImage.url}
            alt={firstImage.altText ?? product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-zinc-600 text-xs tracking-widest uppercase">
            Brak zdjęcia
          </div>
        )}
      </div>
      <h3 className="text-white text-sm font-medium tracking-tight group-hover:text-blue-400 transition-colors duration-200 truncate">
        {product.name}
      </h3>
      <p className="text-zinc-500 text-sm mt-0.5">od {minPrice.toFixed(2)} zł</p>
    </Link>
  )
}
```

- [ ] **Step 2: Create ProductFilters**

```typescript
// apps/storefront/components/products/ProductFilters.tsx
'use client'
import type { Category } from '@/lib/api/categories'

interface Props {
  categories: Category[]
  currentParams: { categoryId?: string; minPrice?: string; maxPrice?: string; sortBy?: string }
  onChange: (updates: Record<string, string | undefined>) => void
}

export default function ProductFilters({ categories, currentParams, onChange }: Props) {
  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-zinc-500 text-xs font-semibold uppercase tracking-widest mb-3">Kategoria</h3>
        <div className="space-y-1">
          <button
            onClick={() => onChange({ categoryId: undefined, page: '1' })}
            className={`block w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors ${
              !currentParams.categoryId
                ? 'bg-zinc-800 text-white'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
            }`}
          >
            Wszystkie
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onChange({ categoryId: cat.id, page: '1' })}
              className={`block w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors ${
                currentParams.categoryId === cat.id
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-zinc-500 text-xs font-semibold uppercase tracking-widest mb-3">Cena (zł)</h3>
        <div className="flex gap-2 items-center">
          <input
            type="number"
            placeholder="Min"
            defaultValue={currentParams.minPrice}
            onBlur={(e) => onChange({ minPrice: e.target.value || undefined, page: '1' })}
            className="w-20 bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500"
          />
          <span className="text-zinc-600">–</span>
          <input
            type="number"
            placeholder="Max"
            defaultValue={currentParams.maxPrice}
            onBlur={(e) => onChange({ maxPrice: e.target.value || undefined, page: '1' })}
            className="w-20 bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      <div>
        <h3 className="text-zinc-500 text-xs font-semibold uppercase tracking-widest mb-3">Sortowanie</h3>
        <select
          value={currentParams.sortBy ?? 'newest'}
          onChange={(e) => onChange({ sortBy: e.target.value, page: '1' })}
          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
        >
          <option value="newest">Najnowsze</option>
          <option value="price_asc">Cena: rosnąco</option>
          <option value="price_desc">Cena: malejąco</option>
        </select>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create ProductGrid client component**

```typescript
// apps/storefront/components/products/ProductGrid.tsx
'use client'
import { useRouter } from 'next/navigation'
import { useProducts } from '@/lib/api/products'
import { useCategories } from '@/lib/api/categories'
import ProductCard from './ProductCard'
import ProductFilters from './ProductFilters'

interface InitialParams {
  categoryId?: string
  minPrice?: string
  maxPrice?: string
  sortBy?: string
  page?: string
}

export default function ProductGrid({ initialParams }: { initialParams: InitialParams }) {
  const router = useRouter()

  const query = {
    categoryId: initialParams.categoryId,
    minPrice: initialParams.minPrice ? Number(initialParams.minPrice) : undefined,
    maxPrice: initialParams.maxPrice ? Number(initialParams.maxPrice) : undefined,
    sortBy: (initialParams.sortBy as 'price_asc' | 'price_desc' | 'newest') || 'newest',
    page: initialParams.page ? Number(initialParams.page) : 1,
  }

  const { data, isLoading, isError } = useProducts(query)
  const { data: categories = [] } = useCategories()

  const updateParams = (updates: Record<string, string | undefined>) => {
    const merged = { ...initialParams, ...updates }
    const params = new URLSearchParams()
    Object.entries(merged).forEach(([k, v]) => { if (v !== undefined) params.set(k, v) })
    router.push(`/sklep?${params.toString()}`)
  }

  return (
    <div className="flex gap-10">
      <aside className="w-56 flex-shrink-0">
        <ProductFilters
          categories={categories}
          currentParams={initialParams}
          onChange={updateParams}
        />
      </aside>

      <div className="flex-1 min-w-0">
        {isError && (
          <p className="text-red-400 text-sm">Nie udało się załadować produktów. Spróbuj ponownie.</p>
        )}
        {isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i}>
                <div className="aspect-square bg-zinc-800 rounded-xl animate-pulse mb-3" />
                <div className="h-4 bg-zinc-800 rounded animate-pulse mb-1.5" />
                <div className="h-3 w-16 bg-zinc-800 rounded animate-pulse" />
              </div>
            ))}
          </div>
        )}
        {!isLoading && data?.items.length === 0 && (
          <p className="text-zinc-500 text-sm">Brak produktów spełniających kryteria.</p>
        )}
        {!isLoading && data && data.items.length > 0 && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
              {data.items.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {data.totalPages > 1 && (
              <div className="flex gap-1.5 mt-10 justify-center">
                {Array.from({ length: data.totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => updateParams({ page: String(p) })}
                    className={`w-8 h-8 rounded-lg text-sm transition-colors ${
                      p === query.page
                        ? 'bg-blue-600 text-white'
                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Create /sklep page (RSC)**

```typescript
// apps/storefront/app/sklep/page.tsx
import { Suspense } from 'react'
import type { Metadata } from 'next'
import ProductGrid from '@/components/products/ProductGrid'

export const metadata: Metadata = {
  title: 'Sklep',
  description: 'Przeglądaj nasz asortyment — odzież, akcesoria i więcej.',
}

interface Props {
  searchParams: Promise<{
    categoryId?: string
    minPrice?: string
    maxPrice?: string
    sortBy?: string
    page?: string
  }>
}

export default async function SklepPage({ searchParams }: Props) {
  const params = await searchParams
  return (
    <main className="min-h-screen bg-zinc-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <h1 className="text-3xl font-bold text-white tracking-tight mb-10">Sklep</h1>
        <Suspense>
          <ProductGrid initialParams={params} />
        </Suspense>
      </div>
    </main>
  )
}
```

- [ ] **Step 5: Create loading skeleton**

```typescript
// apps/storefront/app/sklep/loading.tsx
export default function Loading() {
  return (
    <main className="min-h-screen bg-zinc-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="h-9 w-24 bg-zinc-800 rounded animate-pulse mb-10" />
        <div className="flex gap-10">
          <div className="w-56 space-y-3 flex-shrink-0">
            {[...Array(5)].map((_, i) => <div key={i} className="h-4 bg-zinc-800 rounded animate-pulse" />)}
          </div>
          <div className="flex-1 grid grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i}>
                <div className="aspect-square bg-zinc-800 rounded-xl animate-pulse mb-3" />
                <div className="h-4 bg-zinc-800 rounded animate-pulse mb-1.5" />
                <div className="h-3 w-16 bg-zinc-800 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
```

- [ ] **Step 6: Typecheck**

```bash
pnpm --filter @store/storefront typecheck
```

Expected: clean, exit 0.

- [ ] **Step 7: Commit**

```bash
git add apps/storefront/app/sklep apps/storefront/components/products/ProductCard.tsx apps/storefront/components/products/ProductFilters.tsx apps/storefront/components/products/ProductGrid.tsx
git commit -m "feat(storefront): add /sklep product grid page with filters and pagination"
```

---

### Task 9: Product Detail page + components

**Files:**
- Create: `apps/storefront/app/sklep/[slug]/page.tsx`
- Create: `apps/storefront/app/sklep/[slug]/loading.tsx`
- Create: `apps/storefront/components/products/OmnibusPrice.tsx`
- Create: `apps/storefront/components/products/VariantSelector.tsx`
- Create: `apps/storefront/components/products/ImageGallery.tsx`

- [ ] **Step 1: Create OmnibusPrice**

```typescript
// apps/storefront/components/products/OmnibusPrice.tsx
interface Props {
  omnibusPrice: number | null | undefined
  currentPrice: number
}

export default function OmnibusPrice({ omnibusPrice, currentPrice }: Props) {
  if (omnibusPrice === null || omnibusPrice === undefined) return null
  if (omnibusPrice >= currentPrice) return null
  return (
    <p className="text-zinc-500 text-xs mt-1">
      Najniższa cena z ostatnich 30 dni:{' '}
      <span className="text-zinc-400">{Number(omnibusPrice).toFixed(2)} zł</span>
    </p>
  )
}
```

- [ ] **Step 2: Create ImageGallery**

```typescript
// apps/storefront/components/products/ImageGallery.tsx
'use client'
import { useState } from 'react'
import Image from 'next/image'
import type { ProductImage } from '@/lib/api/products'

interface Props {
  images: ProductImage[]
  productName: string
}

export default function ImageGallery({ images, productName }: Props) {
  const [activeIndex, setActiveIndex] = useState(0)

  if (images.length === 0) {
    return (
      <div className="aspect-square bg-zinc-900 rounded-2xl flex items-center justify-center text-zinc-600 text-xs tracking-widest uppercase">
        Brak zdjęcia
      </div>
    )
  }

  return (
    <div>
      <div className="relative aspect-square bg-zinc-900 rounded-2xl overflow-hidden mb-3">
        <Image
          src={images[activeIndex].url}
          alt={images[activeIndex].altText ?? productName}
          fill
          className="object-cover"
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
        />
      </div>
      {images.length > 1 && (
        <div className="flex gap-2">
          {images.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setActiveIndex(i)}
              className={`relative w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-colors ${
                i === activeIndex ? 'border-blue-500' : 'border-transparent hover:border-zinc-600'
              }`}
            >
              <Image src={img.url} alt={img.altText ?? productName} fill className="object-cover" sizes="64px" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Create VariantSelector**

```typescript
// apps/storefront/components/products/VariantSelector.tsx
'use client'
import { useState } from 'react'
import type { ProductVariant } from '@/lib/api/products'
import OmnibusPrice from './OmnibusPrice'

export default function VariantSelector({ variants }: { variants: ProductVariant[] }) {
  const [selected, setSelected] = useState<ProductVariant>(variants[0])
  if (!selected) return null

  const attributeKeys = Object.keys(variants[0]?.attributes ?? {})

  return (
    <div className="space-y-5">
      {attributeKeys.map((key) => {
        const uniqueValues = [...new Set(variants.map((v) => v.attributes[key]))]
        return (
          <div key={key}>
            <p className="text-zinc-500 text-xs uppercase tracking-widest mb-2">{key}</p>
            <div className="flex flex-wrap gap-2">
              {uniqueValues.map((val) => {
                const matchingVariant = variants.find((v) => v.attributes[key] === val)
                const isSelected = selected.attributes[key] === val
                const outOfStock = !matchingVariant || matchingVariant.stock === 0
                return (
                  <button
                    key={val}
                    disabled={outOfStock}
                    onClick={() => matchingVariant && setSelected(matchingVariant)}
                    className={`px-3.5 py-1.5 rounded-lg border text-sm font-medium transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-500/10 text-white'
                        : 'border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white'
                    } disabled:opacity-30 disabled:cursor-not-allowed`}
                  >
                    {val}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}

      <div className="pt-1">
        <p className="text-3xl font-bold text-white tracking-tight">
          {Number(selected.price).toFixed(2)} <span className="text-lg font-normal text-zinc-400">zł</span>
        </p>
        <OmnibusPrice omnibusPrice={selected.omnibusPrice} currentPrice={Number(selected.price)} />
        {selected.stock === 0 && (
          <p className="text-red-400 text-xs mt-1.5 uppercase tracking-widest">Brak w magazynie</p>
        )}
        {selected.stock > 0 && selected.stock <= 5 && (
          <p className="text-amber-400 text-xs mt-1.5 uppercase tracking-widest">
            Ostatnie {selected.stock} szt.
          </p>
        )}
      </div>

      <button
        disabled={selected.stock === 0}
        className="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:bg-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-colors tracking-wide"
      >
        Dodaj do koszyka
      </button>
    </div>
  )
}
```

- [ ] **Step 4: Create product detail page (RSC)**

```typescript
// apps/storefront/app/sklep/[slug]/page.tsx
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { api } from '@/lib/axios'
import type { Product } from '@/lib/api/products'
import ImageGallery from '@/components/products/ImageGallery'
import VariantSelector from '@/components/products/VariantSelector'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  try {
    const { data } = await api.get<Product>(`/products/${slug}`)
    return {
      title: data.name,
      description: data.description ?? `Kup ${data.name} w naszym sklepie.`,
      openGraph: {
        title: data.name,
        description: data.description ?? `Kup ${data.name} w naszym sklepie.`,
        images: data.images[0] ? [{ url: data.images[0].url, alt: data.images[0].altText ?? data.name }] : [],
      },
    }
  } catch {
    return { title: 'Produkt' }
  }
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params

  let product: Product
  try {
    const { data } = await api.get<Product>(`/products/${slug}`)
    product = data
  } catch {
    notFound()
  }

  return (
    <main className="min-h-screen bg-zinc-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          <ImageGallery images={product.images} productName={product.name} />
          <div className="flex flex-col justify-center">
            <p className="text-zinc-500 text-xs uppercase tracking-widest mb-3">{product.category.name}</p>
            <h1 className="text-3xl font-bold text-white tracking-tight mb-8">{product.name}</h1>
            <VariantSelector variants={product.variants} />
            {product.description && (
              <p className="text-zinc-400 text-sm leading-relaxed mt-8 border-t border-zinc-800 pt-8">
                {product.description}
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
```

- [ ] **Step 5: Create loading skeleton for product detail**

```typescript
// apps/storefront/app/sklep/[slug]/loading.tsx
export default function Loading() {
  return (
    <main className="min-h-screen bg-zinc-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          <div className="aspect-square bg-zinc-800 rounded-2xl animate-pulse" />
          <div className="space-y-4 flex flex-col justify-center">
            <div className="h-3 w-20 bg-zinc-800 rounded animate-pulse" />
            <div className="h-8 w-3/4 bg-zinc-800 rounded animate-pulse" />
            <div className="h-6 w-24 bg-zinc-800 rounded animate-pulse mt-4" />
            <div className="flex gap-2 mt-2">
              {[...Array(4)].map((_, i) => <div key={i} className="h-9 w-14 bg-zinc-800 rounded-lg animate-pulse" />)}
            </div>
            <div className="h-8 w-28 bg-zinc-800 rounded animate-pulse mt-4" />
            <div className="h-12 bg-zinc-800 rounded-xl animate-pulse mt-2" />
          </div>
        </div>
      </div>
    </main>
  )
}
```

- [ ] **Step 6: Typecheck**

```bash
pnpm --filter @store/storefront typecheck
```

Expected: clean, exit 0.

- [ ] **Step 7: Commit**

```bash
git add apps/storefront/app/sklep/\[slug\] apps/storefront/components/products/
git commit -m "feat(storefront): add product detail page with variant selector, gallery, and Omnibus price"
```

---

### Task 10: Dynamic SEO + sitemap

**Files:**
- Create: `apps/storefront/app/sitemap.ts`

- [ ] **Step 1: Create sitemap.ts**

```typescript
// apps/storefront/app/sitemap.ts
import type { MetadataRoute } from 'next'
import { api } from '@/lib/axios'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  let productSlugs: string[] = []
  try {
    const { data } = await api.get<{ items: { slug: string }[] }>('/products?limit=1000')
    productSlugs = data.items.map((p) => p.slug)
  } catch {
    productSlugs = []
  }

  return [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${baseUrl}/sklep`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    ...productSlugs.map((slug) => ({
      url: `${baseUrl}/sklep/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
  ]
}
```

- [ ] **Step 2: Final typecheck across all packages**

```bash
pnpm typecheck
```

Expected: all 6 packages clean, exit 0.

- [ ] **Step 3: Final test run**

```bash
export $(grep -v '^#' .env | xargs) && pnpm test
```

Expected: all test suites pass.

- [ ] **Step 4: Commit**

```bash
git add apps/storefront/app/sitemap.ts
git commit -m "feat(storefront): add dynamic sitemap with all product slugs"
```

---

### Task 11: Smoke-test Phase 2 end-to-end

- [ ] **Step 1: Start all dev servers**

```bash
export $(grep -v '^#' .env | xargs) && pnpm dev
```

- [ ] **Step 2: Create a test category via curl (from a second terminal)**

First, register an admin user and get a token (or use an existing admin account):

```bash
# Register
curl -s -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"password123"}' | jq

# Login (saves cookie)
curl -s -c /tmp/cookies.txt -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"password123"}' | jq
```

Note the `accessToken` from the login response.

- [ ] **Step 3: Create category and product**

```bash
TOKEN="<paste accessToken here>"

# Create category
curl -s -X POST http://localhost:4000/api/categories \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Koszulki","slug":"koszulki"}' | jq

# Create product (use the categoryId from the response above)
curl -s -X POST http://localhost:4000/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Koszulka Basic",
    "slug": "koszulka-basic",
    "description": "Klasyczna koszulka z bawełny organicznej.",
    "basePrice": 89.99,
    "categoryId": "<paste categoryId here>",
    "variants": [
      {"sku": "KB-S", "price": 89.99, "stock": 10, "attributes": {"rozmiar": "S"}},
      {"sku": "KB-M", "price": 89.99, "stock": 5, "attributes": {"rozmiar": "M"}},
      {"sku": "KB-L", "price": 89.99, "stock": 0, "attributes": {"rozmiar": "L"}}
    ],
    "images": []
  }' | jq
```

- [ ] **Step 4: Verify storefront pages**

- Open `http://localhost:3000/sklep` — product grid shows "Koszulka Basic"
- Open `http://localhost:3000/sklep/koszulka-basic` — detail page shows variant selector, size S/M/L, L shows "Brak w magazynie"
- Open `http://localhost:3000/sitemap.xml` — contains `/sklep/koszulka-basic`

- [ ] **Step 5: Final commit if smoke-test passes**

```bash
git push origin main
```
