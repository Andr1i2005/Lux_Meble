# LuxMeble — Live Furniture Configurator & Store

LuxMeble is a made‑to‑order furniture e‑commerce concept built around a **real‑time
3D configurator**. A customer opens a product, tailors the fabric, frame colour,
size, legs and extras, watches the piece update live in 3D, adds it to a cart,
checks out, and then tracks the order from the atelier to their door — in **three
languages** and **three currencies**. A password‑less **admin panel** lets the
shop owner manage the catalogue and images without touching code.

The whole thing runs on **Next.js (App Router) + TypeScript** on the front end and
**Firebase** (Auth, Realtime Database, Storage) on the back end, with a thin
trusted server layer (Route Handlers + Firebase Admin SDK) for anything that must
not be trusted to the client.

> This is a portfolio / coursework project. The README is written to double as
> defence material: it explains not just _what_ was built, but _why_ each
> architectural decision was made and what the trade‑offs are. It is
> self‑contained — everything you need is in this file.

---

## Table of contents

1. [Product overview](#1-product-overview)
2. [Feature list](#2-feature-list)
3. [Technology stack](#3-technology-stack)
4. [High‑level architecture](#4-high-level-architecture)
5. [The 3D configurator](#5-the-3d-configurator)
6. [Data model & the catalogue pipeline](#6-data-model--the-catalogue-pipeline)
7. [Firebase infrastructure & security](#7-firebase-infrastructure--security)
8. [Orders & realtime tracking](#8-orders--realtime-tracking)
9. [Admin panel](#9-admin-panel)
10. [Internationalisation & currency](#10-internationalisation--currency)
11. [Project structure](#11-project-structure)
12. [Getting started](#12-getting-started)
13. [Scripts reference](#13-scripts-reference)
14. [Key engineering decisions (defence notes)](#14-key-engineering-decisions-defence-notes)
15. [Possible future work](#15-possible-future-work)

---

## 1. Product overview

**The problem.** Mass‑produced furniture fills warehouses and then landfills, and
buying online is a leap of faith — you can't tell how a sofa will actually look in
your fabric, your size, your room.

**The idea.** Flip the model: let the customer _design_ the exact piece first, see
it live in 3D, and only then build it to order. Less waste, higher confidence, a
more premium buying experience.

**The user journey the app implements end‑to‑end:**

```
Landing → Catalogue → Product page → 3D Configurator → Cart →
Sign in (Google) → Checkout → Order confirmation → Realtime order tracking
```

Two audiences are served:

- **Customers** — browse, configure, buy, track (public site, i18n + currency).
- **The shop owner (admin)** — add / edit / delete products, upload images,
  manage translations (`/admin`, restricted to allow‑listed accounts).

---

## 2. Feature list

**Storefront**

- Landing page with hero, value props, "Shop the look" interactive hotspots,
  featured pieces and **New arrivals** (sorted by real creation date).
- Catalogue with category filters, sorting (featured / price), animated grid.
- Product detail page with gallery, dimensions, price and CTA.
- **Real‑time 3D configurator** (fabric, frame colour, size/variant, legs,
  extras, dimension overlay) with a live price that animates as you change options.
- Cart drawer with quantity steppers and a persistent cart.
- Checkout with contact / shipping / (demo) payment, a **sticky mobile CTA bar**,
  and an order confirmation screen.

**Accounts & orders**

- **Google sign‑in** (Firebase Auth).
- **Sign‑up wall** — an account is required to place and view orders.
- Orders stored per user in the Realtime Database.
- **Realtime order tracking** — an 8‑stage shipment timeline that updates live
  across tabs/devices; a "fulfilment" control advances the stage.

**Internationalisation & money**

- Full **EN / PL / UA** localisation (UI _and_ product content) with locale‑prefixed
  routes and a language switcher.
- **EUR / PLN / UAH** currency switcher; prices are stored in EUR and converted
  on the client, preference persisted.

**Admin**

- `/admin` panel (Google‑gated, allow‑list): list, create, edit, delete products.
- Image upload to Storage with a **Storage autocomplete** (type a path → matching
  images with previews).
- Per‑product **PL/UA translation** fields (required), live image previews with
  graceful placeholders, deep‑linkable edit URLs (`/admin?edit=<slug>`).

**Cross‑cutting**

- Mobile‑first responsive design, Framer Motion animations, accessible controls.
- SSG/ISR for public pages, realtime subscriptions where it matters.

---

## 3. Technology stack

| Layer          | Choice                                          | Why                                                                                              |
| -------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Framework      | **Next.js 16 (App Router)**                     | Server Components + Route Handlers in one codebase; SSG/ISR for fast, SEO‑friendly public pages. |
| Language       | **TypeScript**                                  | Type safety across the domain model, API contracts and stores.                                   |
| 3D             | **React Three Fiber + drei + three.js**         | Declarative 3D inside React; GLTF loading, orbit controls, lighting.                             |
| UI             | **Tailwind CSS v4** (+ HeroUI available)        | Utility‑first styling, consistent design system, fast iteration.                                 |
| Animation      | **Framer Motion**                               | Page/element transitions, layout animations, the animated price.                                 |
| State          | **Zustand**                                     | Tiny, hook‑based global stores with `persist` (cart, configurator, currency).                    |
| Numbers        | **@number-flow/react**                          | Smoothly animated price digits in the configurator.                                              |
| Backend        | **Firebase** — Auth, Realtime Database, Storage | Managed auth, realtime data and asset hosting with security rules.                               |
| Trusted server | **Firebase Admin SDK** in Next Route Handlers   | Privileged writes (admin, server order validation) behind token checks.                          |
| i18n           | **next-intl v4**                                | Message catalogues, locale routing, server + client translations.                                |
| Asset pipeline | **gltf-transform**, three.js                    | Converting / cleaning GLB models.                                                                |

---

## 4. High‑level architecture

```
                    ┌─────────────────────────── Browser ───────────────────────────┐
                    │  Next.js App Router (RSC + Client Components)                   │
                    │                                                                 │
   Public pages ───▶│  Server Components  ──(read)──▶  lib/catalog.ts ──REST──▶ RTDB │
   (SSG / ISR)      │        │                                     (catalog/*)       │
                    │        ▼                                                        │
                    │  Client islands: configurator (R3F), cart, auth, i18n,         │
                    │  currency, realtime order subscriptions (onValue)              │
                    └───────────────┬───────────────────────────────┬────────────────┘
                                    │ ID token (Bearer)              │ Web SDK
                                    ▼                                ▼
             ┌──────────────── Next Route Handlers ──────────┐   ┌──────── Firebase ────────┐
             │  /api/orders         (server-validated writes) │   │  Auth (Google)           │
             │  /api/admin/*        (admin-only, allow-list)  │──▶│  Realtime Database        │
             │  Firebase Admin SDK (service account)          │   │  Storage (images/models) │
             └────────────────────────────────────────────────┘   └───────────────────────────┘
```

**Guiding principles**

- **Server Components read; client islands interact.** Catalogue pages render on
  the server (fast, cacheable). Interactivity (3D, cart, auth, realtime) lives in
  small `"use client"` islands.
- **The client never holds privileged power.** Anything trust‑sensitive (admin
  writes, authoritative order creation) goes through a Route Handler that verifies
  a Firebase ID token with the Admin SDK. Security Rules are the second line of
  defence.
- **Graceful degradation.** If Firebase env is absent the site still renders the
  built‑in catalogue (static fallback); if the database is unreachable, reads fall
  back to the bundled data.

---

## 5. The 3D configurator

The centrepiece, built with React Three Fiber.

```
FurniturePreview            ← canvas, loader, fade-in, reads store
  └─ Scene3D                ← camera, single lighting rig, orbit (vertical lock), shadow floor
       ├─ SofaGLTF/KivikGLTF ← real GLB models with a custom two-zone colour shader
       └─ procedural         ← RoundedBox sofa/armchair primitives (no model needed)
```

- **Two model types.** `gltf` products load a real `.glb`; `procedural` products
  are built from three.js primitives. `modelPath` present ⇒ GLTF.
- **State** lives in `store/configurator-store.ts` (Zustand): selected fabric,
  frame colour, module/variant, legs, extras, dimensions toggle. Options
  (fabrics/legs/modules) are passed in as props from the server (Firebase‑backed)
  with a static default.
- **Live price** recomputes from the selection and animates with NumberFlow, in the
  active currency.
- **One lighting rig** is used for both procedural and GLTF models — splitting them
  produced dark/broken results.

### 5.1 The two‑zone colour shader (the hard part)

A single‑mesh GLB has **one material for the whole model**, so you can't recolour
"fabric" separately from "leather frame" out of the box. Approaches that **did not
work**: using the baseColor texture as a mask (baked texture is too dark → near
black); luminance‑as‑mask (too low contrast); adding `sheen`/`clearcoat` (blown
highlights).

**What works:** use the model's **roughness map (G‑channel of the ORM texture) as a
spatial mask** between two user‑controlled colours. The model is authored so that
fabric zones are high‑roughness (0.6–1.0) and frame/leather zones are low (0.0–0.5).
GLSL is injected via `onBeforeCompile`, right after `#include <roughnessmap_fragment>`
(the point where both `roughnessFactor` and `diffuseColor` are defined):

```glsl
#include <roughnessmap_fragment>
// roughnessFactor == raw ORM-map value (material roughness is set to 1.0)
float zoneMask = smoothstep(0.45, 0.70, roughnessFactor);
diffuseColor.rgb = mix(uFrame, uFabric, zoneMask);
```

The two colours are shader **uniforms mutated in place** on change — so changing a
colour is instant and does **not** trigger a shader recompile:

```tsx
useEffect(() => {
  uFabric.current.value.set(fabricColor);
}, [fabricColor]);
useEffect(() => {
  uFrame.current.value.set(frameColor);
}, [frameColor]);
```

`customProgramCacheKey` is set on the material so Three.js doesn't collide the
custom program with its cache. Threshold `smoothstep(0.45, 0.70, …)` is calibrated
per model (raise the lower bound → more surface reads as "fabric").

### 5.2 GLB asset pipeline & pitfalls

The IKEA‑style models are Draco‑compressed GLTF; they're converted to clean GLB with
`gltf-transform` (see `scripts/convert-kivik-to-glb.mjs`). Two traps worth knowing:

- **Node‑scale trap.** GLTF nodes often bake a `scale: [0.001, …]` (geometry stored
  in mm, world in metres). If you _also_ add `scale={0.001}` to `<primitive>`, the
  model shrinks to 1e‑6 and vanishes. Check node transforms first; render with no
  extra scale when the node already carries `0.001`.
- **Draco `COLOR_0` mismatch.** Draco sometimes decodes `COLOR_0` with a different
  vertex count than `POSITION`, causing `glDrawElements` buffer errors and an
  invisible mesh. Fix it at **conversion time** by stripping `COLOR_0` from every
  primitive before writing the GLB (not at runtime — the WebGL buffer is already
  uploaded with the wrong stride).

---

## 6. Data model & the catalogue pipeline

**Products are data, not code.** The catalogue lives in the Realtime Database at
`catalog/*`, so it can be edited from the admin panel without a deploy.

```
catalog/
  products/{slug}   → ProductConfig  (name, subtitle, category, price, dimensions,
                                      accentColor, photo, thumbnail, createdAt,
                                      translations{pl,uk}, variants, …)
  fabrics[]  legs[]  extras[]  modules[]  categoryLabels
```

**Read path — `lib/catalog.ts`:** `getProducts()` / `getProduct(slug)` fetch from
RTDB over the REST API (works in Server Components and at build time; cached with
`revalidate: 60`). They **overlay per‑locale content** (subtitle / category /
description) for the active locale and **fall back to the static catalogue**
(`lib/product-catalog.ts`) if the DB is empty or unreachable.

**Two sources of truth, one winner.** Static arrays in `lib/product-catalog.ts` /
`lib/furniture-data.ts` are the **seed** and the **offline fallback**; the database
is the **runtime source of truth**. This gives resilience (site never breaks) plus
editability (admin controls live content).

**Image resolution — `lib/asset-url.ts`:** images always resolve to public Storage
URLs (uploaded images live only there; `<img>` loads them cross‑origin without
CORS), while 3D models stay local to keep the configurator loading exactly as
before.

**Card vs. hero image.** `productImage()` prefers `thumbnail` for cards/lists (small
preview), while the product detail hero prefers the full `photo`.

---

## 7. Firebase infrastructure & security

| Concern            | Service               | Notes                                                                             |
| ------------------ | --------------------- | --------------------------------------------------------------------------------- |
| Accounts           | **Auth** (Google)     | Sign‑in only; drives order ownership and admin gating.                            |
| Catalogue + orders | **Realtime Database** | `catalog/*` (public read, server‑only write), `orders/{uid}/*` (owner‑only).      |
| Images & models    | **Storage**           | Public read, admin‑SDK‑only write; mirrors the `/public` layout.                  |
| Privileged ops     | **Admin SDK**         | In Route Handlers; verifies ID tokens; used for admin CRUD and server order flow. |

### Two‑layer security model

1. **Route Handlers** verify the caller's Firebase **ID token** with the Admin SDK
   (and, for admin, that the email is in `ADMIN_EMAILS`) before any privileged write.
2. **Security Rules** enforce the same invariants at the database/storage level, so
   even a direct client write can't break them.

**Realtime Database rules** — every user reads/writes only their own orders; the
catalogue is world‑readable but only writable by the Admin SDK (which bypasses rules):

```json
{
  "rules": {
    "orders": {
      "$uid": {
        ".read": "auth != null && auth.uid === $uid",
        ".write": "auth != null && auth.uid === $uid"
      }
    },
    "catalog": { ".read": true, ".write": false }
  }
}
```

**Storage rules** — assets are public to read, never client‑writable (uploads go
through the admin API using the Admin SDK):

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if true;
      allow write: if false;
    }
  }
}
```

Both rule sets can be published from a service account with
`scripts/deploy-rtdb-rules.mjs` and `scripts/deploy-storage-rules.mjs`.

---

## 8. Orders & realtime tracking

- **Placement.** On checkout the order is written to `orders/{uid}/{orderId}`.
  There is **no guest/localStorage order path** — placing or viewing an order
  requires sign‑in (the sign‑up wall). An optional trusted mode routes writes
  through `POST /api/orders`, where the server re‑validates the cart (prices, total)
  with the Admin SDK before writing.
- **Tracking.** An order carries a persisted `stageIndex` (0–7) plus
  `stageTimestamps`. `lib/order-tracking.ts` derives the timeline, ETA and progress
  from it. A "fulfilment" control advances the stage; because reads use RTDB
  `onValue`, the change **propagates live** to every open tab/device.
- **Access is realtime.** `lib/use-orders.ts` is the single access point:
  `useOrders()` / `useOrder(id)` subscribe via `onValue`; `useOrderActions()`
  handles create / advance / reset (client‑direct or via the server route).

The 8 stages: `placed → confirmed → in production → quality check → shipped → in
transit → out for delivery → delivered`.

---

## 9. Admin panel

`/admin` — an English‑only, non‑indexed panel outside the localised routing (it
renders its own `<html>` and is excluded from the i18n middleware).

- **Access:** Google sign‑in; the server authoritatively checks the caller's email
  against `ADMIN_EMAILS`. Non‑admins are **redirected home** (and the API rejects
  them independently — the redirect is UX, not the security boundary).
- **CRUD:** list, create, edit (`POST /api/admin/products`), delete
  (`DELETE /api/admin/products/[slug]`). Edits **merge** over the existing record,
  so fields not in the form (e.g. `variants`) survive.
- **Images:** upload to Storage (`POST /api/admin/upload`) returning a tidy
  `/products/x.jpg` path; a **Storage autocomplete** (`GET /api/admin/storage?q=`)
  suggests existing images with previews.
- **Content:** required PL/UA translations, live previews with placeholder
  fallback, deep‑linkable edit state in the URL, and a "View page" link.

---

## 10. Internationalisation & currency

- **i18n (next-intl v4).** Locales `en` (default, `/`), `pl` (`/pl`), `uk` (`/uk`)
  with `localePrefix: "as-needed"`. Routes live under `app/[locale]/`; a middleware
  handles negotiation; messages are in `messages/{en,pl,uk}.json`. UI strings _and_
  product content (via a translations overlay) are localised; dates format per
  locale. Use the locale‑aware `Link`/`useRouter` from `i18n/navigation`.
- **Currency.** `store/currency-store.ts` holds the selected currency (EUR/PLN/UAH,
  persisted). Prices are stored in EUR and converted client‑side; the `<Price>`
  component is hydration‑guarded (renders EUR on the server / first paint, then the
  selected currency) to avoid hydration mismatch. Both selectors live in one header
  popover.

---

## 11. Project structure

```
app/
  [locale]/            # localised public pages (home, catalog, product,
                       #   configurator, checkout, orders, account, about)
  admin/               # admin panel (own <html>, outside i18n)
  api/
    orders/            # server order create + status (Admin SDK)
    admin/             # products CRUD, upload, storage search, session, seed
  layout.tsx           # pass-through root layout
components/
  ConfiguratorPage.tsx # configurator UI shell
  preview/             # R3F scene, GLTF/procedural models, shaders, loaders
  configurator/        # option pickers (module thumbnails …)
  store/               # storefront UI (header, cart, product, checkout, orders,
                       #   auth, Price, LanguageSwitcher, …)
  admin/               # AdminClient + ProductForm
lib/
  catalog.ts           # DB-backed catalogue reads (+ static fallback, i18n overlay)
  product-catalog.ts   # static seed + ProductConfig type + productImage()
  furniture-data.ts    # fabrics / legs / extras / modules + pricing
  product-translations.ts  # PL/UA content overlay (seed)
  firebase.ts          # client SDK (Auth/RTDB/Storage)
  firebase-admin.ts    # server Admin SDK (service account)
  api-auth.ts          # ID-token + admin allow-list verification
  use-orders.ts        # realtime orders access
  order-tracking.ts    # stage model (timeline, ETA, progress)
  order-validation.ts  # server-side cart/order validation
  asset-url.ts         # image → Storage URL resolution
  format.ts            # locale-aware date/number formatting
store/                 # Zustand: cart, configurator, currency
i18n/                  # next-intl routing / navigation / request config
messages/              # en.json / pl.json / uk.json
scripts/               # seeding, rules, CORS, migrations, asset pipeline
```

---

## 12. Getting started

### Prerequisites

- Node.js 20+ and npm
- (Optional but recommended) a Firebase project for the full experience

### Run locally

```bash
npm install
cp .env.local.example .env.local   # fill in Firebase web config (optional)
npm run dev                        # http://localhost:3000
```

Without Firebase env the site runs on the **built‑in static catalogue**; sign‑in,
orders and the admin panel are unavailable but the storefront and configurator work.

### Enable the full backend

1. **Create the project.** In the Firebase console, add a project and enable:
   **Authentication → Google**, **Realtime Database**, **Storage**.

2. **Web config → `.env.local`.** Copy the web app config into `.env.local`
   (see `.env.local.example`):

   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=…
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=…
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=…
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=…
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=…
   NEXT_PUBLIC_FIREBASE_APP_ID=…
   NEXT_PUBLIC_FIREBASE_DATABASE_URL=…      # region-specific RTDB URL
   ```

3. **Service account (server layer & admin).** Project settings → Service accounts →
   _Generate new private key_, then add to `.env.local` (these are **server‑only**,
   never `NEXT_PUBLIC`):

   ```
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-…@<project>.iam.gserviceaccount.com
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n…\n-----END PRIVATE KEY-----\n"
   ADMIN_EMAILS=you@example.com,teammate@example.com
   ADMIN_SEED_SECRET=<any-secret>           # optional, for POST /api/admin/seed
   ```

4. **Publish Security Rules** (§7) and **seed** the catalogue + assets:

   ```bash
   node scripts/deploy-rtdb-rules.mjs    <serviceAccount.json>
   node scripts/deploy-storage-rules.mjs <serviceAccount.json>
   node scripts/set-storage-cors.mjs     <serviceAccount.json>   # for cross-origin GLB
   node scripts/seed-firebase.mjs        <serviceAccount.json>   # catalogue + assets
   ```

5. **Open** `http://localhost:3000` (storefront) and `http://localhost:3000/admin`
   (sign in with an `ADMIN_EMAILS` account).

### Build

```bash
npm run build && npm run start
npm run lint
```

---

## 13. Key engineering decisions (defence notes)

These are the decisions most worth being able to explain and defend.

1. **RSC for reads, client islands for interaction.** Public pages are Server
   Components (fast first paint, cacheable, SEO). Only genuinely interactive parts
   (3D, cart, auth, realtime) opt into the client. Keeps JS shipped to the browser
   small and the data path simple.

2. **Catalogue in the database, with a static fallback.** Moving products to RTDB
   makes them editable without a deploy (enabling the admin panel) while the static
   arrays guarantee the site never breaks if the DB is empty/unreachable. The
   resolver merges translations on top per locale.

3. **Trusted server layer over "just Security Rules".** Security Rules alone can't
   re‑price a cart or check an admin allow‑list reliably. Route Handlers verify the
   Firebase ID token with the Admin SDK first; Rules enforce the same invariants as
   a second layer. Defence in depth.

4. **No guest orders.** Orders are private, per‑user data. Removing the
   localStorage path removed a class of "which copy is the truth" bugs and made the
   sign‑up wall the single, clear gate.

5. **Persisted order status instead of time‑derived.** Tracking started as
   "derive stage from elapsed time". It now stores an explicit `stageIndex` +
   timestamps, which is closer to real fulfilment, controllable, and still updates
   live via `onValue`. Backwards‑compatible: legacy orders fall back to the
   time‑derived model.

6. **Images from Storage, models local.** `<img>` loads cross‑origin without CORS,
   so product images (including admin uploads that exist only in Storage) resolve
   to public Storage URLs everywhere. 3D models keep loading locally to avoid CORS
   nuances in the GLTF loader and keep the configurator's behaviour unchanged.

7. **EUR as the money source of truth.** Storing one currency and converting on the
   client keeps the data model simple and consistent; the `<Price>` component is
   hydration‑guarded to avoid SSR/CSR mismatch.

8. **URL as UI source of truth in admin.** The editor state lives in the URL
   (`?edit=<slug>` / `?new=1`), so refresh, deep links and browser back/forward all
   work — reconciled during render (React's "adjust state on input change" pattern).

9. **The two‑zone shader.** Recolouring two regions of a single‑mesh GLB without
   editing geometry — solved with a roughness‑map mask and in‑place uniform
   mutation (no recompile per colour), after several approaches that produced black
   or blown‑out results.
