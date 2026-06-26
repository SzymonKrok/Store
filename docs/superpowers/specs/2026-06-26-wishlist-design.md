# Wishlist (Ulubione) — Design Spec

**Date:** 2026-06-26
**Status:** Approved

## Summary

Add a working wishlist feature to the storefront. The heart icon on `ProductCard` already toggles a saved state in `localStorage`, but there is no way to view saved products. This spec adds a `WishlistDrawer` (slide-in panel) accessible from a new heart icon in the header, and centralises all wishlist logic into a single `useWishlist` hook.

No backend changes. Pure `localStorage`, no login required.

---

## Architecture

### 1. `apps/storefront/lib/wishlist.ts` — `useWishlist` hook

Central source of truth for wishlist state. Replaces the inline `localStorage` logic currently duplicated in `ProductCard.tsx`.

**Stored type:**
```ts
type WishlistItem = {
  id: string
  slug: string
  name: string
  price: string       // e.g. "129.00"
  imageUrl: string | null
}
```

**localStorage key:** `lune_wishlist` (same as current, preserving existing saved items)

**Hook API:**
```ts
function useWishlist(): {
  items: WishlistItem[]
  count: number
  isWished: (id: string) => boolean
  toggle: (item: WishlistItem) => void
  remove: (id: string) => void
}
```

- Initialises from `localStorage` on mount via `useEffect` (SSR-safe)
- Every mutation writes back to `localStorage` and updates React state

### 2. `apps/storefront/components/layout/WishlistDrawer.tsx` — new file

Mirrors the structure of `CartDrawer.tsx` exactly: full-screen overlay + panel slides in from the right using `AnimatePresence`.

**Empty state:**
- `Heart` icon (large, dimmed)
- "Brak ulubionych produktów"
- Button: "Przeglądaj sklep" → `/sklep`

**Item row (for each WishlistItem):**
- `next/image` thumbnail: 60×80 px, `object-cover`, `rounded-xl`
- Product name (`text-sm font-medium text-cream`)
- Price (`text-sm text-gold tabular-nums`)
- Entire row is a `<Link href="/sklep/[slug]">` that closes the drawer on click
- `X` button (Lucide `X`, size 14) removes the item from the list without closing the drawer

No "add to cart" inside the drawer — user navigates to the product page for that.

### 3. `apps/storefront/components/products/ProductCard.tsx` — updated

Replace the three inline functions (`readWishlist`, `toggleWishlist`, local `useState`/`useEffect`) with `useWishlist()`.

When calling `toggle`, pass:
```ts
{ id: product.id, slug: product.slug, name: product.name, price: price.toFixed(2), imageUrl: primary?.url ?? null }
```

### 4. `apps/storefront/components/layout/Header.tsx` — updated

**Desktop icon row** (left to right): `[HeaderSearch]` `[Heart]` `[User dropdown]` `[ShoppingBag]` `[Menu burger (mobile only)]`

Heart button:
- Same styling as ShoppingBag button: `p-2.5 text-cream/70 hover:text-gold hover:bg-ink-700 transition-colors rounded-xl cursor-pointer`
- Badge: identical to cart badge (gold circle, `text-ink`, count number), visible only when `count > 0`
- `onClick` → `setWishlistOpen(true)`

**Mobile icon bar** (visible on mobile, right side): Heart icon sits between `HeaderSearch` area and `ShoppingBag`, before the menu burger — same badge behaviour.

**Mobile full-screen menu** (the `AnimatePresence` drawer): add "Ulubione" staggered link above the user auth section, with `Heart` icon, pointing to `setWishlistOpen(true)` and closing the mobile menu.

**State:** `const [wishlistOpen, setWishlistOpen] = useState(false)`

`WishlistDrawer` rendered at the bottom of the component return, alongside `CartDrawer`.

---

## Data Flow

```
ProductCard (heart click)
  → useWishlist().toggle({ id, slug, name, price, imageUrl })
    → writes WishlistItem[] to localStorage
    → updates React state

Header (heart icon click)
  → setWishlistOpen(true)

WishlistDrawer (open)
  → useWishlist().items  (reads from same hook state)
  → renders item list

WishlistDrawer (X on item)
  → useWishlist().remove(id)
    → writes updated list to localStorage
    → React state updates → item disappears

WishlistDrawer (row click)
  → navigate to /sklep/[slug]
  → drawer closes
```

---

## Files Changed

| File | Change |
|------|--------|
| `lib/wishlist.ts` | **New** — `useWishlist` hook |
| `components/layout/WishlistDrawer.tsx` | **New** — drawer component |
| `components/products/ProductCard.tsx` | **Updated** — use `useWishlist`, pass full item data |
| `components/layout/Header.tsx` | **Updated** — Heart icon, badge, `WishlistDrawer` |

No backend changes. No new API endpoints. No DB migrations.

---

## Edge Cases

- **SSR safety:** `localStorage` access only inside `useEffect` — no hydration mismatch.
- **Stale price:** Price stored at time of "heart click". Acceptable for a wishlist — final price checked at checkout anyway.
- **Deleted product:** If a product is removed from the store, its wishlist row still appears but its link leads to a 404. Acceptable for now (no cleanup mechanism needed).
- **localStorage unavailable:** `readWishlist` wraps in try/catch, returns `[]` on failure — already in existing code, preserved.
