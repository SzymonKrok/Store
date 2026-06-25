# Configurable Shipping Cost Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make delivery cost a real, admin-configurable amount that is added to the order total and itemized in the checkout summary, Stripe page, confirmation page, and emails — with a one-click "free shipping" mode.

**Architecture:** Extend the existing `StoreSettings` singleton with two prices + a `freeShipping` toggle. The backend resolves the shipping cost from settings at order creation (authoritative), persists it on the order, and adds it to the Stripe total. Frontend reads the same settings for display only.

**Tech Stack:** Prisma/PostgreSQL, NestJS, Stripe, Next.js (App Router), React-email, TanStack Query, Jest.

**Spec:** `docs/superpowers/specs/2026-06-26-configurable-shipping-cost-design.md`

**Branch:** continue on `feat/item-level-returns` (current working branch).

**Migration command (from memory — `packages/db` has no `.env`):**
```bash
cd packages/db && DATABASE_URL=$(grep DATABASE_URL ../../apps/api/.env | cut -d= -f2- | tr -d '"') npx prisma migrate dev --name add_configurable_shipping
```

**API test command:**
```bash
cd apps/api && npm test -- <path>
```

---

## File Structure

| File | Responsibility |
|------|----------------|
| `packages/db/prisma/schema.prisma` | 3 new `StoreSettings` fields, 1 new `Order` field |
| `apps/api/src/orders/shipping-cost.ts` (new) | Pure `resolveShippingCost` helper — single source of truth |
| `apps/api/src/orders/shipping-cost.spec.ts` (new) | Unit tests for the helper |
| `apps/api/src/orders/orders.service.ts` | Resolve + add shipping to total, persist `shippingCost` |
| `apps/api/src/orders/orders.module.ts` | Import `SettingsModule` |
| `apps/api/src/orders/orders.service.spec.ts` | Mock `SettingsService`, assert shipping in total |
| `apps/api/src/settings/dto/update-settings.dto.ts` | 3 new optional fields |
| `apps/api/src/payments/payments.service.ts` | Pass `order.shippingCost` to Stripe |
| `apps/api/src/payments/strategies/stripe.strategy.ts` | Optional "Dostawa" line item |
| `apps/api/src/mail/mail.service.ts` | Thread `shippingCost` into both templates |
| `apps/api/src/mail/templates/OrderConfirmationEmail.tsx` | "Dostawa" row |
| `apps/api/src/mail/templates/GuestOrderAcknowledgedEmail.tsx` | "Dostawa" row |
| `apps/storefront/lib/api/settings.ts` | Interface + server fallback fields |
| `apps/storefront/lib/api/orders.ts` | `shippingCost: string` on order type |
| `apps/storefront/app/checkout/page.tsx` | Pass shipping settings to client |
| `apps/storefront/app/checkout/CheckoutClient.tsx` | Dynamic labels, compute cost, pass to summary |
| `apps/storefront/components/cart/CartSummary.tsx` | "Dostawa" row + total incl. shipping |
| `apps/storefront/app/order-confirmation/[id]/page.tsx` | "Dostawa" row |
| `apps/admin/lib/api/settings.ts` | Interface fields |
| `apps/admin/app/(dashboard)/settings/page.tsx` | "Dostawa" tab |

---

## Task 1: Database schema + migration

**Files:**
- Modify: `packages/db/prisma/schema.prisma` (StoreSettings ~288–299, Order ~228–230)

- [ ] **Step 1: Add fields to `StoreSettings`**

In `model StoreSettings`, after `enableGuestCheckout  Boolean @default(true)`:
```prisma
  shippingCourierCost  Decimal @db.Decimal(10, 2) @default(14.99)
  shippingLockerCost   Decimal @db.Decimal(10, 2) @default(9.99)
  freeShipping         Boolean @default(false)
```

- [ ] **Step 2: Add field to `Order`**

In `model Order`, immediately after `total           Decimal       @db.Decimal(10, 2)`:
```prisma
  shippingCost    Decimal       @db.Decimal(10, 2) @default(0)
```

- [ ] **Step 3: Generate the migration**

Run:
```bash
cd packages/db && DATABASE_URL=$(grep DATABASE_URL ../../apps/api/.env | cut -d= -f2- | tr -d '"') npx prisma migrate dev --name add_configurable_shipping
```
Expected: a new folder under `packages/db/prisma/migrations/` and "Your database is now in sync". Prisma client regenerates automatically.

- [ ] **Step 4: Commit**

```bash
git add packages/db/prisma/schema.prisma packages/db/prisma/migrations
git commit -m "feat(db): add configurable shipping cost fields to settings and orders"
```

---

## Task 2: Shipping-cost helper (TDD)

**Files:**
- Create: `apps/api/src/orders/shipping-cost.ts`
- Test: `apps/api/src/orders/shipping-cost.spec.ts`

- [ ] **Step 1: Write the failing test**

`apps/api/src/orders/shipping-cost.spec.ts`:
```ts
import { resolveShippingCost } from './shipping-cost'

const rates = { freeShipping: false, shippingCourierCost: '14.99', shippingLockerCost: '9.99' }

describe('resolveShippingCost', () => {
  it('returns courier cost for COURIER', () => {
    expect(resolveShippingCost(rates, 'COURIER')).toBe(14.99)
  })

  it('returns locker cost for PARCEL_LOCKER', () => {
    expect(resolveShippingCost(rates, 'PARCEL_LOCKER')).toBe(9.99)
  })

  it('defaults undefined method to courier', () => {
    expect(resolveShippingCost(rates, undefined)).toBe(14.99)
  })

  it('returns 0 when freeShipping is enabled', () => {
    expect(resolveShippingCost({ ...rates, freeShipping: true }, 'COURIER')).toBe(0)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/api && npm test -- src/orders/shipping-cost.spec.ts`
Expected: FAIL — "Cannot find module './shipping-cost'".

- [ ] **Step 3: Write the helper**

`apps/api/src/orders/shipping-cost.ts`:
```ts
import { DeliveryMethod } from '@prisma/client'

export interface ShippingRates {
  freeShipping: boolean
  shippingCourierCost: unknown
  shippingLockerCost: unknown
}

/**
 * Single source of truth for delivery cost. When freeShipping is on, every
 * method costs 0. Otherwise the per-method price from StoreSettings applies.
 * An undefined method falls back to courier (the Order default).
 */
export function resolveShippingCost(
  rates: ShippingRates,
  method: DeliveryMethod | undefined,
): number {
  if (rates.freeShipping) return 0
  const cost =
    method === 'PARCEL_LOCKER' ? rates.shippingLockerCost : rates.shippingCourierCost
  return Number(cost)
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/api && npm test -- src/orders/shipping-cost.spec.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/orders/shipping-cost.ts apps/api/src/orders/shipping-cost.spec.ts
git commit -m "feat(orders): add resolveShippingCost helper"
```

---

## Task 3: Apply shipping in OrdersService (TDD)

**Files:**
- Modify: `apps/api/src/orders/orders.module.ts`
- Modify: `apps/api/src/orders/orders.service.ts` (constructor; total calc ~48–60; order.create data ~84–113)
- Test: `apps/api/src/orders/orders.service.spec.ts`

- [ ] **Step 1: Update the failing test**

In `apps/api/src/orders/orders.service.spec.ts`, add the SettingsService import and mock, register it in the module, and add a shipping assertion.

Add import near the top:
```ts
import { SettingsService } from '../settings/settings.service'
```

Add a mock after `mockCouponsService`:
```ts
const mockSettingsService = {
  getSettings: jest.fn().mockResolvedValue({
    freeShipping: false,
    shippingCourierCost: '14.99',
    shippingLockerCost: '9.99',
  }),
}
```

Add the provider in `Test.createTestingModule({ providers: [...] })`:
```ts
        { provide: SettingsService, useValue: mockSettingsService },
```

Add a new test inside `describe('create', ...)`:
```ts
    it('adds courier shipping cost to the total and persists it', async () => {
      mockPrisma.cart.findFirst.mockResolvedValue(mockCart)
      const createSpy = jest.fn().mockResolvedValue(mockOrder)
      mockPrisma.$transaction.mockImplementation(async (fn: any) => {
        const tx = {
          productVariant: { findUnique: jest.fn().mockResolvedValue({ ...mockVariant, stock: 5 }), update: jest.fn() },
          order: { create: createSpy },
          couponUsage: { create: jest.fn() },
          coupon: { update: jest.fn() },
          cartItem: { deleteMany: jest.fn() },
          cart: { delete: jest.fn() },
        }
        return fn(tx)
      })
      await service.create('u1', dto)
      // subtotal 200 (2 × 100), no discount, courier 14.99 → total 214.99
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ shippingCost: 14.99, total: 214.99 }),
        }),
      )
    })
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/api && npm test -- src/orders/orders.service.spec.ts`
Expected: FAIL — Nest cannot resolve `SettingsService` dependency (provider exists in test but not injected by service yet) OR the new assertion fails because `shippingCost`/`total` are wrong.

- [ ] **Step 3: Import SettingsModule**

`apps/api/src/orders/orders.module.ts` — add the import and module entry:
```ts
import { SettingsModule } from '../settings/settings.module'
```
```ts
  imports: [CouponsModule, FakturowniaModule, SettingsModule],
```

- [ ] **Step 4: Inject SettingsService and apply shipping**

In `apps/api/src/orders/orders.service.ts`:

Add imports:
```ts
import { SettingsService } from '../settings/settings.service'
import { resolveShippingCost } from './shipping-cost'
```

Add `SettingsService` to the constructor (alongside the existing injected services):
```ts
    private readonly settings: SettingsService,
```

Replace the total block (currently `const discountAmount = ...` / `const total = subtotal - discountAmount`):
```ts
    const discountAmount = couponResult?.discountAmount ?? 0

    const storeSettings = await this.settings.getSettings()
    const shippingCost = resolveShippingCost(storeSettings, dto.deliveryMethod)
    const total = subtotal - discountAmount + shippingCost
```

In the `tx.order.create({ data: { ... } })` object, add `shippingCost` right after `total,`:
```ts
          subtotal,
          discountAmount,
          shippingCost,
          total,
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd apps/api && npm test -- src/orders/orders.service.spec.ts`
Expected: PASS (all existing tests + the new one).

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/orders/orders.module.ts apps/api/src/orders/orders.service.ts apps/api/src/orders/orders.service.spec.ts
git commit -m "feat(orders): apply configurable shipping cost to order total"
```

---

## Task 4: Settings DTO + API exposure

**Files:**
- Modify: `apps/api/src/settings/dto/update-settings.dto.ts`

- [ ] **Step 1: Add the three fields**

Append before the closing brace of `UpdateSettingsDto`:
```ts
  @IsOptional()
  @IsNumber()
  @Min(0)
  shippingCourierCost?: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  shippingLockerCost?: number

  @IsOptional()
  @IsBoolean()
  freeShipping?: boolean
```

Update the import line at the top to include the new validators:
```ts
import { IsOptional, IsString, IsBoolean, IsNumber, Min } from 'class-validator'
```

- [ ] **Step 2: Verify it compiles**

Run: `cd apps/api && npx tsc --noEmit -p tsconfig.json`
Expected: no errors. (`GET /settings` already returns all columns via Prisma; `PUT` now accepts the new fields.)

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/settings/dto/update-settings.dto.ts
git commit -m "feat(settings): accept shipping rate fields in update DTO"
```

---

## Task 5: Stripe shipping line item

**Files:**
- Modify: `apps/api/src/payments/strategies/stripe.strategy.ts` (params ~15–23; lineItems ~24–31)
- Modify: `apps/api/src/payments/payments.service.ts` (~42–55)

- [ ] **Step 1: Add `shippingCost` to the Stripe params and a line item**

In `stripe.strategy.ts`, add to the `createCheckoutSession` params type (after `discountAmount: number`):
```ts
    shippingCost: number
```

Right after `const lineItems = params.items.map(...)` (the block ending at `}))`), append:
```ts
    if (params.shippingCost > 0) {
      lineItems.push({
        price_data: {
          currency: params.currency,
          product_data: { name: 'Dostawa', description: 'Koszt wysyłki' },
          unit_amount: Math.round(params.shippingCost * 100),
        },
        quantity: 1,
      })
    }
```

- [ ] **Step 2: Pass shippingCost from PaymentsService**

In `payments.service.ts`, inside the `createCheckoutSession({ ... })` call, add after the `discountAmount:` line:
```ts
      shippingCost: Number(order.shippingCost),
```

- [ ] **Step 3: Verify it compiles**

Run: `cd apps/api && npx tsc --noEmit -p tsconfig.json`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/payments/strategies/stripe.strategy.ts apps/api/src/payments/payments.service.ts
git commit -m "feat(payments): add shipping line item to Stripe checkout"
```

---

## Task 6: Email templates

**Files:**
- Modify: `apps/api/src/mail/mail.service.ts` (`OrderConfirmationData` ~24–29; `sendOrderConfirmation` ~64–92; `sendGuestOrderAcknowledged` ~96–123)
- Modify: `apps/api/src/mail/templates/OrderConfirmationEmail.tsx`
- Modify: `apps/api/src/mail/templates/GuestOrderAcknowledgedEmail.tsx`

- [ ] **Step 1: Thread shippingCost through MailService**

In `mail.service.ts`, add to the `OrderConfirmationData` interface (after `discountAmount: unknown`):
```ts
  shippingCost: unknown
```

In `sendOrderConfirmation`, inside the `OrderConfirmationEmail({ ... })` props, add after `discountAmount: Number(order.discountAmount),`:
```ts
        shippingCost: Number(order.shippingCost),
```

Change the `sendGuestOrderAcknowledged` signature to accept shipping. Replace:
```ts
  async sendGuestOrderAcknowledged(
    email: string,
    orderId: string,
    items: OrderItem[],
    total: unknown,
    discountAmount: unknown,
  ): Promise<void> {
```
with:
```ts
  async sendGuestOrderAcknowledged(
    email: string,
    orderId: string,
    items: OrderItem[],
    total: unknown,
    discountAmount: unknown,
    shippingCost: unknown,
  ): Promise<void> {
```

In its `GuestOrderAcknowledgedEmail({ ... })` props, add after `discountAmount: Number(discountAmount),`:
```ts
        shippingCost: Number(shippingCost),
```

- [ ] **Step 2: Pass shippingCost at the guest-ack call site**

In `apps/api/src/orders/orders.service.ts`, the `this.mail.sendGuestOrderAcknowledged(...)` call — add `createdOrder.shippingCost` as the last argument (after `createdOrder.discountAmount`):
```ts
      void this.mail.sendGuestOrderAcknowledged(
        dto.shippingAddress.email,
        createdOrder.id,
        createdOrder.items,
        createdOrder.total,
        createdOrder.discountAmount,
        createdOrder.shippingCost,
      )
```

- [ ] **Step 3: Add the "Dostawa" row to OrderConfirmationEmail**

In `OrderConfirmationEmail.tsx`, add `shippingCost: number` to `OrderConfirmationEmailProps` (after `discountAmount: number`) and to the destructured params (after `discountAmount,`).

Then, immediately after the discount `{discountAmount > 0 && ( ... )}` Row block and before the closing `<Hr style={shared.tableHr} />` that precedes the "Razem" row, insert:
```tsx
          <Row>
            <Column style={shared.colProduct}><Text style={shared.cellText}>Dostawa</Text></Column>
            <Column style={shared.colSku} />
            <Column style={shared.colPrice}><Text style={{ ...shared.cellText, textAlign: 'right' }}>{shippingCost > 0 ? `${shippingCost.toFixed(2)} zł` : 'Gratis'}</Text></Column>
          </Row>
```

- [ ] **Step 4: Add the "Dostawa" row to GuestOrderAcknowledgedEmail**

In `GuestOrderAcknowledgedEmail.tsx`, add `shippingCost: number` to `GuestOrderAcknowledgedEmailProps` (after `discountAmount: number`) and to the destructured params (after `discountAmount,`).

Insert the same Row block (identical to Step 3) between the discount Row and the `<Hr />` before the "Razem" row:
```tsx
          <Row>
            <Column style={shared.colProduct}><Text style={shared.cellText}>Dostawa</Text></Column>
            <Column style={shared.colSku} />
            <Column style={shared.colPrice}><Text style={{ ...shared.cellText, textAlign: 'right' }}>{shippingCost > 0 ? `${shippingCost.toFixed(2)} zł` : 'Gratis'}</Text></Column>
          </Row>
```

- [ ] **Step 5: Verify it compiles**

Run: `cd apps/api && npx tsc --noEmit -p tsconfig.json`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/mail
git commit -m "feat(mail): itemize shipping cost in order emails"
```

---

## Task 7: Storefront checkout UI

**Files:**
- Modify: `apps/storefront/lib/api/settings.ts`
- Modify: `apps/storefront/app/checkout/page.tsx`
- Modify: `apps/storefront/app/checkout/CheckoutClient.tsx` (DELIVERY_OPTIONS ~90–103; component signature ~105; delivery labels ~370–392; summary ~696–707)
- Modify: `apps/storefront/components/cart/CartSummary.tsx`

- [ ] **Step 1: Extend the storefront settings interface + fallback**

In `apps/storefront/lib/api/settings.ts`, add to the `StoreSettings` interface (after `enableGuestCheckout: boolean`):
```ts
  shippingCourierCost: string
  shippingLockerCost: string
  freeShipping: boolean
```

In **both** fallback object literals inside `fetchStoreSettingsServer` (the `if (!res.ok)` branch and the `catch` branch), add before the closing brace:
```ts
, shippingCourierCost: '14.99', shippingLockerCost: '9.99', freeShipping: false
```
(Append inside each `{ ... }` so both fallbacks include the three fields.)

- [ ] **Step 2: Pass shipping settings into CheckoutClient**

Replace `apps/storefront/app/checkout/page.tsx` body return with:
```tsx
  return (
    <CheckoutClient
      enableGuestCheckout={settings.enableGuestCheckout}
      shippingCourierCost={parseFloat(settings.shippingCourierCost)}
      shippingLockerCost={parseFloat(settings.shippingLockerCost)}
      freeShipping={settings.freeShipping}
    />
  )
```

- [ ] **Step 3: Accept the props and compute the delivery options/cost in CheckoutClient**

Change the component signature:
```tsx
export function CheckoutClient({
  enableGuestCheckout = true,
  shippingCourierCost = 14.99,
  shippingLockerCost = 9.99,
  freeShipping = false,
}: {
  enableGuestCheckout?: boolean
  shippingCourierCost?: number
  shippingLockerCost?: number
  freeShipping?: boolean
}) {
```

Delete the module-level `const DELIVERY_OPTIONS = [...]` (lines ~90–103). Inside the component, after `const deliveryMethod = watch('deliveryMethod')`, add:
```tsx
  const formatCost = (cost: number) => (freeShipping || cost === 0 ? 'Gratis' : `${cost.toFixed(2).replace('.', ',')} zł`)
  const deliveryOptions = [
    { value: 'COURIER' as const, label: 'InPost Kurier', description: 'Dostawa 1–2 dni robocze', price: formatCost(shippingCourierCost) },
    { value: 'PARCEL_LOCKER' as const, label: 'Paczkomat InPost', description: 'Odbiór w ciągu 24h', price: formatCost(shippingLockerCost) },
  ]
  const shippingCost = freeShipping ? 0 : deliveryMethod === 'PARCEL_LOCKER' ? shippingLockerCost : shippingCourierCost
```

In the delivery-method render, change `{DELIVERY_OPTIONS.map((option) => (` to `{deliveryOptions.map((option) => (`.

- [ ] **Step 4: Pass shippingCost to CartSummary**

In the summary block, change the `<CartSummary ... />` usage to:
```tsx
              <CartSummary
                subtotal={subtotal}
                discountAmount={appliedCoupon?.discountAmount}
                couponCode={appliedCoupon?.code}
                shippingCost={shippingCost}
              />
```

- [ ] **Step 5: Render the "Dostawa" row in CartSummary**

Replace `apps/storefront/components/cart/CartSummary.tsx` with:
```tsx
'use client'

interface CartSummaryProps {
  subtotal: number
  discountAmount?: number
  couponCode?: string
  shippingCost?: number
}

export function CartSummary({ subtotal, discountAmount = 0, couponCode, shippingCost = 0 }: CartSummaryProps) {
  const total = subtotal - discountAmount + shippingCost

  return (
    <div className="space-y-2 text-sm">
      <div className="flex justify-between text-cream/70">
        <span>Suma częściowa</span>
        <span>{subtotal.toFixed(2)} zł</span>
      </div>
      {discountAmount > 0 && couponCode && (
        <div className="flex justify-between text-gold">
          <span>Rabat ({couponCode})</span>
          <span>−{discountAmount.toFixed(2)} zł</span>
        </div>
      )}
      <div className="flex justify-between text-cream/70">
        <span>Dostawa</span>
        <span>{shippingCost > 0 ? `${shippingCost.toFixed(2)} zł` : 'Gratis'}</span>
      </div>
      <div className="flex justify-between font-semibold text-cream pt-2 border-t border-ink-600 text-base">
        <span>Razem</span>
        <span>{total.toFixed(2)} zł</span>
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Verify it builds**

Run: `cd apps/storefront && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add apps/storefront/lib/api/settings.ts apps/storefront/app/checkout/page.tsx apps/storefront/app/checkout/CheckoutClient.tsx apps/storefront/components/cart/CartSummary.tsx
git commit -m "feat(storefront): show configurable shipping cost in checkout"
```

---

## Task 8: Storefront order-confirmation page

**Files:**
- Modify: `apps/storefront/lib/api/orders.ts` (~13)
- Modify: `apps/storefront/app/order-confirmation/[id]/page.tsx` (~144–155)

- [ ] **Step 1: Add shippingCost to the order type**

In `apps/storefront/lib/api/orders.ts`, after `discountAmount: string`:
```ts
  shippingCost: string
```

- [ ] **Step 2: Render the "Dostawa" row**

In `apps/storefront/app/order-confirmation/[id]/page.tsx`, inside the totals block, between the discount `{parseFloat(order.discountAmount) > 0 && ( ... )}` block and the "Razem" row, insert:
```tsx
              <div className="flex justify-between text-cream/70">
                <span>Dostawa</span>
                <span>{parseFloat(order.shippingCost) > 0 ? `${parseFloat(order.shippingCost).toFixed(2)} zł` : 'Gratis'}</span>
              </div>
```

- [ ] **Step 3: Verify it builds**

Run: `cd apps/storefront && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add apps/storefront/lib/api/orders.ts apps/storefront/app/order-confirmation/[id]/page.tsx
git commit -m "feat(storefront): show shipping cost on order confirmation page"
```

---

## Task 9: Admin settings UI

**Files:**
- Modify: `apps/admin/lib/api/settings.ts`
- Modify: `apps/admin/app/(dashboard)/settings/page.tsx`

- [ ] **Step 1: Extend the admin settings interface**

In `apps/admin/lib/api/settings.ts`, add to the `StoreSettings` interface (after `enableGuestCheckout: boolean`):
```ts
  shippingCourierCost: string
  shippingLockerCost: string
  freeShipping: boolean
```

- [ ] **Step 2: Add the "Dostawa" tab to the settings page**

In `apps/admin/app/(dashboard)/settings/page.tsx`:

Add `Truck` to the lucide import:
```ts
import { Settings, FileText, ToggleLeft, Truck } from 'lucide-react'
```

Extend the `Tab` type:
```ts
type Tab = 'analytics' | 'legal' | 'features' | 'shipping'
```

Add state (after `enableGuestCheckout` state):
```ts
  const [courierCost, setCourierCost] = useState('14.99')
  const [lockerCost, setLockerCost] = useState('9.99')
  const [freeShipping, setFreeShipping] = useState(false)
```

In the `useEffect(... [settings])`, after `setEnableGuestCheckout(...)`:
```ts
      setCourierCost(settings.shippingCourierCost)
      setLockerCost(settings.shippingLockerCost)
      setFreeShipping(settings.freeShipping)
```

Add a save handler (after `handleSaveFeatures`):
```ts
  async function handleSaveShipping() {
    try {
      await save({
        shippingCourierCost: parseFloat(courierCost) || 0,
        shippingLockerCost: parseFloat(lockerCost) || 0,
        freeShipping,
      } as Partial<StoreSettings> as never)
      toast.success('Ustawienia dostawy zapisane')
    } catch {
      toast.error('Błąd podczas zapisywania')
    }
  }
```

Add the tab to the `tabs` array:
```ts
    { id: 'shipping', label: 'Dostawa', icon: Truck },
```

Add the panel (after the `activeTab === 'features'` block, before `activeTab === 'legal'`):
```tsx
          {activeTab === 'shipping' && (
            <div className="space-y-6">
              <div className="bg-card rounded-lg border border-border p-6 space-y-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-cream">Darmowa dostawa</p>
                    <p className="text-xs text-cream-muted mt-0.5">Gdy włączone, koszt dostawy to 0 zł — w sklepie pokazuje się „Gratis".</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFreeShipping(!freeShipping)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${freeShipping ? 'bg-primary' : 'bg-ink-600'}`}
                    role="switch"
                    aria-checked={freeShipping}
                  >
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${freeShipping ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>

                <div className="border-t border-border pt-5 grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="courierCost">Kurier (zł)</Label>
                    <Input id="courierCost" type="number" step="0.01" min="0" disabled={freeShipping} value={courierCost} onChange={(e) => setCourierCost(e.target.value)} placeholder="14.99" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lockerCost">Paczkomat (zł)</Label>
                    <Input id="lockerCost" type="number" step="0.01" min="0" disabled={freeShipping} value={lockerCost} onChange={(e) => setLockerCost(e.target.value)} placeholder="9.99" />
                  </div>
                </div>
              </div>
              <Button onClick={handleSaveShipping} disabled={isPending}>
                {isPending ? 'Zapisywanie…' : 'Zapisz ustawienia dostawy'}
              </Button>
            </div>
          )}
```

Add the `StoreSettings` import if not already present:
```ts
import { useStoreSettings, useUpdateStoreSettings, type StoreSettings } from '@/lib/api/settings'
```

- [ ] **Step 3: Verify it builds**

Run: `cd apps/admin && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add apps/admin/lib/api/settings.ts "apps/admin/app/(dashboard)/settings/page.tsx"
git commit -m "feat(admin): add shipping settings tab"
```

---

## Task 10: End-to-end smoke test

- [ ] **Step 1: Restart API (picks up new Prisma client + SettingsModule wiring)**

Run: `kill $(lsof -ti :4000); cd apps/api && npm run dev`
Expected: starts cleanly on port 4000, no DI errors.

- [ ] **Step 2: Admin — set rates**

In admin → Ustawienia → Dostawa: set courier `19.99`, locker `12.99`, free shipping OFF, save. Confirm toast.

- [ ] **Step 3: Checkout — courier**

Storefront → add product → checkout → select Kurier. Verify the button shows `19,99 zł`, the summary "Dostawa" row shows `19.99 zł`, and "Razem" = subtotal + 19.99. Pay with `4242 4242 4242 4242`.

- [ ] **Step 4: Verify downstream**

- Stripe hosted page lists a "Dostawa" line.
- Order-confirmation page shows the "Dostawa" row and correct total.
- Confirmation email shows the "Dostawa" row.
- Admin order total matches.

- [ ] **Step 5: Free shipping**

Admin → Dostawa → toggle "Darmowa dostawa" ON, save. New checkout shows "Gratis" everywhere, total = subtotal − discount, no Stripe shipping line.

- [ ] **Step 6: Final commit (if any test fixups were needed)**

```bash
git add -A && git commit -m "test(shipping): smoke-test fixups"
```

---

## Self-Review Notes

- **Spec coverage:** settings model (T1), Order column (T1), backend resolve+total (T2–T3), Stripe line (T5), DTO/admin/store interfaces (T4, T7, T9), checkout summary (T7), order-confirmation (T8), emails (T6), migration (T1), admin UI (T9). All spec sections mapped.
- **Type consistency:** helper name `resolveShippingCost` used identically in T2/T3; prop `shippingCost` used consistently across CartSummary, emails, payments, confirmation page; Decimal columns read via `Number(...)`/`parseFloat(...)` matching existing patterns.
- **Free-shipping label:** "Gratis" rendered uniformly in checkout summary, confirmation page, and both emails when cost is 0.
