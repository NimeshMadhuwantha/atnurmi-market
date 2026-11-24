import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { isAdminRequest, sameOrigin } from "@/lib/admin-session";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

function clean(value: unknown): unknown {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (Array.isArray(value)) return value.map(clean);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, clean(item)]));
  }
  return value;
}

async function rows(collection: string) {
  const snapshot = await adminDb.collection(collection).limit(250).get();
  return snapshot.docs.map((item) => ({ id: item.id, ...clean(item.data()) as object }));
}

async function recalculateArtistRating(uid: string) {
  if (!uid) return;
  const feedback = await adminDb.collection("feedback").where("artistId", "==", uid).where("status", "==", "approved").limit(500).get();
  const values = feedback.docs.map((item) => Number(item.data().average ?? 0)).filter((value) => value > 0);
  const rating = values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length * 10) / 10 : 0;
  const artworks = await adminDb.collection("artworks").where("artistId", "==", uid).limit(200).get();
  const batch = adminDb.batch();
  batch.set(adminDb.collection("artists").doc(uid), { rating, reviewCount: values.length, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  artworks.docs.forEach((item) => batch.update(item.ref, { rating, reviewCount: values.length, updatedAt: FieldValue.serverTimestamp() }));
  await batch.commit();
}

export async function GET() {
  if (!await isAdminRequest()) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  try {
    const [applications, artists, artworks, orders, feedback] = await Promise.all([
      rows("artistApplications"), rows("artists"), rows("artworks"), rows("orders"), rows("feedback"),
    ]);
    return NextResponse.json({ applications, artists, artworks, orders, feedback });
  } catch (error) {
    console.error("Admin marketplace read failed", error);
    return NextResponse.json({ error: "Firebase Admin is not configured or Firestore is unavailable." }, { status: 503 });
  }
}

type ActionBody = {
  action?: "approve-artist" | "decline-artist" | "block-artist" | "delete-artist" | "artist-limit" | "approve-feedback" | "edit-feedback" | "delete-feedback" | "delete-order";
  id?: string;
  value?: number | boolean | string;
};

export async function POST(request: Request) {
  if (!sameOrigin(request) || !await isAdminRequest()) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const body = await request.json().catch(() => null) as ActionBody | null;
  if (!body?.action || !body.id) return NextResponse.json({ error: "Invalid action." }, { status: 400 });

  try {
    if (body.action === "approve-artist" || body.action === "decline-artist") {
      const ref = adminDb.collection("artistApplications").doc(body.id);
      const snapshot = await ref.get();
      if (!snapshot.exists) return NextResponse.json({ error: "Application not found." }, { status: 404 });
      const application = snapshot.data()!;
      if (application.status !== "pending") return NextResponse.json({ error: "This application has already been processed." }, { status: 409 });
      const uid = String(application.uid ?? "");
      if (!uid) return NextResponse.json({ error: "Application has no Firebase user." }, { status: 400 });

      if (body.action === "approve-artist") {
        const user = await adminAuth.getUser(uid);
        const batch = adminDb.batch();
        batch.set(adminDb.collection("artists").doc(uid), {
          displayName: application.fullName,
          email: application.email,
          photoUrl: user.photoURL ?? "",
          whatsapp: application.whatsapp,
          location: application.location ?? "Sri Lanka",
          specialties: application.specialties ?? ["Original Art"],
          rating: 0, reviewCount: 0, artworkLimit: 10, blocked: false,
          status: "provisioning", createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
        }, { merge: true });
        batch.set(adminDb.collection("artistPrivate").doc(uid), {
          fullName: application.fullName, dateOfBirth: application.dateOfBirth,
          address: application.address, whatsapp: application.whatsapp, email: application.email,
          updatedAt: FieldValue.serverTimestamp(),
        }, { merge: true });
        await batch.commit();
        await adminAuth.setCustomUserClaims(uid, { ...user.customClaims, role: "artist" });
        const activation = adminDb.batch();
        activation.set(adminDb.collection("artists").doc(uid), { status: "active", updatedAt: FieldValue.serverTimestamp() }, { merge: true });
        activation.set(adminDb.collection("users").doc(uid), { role: "artist", updatedAt: FieldValue.serverTimestamp() }, { merge: true });
        activation.update(ref, { status: "approved", approvedAt: FieldValue.serverTimestamp(), expiresAt: FieldValue.delete() });
        await activation.commit();
      } else {
        await ref.update({ status: "declined", declinedAt: FieldValue.serverTimestamp() });
      }
    } else if (body.action === "block-artist") {
      const blocked = Boolean(body.value);
      const artworks = await adminDb.collection("artworks").where("artistId", "==", body.id).limit(200).get();
      const batch = adminDb.batch();
      batch.update(adminDb.collection("artists").doc(body.id), { blocked, updatedAt: FieldValue.serverTimestamp() });
      artworks.docs.forEach((item) => batch.update(item.ref, { status: blocked ? "hidden" : "published", updatedAt: FieldValue.serverTimestamp() }));
      await batch.commit();
    } else if (body.action === "artist-limit") {
      const limit = Number(body.value);
      if (![10, 15, 20].includes(limit)) return NextResponse.json({ error: "Invalid artwork limit." }, { status: 400 });
      await adminDb.collection("artists").doc(body.id).update({ artworkLimit: limit, updatedAt: FieldValue.serverTimestamp() });
    } else if (body.action === "delete-artist") {
      const [artworks, applications] = await Promise.all([
        adminDb.collection("artworks").where("artistId", "==", body.id).limit(200).get(),
        adminDb.collection("artistApplications").where("uid", "==", body.id).limit(10).get(),
      ]);
      const batch = adminDb.batch();
      artworks.docs.forEach((item) => { batch.delete(item.ref); batch.delete(adminDb.collection("artworkImages").doc(item.id)); });
      applications.docs.forEach((item) => batch.delete(item.ref));
      batch.delete(adminDb.collection("artists").doc(body.id));
      batch.delete(adminDb.collection("artistPrivate").doc(body.id));
      batch.delete(adminDb.collection("users").doc(body.id));
      await batch.commit();
      await adminAuth.deleteUser(body.id).catch(() => undefined);
    } else if (body.action === "approve-feedback") {
      const ref = adminDb.collection("feedback").doc(body.id);
      const feedback = await ref.get();
      await ref.update({ status: "approved", approvedAt: FieldValue.serverTimestamp() });
      await recalculateArtistRating(String(feedback.data()?.artistId ?? ""));
    } else if (body.action === "edit-feedback") {
      const comment = String(body.value ?? "").trim().slice(0, 1000);
      if (!comment) return NextResponse.json({ error: "Feedback cannot be empty." }, { status: 400 });
      await adminDb.collection("feedback").doc(body.id).update({ comment, editedAt: FieldValue.serverTimestamp() });
    } else if (body.action === "delete-feedback") {
      const ref = adminDb.collection("feedback").doc(body.id);
      const feedback = await ref.get();
      await ref.delete();
      await recalculateArtistRating(String(feedback.data()?.artistId ?? ""));
    } else if (body.action === "delete-order") {
      await adminDb.collection("orders").doc(body.id).delete();
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Admin marketplace action failed", error);
    return NextResponse.json({ error: "The Firebase operation failed." }, { status: 500 });
  }
}

