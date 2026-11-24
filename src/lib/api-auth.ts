import "server-only";

import { adminAuth } from "./firebase-admin";

export async function requireFirebaseUser(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) throw new Error("UNAUTHENTICATED");
  return adminAuth.verifyIdToken(token, true);
}

