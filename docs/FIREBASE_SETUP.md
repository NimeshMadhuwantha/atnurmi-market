# Firebase setup for Atnurmi Marketplace

This guide connects `market.atnurmi.com` to Firebase Authentication, Cloud Firestore, and Cloud Storage. Complete the sections in order.

## 1. Create the Firebase project

1. Open [Firebase Console](https://console.firebase.google.com/).
2. Select **Create a project** and use a project ID such as `atnurmi-market`.
3. Google Analytics is optional.
4. Open **Project settings → General → Your apps**, select the Web icon, and register `Atnurmi Marketplace`.
5. Do not enable Firebase Hosting; this project deploys through Netlify.

Copy the Web configuration into the root `.env.local` file:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=atnurmi-market.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=atnurmi-market
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=atnurmi-market.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

These public identifiers are not administrator secrets. Firestore and Storage Rules provide authorization.

## 2. Configure Authentication

1. Open **Build → Authentication → Get started → Sign-in method**.
2. Enable **Google** for collectors.
3. Enable **Email/Password** for approved artists.
4. Open **Authentication → Settings → Authorized domains** and add `localhost`, the Netlify preview domain, and `market.atnurmi.com`.
5. Set the public-facing support email.

Install the official browser SDK when the npm registry is reachable:

```bash
npm install firebase
```

Public seller listings currently load through `src/lib/firestore-rest.ts`. The SDK is needed for Google popup authentication and ID tokens used by protected seller writes.

## 3. Create Firestore

1. Open **Build → Firestore Database → Create database**.
2. Choose **Production mode**.
3. Select the nearest practical region; it cannot be changed later.
4. Do not loosen the generated rules.

Use these collections:

| Collection | Document ID | Purpose |
| --- | --- | --- |
| `users` | Auth UID | Customer profile, address, phones and role |
| `artists` | Artist Auth UID | Public artist profile, ratings, limits and blocked state |
| `artworks` | Auto ID | Seller-created marketplace listings |
| `orders` | Auto ID | Buyer, seller, totals, items and controlled order status |
| `artistApplications` | Auto ID | Approval form with a 30-day expiry |
| `feedback` | Auto ID | Buyer ratings awaiting moderation |
| `counters` | Named documents | Pre-aggregated dashboard totals to reduce reads |

### Required `artworks` fields

```text
artistId string, artistName string, name string, description string
category string, size string, medium string, materials string
price number, deliveryCharge number, deliveryLabel string
deliveryOptions array<string>, imageUrls array<string>, note string
status string (pending | published | hidden | sold)
rating number, reviewCount number, createdAt timestamp, updatedAt timestamp
```

Only `status == "published"` documents appear publicly.

### Suggested `orders` fields

```text
buyerId, artistId, artworkId, artworkSnapshot
subtotal, deliveryCharge, total, deliveryAddressSnapshot
status (pending | confirmed | processing | dispatched | delivered | received | cancelled)
statusHistory, createdAt, updatedAt
```

Store artwork, price, artist, and address snapshots so historical orders do not change after profile or listing edits.

## 4. Deploy rules and indexes

The repository contains `firebase/firestore.rules`, `firebase/firestore.indexes.json`, `firebase/storage.rules`, and `firebase.json`.

```bash
npm install -g firebase-tools
firebase login
firebase use --add
firebase deploy --only firestore:rules,firestore:indexes,storage
```

Choose your new project when `firebase use --add` asks. Never replace the included rules with public read/write rules.

## 5. Configure Storage

1. Open **Build → Storage → Get started**.
2. Use the same region as Firestore where possible.
3. Deploy the included Storage Rules.

Expected paths:

```text
profiles/{uid}/{generated-name}.webp
artworks/{artistUid}/{artworkId}/{generated-name}.webp
```

`src/lib/image-optimizer.ts` rejects inputs over 1 MB, converts them to WebP, limits dimensions, and targets less than 200 KB. Storage Rules independently enforce MIME type, ownership, and size.

## 6. Configure roles safely

Use Firebase custom claims. Never trust roles supplied by the browser.

Artist claim: `{ "role": "artist" }`

Administrator claim: `{ "admin": true }`

Set claims only through a trusted Admin SDK script, Cloud Function, or protected administration backend. The user must refresh their ID token or sign in again after claims change. Production admin operations must verify the `admin` claim in addition to the temporary `/NurAdm` interface session.

## 7. Enable 30-day application expiry

Write `createdAt`, `expiresAt` (`createdAt + 30 days`), and `status` to every `artistApplications` document. In **Firestore → Time-to-live**, create a TTL policy for collection group `artistApplications` using `expiresAt`.

## 8. Enable App Check

1. Open **Build → App Check**.
2. Register the web app with reCAPTCHA Enterprise.
3. Add its site key to Netlify environment variables.
4. Monitor valid traffic before enforcement.
5. Enforce App Check for Firestore, Storage, and Authentication.

## 9. Configure Netlify

1. Open **Netlify → Site configuration → Environment variables**.
2. Add every value from `.env.example`.
3. Replace the local admin password and use a long random `ADMIN_SESSION_SECRET`.
4. Deploy; `netlify.toml` already defines the build.
5. Attach `market.atnurmi.com` in Netlify domain settings.
6. Add the final domain to Firebase Authentication authorized domains.

## 10. Minimize reads and writes

- Home and Explore request only the newest 20 published artworks.
- Paginate Explore; do not listen to the full collection.
- Avoid realtime listeners for catalog content that changes infrequently.
- Keep totals in `counters` documents and update them transactionally.
- Denormalize artist name and approved rating onto artwork documents.
- Use batched writes when feedback approval updates rating aggregates.
- Keep cart and recently viewed state in the browser until checkout.
- Use order snapshots instead of rewriting historical records.

## 11. Security verification

1. Logged-out visitors read only published artwork and public artist profiles.
2. Collectors cannot create artwork.
3. Artists write only their own profile, artwork, and assigned orders.
4. Buyers see only their orders; artists see only assigned orders.
5. Feedback stays hidden until approved.
6. Unsupported or oversized uploads are rejected.
7. No Admin SDK key or server secret appears in the browser bundle.

