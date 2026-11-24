"use client";

import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { initializeAppCheck, ReCaptchaEnterpriseProvider, type AppCheck } from "firebase/app-check";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore/lite";
import { firebaseConfig, isFirebaseConfigured } from "./firebase-config";

/** Browser Firebase services, initialized once with the modular SDK. */
export const firebaseApp: FirebaseApp | null = isFirebaseConfigured
  ? (getApps().length ? getApp() : initializeApp(firebaseConfig))
  : null;

const appCheckSiteKey = process.env.NEXT_PUBLIC_FIREBASE_APP_CHECK_SITE_KEY ?? "";
if (appCheckSiteKey && process.env.NEXT_PUBLIC_FIREBASE_APP_CHECK_DEBUG === "true") {
  (globalThis as typeof globalThis & { FIREBASE_APPCHECK_DEBUG_TOKEN?: boolean }).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
}
export const firebaseAppCheck: AppCheck | null = firebaseApp && appCheckSiteKey
  ? initializeAppCheck(firebaseApp, {
      provider: new ReCaptchaEnterpriseProvider(appCheckSiteKey),
      isTokenAutoRefreshEnabled: true,
    })
  : null;

export const firebaseAuth: Auth | null = firebaseApp ? getAuth(firebaseApp) : null;
export const firestore: Firestore | null = firebaseApp ? getFirestore(firebaseApp) : null;

export function requireFirebaseServices() {
  if (!firebaseApp || !firebaseAuth || !firestore) {
    throw new Error("Firebase public configuration is incomplete.");
  }

  return {
    app: firebaseApp,
    auth: firebaseAuth,
    db: firestore,
  };
}
