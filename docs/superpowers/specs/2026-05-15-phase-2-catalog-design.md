# Phase 2: Product Catalog — Design Spec

**Date:** 2026-05-15
**Status:** Approved

---

## Goal

Build the complete product catalog layer: backend CRUD API for Categories, Products, and Variants; Cloudflare R2 image upload via pre-signed URLs; storefront Product Grid and Product Detail pages with RSC + TanStack Query; and dynamic SEO (sitemap, OpenGraph metadata).

---

## Architecture

### Backend (NestJS)

Three sibling modules — `categories`, `products`, `upload` — all registering in `AppModule`. Variants and images are managed inside the `products` module (never independent). All write endpoints are ADMIN-only via `JwtAuthGuard` + `RolesGuard`.

**R2 Upload flow:**
1. Admin calls `POST /api/upload/presign` → receives `{ uploadUrl, key }`
2. Browser PUT-uploads file directly to R2 using `uploadUrl` (never touches NestJS server)
3. Admin submits product form with `key` as the `url` on `CreateProductImageDto` (or the constructed public R2 URL)

**Omnibus compliance (Polish law):**
Price history is tracked at the **ProductVariant level**, not the product level. `PriceHistory.variantId` is required. On every variant price change, a new `PriceHistory` row is written automatically in a Prisma transaction. The storefront queries `MIN(price) WHERE variantId = ? AND recordedAt >= NOW() - INTERVAL '30 days'` to display the Omnibus required "Najniższa cena z ostatnich 30 dni".

### Frontend (Next.js App Router)

**Product Grid (`/sklep`):**
- RSC page loads initial data server-side (SEO + Core Web Vitals)
- `<ProductGrid>` client component hydrates with TanStack Query and takes over for subsequent filter/sort/pagination changes
- Filter state lives in URL search params: `?categoryId=&minPrice=&maxPrice=&sortBy=&page=`
- Filters: category (tree), price range (min/max), sort (newest/price_asc/price_desc)

**Product Detail (`/sklep/[slug]`):**
- Full RSC page (SSR on every request)
- `generateMetadata` produces dynamic `<title>`, description, OpenGraph image
- `<VariantSelector>` client component tracks selected variant in local state
- `<OmnibusPrice>` renders "Najniższa cena z ostatnich 30 dni: X zł" only when omnibusPrice < currentPrice
- "Dodaj do koszyka" button is wired up in Phase 3

---

## Database Changes

### New model: `ProductImage`
```prisma
model ProductImage {
  id        String  @id @default(cuid())
  productId String
  product   Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  url       String
  altText   String?
  position  Int     @default(0)

  @@index([productId])
}
```

### Updated: `PriceHistory`
Add required `variantId` field + relation to `ProductVariant`. Update indexes.
```prisma
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
```

### Updated relations
- `Product` gains `images ProductImage[]`
- `ProductVariant` gains `priceHistory PriceHistory[]`

---

## API Endpoints

### Categories
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/categories` | Public | Flat list of root categories with nested children |
| POST | `/api/categories` | ADMIN | Create category |
| PATCH | `/api/categories/:id` | ADMIN | Update category |
| DELETE | `/api/categories/:id` | ADMIN | Delete category |

### Products
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/products` | Public | Paginated list. Query: `categoryId`, `minPrice`, `maxPrice`, `sortBy` (newest/price_asc/price_desc), `page`, `limit` |
| GET | `/api/products/:slug` | Public | Full detail with all variants (each with `omnibusPrice`), all images |
| POST | `/api/products` | ADMIN | Create product + variants + images in one transaction; records initial PriceHistory per variant |
| PATCH | `/api/products/:id` | ADMIN | Update product; auto-records PriceHistory if variant price changes |
| DELETE | `/api/products/:id` | ADMIN | Delete product (cascades to variants, images, price history) |

### Upload
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/upload/presign` | ADMIN | Returns `{ uploadUrl, key }` for direct R2 browser upload (5-min TTL) |

---

## Storefront Pages & Components

### Pages
- `apps/storefront/app/sklep/page.tsx` — RSC, passes searchParams to `<ProductGrid>`
- `apps/storefront/app/sklep/loading.tsx` — Skeleton UI
- `apps/storefront/app/sklep/[slug]/page.tsx` — RSC, `generateMetadata`, 404 on missing product
- `apps/storefront/app/sklep/[slug]/loading.tsx` — Skeleton UI
- `apps/storefront/app/sitemap.ts` — Dynamic sitemap including all product slugs

### Components
- `components/products/ProductGrid.tsx` — `'use client'`, owns TanStack Query state
- `components/products/ProductCard.tsx` — Image, name, lowest variant price
- `components/products/ProductFilters.tsx` — `'use client'`, category tree + price range + sort select
- `components/products/VariantSelector.tsx` — `'use client'`, attribute buttons + price + Omnibus + add-to-cart stub
- `components/products/OmnibusPrice.tsx` — Pure display, renders only when omnibus < current price
- `components/products/ImageGallery.tsx` — `'use client'`, main image + thumbnail strip

### API Hooks
- `lib/api/products.ts` — `useProducts(query)`, `useProduct(slug)`
- `lib/api/categories.ts` — `useCategories()`

---

## Environment Variables Added

```env
# Cloudflare R2
R2_ACCOUNT_ID="your-account-id"
R2_ACCESS_KEY_ID="your-r2-access-key"
R2_SECRET_ACCESS_KEY="your-r2-secret-key"
R2_BUCKET_NAME="store-assets"
R2_PUBLIC_URL="https://pub-xxxxx.r2.dev"

# Storefront
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

---

## New Dependencies

**apps/api:**
- `@nestjs/mapped-types` — `PartialType` for update DTOs
- `@aws-sdk/client-s3` — S3-compatible R2 client
- `@aws-sdk/s3-request-presigner` — Pre-signed URL generation

**apps/storefront:**
- `framer-motion` — Page/card animations
- `lucide-react` — Icons

---

## Testing Strategy

- Unit tests with mocked PrismaService for all NestJS services
- Key cases: slug conflict (409), not found (404), Omnibus price computation, paginated list, price history creation on variant price change
- Storefront: TypeScript + Next.js build validation (no dedicated unit tests for UI components in Phase 2)
