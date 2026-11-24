import fs from "node:fs";
import process from "node:process";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function loadEnv(path) {
  const values = {};
  for (const line of fs.readFileSync(path, "utf8").split(/\r?\n/)) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (!match) continue;
    values[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, "").replace(/\\n/g, "\n");
  }
  return values;
}

const env = loadEnv(".env.local");
const app = getApps()[0] ?? initializeApp({ credential: cert({
  projectId: env.FIREBASE_ADMIN_PROJECT_ID,
  clientEmail: env.FIREBASE_ADMIN_CLIENT_EMAIL,
  privateKey: env.FIREBASE_ADMIN_PRIVATE_KEY,
}) });
const auth = getAuth(app);
const db = getFirestore(app);
const uid = `codex-ui-${Date.now()}`;
const email = `${uid}@example.test`;

if (process.argv[2] === "cleanup") {
  const cleanupUid = process.argv[3];
  if (!cleanupUid?.startsWith("codex-ui-")) throw new Error("Refusing cleanup for an unexpected user id.");
  await Promise.all([
    auth.deleteUser(cleanupUid).catch(() => undefined),
    db.collection("users").doc(cleanupUid).delete(),
    db.collection("artists").doc(cleanupUid).delete(),
    db.collection("artistPrivate").doc(cleanupUid).delete(),
  ]);
  const artworkSnapshot = await db.collection("artworks").where("artistId", "==", cleanupUid).get();
  const batch = db.batch();
  for (const artwork of artworkSnapshot.docs) {
    batch.delete(artwork.ref);
    batch.delete(db.collection("artworkImages").doc(artwork.id));
  }
  await batch.commit();
  console.log(JSON.stringify({ cleaned: cleanupUid, artworks: artworkSnapshot.size }));
  process.exit(0);
}

await auth.createUser({ uid, email, displayName: "Codex Artist" });
await auth.setCustomUserClaims(uid, { role: "artist" });
await Promise.all([
  db.collection("users").doc(uid).set({ uid, email, displayName: "Codex Artist", role: "artist" }),
  db.collection("artists").doc(uid).set({ uid, email, displayName: "Codex Artist", status: "active", blocked: false, artworkLimit: 10 }),
]);
const token = await auth.createCustomToken(uid);
console.log(JSON.stringify({ uid, token }));
