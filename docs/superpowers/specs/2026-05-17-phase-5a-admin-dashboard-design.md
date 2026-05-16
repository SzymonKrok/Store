# Phase 5A: Admin Dashboard — Design Spec

**Date:** 2026-05-17
**Status:** Approved

---

## Overview

Phase 5A builds the full admin panel in `apps/admin` (Next.js, port 3001). It is the operational backbone of the white-label platform — giving store owners a professional, data-dense UI to manage every entity in the system.

**Tech stack additions:** shadcn/ui, Recharts, sonner (toasts), react-hook-form, zod, date-fns.

**Design system:** Data-dense dashboard. Professional blue (`#2563EB`) primary, slate sidebar, light content area. Fira Code for monospace data (IDs, SKUs), Inter for UI text. shadcn CSS variable tokens throughout — no raw hex in components.

---

## Schema Changes (single migration)

```prisma
model Product {
  isActive  Boolean  @default(true)   // soft-delete guard
}

model ProductVariant {
  compareAtPrice  Decimal?  @db.Decimal(10, 2)  // promotional "was" price
  isActive        Boolean   @default(true)        // soft-delete guard
}

model Order {
  user  User?  @relation(fields: [userId], references: [id], onDelete: SetNull)
  // adds onDelete: SetNull — enables GDPR user deletion while preserving financial records
}
```

Also adds a new `POST /api/admin/orders/:id/regenerate-invoice` endpoint (calls `FakturowniaService.generateInvoice()`, updates `invoiceUrl`).

---

## 1. App Structure & Routing

```
apps/admin/
  app/
    login/
      page.tsx                   ← public, no layout
    (dashboard)/
      layout.tsx                 ← auth guard + sidebar shell ('use client')
      page.tsx                   ← / → Dashboard (KPIs + chart)
      orders/
        page.tsx                 ← Orders list
        [id]/page.tsx            ← Order detail (or sheet from list)
      products/
        page.tsx                 ← Products list
        new/page.tsx             ← Create product
        [id]/page.tsx            ← Edit product
      categories/
        page.tsx
      users/
        page.tsx
      coupons/
        page.tsx
  components/
    layout/
      Sidebar.tsx
      Header.tsx
    ui/                          ← shadcn primitives (generated)
    orders/
      OrdersTable.tsx
      OrderSheet.tsx
    products/
      ProductsTable.tsx
      ProductForm.tsx
      VariantRow.tsx
      AttributeBuilder.tsx
      ImageUploadZone.tsx
    categories/
      CategoriesTable.tsx
      CategoryDialog.tsx
    users/
      UsersTable.tsx
      UserSheet.tsx
    coupons/
      CouponsTable.tsx
      CouponDialog.tsx
    dashboard/
      KpiCards.tsx
      RevenueChart.tsx
  lib/
    axios.ts                     ← Axios client with Bearer + refresh interceptor
    api/
      stats.ts
      orders.ts
      products.ts
      categories.ts
      users.ts
      coupons.ts
```

**Sidebar** — fixed left, `w-64`, `bg-slate-900` background, white text. Navigation items (each with Lucide icon + label): Dashboard, Orders (pending count badge), Products, Categories, Users, Coupons. Store Admin logo at top. Logout button at bottom.

---

## 2. Authentication

### Layout auth guard — `(dashboard)/layout.tsx`

`'use client'` component. State: `isChecking: boolean = true`.

```
useEffect:
  token = localStorage.getItem('admin_token')
  if (!token) → router.push('/login')
  else → setIsChecking(false)
```

While `isChecking === true` → renders full-screen `<Loader2>` spinner (centered, `text-slate-400`).
Once false → renders `<QueryClientProvider>` wrapping sidebar shell + `{children}`.

### Login page — `/login`

Centered `<Card>` (`max-w-sm`). Fields: email, password. `react-hook-form + zod` validation.

On submit:
1. `POST /api/auth/login`
2. If `user.role !== 'ADMIN'` → form error: "Brak dostępu do panelu administratora"
3. On success → `localStorage.setItem('admin_token', accessToken)` → `router.push('/')`

### Axios client — `lib/axios.ts`

- Request interceptor: reads `localStorage.getItem('admin_token')`, sets `Authorization: Bearer <token>`
- Response interceptor on 401:
  1. Calls `POST /api/auth/refresh` (httpOnly cookie carries refresh token automatically)
  2. On success → updates `localStorage` with new access token, retries original request
  3. On failure → `localStorage.removeItem('admin_token')` → `router.push('/login')`

### Logout

Sidebar Logout button: calls `POST /api/auth/logout`, clears `localStorage`, redirects to `/login`.

### TanStack Query

`QueryClientProvider` wraps dashboard layout children. `staleTime: 30_000` as default.

---

## 3. Dashboard Page

### New API endpoint — `GET /api/admin/stats`

Admin-only. Single response:

```typescript
{
  kpis: {
    revenueThisMonth: number,      // SUM(total) WHERE status='PAID' AND month = current (Warsaw TZ)
    totalOrders: number,           // COUNT(*) all orders
    pendingPaymentOrders: number,  // COUNT WHERE status='PENDING_PAYMENT'
    lowStockVariants: number,      // COUNT WHERE stock <= 5
  },
  chart: Array<{ date: string, revenue: number }>  // 30 entries, one per day
}
```

**Timezone requirement:** All date grouping and boundary calculations MUST use Polish time:

```sql
GROUP BY DATE(
  "createdAt" AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Warsaw'
)
```

The "start of current month" KPI boundary is calculated as `startOf(month, { timeZone: 'Europe/Warsaw' })` in the service layer using `date-fns-tz`.

The service layer fills in zero-revenue days for the 30-day window so Recharts always receives a complete 30-point array (no gaps in the X-axis).

### Dashboard layout

**Row 1 — 4 KPI cards** (`grid grid-cols-2 lg:grid-cols-4 gap-4`):
- Total revenue this month (PLN formatted)
- Total orders all-time
- Pending payment — amber `<Badge>` if count > 0
- Low-stock variants — red `<Badge>` if count > 0

While loading → 4 `<Skeleton>` cards (`h-28 rounded-xl`).

**Row 2 — Revenue chart** (full-width `<Card>`):

```tsx
<ResponsiveContainer width="100%" height={300}>
  <LineChart data={chart}>
    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
    <XAxis dataKey="date" tickFormatter={(d) => format(parseISO(d), 'd MMM', { locale: pl })} />
    <YAxis tickFormatter={(v) => v.toLocaleString('pl-PL') + ' zł'} />
    <Tooltip formatter={(v) => v.toLocaleString('pl-PL') + ' zł'} />
    <Line type="monotone" dataKey="revenue" stroke="#2563EB" strokeWidth={2} dot={false} />
  </LineChart>
</ResponsiveContainer>
```

While loading → `<Skeleton className="h-[300px] rounded-xl" />`.

---

## 4. Product & Variant Management

### Products list — `/products`

Full-width shadcn `<Table>`:
| Column | Content |
|---|---|
| Name | product name |
| Category | category name |
| Variants | count badge |
| Price range | min–max across variants |
| Stock | green OK / amber Low (any variant ≤5) / red Out (any variant = 0) |
| Status | Active / Archived badge (`isActive`) |
| Actions | Edit (pencil) / Delete (trash) |

Pagination via shadcn `<Pagination>`. "Nowy produkt" button top-right → navigates to `/products/new`.

### Create / Edit product — `/products/new` and `/products/[id]`

Dedicated page (not modal — form is too large). Two-column layout desktop (`grid grid-cols-[1fr_380px] gap-6`):

**Left column — core fields:**
- Name `<Input>` → slug auto-generates via `slugify()`, displayed in read-only input below (editable)
- Description `<Textarea>`
- Category `<Select>` (options from `GET /api/categories`)
- Base price `<Input type="number">` (reference display price; actual prices on variants)

**Right column — image upload:**
- Dropzone: click or drag-and-drop, accepts `image/*`
- On file select: `POST /api/upload/presign` per file → browser PUT directly to R2 → thumbnail preview
- Existing images: reorderable thumbnail grid, individual delete button per image
- Stored as ordered array of R2 URLs in the product payload

**Variants section — full width below:**

Shadcn `<Table>` where each row is one variant with inline editable fields:

| SKU | Price (zł) | Cena przed promocją (zł) | Stock | Attributes | isActive | Actions |
|---|---|---|---|---|---|---|
| `<Input>` | `<Input>` | `<Input>` (optional) | `<Input>` | Key-value builder | `<Switch>` | Delete row |

**Key-value attribute builder:**
- Existing attributes rendered as dismissible chips: `size: L ×`
- "＋ Atrybut" button opens an inline popover with Key `<Input>` + Value `<Input>` + "Dodaj" button
- Serialises to JSON object before submission
- No JSON knowledge required from the admin

"Dodaj wariant" button appends a blank row. Minimum one variant enforced by form validation.

### Safe delete / archive strategy

1. Admin clicks Delete → `<AlertDialog>` confirmation
2. `DELETE /api/products/:id` (or variant)
3. **HTTP 200** → row removed, success Sonner toast
4. **HTTP 409** (Restrict constraint — product/variant has orders) → Sonner toast:
   > "Ten produkt był zamówiony i nie może zostać trwale usunięty. Czy chcesz go zarchiwizować?"
   
   Inline "Archiwizuj" action in toast → `PATCH /api/products/:id { isActive: false }` → row grays out with "Archiwum" badge

Archived products/variants are invisible in the storefront (`WHERE isActive = true` on all public queries). Visible in admin list with filter toggle "Pokaż zarchiwizowane".

### compareAtPrice on storefront

When `compareAtPrice` is set and greater than current `price`, the storefront product detail page renders:
```
~~3 999,99 zł~~ 2 999,99 zł
```
This is separate from (and complementary to) the Omnibus "Najniższa cena z ostatnich 30 dni" display.

---

## 5. Categories, Users & Coupons

### Categories — `/categories`

`<Table>`: Name, Slug, Parent (or "—"), Product count, Actions.

Create/edit via `<Dialog>` (small form: name input, slug auto-generated, parent `<Select>`).

Safe delete: category with products → 409 → Sonner toast offering to cancel (no archive for categories — admin must reassign products first).

### Users — `/users`

`<Table>`: Email, Role badge (USER / ADMIN), Join date, Order count.

Clicking a row opens `<Sheet>` (right panel) with:
- User details
- Order history summary (last 5 orders)
- Two actions:
  1. **Toggle role** — `PATCH /api/admin/users/:id/role` (USER ↔ ADMIN)
  2. **Delete account** (GDPR Right to be Forgotten) — `<AlertDialog>` with warning: *"Ta operacja jest nieodwracalna. Historia zamówień zostanie zachowana, ale dane osobowe użytkownika zostaną usunięte."* → `DELETE /api/admin/users/:id`

**Schema dependency:** `Order.user` relation requires `onDelete: SetNull` in Prisma schema (same migration). On user deletion, Prisma nullifies `Order.userId` and `CouponUsage.userId` — financial records preserved, PII removed.

### Coupons — `/coupons`

`<Table>`: Code (monospace), Type (PERCENTAGE / FLAT badge), Value, Expiry, Uses (usedCount / maxUses), Status (Active / Nieaktywny badge).

Create/edit via `<Dialog>`:
- Code `<Input>` (uppercase enforced)
- Type `<Select>` (PERCENTAGE / FLAT)
- Value `<Input type="number">`
- Expiry `<DatePicker>` (optional)
- Min order value `<Input>` (optional)
- Max uses `<Input>` (optional)
- Limit per user `<Input>` (optional)
- isActive `<Switch>`

**No hard delete.** Trash icon performs soft delete (`PATCH isActive: false`). "Przywróć" action re-enables. Rationale: `Order.couponId` FK would Restrict-error on hard delete.

---

## 6. Order Management

### Orders list — `/orders`

`<Table>`: Order ID (truncated monospace), Customer email, Date, Delivery badge (Kurier / Paczkomat), Status badge (colour-coded), Total PLN.

Filter row: Status `<Select>` + date range pickers.

Clicking a row opens the order detail `<Sheet>`.

### Order detail `<Sheet>` (`w-[600px]`)

Three sections:

**Items** — compact table: productName, variantSku, variantAttributes chips, quantity × priceAtPurchase. Snapshot data — always historically accurate.

**Shipping & payment** — shippingAddress fields, deliveryMethod badge, lockerCode (if PARCEL_LOCKER), p24OrderId, wantsInvoice indicator with companyName/taxId.

**Actions panel:**

1. **Status** — shadcn `<Select>` pre-filled with current status → `PATCH /api/admin/orders/:id/status` on change → success toast.

2. **Invoice:**
   - If `invoiceUrl` set → "Pobierz fakturę" link button (opens PDF in new tab)
   - If `invoiceUrl` null → "Generuj fakturę" button → `POST /api/admin/orders/:id/regenerate-invoice` → on success: link appears

3. **Shipping label:**
   - If `shippingLabelUrl` set → "Pobierz etykietę" link
   - If null → "Generuj etykietę InPost" button → inline form (parcel size A/B/C `<Select>` + weight `<Input>`) → `POST /api/admin/orders/:id/generate-label` → label link appears on success

**Action guards — invoice and label buttons:**

Both "Generuj fakturę" and "Generuj etykietę InPost" buttons are `disabled` with a shadcn `<Tooltip>`:
> "Akcja niedostępna dla zamówień w statusie {{status}}"

when `order.status` is `PENDING_PAYMENT`, `CANCELLED`, or `REFUNDED`.

Active only for: `PAID | PROCESSING | SHIPPED | DELIVERED`.

Rationale: prevents phantom Fakturownia invoice registrations and billable InPost label generation for unpaid or cancelled orders.

---

## 7. New Backend Endpoints Required

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/admin/stats` | Dashboard KPIs + 30-day revenue chart |
| `POST` | `/api/admin/orders/:id/regenerate-invoice` | Re-calls FakturowniaService, updates invoiceUrl; validates order.status is PAID/PROCESSING/SHIPPED/DELIVERED server-side |
| `GET` | `/api/admin/users` | Paginated user list with order counts |
| `PATCH` | `/api/admin/users/:id/role` | Toggle USER ↔ ADMIN |
| `DELETE` | `/api/admin/users/:id` | GDPR deletion (SetNull on orders) |

Existing endpoints already cover: orders CRUD, products CRUD, categories CRUD, coupons CRUD, label generation.

---

## 8. Key Design Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Auth pattern | Client-side guard + TanStack Query | Matches storefront patterns; API is the real security boundary |
| Token storage | localStorage + httpOnly refresh cookie | Access token in localStorage, silent refresh via existing cookie |
| Stats timezone | `AT TIME ZONE 'Europe/Warsaw'` | Prevents UTC vs Warsaw day-boundary mis-grouping |
| Product delete | 409 → archive fallback | `onDelete: Restrict` on OrderItem; preserves invoice history |
| Coupon delete | Soft-delete only | `Order.couponId` FK; hard delete would corrupt historical records |
| User delete | Hard delete + `onDelete: SetNull` | GDPR Right to be Forgotten; orders preserved with null userId |
| compareAtPrice | Separate field from Omnibus | Strikethrough "was" price is merchant-set; Omnibus is auto-calculated from PriceHistory |
| Action guards | Disabled for non-PAID statuses | Prevents billable InPost charges and phantom Fakturownia invoices |
