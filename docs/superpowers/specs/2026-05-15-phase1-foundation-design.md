# Phase 1 Foundation Design — White-label E-commerce Boilerplate

**Date:** 2026-05-15  
**Scope:** Phase 1 — Monorepo scaffold, Next.js storefront, Next.js admin, NestJS API, Prisma schema, JWT Auth  
**Status:** Approved

---

## 1. Project Context

A white-label e-commerce boilerplate for the Polish market. The backend logic and database schema are identical for every client. Per-client customisation is achieved exclusively by toggling feature flags and adjusting UI variables in `apps/storefront/theme.config.ts`. The platform must be legally compliant with the Omnibus Directive, GDPR/RODO, and RMA regulations.

Full specification: `CLAUDE.md` in the repository root.

---

## 2. Monorepo Tooling

| Tool | Choice | Reason |
|---|---|---|
| Package manager | pnpm workspaces | Efficient disk usage, strict dependency isolation |
| Build orchestration | Turborepo | Best-in-class caching, purpose-built for Next.js/Node monorepos |
| Internal package prefix | `@store/*` | Clean, unambiguous imports across apps |

---

## 3. Directory Structure

```
store/
├── apps/
│   ├── storefront/                 # Next.js 14 (App Router) — client-facing shop
│   │   ├── app/
│   │   ├── components/
│   │   ├── lib/                    # Axios instance, TanStack Query setup
│   │   ├── theme.config.ts         # Feature flags + UI variables (white-label control)
│   │   └── package.json
│   │
│   ├── admin/                      # Next.js 14 (App Router) — internal ops panel
│   │   ├── app/
│   │   ├── components/
│   │   └── package.json
│   │
│   └── api/                        # NestJS — REST API
│       ├── src/
│       │   ├── auth/               # JWT module (access + refresh tokens)
│       │   ├── users/
│       │   ├── common/             # Guards, interceptors, pipes
│       │   └── main.ts
│       └── package.json
│
├── packages/
│   ├── db/                         # Prisma schema + generated PrismaClient
│   │   ├── prisma/
│   │   │   ├── schema.prisma       # Single source of truth for all models
│   │   │   └── migrations/
│   │   ├── src/
│   │   │   └── index.ts            # Re-exports PrismaClient + all generated types
│   │   └── package.json            # name: "@store/db"
│   │
│   ├── validation/                 # Shared Zod schemas
│   │   ├── src/
│   │   │   ├── auth.schemas.ts     # loginSchema, registerSchema
│   │   │   └── index.ts
│   │   └── package.json            # name: "@store/validation"
│   │
│   └── tsconfig/                   # Base TypeScript configs
│       ├── base.json
│       ├── nextjs.json
│       └── nestjs.json
│
├── turbo.json                      # Pipeline: build → ^build, lint, typecheck
├── package.json                    # pnpm workspace root
└── pnpm-workspace.yaml
```

---

## 4. Architectural Decisions

### 4.1 Package sharing strategy

- `apps/api` imports `@store/db` for `PrismaService` (full client access).
- `apps/storefront` and `apps/admin` import **types only** from `@store/db` — never instantiate the Prisma client on the frontend.
- `@store/validation` provides Zod schemas consumed by both Next.js forms (client-side validation) and NestJS DTOs (via `class-validator` wrappers or direct Zod pipes).
- `@store/tsconfig` provides `base.json`, `nextjs.json`, and `nestjs.json` extended by each app.

### 4.2 NestJS Prisma pattern

`PrismaService` extends `PrismaClient` and is registered as a global provider, enabling injection across all feature modules without repeated imports.

### 4.3 JWT Authentication

- **Access token:** 15-minute expiry, signed with `JWT_ACCESS_SECRET`.
- **Refresh token:** 7-day expiry, signed with `JWT_REFRESH_SECRET`, stored as an httpOnly cookie and hashed in the `User.refreshToken` DB column.
- **Guards:** `JwtAuthGuard` (access token), `JwtRefreshGuard` (refresh token rotation endpoint).
- **RBAC:** `@Roles(Role.ADMIN)` decorator + `RolesGuard` for admin-only routes.

### 4.4 White-label configuration

`apps/storefront/theme.config.ts` is the single file a developer edits per client deployment. It exports:
- Feature flags (e.g., `enableBestsellers`, `enableGuestCheckout`, `enableVariants`).
- UI tokens (primary colour, font family, border-radius scale).

No runtime feature flag service is needed — flags are compile-time constants, tree-shaken by Next.js.

### 4.5 API communication

All data fetching in `storefront` and `admin` goes through TanStack Query hooks backed by a shared Axios instance (configured with base URL, auth header injection, and 401 → refresh-token retry interceptor).

### 4.6 Environment variables

Root `.env` file. Each app reads its own subset. Turborepo `pipeline.env` keys are declared per task to ensure correct cache invalidation when env values change.

---

## 5. Prisma Schema — Phase 1 Models

These models are scaffolded in Phase 1. They are designed to be extended in later phases without breaking migrations.

```prisma
enum Role {
  USER
  ADMIN
}

model User {
  id            String   @id @default(cuid())
  email         String   @unique
  passwordHash  String
  role          Role     @default(USER)
  refreshToken  String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model Category {
  id        String     @id @default(cuid())
  name      String
  slug      String     @unique
  parentId  String?
  parent    Category?  @relation("Subcategories", fields: [parentId], references: [id])
  children  Category[] @relation("Subcategories")
  products  Product[]
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
  priceHistory PriceHistory[]
  createdAt    DateTime         @default(now())
  updatedAt    DateTime         @updatedAt
}

model ProductVariant {
  id         String   @id @default(cuid())
  productId  String
  product    Product  @relation(fields: [productId], references: [id])
  sku        String   @unique
  price      Decimal  @db.Decimal(10, 2)
  stock      Int      @default(0)
  attributes Json
  cartItems  CartItem[]
}

// Omnibus Directive compliance — lowest price in last 30 days
model PriceHistory {
  id         String   @id @default(cuid())
  productId  String
  product    Product  @relation(fields: [productId], references: [id])
  price      Decimal  @db.Decimal(10, 2)
  recordedAt DateTime @default(now())
}

model Cart {
  id        String     @id @default(cuid())
  userId    String?
  sessionId String?
  items     CartItem[]
  updatedAt DateTime   @updatedAt
}

model CartItem {
  id        String         @id @default(cuid())
  cartId    String
  cart      Cart           @relation(fields: [cartId], references: [id])
  variantId String
  variant   ProductVariant @relation(fields: [variantId], references: [id])
  quantity  Int
}
```

---

## 6. Turbo Pipeline

```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "lint": {},
    "typecheck": {
      "dependsOn": ["^build"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

---

## 7. Deployment Targets

| App | Platform |
|---|---|
| `apps/storefront` | Vercel (or Cloudflare Pages) |
| `apps/admin` | Vercel |
| `apps/api` | Railway |
| PostgreSQL | Railway managed DB |
| File storage | Cloudflare R2 |
| Transactional email | Resend |

---

## 8. Out of Scope for Phase 1

The following are deliberately excluded and addressed in later phases:

- Payment integration (Przelewy24) — Phase 4
- Shipping integration (InPost) — Phase 4
- Invoicing (Fakturownia) — Phase 4
- Admin dashboard UI — Phase 5
- RMA workflow — Phase 5
- Cookie consent banner — Phase 5
- Abandoned cart cron jobs — Phase 3
- Discount/coupon logic — Phase 3
