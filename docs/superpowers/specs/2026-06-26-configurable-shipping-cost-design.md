# Configurable Shipping Cost — Design

**Date:** 2026-06-26
**Status:** Approved (design)
**Branch:** feat/item-level-returns (current working branch)

## Problem

Delivery cost is currently cosmetic. The checkout shows hardcoded prices on the
delivery-method buttons (`14,99 zł` courier, `9,99 zł` parcel locker), but these
strings never enter any calculation:

- Backend computes `total = subtotal − discountAmount` (no shipping). See
  `apps/api/src/orders/orders.service.ts:60`.
- The `Order` model has no shipping cost column.
- Stripe receives only product line items + discount coupon.
- `CartSummary` shows "Suma częściowa / Rabat / Razem" with no "Dostawa" line.
- Order confirmation emails have no shipping line.

The client (boutique owner) needs to:
1. Have shipping cost actually added to the order total.
2. Optionally offer **free shipping** (shown everywhere as "Gratis" / 0 zł).
3. Configure all of this **from the admin panel** (not code/env).
4. See the delivery cost itemized in the checkout summary AND the confirmation email.

## Decision

Make shipping admin-configurable by extending the existing `StoreSettings`
singleton (same pattern as GA4 ID, feature flags). Two numeric prices + one
"free shipping" toggle. No threshold-based free shipping (YAGNI — not requested;
easy to add later on the same foundation).

## Data Model

### `StoreSettings` — new fields
```prisma
shippingCourierCost  Decimal  @db.Decimal(10, 2)  @default(14.99)
shippingLockerCost   Decimal  @db.Decimal(10, 2)  @default(9.99)
freeShipping         Boolean  @default(false)
```
When `freeShipping = true`, both costs are treated as 0 and the UI shows
"Gratis". When `false`, the per-method cost is added. This realizes the client's
"either prices OR free" requirement with one checkbox + two price fields.

### `Order` — new field
```prisma
shippingCost  Decimal  @db.Decimal(10, 2)  @default(0)
```
Persists the amount actually charged, so historical orders stay correct even
after the rate card changes later.

## Behavior / Data Flow

### Shipping cost resolution (single source of truth)
```
resolveShippingCost(settings, deliveryMethod):
  if settings.freeShipping: return 0
  return deliveryMethod === 'COURIER'
    ? settings.shippingCourierCost
    : settings.shippingLockerCost
```
Used on the backend at order creation (authoritative). The frontend mirrors the
same logic for display only — backend value is the one persisted and charged.

### Backend — order creation (`orders.service.ts`)
1. Fetch `StoreSettings` (already a singleton upsert in `SettingsService`).
2. `shippingCost = resolveShippingCost(settings, deliveryMethod)`.
3. `total = subtotal − discountAmount + shippingCost`.
4. Persist `shippingCost` on the order.

### Stripe (`payments.service.ts` → `stripe.strategy.ts`)
Add a `shippingCost` param to `createCheckoutSession`. When `> 0`, append an
extra line item:
```
{ name: 'Dostawa', unitAmount: round(shippingCost * 100), quantity: 1 }
```
Discount (`amount_off`) is unchanged. Resulting Stripe total =
items + shipping − discount = our `order.total`. When shipping is 0, no line
item is added.

### Frontend checkout
- `checkout/page.tsx` (RSC) passes shipping settings into `CheckoutClient`
  alongside the existing `enableGuestCheckout`.
- Delivery-method option labels render the **real** price from settings, or
  "Gratis" when `freeShipping`.
- `CartSummary` gains a `shippingCost` prop and a "Dostawa" row;
  `Razem = subtotal − discount + shipping`. Updates reactively when the user
  switches delivery method.
- `lib/api/settings.ts` `StoreSettings` interface + server fallback gain the
  three new fields. (Decimal serializes as string over JSON → parse with
  `parseFloat`, matching how item prices are already handled.)

### Email
`OrderConfirmationEmail` (and `GuestOrderAcknowledgedEmail`) render a "Dostawa"
line. `MailService` passes `order.shippingCost` through to the templates. Show
"Gratis" when 0, otherwise the amount.

### Admin
New "Dostawa" section on the settings page: a "Darmowa dostawa" checkbox plus
two price inputs (courier / locker). Price inputs are disabled when the checkbox
is on. `UpdateSettingsDto` + admin `settings.ts` API client gain the three
fields.

## Migration

One Prisma migration adds the columns to `StoreSettings` and `Order`. Defaults
match current display prices (14.99 / 9.99) and `freeShipping = false`, so
production behavior after deploy is "prices now actually apply" with no manual
data fixup. Runs automatically via `prisma migrate deploy` on Railway deploy.

## Components Touched

| Layer | File | Change |
|-------|------|--------|
| DB | `packages/db/prisma/schema.prisma` | 3 fields on StoreSettings, 1 on Order + migration |
| API | `settings/dto/update-settings.dto.ts` | 3 optional fields |
| API | `orders/orders.service.ts` | resolve + add shipping to total, persist |
| API | `payments/payments.service.ts` | pass shippingCost to Stripe |
| API | `payments/strategies/stripe.strategy.ts` | optional "Dostawa" line item |
| API | `mail/mail.service.ts` | pass shippingCost to templates |
| API | `mail/templates/OrderConfirmationEmail.tsx` | Dostawa row |
| API | `mail/templates/GuestOrderAcknowledgedEmail.tsx` | Dostawa row |
| Shared | new `resolveShippingCost` helper (backend; FE mirrors) | single source of truth |
| Store | `lib/api/settings.ts` | interface + fallback fields |
| Store | `app/checkout/page.tsx` | pass shipping settings |
| Store | `app/checkout/CheckoutClient.tsx` | dynamic labels, pass cost to summary |
| Store | `components/cart/CartSummary.tsx` | Dostawa row + total incl. shipping |
| Admin | `app/(dashboard)/settings/page.tsx` | Dostawa section |
| Admin | `lib/api/settings.ts` | interface fields |

## Out of Scope (YAGNI)

- Free-shipping threshold ("darmowa od X zł").
- Per-region / weight-based shipping rates.
- Multiple courier tiers beyond the existing two methods.

## Testing

- Order with courier + paid prices → total includes 14.99, Stripe shows
  "Dostawa", email shows it, admin order detail total matches.
- Order with parcel locker → 9.99 applied.
- `freeShipping = true` → shipping 0 everywhere, "Gratis" in checkout + email,
  no Stripe shipping line, total = subtotal − discount.
- Coupon + shipping together → `total = subtotal − discount + shipping`.
- Changing rates in admin affects new orders only; historical `shippingCost`
  unchanged.
