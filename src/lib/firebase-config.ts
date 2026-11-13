/** Public Firebase identifiers only. Private admin credentials never belong here. */
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
};
export const isFirebaseConfigured = Object.values(firebaseConfig).every(Boolean);
export const collectionNames = { users:"users", artists:"artists", artworks:"artworks", orders:"orders", artistApplications:"artistApplications", feedback:"feedback", counters:"counters" } as const;

