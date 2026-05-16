# Phase 4: Polish Regional Integrations — Design Spec

**Date:** 2026-05-16
**Status:** Approved

---

## Overview

Phase 4 wires up the four Polish-market integrations required to run a complete, legally compliant e-commerce operation:

1. **Przelewy24 (P24)** — payment link generation + webhook processing
2. **InPost** — Geowidget locker selector on checkout + ShipX label generation (admin-triggered)
3. **Fakturownia** — 100% automated invoice generation (B2B VAT or B2C imienna) on every paid order
4. **Resend** — order confirmation email with guaranteed invoice link

The central architectural decision is **Approach B: NestJS EventEmitter**. The P24 webhook handler returns `200 OK` immediately after marking the order `PAID`, then emits `order.paid`. A single `OrderFulfillmentListener` catches the event, sequentially `await`s Fakturownia (so the invoice URL is available), then passes the URL to Resend for a complete confirmation email.

---

## 1. Schema Changes

### New enums

```prisma
enum DeliveryMethod {
  COURIER
  PARCEL_LOCKER
}
```

### Order model additions

```prisma
model Order {
  // --- existing fields ---
  // id, status, total, discountAmount, shippingAddress, couponId, userId, items, createdAt, updatedAt

  // Delivery
  deliveryMethod    DeliveryMethod
  lockerCode        String?         // InPost machine ID, e.g. "WAW123"; null for COURIER

  // Invoicing
  wantsInvoice      Boolean         @default(false)
  companyName       String?         // required when wantsInvoice = true
  taxId             String?         // NIP; required when wantsInvoice = true
  invoiceUrl        String?         // Fakturownia PDF URL; null until generated
  fakturowniaId     String?         // Fakturownia invoice ID; for re-generation

  // Payments
  p24SessionId      String?         // registered with P24 on payment initiation
  p24OrderId        String?         // returned by P24 webhook on successful payment

  // Shipping label
  inpostShipmentId  String?         // ShipX internal shipment ID
  trackingNumber    String?         // public InPost tracking number
  shippingLabelUrl  String?         // R2 URL of label PDF; re-downloads hit R2, not InPost
}
```

One migration covers all additions.

### @store/validation — checkoutSchema update

`checkoutSchema` gains conditional validation via `.superRefine()`:

- `deliveryMethod: z.enum(['COURIER', 'PARCEL_LOCKER'])`
- `lockerCode: z.string().optional()` — required when `deliveryMethod === 'PARCEL_LOCKER'`
- `wantsInvoice: z.boolean().default(false)`
- `companyName: z.string().optional()` — required when `wantsInvoice === true`
- `taxId: z.string().regex(/^\d{10}$/).optional()` — NIP (10 digits); required when `wantsInvoice === true`

---

## 2. Przelewy24 (P24) Payment Flow

### Strategy Pattern

`PaymentsModule` exposes a `PaymentStrategy` interface with `initiatePayment(order)` and `verifyWebhook(payload, signature)`. `Przelewy24Strategy` implements it. Future payment providers (Stripe, PayU) are new strategy implementations — zero changes to the controller.

### Payment initiation — `POST /api/orders/:id/pay`

Protected by `JwtAuthGuard` (authenticated) or `OptionalJwtAuthGuard` (guest, identified by `p24SessionId`).

1. Load Order, verify it belongs to the requesting user (or guest session).
2. Assert `status === 'PENDING_PAYMENT'` — reject if already paid or cancelled.
3. Generate `p24SessionId = \`order-${order.id}-${Date.now()}\`` — store on Order.
4. Call P24 `POST /api/v1/transaction/register`:
   - `merchantId`, `posId`, `sessionId: p24SessionId`
   - `amount` in grosz (`Math.round(total * 100)`)
   - `currency: 'PLN'`
   - `description: \`Zamówienie #${order.id}\``
   - `email: shippingAddress.email`
   - `urlReturn`: storefront `/order-confirmation/${order.id}`
   - `urlStatus`: `${API_BASE_URL}/api/payments/p24/webhook`
   - `sign`: SHA384 of `{sessionId, merchantId, amount, currency, crc}`
5. Return `{ paymentUrl }` → frontend redirects the user to P24.

### Webhook — `POST /api/payments/p24/webhook`

No auth guard (public, but signature-verified).

1. Verify P24 signature: SHA384 of `{merchantId, posId, sessionId, amount, originAmount, currency, orderId, methodId, statement, crc}`.
2. Call P24 `PUT /api/v1/transaction/verify` with `sessionId`, `orderId`, `amount`, `currency`, `sign`.
3. Find Order by `p24SessionId`. If not found or already `PAID` — return `{ data: "OK" }` (idempotent).
4. In a Prisma transaction: set `status = 'PAID'`, store `p24OrderId`.
5. Emit `order.paid` event (see Section 4).
6. Return `{ data: "OK" }` immediately.

**On `CANCELLED` webhook:** restore stock — same `restoreStock(orderId, tx)` helper used by the timeout cron (see below).

### Order Timeout Cron — `OrderTimeoutService`

Runs every 15 minutes (`@Cron('*/15 * * * *')`).

Finds all orders where `status === 'PENDING_PAYMENT'` AND `createdAt < NOW() - 60 minutes`.

For each, in a Prisma transaction:
1. Set `status = 'CANCELLED'`.
2. Call `restoreStock(orderId, tx)`: increment `ProductVariant.stock` by `OrderItem.quantity` for each item.

The shared `restoreStock` helper lives in `OrdersService` (private method), called by both the cron and the cancellation webhook path — no logic duplication.

### Environment variables

```
P24_MERCHANT_ID=
P24_POS_ID=
P24_CRC=
P24_API_URL=https://sandbox.przelewy24.pl  # swap to https://secure.przelewy24.pl for prod
P24_REPORT_KEY=
API_BASE_URL=
```

---

## 3. InPost Integration

### A. Geowidget (storefront — checkout page)

The checkout page gains a **delivery method toggle** above the shipping form:

- `COURIER` (default) — no extra UI, uses existing address fields.
- `PARCEL_LOCKER` — lazy-loads the InPost Geowidget script (`https://geowidget.inpost.pl/inpost-geowidget.js`) via a `useEffect` only when this option is selected. Renders `<inpost-geowidget token={INPOST_GEOWIDGET_TOKEN}>` web component.

The widget fires an `onPoint` callback with `{ name, address, point_name }`. `point_name` is the locker code (e.g. `WAW123`) — stored in React Hook Form state as `lockerCode`. Switching back to COURIER clears `lockerCode`.

Zod `.superRefine()` in the shared schema enforces `lockerCode` is present when `deliveryMethod === 'PARCEL_LOCKER'`.

### B. ShipX Label Generation (backend)

**`POST /api/admin/orders/:id/generate-label`** — Admin only (`@Roles('ADMIN')`).

Request body: `{ parcelSize: 'A' | 'B' | 'C', parcelWeight: number }` (admin specifies before generating).

Flow:
1. Load Order; assert it is `PAID` and has no existing `inpostShipmentId`.
2. Call ShipX `POST /v1/organizations/{ORG_ID}/shipments`:
   - `sender`: populated from env vars (`STORE_NAME`, `STORE_EMAIL`, `STORE_PHONE`, `STORE_STREET`, `STORE_CITY`, `STORE_POSTAL_CODE`) — one env set per client deployment.
   - `receiver`: from `shippingAddress` (courier) OR locker address from `lockerCode` (parcel locker).
   - `parcels`: `[{ dimensions: { length, width, height }, weight: { amount, unit: 'kg' } }]`.
   - `service`: `inpost_courier_standard` (COURIER) or `inpost_locker_standard` (PARCEL_LOCKER).
3. Store `inpostShipmentId` + `trackingNumber` on Order.
4. Call ShipX `GET /v1/shipments/{id}/label?format=Pdf` — get PDF buffer.
5. Upload PDF buffer to R2 via `UploadService.uploadBuffer(buffer, key, 'application/pdf')` (reuses Phase 2 R2 client).
6. Store R2 URL as `shippingLabelUrl` on Order.
7. Return `{ trackingNumber, shippingLabelUrl }`.

Re-downloads always hit R2 — InPost API rate limits are not a concern.

### Environment variables

```
INPOST_API_TOKEN=
INPOST_ORG_ID=
INPOST_GEOWIDGET_TOKEN=
INPOST_API_URL=https://api-shipx-pl.easypack24.net
STORE_NAME=
STORE_EMAIL=
STORE_PHONE=
STORE_STREET=
STORE_CITY=
STORE_POSTAL_CODE=
```

---

## 4. Fakturownia + Resend — `OrderFulfillmentListener`

### Architecture

A single `OrderFulfillmentListener` class decorated with `@OnEvent('order.paid')`. Sequential execution guarantees the invoice URL is available before the email is sent.

```
order.paid event
    │
    ▼
FakturowniaService.generateInvoice(order)
    │  (awaited — 1-3s Fakturownia API call)
    ▼
invoiceUrl: string | null
    │
    ▼
ResendService.sendOrderConfirmation(order, invoiceUrl)
    │  (single complete email)
    ▼
done
```

On Fakturownia failure: logs error, passes `null` to Resend. Order has `invoiceUrl = null` — surfaced in Phase 5 admin as "Regenerate Invoice" button.

### Fakturownia invoice logic

`POST https://app.fakturownia.pl/invoices.json`

| Field | B2B (wantsInvoice = true) | B2C (wantsInvoice = false) |
|---|---|---|
| `kind` | `'vat'` | `'vat'` (Faktura imienna — no NIP) |
| `buyer_name` | `companyName` | `firstName + ' ' + lastName` |
| `buyer_tax_no` | `taxId` (NIP) | omitted |
| `buyer_email` | `shippingAddress.email` | `shippingAddress.email` |
| `positions` | one per OrderItem | one per OrderItem |

Position fields: `name: productName`, `quantity`, `price_net` from `priceAtPurchase` (backend calculates `price_gross` using configured VAT rate, default 23%).

On success: update `Order.invoiceUrl` + `Order.fakturowniaId`.

**Legal value proposition:** 100% of electronic transactions are documented with an automated invoice. The store owner is legally exempt from a physical fiscal printer (kasa fiskalna) in Poland under the electronic sales exemption. This is a key selling point of the white-label boilerplate.

### Resend order confirmation email

Sent to `shippingAddress.email`. Contains:
- Order ID + timestamp
- Itemised list (productName, variantSku, quantity, priceAtPurchase)
- Subtotal, discount (if any), total
- Invoice PDF link (if `invoiceUrl !== null`) — button "Pobierz fakturę"
- InPost tracking number (if `trackingNumber` is set — it won't be at this stage, but the template handles null gracefully)

### Environment variables

```
FAKTUROWNIA_API_TOKEN=
FAKTUROWNIA_SUBDOMAIN=   # e.g. "mystore" → mystore.fakturownia.pl
FAKTUROWNIA_VAT_RATE=23
RESEND_API_KEY=          # already set in Phase 3
RESEND_FROM_EMAIL=       # e.g. "zamowienia@mystore.pl"
```

---

## 5. Module Structure (NestJS)

```
apps/api/src/
  payments/
    payments.module.ts
    payments.controller.ts       # POST /orders/:id/pay, POST /payments/p24/webhook
    payments.service.ts          # orchestrates P24 strategy
    strategies/
      przelewy24.strategy.ts     # P24 API calls + signature
    dto/
      initiate-payment.dto.ts
      p24-webhook.dto.ts
  inpost/
    inpost.module.ts
    inpost.controller.ts         # POST /admin/orders/:id/generate-label
    inpost.service.ts            # ShipX API + R2 upload
    dto/
      generate-label.dto.ts
  fakturownia/
    fakturownia.module.ts
    fakturownia.service.ts       # Fakturownia API calls
  fulfillment/
    fulfillment.module.ts
    order-fulfillment.listener.ts  # @OnEvent('order.paid') — sequential Fakturownia → Resend
  order-timeout/
    order-timeout.module.ts
    order-timeout.service.ts     # @Cron every 15min, PENDING_PAYMENT cleanup
```

`EventEmitterModule.forRoot()` added to `AppModule`.

---

## 6. Storefront Changes

### Checkout page additions

1. **Delivery method toggle** — `COURIER` | `PARCEL_LOCKER` radio/tab UI above the form.
2. **InPost Geowidget** — conditionally rendered below the toggle; lazy-loaded JS only when PARCEL_LOCKER selected.
3. **"Chcę fakturę na firmę" checkbox** — below the phone field; conditionally reveals `companyName` + `taxId` fields with Zod validation.
4. **`POST /api/orders/:id/pay`** — after `createOrder` succeeds, immediately call the payment initiation endpoint and redirect to the returned `paymentUrl`.

### Order confirmation page

Already exists from Phase 3. No changes needed — P24 `urlReturn` points here.

---

## 7. Key Decisions Summary

| Decision | Choice | Rationale |
|---|---|---|
| P24 integration style | Payment link | Simpler, P24 handles checkout UI, sandbox-friendly |
| Webhook response speed | EventEmitter (emit then return 200) | P24 needs fast ack; avoids timeout retries |
| Fakturownia timing | Sequential await before Resend | Guarantees invoice link in confirmation email |
| Invoice scope | 100% of paid orders (B2B or B2C) | Legal fiscal printer exemption for merchants |
| InPost label trigger | Manual admin action | Expiry windows, parcel size adjustments, cancellation buffer |
| Label storage | R2 (PDF buffer uploaded after ShipX fetch) | Avoids InPost rate limits on re-downloads |
| Stock restoration | `restoreStock` shared helper | Used by both webhook cancellation and timeout cron |
| Crash resilience | `null invoiceUrl` as signal | Phase 5 "Regenerate Invoice" button handles edge cases |
| Sender details | Env vars (`STORE_*`) | White-label: one env change per client |
