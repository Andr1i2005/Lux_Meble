# Firebase setup — Google Auth + Realtime Database + Storage

The store works without Firebase (guest mode → orders in `localStorage`). To enable
real accounts, realtime order tracking and Storage-hosted assets, connect a Firebase
project.

## 1. Create the project

1. Go to <https://console.firebase.google.com> → **Add project**.
2. **Build → Authentication → Get started → Google → Enable** (set a support email).
3. **Build → Realtime Database → Create database** (any region; start locked).
4. **Build → Storage → Get started** (needed for furniture assets).

## 2. Add a web app & env vars

1. Project settings (⚙) → **Your apps → Web (`</>`)** → register an app.
2. Copy the config into `.env.local` (see `.env.local.example`):

   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=...
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
   NEXT_PUBLIC_FIREBASE_APP_ID=...
   NEXT_PUBLIC_FIREBASE_DATABASE_URL=...   # from the Realtime Database page
   ```

   Grab `DATABASE_URL` from the Realtime Database page — it shows the region-specific
   host (e.g. `https://<project>-default-rtdb.europe-west1.firebasedatabase.app`).
   If omitted, the app assumes the US default (`…-default-rtdb.firebaseio.com`).

3. Restart `npm run dev`. The header now shows a **sign-in** control and checkout
   requires an account.

## 3. Security rules

### Realtime Database → Rules

```json
{
  "rules": {
    "orders": {
      "$uid": {
        ".read": "auth != null && auth.uid === $uid",
        ".write": "auth != null && auth.uid === $uid"
      }
    },
    "catalog": {
      ".read": true,
      ".write": false
    }
  }
}
```

Every user can read and write **only their own** orders (`orders/{uid}/…`). The
`catalog` node (products + configurator options) is **public-read** and written
only server-side by the Admin SDK (the seed route / a future admin panel), so
client tampering is impossible.

### Storage → Rules (public read, no client writes)

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if true;      // product images / models are public
      allow write: if false;    // uploads happen via the admin script only
    }
  }
}
```

## 4. Upload assets to Storage

```bash
node scripts/upload-assets.mjs        # mirrors public/{products,thumbnails,models}
```

The script writes with the web SDK, so temporarily relax the Storage write rule
(`allow write: if true;`) while it runs, then restore `allow write: if false;`.
Alternatively upload with the CLI: `gsutil -m cp -r public/products gs://<bucket>/products`.

Then set `NEXT_PUBLIC_ASSETS_FROM_STORAGE=1` in `.env.local` and restart. Product
images and 3D models are now served from Storage; leave it `0` to serve from `/public`.

> Cross-origin `.glb` loads need CORS on the bucket:
> `gsutil cors set cors.json gs://<bucket>` with
> `[{"origin":["*"],"method":["GET"],"maxAgeSeconds":3600}]`.

## 5. Seed the catalog into the database

The catalog (products + configurator options) is served from RTDB `catalog/*`
(`lib/catalog.ts`), with the static arrays as the offline fallback. Seed the
database once from the built-in data:

1. Set up the service account (step 6) and add `ADMIN_SEED_SECRET=<any-secret>`.
2. Run:

   ```bash
   curl -X POST http://localhost:3000/api/admin/seed -H "x-seed-key: <secret>"
   ```

This writes `catalog/products` (keyed by slug), `catalog/fabrics`, `catalog/legs`,
`catalog/extras`, `catalog/modules` and `catalog/categoryLabels`. Re-run it any
time to reset the catalog to the built-in data. After seeding, all product/option
reads come from Firebase; edit content there (or via a future admin panel) and it
appears on the site (60s cache). If the database is empty or unreachable, the site
falls back to the static catalog so it never breaks.

## 6. Server (Admin SDK) order layer — optional

By default orders are written to RTDB directly from the client, guarded by the
Security Rules above. For trusted, server-validated writes (price/total checks,
authoritative status transitions), route them through the Admin SDK instead:

1. **Project settings → Service accounts → Generate new private key.**
2. Add to `.env.local` (server-only — never `NEXT_PUBLIC`):

   ```
   NEXT_PUBLIC_USE_SERVER_ORDERS=1
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-…@<project>.iam.gserviceaccount.com
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n…\n-----END PRIVATE KEY-----\n"
   ```

Now `POST /api/orders` verifies the caller's ID token, revalidates the cart with
`lib/order-validation.ts`, stamps the order and writes it with `lib/firebase-admin.ts`;
`PATCH /api/orders/[id]` drives shipment status. The client (`lib/use-orders.ts`)
switches to these routes automatically; realtime reads are unchanged. Without the
service account the routes return 503 and the app falls back to client writes.

## 7. Admin panel — `/admin`

A password-less admin panel (Google sign-in) to manage the catalog. Requires the
service account (step 6) since all writes go through the Admin SDK.

1. Add allowed admin emails to `.env.local`:

   ```
   ADMIN_EMAILS=you@example.com,teammate@example.com
   ```

2. Publish **Storage** rules (public read, Admin-SDK-only write) so uploaded
   product images are viewable:

   ```bash
   node scripts/deploy-storage-rules.mjs /path/to/serviceAccount.json
   ```

3. Open <http://localhost:3000/admin>, sign in with an allowed Google account.

The panel lists all products and lets you **create, edit and delete** them plus
upload images. Endpoints (all admin-only, verified against `ADMIN_EMAILS`):
`GET/POST /api/admin/products`, `DELETE /api/admin/products/[slug]`,
`POST /api/admin/upload` (image → Storage), `GET /api/admin/session`. Edits merge
over the existing record, so fields not in the form (e.g. `variants`) are kept.
`/admin` is outside the `[locale]` routing and is not indexed.

## How it works

- **Auth** — `components/store/AuthProvider.tsx` exposes `useAuth()` with
  `signInWithGoogle()` (primary) plus email/password. `/account` and the checkout
  wall host the shared `<AuthForm>`.
- **Sign-up wall** — `components/store/CheckoutClient.tsx` renders `<AuthWall>`
  instead of the order form when Firebase is enabled and no user is signed in, so
  an account is required to place an order.
- **Data** — `lib/use-orders.ts` is the single access point:
  - signed in + Firebase configured → orders live under `orders/{uid}` in the
    Realtime Database and stream via `onValue`;
  - otherwise → the persisted `localStorage` store (guest mode), unchanged.
- **Assets** — `lib/asset-url.ts` maps local `/public` paths to Storage download
  URLs when `NEXT_PUBLIC_ASSETS_FROM_STORAGE=1`, else returns the local path.
- **Realtime tracking** — the order record stores `createdAt` (ms). The tracking
  page derives the stage from elapsed time (`lib/order-tracking.ts`). The demo
  **Advance / Reset** buttons `update` that field, so the change propagates to
  every open tab/device instantly.
