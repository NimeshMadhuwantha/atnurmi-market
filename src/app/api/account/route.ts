import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { requireFirebaseUser } from "@/lib/api-auth";
import { sameOrigin } from "@/lib/admin-session";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

const ACTIVE_ORDER_STATUSES = ["pending", "confirmed", "processing", "dispatched"];

function isWebpDataUrl(value: string, maxBytes: number) {
  if (!value.startsWith("data:image/webp;base64,")) return false;
  try {
    const bytes = Buffer.from(value.slice("data:image/webp;base64,".length), "base64");
    return bytes.length <= maxBytes
      && bytes.subarray(0, 4).toString("ascii") === "RIFF"
      && bytes.subarray(8, 12).toString("ascii") === "WEBP";
  } catch {
    return false;
  }
}

function isTrustedGooglePhotoUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:"
      && (url.hostname === "googleusercontent.com" || url.hostname.endsWith(".googleusercontent.com"));
  } catch {
    return false;
  }
}

function text(value: unknown, max: number) {
  return String(value ?? "").trim().slice(0, max);
}

function cleanAddress(value: unknown) {
  const input = value && typeof value === "object" ? value as Record<string, unknown> : {};
  return {
    line1: text(input.line1, 120),
    line2: text(input.line2, 120),
    town: text(input.town, 80),
    postalCode: text(input.postalCode, 20),
    district: text(input.district, 80),
    country: "Sri Lanka",
  };
}

export async function GET(request: Request) {
  try {
    const user = await requireFirebaseUser(request);
    const [profileSnapshot, artistPrivateSnapshot] = await Promise.all([
      adminDb.collection("users").doc(user.uid).get(),
      user.role === "artist"
        ? adminDb.collection("artistPrivate").doc(user.uid).get()
        : Promise.resolve(null),
    ]);
    const stored = profileSnapshot.data() ?? {};
    const artistPrivate = artistPrivateSnapshot?.data() ?? {};
    return NextResponse.json({
      profile: {
        displayName: text(stored.displayName ?? user.name, 80),
        email: user.email ?? "",
        photoUrl: String(stored.photoUrl ?? user.picture ?? ""),
        phone: text(stored.phone, 30),
        optionalPhone: text(stored.optionalPhone, 30),
        whatsapp: text(stored.whatsapp ?? artistPrivate.whatsapp, 30),
        address: cleanAddress(stored.address),
        role: user.role === "artist" ? "artist" : "customer",
      },
    });
  } catch (error) {
    console.error("Profile read failed", error);
    return NextResponse.json({ error: "Unable to load your profile." }, { status: 401 });
  }
}

export async function PATCH(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  try {
    const user = await requireFirebaseUser(request);
    const body = await request.json() as Record<string, unknown>;
    const displayName = text(body.displayName, 80);
    const phone = text(body.phone, 30);
    const optionalPhone = text(body.optionalPhone, 30);
    const whatsapp = text(body.whatsapp, 30);
    const photoUrl = String(body.photoUrl ?? "");
    const phonePattern = /^$|^\+?[0-9 ()-]{9,24}$/;

    if (displayName.length < 2) return NextResponse.json({ error: "Enter a valid display name." }, { status: 400 });
    if (!phonePattern.test(phone) || !phonePattern.test(optionalPhone) || !phonePattern.test(whatsapp)) return NextResponse.json({ error: "Enter valid phone numbers." }, { status: 400 });
    if (photoUrl && !isWebpDataUrl(photoUrl, 100_000) && !isTrustedGooglePhotoUrl(photoUrl)) {
      return NextResponse.json({ error: "Profile image must be an optimized WebP or your Google profile photo." }, { status: 400 });
    }

    const address = cleanAddress(body.address);
    const profile = {
      displayName,
      email: user.email ?? "",
      photoUrl,
      phone,
      optionalPhone,
      whatsapp,
      address,
      role: user.role === "artist" ? "artist" : "customer",
      updatedAt: FieldValue.serverTimestamp(),
    };
    const batch = adminDb.batch();
    batch.set(adminDb.collection("users").doc(user.uid), profile, { merge: true });
    if (user.role === "artist") {
      batch.set(adminDb.collection("artists").doc(user.uid), { displayName, photoUrl, whatsapp, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
      batch.set(adminDb.collection("artistPrivate").doc(user.uid), { whatsapp, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    }
    await batch.commit();
    return NextResponse.json({
      ok: true,
      profile: { displayName, email: user.email ?? "", photoUrl, phone, optionalPhone, whatsapp, address, role: profile.role },
    });
  } catch (error) {
    console.error("Profile update failed", error);
    return NextResponse.json({ error: "Unable to save your profile." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  try {
    const user = await requireFirebaseUser(request);
    const [buyerOrders, artistOrders] = await Promise.all([
      adminDb.collection("orders").where("buyerId", "==", user.uid).limit(100).get(),
      adminDb.collection("orders").where("artistId", "==", user.uid).limit(100).get(),
    ]);
    const hasActiveOrders = [...buyerOrders.docs, ...artistOrders.docs]
      .some((item) => ACTIVE_ORDER_STATUSES.includes(String(item.data().status)));
    if (hasActiveOrders) return NextResponse.json({ error: "Complete active orders before deleting your account." }, { status: 409 });

    const [artworks, applications] = await Promise.all([
      adminDb.collection("artworks").where("artistId", "==", user.uid).limit(25).get(),
      adminDb.collection("artistApplications").where("uid", "==", user.uid).limit(10).get(),
    ]);
    const batch = adminDb.batch();
    artworks.docs.forEach((item) => {
      batch.delete(item.ref);
      batch.delete(adminDb.collection("artworkImages").doc(item.id));
    });
    applications.docs.forEach((item) => batch.delete(item.ref));
    batch.delete(adminDb.collection("users").doc(user.uid));
    batch.delete(adminDb.collection("artists").doc(user.uid));
    batch.delete(adminDb.collection("artistPrivate").doc(user.uid));
    await batch.commit();
    await adminAuth.deleteUser(user.uid);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Account deletion failed", error);
    return NextResponse.json({ error: "Unable to delete this account." }, { status: 500 });
  }
}
