# Atnurmi Marketplace

A full-stack Next.js marketplace for discovering original art, commissioning approved artists, managing seller listings and orders, and moderating marketplace activity.

Seller artwork loads from Firestore whenever Firebase environment variables are configured. The included artwork records are a development fallback, not production inventory.

See [Firebase setup](docs/FIREBASE_SETUP.md) for the complete Firebase Console, Authentication, Firestore, Storage, Rules, TTL, App Check, and Netlify configuration path.

## Development

```bash
npm run dev
```

## Validation

```bash
npm run lint
npm run build
```

