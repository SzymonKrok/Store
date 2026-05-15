# Phase 3: Cart & Marketing — Design Spec

**Date:** 2026-05-15
**Status:** Approved
**Phase:** 3 of 5

---

## Overview

Phase 3 adds the full shopping journey from cart to placed order. It introduces a slide-out cart drawer, a dedicated distraction-free checkout page, coupon codes with full rule enforcement, and an automated abandoned cart recovery cron job. Payments (Przelewy24) are Phase 4; Phase 3 creates orders in `PENDING_PAYMENT` state only.

---

## 1. Schema Changes

### New Enum

```prisma
enum OrderStatus {
  PENDING_PAYMENT
  PAID
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
  REFUNDED
}

enum DiscountType {
  PERCENTAGE
  FLAT
}
```

### New Models

**`Coupon`**
```
id            String        @id @default(cuid())
code          String        @unique
type          DiscountType
value         Decimal       @db.Decimal(10, 2)
expiresAt     DateTime?
minOrderValue Decimal?      @db.Decimal(10, 2)
maxUses       Int?
limitPerUser  Int?
usedCount     Int           @default(0)
isActive      Boolean       @default(true)
usages        CouponUsage[]
orders        Order[]
```

**`CouponUsage`** — one row per redemption, enforces per-user limit
```
id         String   @id @default(cuid())
couponId   String
coupon     Coupon   @relation(fields: [couponId], references: [id])
userId     String?
guestEmail String?
orderId    String
order      Order    @relation(fields: [orderId], references: [id])
usedAt     DateTime @default(now())

@@index([couponId, userId])
```

**`Order`**
```
id              String      @id @default(cuid())
userId          String?
user            User?       @relation(fields: [userId], references: [id])
guestEmail      String?
guestName       String?
guestPhone      String?
status          OrderStatus @default(PENDING_PAYMENT)
subtotal        Decimal     @db.Decimal(10, 2)
discountAmount  Decimal     @db.Decimal(10, 2) @default(0)
total           Decimal     @db.Decimal(10, 2)
couponId        String?
coupon          Coupon?     @relation(fields: [couponId], references: [id])
shippingAddress Json
items           OrderItem[]
couponUsage     CouponUsage[]
createdAt       DateTime    @default(now())
updatedAt       DateTime    @updatedAt

@@index([userId])
@@index([status])
```

`shippingAddress` JSON shape: `{ firstName, lastName, email, street, city, postalCode, phone }`

**`OrderItem`** — fully self-contained snapshot; survives product renames/deletions
```
id                String         @id @default(cuid())
orderId           String
order             Order          @relation(fields: [orderId], references: [id], onDelete: Cascade)
variantId         String
variant           ProductVariant @relation(fields: [variantId], references: [id], onDelete: Restrict)
quantity          Int
priceAtPurchase   Decimal        @db.Decimal(10, 2)
productName       String
variantSku        String
variantAttributes Json

@@index([orderId])
```

### Modified Models

**`Cart`** — add one field:
```
recoveryEmailSentAt DateTime?
```
Prevents the abandoned cart cron from sending duplicate recovery emails.

---

## 2. Backend Modules & API

### 2.1 CartModule — `/api/cart`

**Session identity:** Guest carts are identified by an `x-cart-session` header containing a client-generated `nanoid()` UUID. Authenticated users are identified by their JWT. The backend resolves the correct cart in a shared `CartService.resolveCart(userId?, sessionId?)` method.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/cart` | Optional | Resolve or create cart; returns full cart with items + variant data |
| POST | `/api/cart/items` | Optional | Add variant to cart. Body: `{ variantId, quantity }`. Idempotent — increments if already present |
| PATCH | `/api/cart/items/:itemId` | Optional | Update quantity (min 1). Body: `{ quantity }` |
| DELETE | `/api/cart/items/:itemId` | Optional | Remove one line item |
| POST | `/api/cart/merge` | Required | Merge session cart into user cart on login. Body: `{ sessionId }`. Sums quantities for duplicates, deletes session cart |

### 2.2 CouponsModule — `/api/coupons`

**Validation logic** (shared between validate endpoint and order creation):
1. Coupon exists and `isActive = true`
2. `expiresAt` is null or in the future
3. `subtotal >= minOrderValue` (if set)
4. `usedCount < maxUses` (if set)
5. Per-user: `COUNT(CouponUsage WHERE couponId = ? AND userId = ?) < limitPerUser` (if set; for guests, skip this check)

Returns `{ discountAmount, finalTotal }` on success, or a typed error string on failure. Does **not** redeem — redemption only happens inside the order transaction.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/coupons/validate` | Optional | Validate coupon. Body: `{ code, subtotal, userId? }` |
| POST | `/api/admin/coupons` | ADMIN | Create coupon |
| GET | `/api/admin/coupons` | ADMIN | List all coupons (paginated) |
| PATCH | `/api/admin/coupons/:id` | ADMIN | Update coupon |
| DELETE | `/api/admin/coupons/:id` | ADMIN | Deactivate (soft delete via `isActive = false`) |

### 2.3 OrdersModule — `/api/orders`

**`POST /api/orders` — checkout transaction.** Everything inside a single Prisma `$transaction`:

1. Re-validate coupon (same logic as `/api/coupons/validate`); fail fast if invalid
2. Hard stock check: `ProductVariant.stock >= CartItem.quantity` for every item — throw `409 Conflict` and rollback if any item fails
3. Decrement stock: `stock -= quantity` for each item
4. Snapshot `OrderItem` fields: `priceAtPurchase`, `productName`, `variantSku`, `variantAttributes`
5. Create `Order` with `PENDING_PAYMENT`
6. Create `CouponUsage` record (if coupon used); increment `Coupon.usedCount`
7. Delete all `CartItem` rows for this cart; delete the `Cart` record

**Phase 4 note:** When P24 webhook confirms payment failure, the handler must restore stock (`stock += quantity`) before setting `OrderStatus = CANCELLED`.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/orders` | Optional | Create order from cart. Body: `{ shippingAddress, couponCode?, sessionId? }` |
| GET | `/api/orders` | Required | Authenticated user's order history |
| GET | `/api/orders/:id` | Optional | Order detail (owner or ADMIN only) |
| GET | `/api/admin/orders` | ADMIN | All orders, paginated, filterable by status |
| PATCH | `/api/admin/orders/:id/status` | ADMIN | Update order status |

### 2.4 AbandonedCartModule — Cron

- Schedule: `@Cron('0 * * * *')` — runs every hour
- Query: `Cart WHERE updatedAt < NOW() - 2h AND recoveryEmailSentAt IS NULL AND items.some exists`
- Scope: authenticated-user carts only (`userId IS NOT NULL`) — guest carts have no email until checkout
- Action: send recovery email via Resend → set `recoveryEmailSentAt = NOW()`
- Email content: plain reminder with cart item summary and a link back to the storefront. No auto-generated coupon.
- NestJS module: `ScheduleModule.forRoot()` in `AppModule`; `@nestjs/schedule` + `resend` packages

---

## 3. Frontend Components

### 3.1 Cart Session Identity

On first cart interaction, the storefront generates a `nanoid()` UUID and persists it in `localStorage` as `cart_session_id`. This value is sent as the `x-cart-session` header on every cart/order API call. After successful login + merge, the key is removed from `localStorage`.

### 3.2 TanStack Query — Cart State

Single query key `['cart']`. All mutations (add, update, remove, merge) call `queryClient.invalidateQueries(['cart'])` on settle. Optimistic updates applied on quantity change and item removal for instant UI feedback.

Cart hooks live in `apps/storefront/src/lib/api/cart.ts`:
- `useCart()` — GET cart
- `useAddToCart()` — POST cart/items
- `useUpdateCartItem()` — PATCH cart/items/:id
- `useRemoveCartItem()` — DELETE cart/items/:id
- `useMergeCart()` — POST cart/merge (called in auth success handler)

### 3.3 `<CartDrawer>` Component

Location: `apps/storefront/src/components/cart/CartDrawer.tsx`

- **Overlay:** `motion.div` `opacity: 0→1`, `bg-black/40 backdrop-blur-sm`, click-to-close
- **Panel:** `motion.div` `x: '100%'→0`, duration `0.35s`, easing `[0.25, 0.46, 0.45, 0.94]`, `bg-white`, `w-full max-w-md`, fixed right, full height
- **Header:** "Twój koszyk" + item count + `X` close button (Lucide `X`, `strokeWidth={1.5}`)
- **Body:** scrollable `<CartItem>` list
- **Coupon section:** text input + "Zastosuj" button → calls `POST /api/coupons/validate`; shows green discount line or inline red error
- **Summary:** subtotal, discount line (green, shown only when coupon applied), total in bold
- **CTA:** `bg-stone-900 text-white rounded-2xl` "Przejdź do kasy" → navigates to `/checkout`
- **Ghost link:** "Kontynuuj zakupy" → closes drawer
- **Accessibility:** focus trap inside panel, `Escape` key closes, `role="dialog"` `aria-modal="true"`

### 3.4 `<CartItem>` Component

Location: `apps/storefront/src/components/cart/CartItem.tsx`

- R2 product image (`rounded-xl`, `object-cover`)
- Product name (`font-sans font-medium text-stone-900`)
- Variant attributes badge (`text-stone-500 text-sm`)
- Quantity stepper: `−` / count / `+` buttons with optimistic update; min 1
- Unit price
- Remove button: Lucide `Trash2`, `strokeWidth={1.5}`, `text-stone-400 hover:text-red-500`

### 3.5 Header Cart Icon

Location: `apps/storefront/src/components/layout/Header.tsx` (existing file)

- Lucide `ShoppingBag`, `strokeWidth={1.5}`, size 20
- Badge: absolute `bg-stone-900 text-white text-[10px] rounded-full w-4 h-4` top-right
- Badge animates on count change: `motion.div key={count}` scale `0.8→1`, duration `0.2s`
- Clicking icon sets `isCartOpen = true` via `CartDrawerContext` (React context at layout level — single boolean, no external store needed)

### 3.6 `/checkout` Page

Location: `apps/storefront/src/app/checkout/page.tsx`

- Minimal layout: logo only, no nav, no footer
- Two-column desktop (`grid-cols-[1fr_400px]`), single column mobile
- If cart is empty on mount: redirect to `/sklep`

**`<ShippingForm>`** — React Hook Form + shared Zod schema from `@store/validation`:
```
firstName    z.string().min(1)
lastName     z.string().min(1)
email        z.string().email()
street       z.string().min(1)
city         z.string().min(1)
postalCode   z.string().regex(/^\d{2}-\d{3}$/)   // Polish format
phone        z.string().min(9)
acceptTerms  z.literal(true)   // legal requirement — order cannot be placed without explicit consent
```

- T&C checkbox above CTA: "Akceptuję Regulamin i Politykę Prywatności" with links
- "Złóż zamówienie" CTA → `POST /api/orders` → on success redirect to `/order-confirmation/[orderId]`
- On stock-out `409` error: show inline banner listing unavailable items; do not clear cart

**`<OrderSummary>`** — read-only sidebar:
- Cart items list (name, variant, qty, line total)
- Applied coupon (green badge + discount amount)
- Subtotal, discount, **Total** (large, bold)

### 3.7 `/order-confirmation/[id]` Page

Location: `apps/storefront/src/app/order-confirmation/[id]/page.tsx`

- RSC page, fetches order server-side
- Displays: order ID, item list with snapshots, shipping address, total
- "Kontynuuj zakupy" CTA → `/sklep`
- No sensitive data shown if session doesn't match order owner

---

## 4. Key Decisions & Trade-offs

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Cart session | `x-cart-session` header + `localStorage` | Simpler than httpOnly cookie for cross-origin NestJS; works with RSC |
| Cart state | TanStack Query only | No extra store; optimistic updates built-in |
| Stock check | At order creation (checkout) | Prevents overselling during payment window; clean with Phase 4 webhook restoring on failure |
| Guest email | Captured in shippingAddress JSON | Avoids a separate GuestUser model; sufficient for Phase 4 P24 and Resend emails |
| Coupon redemption | Only inside order transaction | Prevents race conditions from double-apply |
| Abandoned cart | Authenticated carts only | Guests have no email until checkout; no partial-email capture in Phase 3 |
| Cart drawer state | `CartDrawerContext` (React context) | Single boolean at layout level; no external store needed, no prop-drilling |

---

## 5. Out of Scope (Phase 4+)

- P24 payment step in checkout
- Stock restoration on payment failure webhook
- InPost Geowidget on checkout page
- Fakturownia invoice generation
- Resend transactional order confirmation email (stub `POST /api/orders` to log intent only)
