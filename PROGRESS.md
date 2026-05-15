# Project Progress

## Phase 1: Foundation ✅ COMPLETE

**Completed:** 2026-05-15

### What was built
- Turborepo + pnpm monorepo with `apps/storefront`, `apps/admin`, `apps/api`
- Shared packages: `@store/db` (Prisma + singleton), `@store/validation` (Zod), `@store/tsconfig`
- Full Prisma schema: User, Category, Product, ProductVariant, ProductImage, PriceHistory (variant-level), Cart, CartItem
- Initial PostgreSQL migration applied to Railway
- JWT auth (register, login, refresh via httpOnly cookie, logout)
- RBAC with `@Roles()` decorator + `RolesGuard`
- `apps/storefront` scaffold: TanStack Query, Axios 401→refresh interceptor, `theme.config.ts`
- `apps/admin` scaffold: placeholder, port 3001
- GitHub repo linked: https://github.com/SzymonKrok/Store

### Key decisions
- `PriceHistory.variantId` required (Omnibus at variant level, not product)
- Pre-signed URL upload for R2 (browser → R2 directly, no NestJS proxy)
- JWT: 15-min access token (Bearer header) + 7-day refresh (httpOnly cookie at `/api/auth/refresh`)

---

## Phase 2: Product Catalog ✅ COMPLETE

**Completed:** 2026-05-15

**Spec:** `docs/superpowers/specs/2026-05-15-phase-2-catalog-design.md`
**Plan:** `docs/superpowers/plans/2026-05-15-phase-2-catalog-plan.md`

### Checklist

#### Backend (NestJS)
- [x] **Task 1** — Update Prisma schema: add `ProductImage`, add `variantId` to `PriceHistory`, run migration
- [x] **Task 2** — Add product/category Zod schemas to `@store/validation`
- [x] **Task 3** — `CategoriesModule`: CRUD, slug uniqueness, ADMIN guards
- [x] **Task 4** — `UploadModule`: Cloudflare R2 pre-signed PUT URLs
- [x] **Task 5** — `ProductsModule`: paginated list, detail with Omnibus, create/update with price history, delete
- [x] **Task 6** — Wire all modules into `AppModule`

#### Frontend (Next.js Storefront)
- [x] **Task 7** — Install Framer Motion + Lucide React; add R2 image domain to `next.config.ts`; create `lib/api/products.ts` and `lib/api/categories.ts` TanStack Query hooks
- [x] **Task 8** — `/sklep` product grid: RSC page + `<ProductGrid>` client component + `<ProductCard>` + `<ProductFilters>`
- [x] **Task 9** — `/sklep/[slug]` product detail: RSC page + `<ImageGallery>` + `<VariantSelector>` + `<OmnibusPrice>`
- [x] **Task 10** — Dynamic `sitemap.ts`

#### Final verification
- [x] **Task 11** — End-to-end smoke test: create category + product via API, verify storefront renders correctly

---

## Phase 3: Cart & Marketing ⏳ PLANNED

- Persistent cart (session + authenticated)
- Coupon codes (percentage + flat)
- Guest checkout flow
- Abandoned cart recovery (NestJS Cron + Resend email)

## Phase 4: Polish Regional Integrations ⏳ PLANNED

- InPost Geowidget + ShipX label generation
- Przelewy24 payments + webhook handlers
- Fakturownia invoice generation via Resend

## Phase 5: Admin Dashboard & Polish ⏳ PLANNED

- Sales stats + order management
- RMA / returns workflow
- Product/Variant/Category/User/Coupon CRUD UI
- CMS for Terms of Service + Privacy Policy
- GA4 + Facebook Pixel injection
- GDPR Cookie Banner
