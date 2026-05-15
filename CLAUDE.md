# PROJECT OVERVIEW: WHITE-LABEL E-COMMERCE CORE
You are an expert full-stack developer and software architect assisting in building a highly modular, reusable, and customizable e-commerce boilerplate. The goal is to build a "White-label" core platform for local businesses. For future clients, we will only need to change UI themes (colors, fonts) and toggle specific sections on/off via configuration.

# TECH STACK & FREE TIER USAGE
- **Frontend (Storefront & Admin Panel):** Next.js (App Router), React, Tailwind CSS.
- **Form Management & Validation:** React-hook-form, Zod.
- **State & Data Fetching:** TanStack Query.
- **Backend (API):** NestJS.
- **Database & ORM:** PostgreSQL managed via Prisma ORM (hosted on Railway).
- **Authentication:** JWT (Access & Refresh tokens).
- **Storage (Images/Assets):** Cloudflare R2 (S3-compatible API).
- **Emails (Transactional & Marketing):** Resend (emails for registration, order updates, cart recovery).
- **Deployment Context:** Railway (Backend + DB), Vercel/Cloudflare Pages (Frontend).

# ARCHITECTURE & WHITE-LABEL GUIDELINES
1. **Central Configuration:** Use a global `theme.config.ts` to manage feature flags (e.g., `enableBestsellers`, `enableGuestCheckout`, `enableVariants`) and theme variables.
2. **API Communication:** Strictly use TanStack Query hooks mapped to a customized Axios instance.
3. **Validation:** Share validation logic between Frontend forms (Zod) and Backend DTOs (class-validator) where possible.
4. **Strategy Pattern:** All external services (Payments, Shipping, Invoicing) must be implemented using the Strategy Pattern in NestJS to easily swap or inject client-specific API keys.
5. **Monorepo Structure:** The Next.js frontend MUST be split into two separate, completely isolated applications within the monorepo (`apps/storefront` and `apps/admin`). This guarantees zero bundle bloat for the public store, separate caching strategies, and strict security isolation for the admin dashboard. Shared UI components (like buttons, inputs) and TypeScript interfaces should reside in a shared `packages/ui` or `packages/types` directory.

# CORE MODULES & FEATURES
## 1. Authentication & Users
- JWT-based login, registration, password reset.
- Role-based access control (RBAC): `USER` and `ADMIN`.
- **Guest Checkout:** Support order creation without requiring a registered account (orders linked via email).

## 2. Product Catalog & Legal Compliance
- Categories and Subcategories management.
- **Product Variants (Crucial):** Prisma schema must support complex variants (e.g., size, color). One `Product` has many `ProductVariants`, each with its own SKU, price, and stock level.
- Product Grid with pagination, filtering (category + price range), sorting (newest/price_asc/price_desc).
- Product Details Page (R2 images, description, stock selection by variant).
- **Omnibus Directive (Legal — Polish law):** `PriceHistory` tracks price at the **ProductVariant level** (not product level). `PriceHistory.variantId` is required. Every variant price change writes a new row automatically (in a Prisma transaction). The storefront displays "Najniższa cena z ostatnich 30 dni: X zł" using `MIN(price) WHERE variantId = ? AND recordedAt >= NOW() - INTERVAL '30 days'` — shown only when omnibusPrice < currentPrice.
- **R2 Image Upload:** Pre-signed URL flow — API generates a short-lived PUT URL (`POST /api/upload/presign`), browser uploads directly to R2, then passes the key/URL back when creating/updating a product. Images never travel through the NestJS server.

## 3. Cart, Checkout & Marketing
- Persistent cart state.
- **Discount System:** Support for coupon codes (percentage and flat amount discounts) calculated at checkout.
- **Abandoned Cart Recovery:** Backend cron jobs (NestJS Task Scheduling) to detect carts inactive for 2+ hours and automatically trigger a recovery email via Resend (e.g., offering a discount code).
- Checkout flow capturing Shipping details and Delivery method.

## 4. Polish Regional Integrations (Sandbox Mode initially)
- **Shipping (InPost):** Frontend InPost Geowidget for Parcel Locker selection (lazy loaded). Backend InPost ShipX API for automated label generation. Standard courier support.
- **Payments (Przelewy24):** Implement P24 API for fast transfers/BLIK. Must include secure Webhook handlers to automatically update order statuses.
- **Invoicing & KSeF (Fakturownia):** Do not integrate KSeF directly. Use Fakturownia.pl API to generate invoices automatically upon successful P24 payment. Store the PDF URL in the DB and send it to the customer via Resend.

## 5. Admin Dashboard & Operations
- Sales statistics and Order management.
- **RMA / Returns Management:** Dedicated flow for customers to request returns, and for admins to manage `RETURN_REQUESTED`, `RETURN_APPROVED`, `REFUNDED` statuses.
- CRUD operations for Products, Variants, Categories, Users, Coupons.
- **CMS / Static Pages:** Simple editor to manage content for "Terms of Service" and "Privacy Policy".
- **Easy Analytics:** Admin fields to input Google Analytics 4 ID and Facebook Pixel ID for dynamic script injection.

## 6. SEO & Privacy
- **Dynamic SEO:** Generate dynamic `sitemap.xml` and dynamic Meta Tags (Title, Description, OpenGraph) for all Product/Category pages using Next.js Metadata API.
- **GDPR / RODO:** Implement a standard Cookie Consent Banner that blocks tracking scripts until explicitly accepted.

# UI/UX & DESIGN SYSTEM GUIDELINES
The storefront uses a sophisticated **bright light theme** — warm, airy, premium. Inspiration: high-end architectural design and premium automotive. The interface must feel expensive, trustworthy, and perfectly polished.

## Color Palette
- **Background:** `bg-stone-50` (warm off-white) — never pure white
- **Primary text:** `text-stone-900`
- **Secondary text:** `text-stone-500` / `text-stone-400`
- **Borders:** `border-stone-200` (cards, inputs, dividers)
- **Accent:** `text-amber-700` / `bg-amber-700` (#A16207) — category labels, highlights, active states
- **Cards:** `bg-white` with `border border-stone-200 rounded-2xl`
- **Skeletons:** `bg-stone-200` / `bg-stone-100` on `bg-stone-50`
- **CTA buttons:** `bg-stone-900 text-white rounded-2xl` (primary), ghost `border-stone-300` (secondary)
- **Decorative blobs:** `bg-amber-50` + `bg-stone-200` with `blur-3xl opacity-60` — ambient, never distracting

## Typography
- **Display headings (h1, hero titles):** `font-display` → Cormorant Garamond (variable `--font-cormorant`), loaded via `next/font/google`. Use italic spans for elegance.
- **Body / UI text:** `font-sans` → Inter (variable `--font-inter`). All buttons, labels, nav, paragraphs.
- **Tailwind classes:** `font-display` for Cormorant, `font-sans` (default) for Inter. Configured in `tailwind.config.ts`.
- Never mix font families within the same UI element. Display font is for headings only.

## Layout & Structure
- **Header:** Fixed, `h-16`. Transparent on load → `bg-white/90 backdrop-blur-md border-b border-stone-200` after 24px scroll. Framer Motion entrance from `y: -72`.
- **Page content:** `pt-16` to clear fixed header. Max width `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`.
- **Footer:** 5-column grid (brand + 4 nav columns). `bg-stone-900 text-white`.
- **Page transitions:** `app/template.tsx` wraps every page in `motion.div` with `opacity: 0→1, y: 10→0, duration: 0.35s`.

## Animations (Framer Motion)
- **Scroll reveals:** Use `<AnimatedSection>` (`components/ui/AnimatedSection.tsx`) for section-level fade-up. `useInView({ once: true, margin: '-80px' })`.
- **Stagger:** `staggerChildren: 0.08` for grids, `0.12` for hero text lines.
- **Duration:** 0.35s for page transitions, 0.5–0.6s for section reveals, 0.2s for micro-interactions.
- **Easing:** `[0.25, 0.46, 0.45, 0.94]` (ease-out-quart) for entrances; `ease-in` for exits.
- **Card hover:** `scale: 1.02` + shadow expansion via Tailwind `hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)]`.
- **Mobile drawer:** `AnimatePresence` + slide from `x: '100%'`, staggered nav links inside.
- Always respect `prefers-reduced-motion` — Framer Motion handles this automatically.

## Component Conventions
- Icons: Lucide React only, `strokeWidth={1.5}`, size 16–20px for UI, 13px for inline status.
- Border radius: `rounded-2xl` for cards/buttons, `rounded-xl` for inputs/tags, `rounded-3xl` for image containers.
- Glassmorphism: `bg-white/90 backdrop-blur-md` — header only, not cards.
- No dark mode support in storefront (light theme is definitive). Admin panel may differ.
- Product card empty state: large italic Cormorant "S" on `bg-stone-100`.

## theme.config.ts
Central config at `apps/storefront/theme.config.ts`. Key fields: `mode: 'light'`, `primaryColor: '#1C1917'`, `accentColor: '#A16207'`, `displayFontFamily: 'Cormorant'`, `borderRadius: '1rem'`.

# RENDERING & DATA FETCHING STRATEGY (Next.js App Router)

- **Product Grid (`/sklep`):** RSC page fetches initial data server-side for SEO. `<ProductGrid>` is a `'use client'` component that hydrates with TanStack Query and handles all subsequent filter/sort/pagination interactions. Filter state is stored in URL search params (`?categoryId=&minPrice=&maxPrice=&sortBy=&page=`) for bookmarkability and SSR.
- **Product Detail (`/sklep/[slug]`):** Full RSC page (SSR on every request). `generateMetadata` for dynamic title/OpenGraph. Client components (`<VariantSelector>`, `<ImageGallery>`) handle interactivity.
- **Sitemap:** `app/sitemap.ts` fetches all product slugs server-side at request time.
- **General rule:** RSC for initial SEO-critical load, TanStack Query client components for interactive state that changes without navigation.

# DEVELOPMENT PHASES
- **PHASE 1 (Foundation):** Setup Monorepo, Next.js, NestJS, DB schema (Prisma including Omnibus PriceHistory and Product Variants), and JWT Auth.
- **PHASE 2 (Catalog):** Backend CRUD for Products/Variants/Categories, R2 Upload integration, Frontend Product Grid, and Product Pages with dynamic SEO.
- **PHASE 3 (Cart & Marketing):** Shopping Cart, Discount Coupons logic, Guest Checkout flow, and Abandoned Cart Recovery (NestJS Cron).
- **PHASE 4 (Integrations):** Implement InPost Geowidget, Przelewy24 payments, Webhooks, Fakturownia invoicing, and Resend transactional emails.
- **PHASE 5 (Admin & Polish Standard):** Admin Dashboard, RMA workflow, Static Pages CMS, Easy Analytics injection, and Cookie Banner.

Before writing any code, always confirm which Phase or Module we are currently working on. Ensure strict typing and modularity.