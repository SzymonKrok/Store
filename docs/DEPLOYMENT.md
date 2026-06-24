# Lune Atelier — Deployment Guide (Runbook)

A step-by-step "recipe" for taking the shop from localhost to live, shareable URLs.
Follow it top to bottom. Each phase ends with a **✅ Verify** step — don't move on until it passes.

> **Placeholder:** this guide uses `luneatelier.com` as the example domain.
> Replace it everywhere with the domain you actually buy (find-and-replace).

---

## 1. Architecture & cost

```
                        luneatelier.com  ──────────►  Storefront (Next.js)  ─┐
                  admin.luneatelier.com  ──────────►  Admin (Next.js)        │   both on VERCEL (free)
                                                                             │
                    api.luneatelier.com  ──────────►  API (NestJS)  ─────────┘   on RAILWAY (~$5/mo)
                                                            │
                                  ┌─────────────────────────┼───────────────┐
                              SUPABASE                    Stripe           Resend
                         (Postgres + Storage)          (test mode)        (emails)
```

| What | Where | Cost |
|------|-------|------|
| Storefront (`apps/storefront`) | Vercel | Free |
| Admin (`apps/admin`) | Vercel | Free |
| API (`apps/api`, NestJS) | Railway | ~$5/mo |
| Database + image storage | Supabase | Free tier |
| Payments | Stripe (test mode) | Free |
| Emails | Resend | Free tier (100/day) |
| Domain | Cloudflare Registrar / Porkbun | ~$10/yr |

**Total: ~$5/month + ~$10/year.**

**Accounts:** Supabase ✅, Stripe ✅, GitHub ✅ already exist. You'll create **Railway**, **Vercel**, **Resend**, and buy a **domain**.

### Live URLs you'll end up with
| App | URL |
|-----|-----|
| Storefront | `https://luneatelier.com` |
| Admin | `https://admin.luneatelier.com` |
| API | `https://api.luneatelier.com/api` |
| API docs (Swagger) | `https://api.luneatelier.com/api/docs` |

---

## Phase 0 — Pre-flight (repo cleanup)

### 0.1 Confirm the secret env file is not in Git
Already verified safe, but confirm yourself:
```bash
git ls-files | grep -E '\.env'          # should show ONLY *.env.example files
git log --all --oneline -- apps/storefront/.env.local   # should print nothing
```
- If both are clean → nothing to do. `.env.local` is already gitignored.
- **If `.env.local` ever shows up as tracked**, remove it from Git history-going-forward:
  ```bash
  git rm --cached apps/storefront/.env.local
  git commit -m "chore: stop tracking storefront .env.local"
  ```
  (It's already listed in `.gitignore`, so it won't be re-added.)

> ⚠️ The InPost sandbox Geowidget token currently lives in `apps/storefront/.env.local`.
> It's a **sandbox** token (low risk) and the file isn't in Git — but on Vercel you'll set
> `NEXT_PUBLIC_INPOST_GEOWIDGET_TOKEN` as an environment variable instead (Phase 5).

### 0.2 Remove dead Przelewy24 code
The standalone Przelewy24 strategy is an **orphan** — it's never registered in `PaymentsModule`
(only `StripeStrategy` is). BLIK and Przelewy24 are still offered to customers, but **through Stripe**
(`payment_method_types: ['card', 'p24', 'blik']` in `stripe.strategy.ts`) — that stays.

Delete the dead file:
```bash
git rm apps/api/src/payments/strategies/przelewy24.strategy.ts
git commit -m "chore: remove unused Przelewy24 strategy (payments go through Stripe)"
```
✅ **Verify:** `pnpm --filter @store/api run build` still succeeds.

### 0.3 Push everything to GitHub
Railway and Vercel deploy from GitHub, so `main` must be current:
```bash
git push origin main
```

---

## Phase 1 — Database & Storage (Supabase)

You already have Supabase. We need **one production database** and **one storage bucket**.

### 1.1 Get the database connection string (Session Pooler)
1. Supabase dashboard → your project → **Project Settings → Database**.
2. Under **Connection string**, choose the **Session pooler** (also called "Session mode", host looks like
   `aws-0-<region>.pooler.supabase.com`, **port 5432**).
3. Copy it. It looks like:
   ```
   postgresql://postgres.<project-ref>:<password>@aws-0-eu-central-1.pooler.supabase.com:5432/postgres
   ```
   > **Why the Session Pooler and not the Transaction Pooler (port 6543)?**
   > Your Prisma schema uses a single `DATABASE_URL` for *both* the app and migrations.
   > The Session Pooler (5432) is IPv4-compatible **and** supports `prisma migrate deploy`.
   > The Transaction Pooler (6543) would break migrations. Use 5432.

   This becomes **`DATABASE_URL`** on Railway (Phase 4).

### 1.2 Create the storage bucket
1. Supabase dashboard → **Storage → Create bucket**.
2. Name it `product-images` (or your preferred name → this is `STORAGE_BUCKET`).
3. Set it **Public** (so product images load on the storefront without signed URLs).

### 1.3 Get S3-compatible storage credentials
Your upload code talks to Supabase Storage via its **S3 API**, so you need S3 keys:
1. Supabase dashboard → **Project Settings → Storage** → **S3 Connection** (or **Storage → Settings**).
2. Note the **endpoint region** (e.g. `eu-central-1`) → this is `STORAGE_REGION`.
3. Click **New access key** → copy the **Access key ID** and **Secret access key**.
   - `STORAGE_ACCESS_KEY_ID`
   - `STORAGE_SECRET_ACCESS_KEY`
4. Your project ref (the `<project-ref>` in the URLs, e.g. `abcdefgh`) → this is `SUPABASE_PROJECT_REF`.

> 📌 Collect these 5 storage values — you'll paste them into Railway in Phase 4:
> `SUPABASE_PROJECT_REF`, `STORAGE_REGION`, `STORAGE_BUCKET`, `STORAGE_ACCESS_KEY_ID`, `STORAGE_SECRET_ACCESS_KEY`.

✅ **Verify:** you have a `DATABASE_URL` (5432 pooler) and 5 storage values written down.

---

## Phase 2 — Stripe (test mode)

You already have a Stripe account. Stay in **Test mode** (toggle, top-right of the Stripe dashboard).

1. Stripe dashboard → **Developers → API keys**.
2. Copy the **Secret key** (`sk_test_...`) → this is `STRIPE_SECRET_KEY`.
3. **Leave the webhook for now** — you can't create it until the API has a public URL.
   You'll come back in Phase 6 to get `STRIPE_WEBHOOK_SECRET`.

✅ **Verify:** you have `STRIPE_SECRET_KEY` (starts with `sk_test_`).

---

## Phase 3 — Resend (emails)

1. Create a free account at **https://resend.com**.
2. **API Keys → Create API Key** → copy it (`re_...`) → this is `RESEND_API_KEY`.
3. **Domains → Add Domain** → enter `luneatelier.com`.
   - Resend shows DNS records (TXT/DKIM, MX). **You'll add these in Phase 6** once you own the domain.
4. Decide your sender address, e.g. `Lune Atelier <no-reply@luneatelier.com>` → this is `RESEND_FROM_EMAIL`.

> Until the domain is verified (Phase 6), you can test by setting `RESEND_FROM_EMAIL` to Resend's
> sandbox sender `onboarding@resend.dev`, then switch to your domain once verified.

✅ **Verify:** you have `RESEND_API_KEY`. (Domain verification finishes in Phase 6.)

---

## Phase 4 — Deploy the API to Railway

This is the most involved phase. The NestJS API is a pnpm-monorepo workspace, so Railway must
install from the repo root, generate the Prisma client, build, then run migrations on start.

### 4.1 Create the project
1. Create an account at **https://railway.app** (sign in with GitHub).
2. **New Project → Deploy from GitHub repo** → pick this repo.
3. Railway creates a service. Open it → **Settings**.

### 4.2 Configure build & start commands
In the service **Settings → Build / Deploy**, set:

- **Root Directory:** `/` (repo root — required so pnpm can resolve workspace packages)
- **Install Command:**
  ```
  pnpm install --frozen-lockfile
  ```
- **Build Command:**
  ```
  pnpm --filter @store/db run db:generate && pnpm --filter @store/api run build
  ```
- **Start Command:**
  ```
  pnpm --filter @store/db exec prisma migrate deploy && node apps/api/dist/main
  ```

> The start command runs **`prisma migrate deploy`** (applies your existing migrations to the
> production DB) **before** booting the server. On the first deploy this creates all your tables.

### 4.3 Set environment variables
Service → **Variables** → add these. Generate the two JWT secrets locally first:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"   # run twice
```

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | *(Supabase Session Pooler URL from 1.1)* |
| `JWT_ACCESS_SECRET` | *(generated, 1st)* |
| `JWT_REFRESH_SECRET` | *(generated, 2nd)* |
| `ALLOWED_ORIGINS` | `https://luneatelier.com,https://www.luneatelier.com,https://admin.luneatelier.com` |
| `STOREFRONT_URL` | `https://luneatelier.com` |
| `SUPABASE_PROJECT_REF` | *(from 1.3)* |
| `STORAGE_REGION` | *(from 1.3, e.g. `eu-central-1`)* |
| `STORAGE_BUCKET` | `product-images` |
| `STORAGE_ACCESS_KEY_ID` | *(from 1.3)* |
| `STORAGE_SECRET_ACCESS_KEY` | *(from 1.3)* |
| `STRIPE_SECRET_KEY` | *(from Phase 2, `sk_test_...`)* |
| `STRIPE_WEBHOOK_SECRET` | *(placeholder for now — set in Phase 6)* |
| `RESEND_API_KEY` | *(from Phase 3, `re_...`)* |
| `RESEND_FROM_EMAIL` | `Lune Atelier <no-reply@luneatelier.com>` |
| `STORE_NAME` | `Lune Atelier` |
| `STORE_EMAIL` | `kontakt@luneatelier.com` |
| `STORE_PHONE` | *(any valid PL number, e.g. `+48123456789`)* |
| `STORE_STREET` | *(demo address)* |
| `STORE_BUILDING_NUMBER` | *(demo, e.g. `1`)* |
| `STORE_CITY` | *(demo city)* |
| `STORE_POSTAL_CODE` | *(demo, e.g. `00-001`)* |

> **Do not** set `PORT` — Railway injects it automatically and the app reads `process.env.PORT`.
> **Leave unset** (the app safely skips them): `INPOST_*`, `FAKTUROWNIA_*`, `GOOGLE_*`, `P24_*`.
> See Phase 9 to enable InPost/Fakturownia later.

### 4.4 Deploy and get the public URL
1. Trigger a deploy (Railway auto-deploys on push, or click **Deploy**).
2. Watch the **Deploy logs** — you should see migrations apply, then
   `API running on http://localhost:<port>/api`.
3. Service → **Settings → Networking → Generate Domain**. Railway gives you a URL like
   `store-api-production.up.railway.app`. (We'll attach `api.luneatelier.com` in Phase 6.)

✅ **Verify:** open `https://<railway-domain>/api/docs` — the Swagger UI loads. The API is live.

---

## Phase 5 — Domain + deploy the two Next.js apps (Vercel)

### 5.1 Buy the domain
- Recommended registrars (at-cost, no upsells): **Cloudflare Registrar** or **Porkbun**.
- Buy `luneatelier.com` (or your chosen name).

### 5.2 Deploy the Storefront
1. Create an account at **https://vercel.com** (sign in with GitHub).
2. **Add New → Project** → import this repo.
3. **Configure Project:**
   - **Root Directory:** `apps/storefront`  *(click Edit → select it)*
   - Framework Preset: **Next.js** (auto-detected)
   - Vercel auto-detects pnpm + Turborepo and installs from the workspace root.
4. **Environment Variables:**
   | Variable | Value |
   |----------|-------|
   | `NEXT_PUBLIC_API_URL` | `https://api.luneatelier.com/api` |
   | `NEXT_PUBLIC_SITE_URL` | `https://luneatelier.com` |
   | `NEXT_PUBLIC_INPOST_GEOWIDGET_TOKEN` | *(optional — the sandbox token, only needed for the locker map)* |
   | `NEXT_PUBLIC_ALLOW_INDEXING` | **Leave UNSET while testing** (site stays hidden from Google). Set to `true` only at go-live. See Phase 5.5. |
5. **Deploy.**

> ⚠️ Before the first Vercel deploy, remove the temporary ngrok proxy from
> `apps/storefront/next.config.ts` — the `rewrites()` block pointing at `http://localhost:4000`
> (marked `TEMP`). It's only for local tunneling and has no purpose in production.

> Tip: you can set `NEXT_PUBLIC_API_URL` to the temporary Railway domain
> (`https://<railway-domain>/api`) to test immediately, then update it to `api.luneatelier.com`
> after Phase 6 and redeploy.

### 5.3 Deploy the Admin (second Vercel project)
1. **Add New → Project** → import the **same** repo again.
2. **Root Directory:** `apps/admin`
3. **Environment Variables:**
   | Variable | Value |
   |----------|-------|
   | `NEXT_PUBLIC_API_URL` | `https://api.luneatelier.com/api` |
4. **Deploy.**

✅ **Verify:** both Vercel projects build successfully and open on their `*.vercel.app` URLs.

---

## Phase 5.5 — Staging mode (publish privately, hidden from Google)

Use this to deploy and test the real, live shop **without** anyone finding it or Google indexing it —
before you're ready to go public on `luneatelier.com`.

### The core idea: domain ≠ deployment
These are separate. The shop can be fully deployed and reachable at a link **without** the production
domain attached. **As long as you don't connect `luneatelier.com`, nobody typing it sees the test shop.**
So: test under the `*.vercel.app` URL (or a `staging.` subdomain), attach the real domain only at go-live.

### How hiding works (already built into the code)
A single build-time flag controls search-engine visibility, with a **safe default of hidden**:

| State | `NEXT_PUBLIC_ALLOW_INDEXING` | Result |
|-------|------------------------------|--------|
| **Staging (default)** | unset (or anything ≠ `true`) | Storefront sends `noindex, nofollow` via `<meta>`, `X-Robots-Tag` header, **and** `robots.txt` `Disallow: /`. Google won't index it. |
| **Production (go-live)** | `true` | Indexing allowed; `robots.txt` exposes the sitemap. |

The **admin** app is **always** `noindex`, regardless of the flag.

> If you forget to set anything, the site stays hidden — you can't accidentally expose a buggy build.

### Workflow
1. Deploy the storefront to Vercel with `NEXT_PUBLIC_ALLOW_INDEXING` **unset**.
2. Test under the `*.vercel.app` URL. (Optional: add a `staging.luneatelier.com` subdomain instead —
   keep the apex `luneatelier.com` unattached so it shows nothing.)
3. ✅ **Verify hidden:** open `https://<your-vercel-url>/robots.txt` → must show `Disallow: /`;
   and View Source on the homepage → `<meta name="robots" content="noindex, nofollow">`.

### Going live (when ready)
1. Attach `luneatelier.com` to the production deployment (Phase 6.1).
2. Set `NEXT_PUBLIC_ALLOW_INDEXING=true` in the storefront's Vercel env → **redeploy**
   (it's a `NEXT_PUBLIC_` build-time var, so a rebuild is required).
3. Submit `https://luneatelier.com/sitemap.xml` in **Google Search Console**.

> **Want a password too (not just hidden)?** This phase only blocks indexing — the link still works for
> anyone who has it. For a shared password gate (e.g. showing a client), add HTTP Basic Auth via Next.js
> middleware, or use Vercel's built-in Deployment Protection. Not set up yet — ask when you need it.

---

## Phase 6 — Wire it all together (domains, CORS, webhook, email DNS)

Now connect the custom domains and finish the integrations that needed public URLs.

### 6.1 Point DNS at each service
At your registrar (or Cloudflare DNS if you used Cloudflare Registrar), add:

| Host | Type | Points to | For |
|------|------|-----------|-----|
| `luneatelier.com` | A / CNAME | *(value Vercel shows)* | Storefront |
| `www` | CNAME | `cname.vercel-dns.com` | Storefront (www) |
| `admin` | CNAME | `cname.vercel-dns.com` | Admin |
| `api` | CNAME | *(value Railway shows)* | API |

- **Vercel:** in each project → **Settings → Domains → Add** (`luneatelier.com` for storefront,
  `admin.luneatelier.com` for admin). Vercel shows the exact A/CNAME values to use.
- **Railway:** API service → **Settings → Networking → Custom Domain → Add** `api.luneatelier.com`.
  Railway shows the CNAME target to use.

Wait for DNS to propagate (minutes to ~1 hour) and for HTTPS certificates to issue automatically.

### 6.2 Create the Stripe webhook
1. Stripe dashboard (**Test mode**) → **Developers → Webhooks → Add endpoint**.
2. **Endpoint URL:** `https://api.luneatelier.com/api/webhooks/stripe`
3. **Events to send:** at minimum `checkout.session.completed`.
4. Create it → copy the **Signing secret** (`whsec_...`).
5. Railway → API service → **Variables** → set `STRIPE_WEBHOOK_SECRET` to that value → redeploy.

### 6.3 Finish Resend domain verification
1. Add the DNS records Resend gave you in Phase 3 (TXT/DKIM + MX) at your registrar.
2. Resend → **Domains** → click **Verify**. Once green, `RESEND_FROM_EMAIL` with your domain works.

### 6.4 Lock down CORS & API URL
- Confirm Railway `ALLOWED_ORIGINS` lists the **real** storefront + admin domains (no trailing slashes).
- Confirm both Vercel projects' `NEXT_PUBLIC_API_URL` = `https://api.luneatelier.com/api`, then
  **redeploy** both (env changes need a rebuild for `NEXT_PUBLIC_*` vars to take effect).

✅ **Verify:** `https://luneatelier.com`, `https://admin.luneatelier.com`, and
`https://api.luneatelier.com/api/docs` all load over HTTPS.

---

## Phase 7 — End-to-end smoke test

Run through the real flow on the live site:

1. **Browse:** open `https://luneatelier.com` → categories, product grid, filters, product pages load.
2. **Admin login + product:** log into `admin.luneatelier.com`, create/edit a product, **upload an image**
   → image appears (confirms Supabase Storage works).
3. **Cart → checkout:** add to cart, go to checkout, fill details.
4. **Pay (test card):** use Stripe test card `4242 4242 4242 4242`, any future expiry, any CVC.
5. **Webhook → order:** payment succeeds → order shows as **PAID** in admin
   (confirms the Stripe webhook reached the API).
6. **Email:** the order-confirmation email arrives via Resend.

If any step fails, see **Troubleshooting** below.

---

## Phase 8 — Go-live checklist

- [ ] `.env.local` not in Git (Phase 0.1) ✔ already verified
- [ ] Dead Przelewy24 file removed, build still passes
- [ ] `DATABASE_URL` uses the **Session Pooler (5432)**
- [ ] Migrations applied (tables exist in Supabase)
- [ ] JWT secrets are long random values, **different** from each other
- [ ] `ALLOWED_ORIGINS` = exact production domains, no trailing slash
- [ ] Stripe in **Test mode**, webhook points at `api.luneatelier.com`, `STRIPE_WEBHOOK_SECRET` set
- [ ] Resend domain verified; `RESEND_FROM_EMAIL` uses your domain
- [ ] Storefront + admin custom domains resolve over HTTPS
- [ ] Full smoke test (Phase 7) passes

---

## Phase 9 — Optional add-ons (enable anytime)

These safely no-op while unset. Turn them on later to demo the Polish shipping/invoicing story —
no code changes needed, just env vars on Railway.

### InPost (sandbox shipping)
1. Get a **sandbox** ShipX API token + Organization ID from InPost.
2. Railway → Variables:
   | Variable | Value |
   |----------|-------|
   | `INPOST_API_TOKEN` | *(sandbox token)* |
   | `INPOST_ORG_ID` | *(sandbox org id)* |
   | `INPOST_API_URL` | `https://sandbox-api-shipx-pl.easypack24.net` |
3. The storefront locker map needs `NEXT_PUBLIC_INPOST_GEOWIDGET_TOKEN` on Vercel (storefront).
4. After a paid PARCEL_LOCKER order, admin clicks **Generate label** on the order
   (`POST /api/admin/orders/:id/generate-label`) to create the shipment in ShipX.
   *(Auto-creation on payment exists but is intentionally disabled — a `TODO` in `order-fulfillment.listener.ts`.)*

### Fakturownia (sandbox invoicing)
1. Create a Fakturownia account → get API token + subdomain.
2. Railway → Variables:
   | Variable | Value |
   |----------|-------|
   | `FAKTUROWNIA_API_TOKEN` | *(token)* |
   | `FAKTUROWNIA_SUBDOMAIN` | *(your subdomain)* |
   | `FAKTUROWNIA_SELLER_NAME` | `Lune Atelier` |
   | `FAKTUROWNIA_SELLER_TAX_NO` | *(NIP, optional)* |
   | `FAKTUROWNIA_VAT_RATE` | `23` |
3. On the next paid order, the `order.paid` event generates a VAT invoice, stores its PDF URL,
   and attaches the PDF to the Resend confirmation email.

### Google login (optional)
Set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`
(`https://api.luneatelier.com/api/auth/google/callback`) and register that callback in Google Cloud Console.

---

## Appendix A — Environment variable reference

### API (Railway) — required for the demo
`NODE_ENV`, `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `ALLOWED_ORIGINS`,
`STOREFRONT_URL`, `SUPABASE_PROJECT_REF`, `STORAGE_REGION`, `STORAGE_BUCKET`,
`STORAGE_ACCESS_KEY_ID`, `STORAGE_SECRET_ACCESS_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
`RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `STORE_NAME`, `STORE_EMAIL`, `STORE_PHONE`, `STORE_STREET`,
`STORE_BUILDING_NUMBER`, `STORE_CITY`, `STORE_POSTAL_CODE`

### API (Railway) — optional (Phase 9)
`INPOST_API_TOKEN`, `INPOST_ORG_ID`, `INPOST_API_URL`,
`FAKTUROWNIA_API_TOKEN`, `FAKTUROWNIA_SUBDOMAIN`, `FAKTUROWNIA_SELLER_NAME`,
`FAKTUROWNIA_SELLER_TAX_NO`, `FAKTUROWNIA_VAT_RATE`,
`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`

### Storefront (Vercel)
`NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_INPOST_GEOWIDGET_TOKEN` *(optional)*,
`NEXT_PUBLIC_ALLOW_INDEXING` *(set `true` only at go-live — see Phase 5.5; unset = hidden from Google)*

### Admin (Vercel)
`NEXT_PUBLIC_API_URL`

---

## Appendix B — Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Railway deploy fails at migrate with a TLS/connection error | Using Transaction Pooler (6543) or direct IPv6 host | Switch `DATABASE_URL` to the **Session Pooler** (5432) |
| Build fails: `@store/db` not found | Root Directory wrong on Railway | Set Root Directory to `/` (repo root) |
| Storefront loads but data calls fail (CORS error in console) | `ALLOWED_ORIGINS` missing the domain, or trailing slash | Fix `ALLOWED_ORIGINS` on Railway, redeploy |
| Frontend still hits localhost / old API | `NEXT_PUBLIC_API_URL` changed but not rebuilt | Redeploy the Vercel project (NEXT_PUBLIC vars bake in at build) |
| Payment succeeds but order stays unpaid | Webhook not configured or wrong secret | Check webhook URL `…/api/webhooks/stripe` + `STRIPE_WEBHOOK_SECRET` |
| Image upload fails in admin | Wrong storage keys / bucket not public | Re-check the 5 `STORAGE_*`/`SUPABASE_PROJECT_REF` values; bucket public |
| Emails don't arrive | Resend domain not verified | Verify domain, or temporarily use `onboarding@resend.dev` as sender |

---

## Appendix C — Redeploying after code changes

- **Storefront / Admin:** `git push` → Vercel auto-deploys.
- **API:** `git push` → Railway auto-deploys (and runs `prisma migrate deploy` on start, so new
  migrations apply automatically).
- **New env var:** add it in Railway/Vercel → redeploy that service.
