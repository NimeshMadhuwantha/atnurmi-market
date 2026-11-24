# Atnurmi Marketplace: Firebase setup and release checklist

This project uses Firebase Authentication, Cloud Firestore, and the Firebase Admin SDK. Firebase Storage is not currently used: the browser converts uploads to WebP, catalog documents contain a small thumbnail, and the three detail images are kept in a separate `artworkImages` document that is read only when a visitor opens the artwork.

## Verified project state (24 November 2026)

The following items were checked against the live `atnurmi-market` Firebase project without exposing credentials:

- The local Web App configuration matches the active Firebase Web App.
- Google Authentication is enabled and its OAuth client is configured.
- Authorized domains include `localhost`, `atnurmi-market.firebaseapp.com`, `atnurmi-market.web.app`, `market.atnurmi.com`, and `atnurmi-marketplace.netlify.app`.
- The local Firebase Admin service account parses correctly and belongs to `atnurmi-market`.
- Firebase Admin can reach Authentication and Firestore.
- The Firestore `(default)` database is Native mode, Standard edition, in `asia-south1`.
- The secured Firestore rules are compiled and deployed, and all required composite indexes are ready.
- Authentication and Firestore currently contain no marketplace users or content. Collections will appear after the first real write.

Do not create dummy collections or users in the Firebase Console.

## 1. Authentication settings

These are already correct. Use these paths if they are ever changed or if sign-in fails after moving domains.

1. Open [Firebase Console](https://console.firebase.google.com/) and select `atnurmi-market`.
2. Go to `Build -> Authentication -> Sign-in method`.
3. Open `Google` and confirm:
   - Enabled: on
   - Project support email: a monitored Atnurmi email
4. Go to `Build -> Authentication -> Settings -> Authorized domains`.
5. Keep the verified domains above. Add the exact final Netlify hostname if it differs from `atnurmi-marketplace.netlify.app`.

Customers and artists use the same Google account. Artist status is a server-issued custom claim after admin approval; do not manually create separate artist/password accounts.

The Google popup requires `https://apis.google.com`. The application Content Security Policy already allows this origin. Removing it causes `Firebase: Error (auth/internal-error)`.

## 2. Deploy Firestore rules and indexes

This deployment was completed on 24 November 2026. Run it again whenever either rules or indexes change.

The source of truth is:

- `firebase/firestore.rules`
- `firebase/firestore.indexes.json`
- `firebase.json`

From PowerShell:

```powershell
Set-Location "D:\My projects\atnurmi-market"
firebase login
firebase use atnurmi-market
firebase deploy --only firestore --project atnurmi-market
```

The rules enforce private profiles, approved/active artist access, public reads only for published listings, owner-only orders, forward-only delivery states, one feedback document per order, and deny-by-default access for every other path.

Deploy from the repository rather than editing rules in the Firebase Console, because a later CLI deployment replaces console-only rule changes.

## 3. Enable automatic 30-day application cleanup

Each artist application is written with an `expiresAt` Firestore timestamp. Configure TTL once:

1. Open [Google Cloud Console](https://console.cloud.google.com/) and select project `atnurmi-market`.
2. Go to `Firestore -> Databases`.
3. Select `(default)`.
4. Open `Time-to-live` in the database navigation.
5. Click `Create policy`.
6. Collection group: `artistApplications`.
7. Timestamp field: `expiresAt`.
8. Expiration offset: `0`.
9. Click `Create` and wait until the policy status becomes active.

Firestore TTL deletion is not immediate; an expired document is normally removed later by the managed TTL service. Approved applications have `expiresAt` removed and are retained as an approval record.

## 4. Firebase Admin credentials

Local Admin credentials are already configured in the ignored `.env.local` file. Do not generate another key unless this key is being rotated.

To rotate it later:

1. Firebase Console -> gear icon -> `Project settings` -> `Service accounts`.
2. Click `Generate new private key` and confirm.
3. Keep the JSON outside this repository and outside `public`.
4. Convert it for a one-line environment value:

```powershell
$firebaseKeyPath = "C:\Users\MADHU\Downloads\your-service-account.json"
$encodedFirebaseKey = [Convert]::ToBase64String([IO.File]::ReadAllBytes($firebaseKeyPath))
Set-Clipboard -Value $encodedFirebaseKey
```

5. Paste it after `FIREBASE_SERVICE_ACCOUNT_JSON=` in `.env.local` without quotes.
6. Restart `next dev`.
7. After the new key works locally and in Netlify, return to Google Cloud Console -> `IAM & Admin -> Service Accounts -> Keys` and delete the old key.

Never expose `FIREBASE_SERVICE_ACCOUNT_JSON`, `ADMIN_PASSWORD`, or `ADMIN_SESSION_SECRET` in a variable beginning with `NEXT_PUBLIC_`.

## 5. App Check before production enforcement

The code has optional reCAPTCHA Enterprise App Check support. It stays inactive until a site key is supplied.

1. Google Cloud Console -> select `atnurmi-market` -> `Security -> reCAPTCHA Enterprise` (the console may group this under Fraud Protection).
2. Enable the reCAPTCHA Enterprise API if asked.
3. Create a score-based Web key. Add only production domains such as:
   - `market.atnurmi.com`
   - the exact Netlify production hostname
4. Do not add `localhost` to the production reCAPTCHA key.
5. Firebase Console -> `Build -> App Check` (or `Security -> App Check`) -> `Apps`.
6. Register the Atnurmi Web App with the reCAPTCHA Enterprise key.
7. Add the public site key to local/Netlify environments:

```env
NEXT_PUBLIC_FIREBASE_APP_CHECK_SITE_KEY=your_public_site_key
```

8. Deploy, use the production site, and inspect App Check metrics.
9. Only after valid requests appear, enable enforcement for `Cloud Firestore` and then `Authentication`.

For local development after enforcement, set this only in `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_APP_CHECK_DEBUG=true
```

Open the local site once, copy the debug token printed by Firebase in the browser console, then add it at `Firebase Console -> App Check -> Apps -> Manage debug tokens`. Never set the debug flag in Netlify production.

## 6. Netlify environment variables (when ready to host)

In Netlify, open the site and go to `Site configuration -> Environment variables`. Add every key below using the values from `.env.local`:

```text
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
NEXT_PUBLIC_FIREBASE_APP_CHECK_SITE_KEY     (after App Check registration)
ADMIN_EMAIL
ADMIN_PASSWORD
ADMIN_SESSION_SECRET
FIREBASE_SERVICE_ACCOUNT_JSON
```

Do not add `NEXT_PUBLIC_FIREBASE_APP_CHECK_DEBUG` in production. Use a new long production `ADMIN_PASSWORD`; the short local testing password is not suitable for an internet-facing admin panel. Keep `ADMIN_SESSION_SECRET` as a long random value.

After saving variables, trigger a fresh deploy because all `NEXT_PUBLIC_` values are embedded during the Next.js build. `netlify.toml` already selects Node 24 and the Next.js build command.

After deployment:

1. Add the exact Netlify production hostname at `Firebase Console -> Authentication -> Settings -> Authorized domains`.
2. Test Google sign-in on the Netlify URL.
3. Test `/NurAdm` using the production admin credentials.
4. Add `market.atnurmi.com` in Netlify at `Domain management -> Production domains`.
5. Confirm `market.atnurmi.com` remains in Firebase Authorized domains.

## 7. End-to-end test order

Run this after the rules are deployed:

1. Sign in with Google. A `users/{uid}` profile is created once.
2. Open `About Us -> Apply to the artist collective` and submit the verified details.
3. Open `/NurAdm`, then approve the pending application.
4. Sign out of the marketplace and sign in again so Firebase refreshes the `role: artist` custom claim.
5. Open `My Arts`, choose all three gallery images (each original must be at most 1 MB), and publish. The browser converts them to WebP before the server validates and saves the listing.
6. Confirm the listing appears in `Explore Arts` and its detail gallery opens.
7. Edit the listing and confirm the updated fields appear publicly.
8. Confirm artist dashboard counts and artist-directory details.

Artwork publishing is handled by the server using Firebase Admin. It creates the artwork record in Firestore `artworks` and the gallery record in `artworkImages`; Firestore creates these collections on the first successful publish. No Firebase Storage bucket or manual collection creation is needed for the current Base64 approach. The three optimized gallery images are capped at 220 KB each so their Base64 data plus Firestore metadata stays below the 1 MiB per-document limit.

Checkout/payment creation is intentionally not present yet, matching the project specification. Once payment is implemented, it must create the order on a trusted server route; client-side Firestore order creation is deliberately denied. The existing order delivery and moderated feedback lifecycle starts after a trusted order record exists.

## Firestore collections

| Collection | Purpose and access |
| --- | --- |
| `users` | Private customer profile and delivery address |
| `artists` | Public profile for approved, active artists |
| `artistPrivate` | Private legal/contact details for the artist and admin |
| `artistApplications` | Admin-reviewed requests with `expiresAt` TTL |
| `artworks` | Public listing fields plus a small WebP thumbnail |
| `artworkImages` | Three on-demand WebP detail images |
| `orders` | Trusted-server order snapshots and controlled status |
| `feedback` | One buyer review per received order, pending admin moderation |

At larger traffic volumes, migrate artwork files to Firebase Storage or another image CDN and keep only URLs in Firestore. The current split-document approach avoids unnecessary gallery reads and works without enabling Storage, but a CDN is the better long-term image delivery architecture.
