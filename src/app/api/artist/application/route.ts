import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { requireFirebaseUser } from "@/lib/api-auth";
import { sameOrigin } from "@/lib/admin-session";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  try {
    const user = await requireFirebaseUser(request);
    if (user.role === "artist") return NextResponse.json({ error: "This account already has artist access." }, { status: 409 });
    const body = await request.json() as Record<string, unknown>;
    const fullName = String(body.fullName ?? "").trim();
    const dateOfBirth = String(body.dateOfBirth ?? "");
    const address = String(body.address ?? "").trim();
    const whatsapp = String(body.whatsapp ?? "").trim();
    const birthDate = new Date(`${dateOfBirth}T00:00:00Z`);
    if (fullName.length < 3 || fullName.length > 100 || !dateOfBirth || Number.isNaN(birthDate.getTime()) || birthDate >= new Date() || address.length < 8 || address.length > 500 || !/^\+?[0-9 ()-]{9,24}$/.test(whatsapp)) {
      return NextResponse.json({ error: "Please complete all artist details correctly." }, { status: 400 });
    }
    const existing = await adminDb.collection("artistApplications").where("uid", "==", user.uid).limit(1).get();
    if (!existing.empty && existing.docs[0].data().status === "approved") {
      return NextResponse.json({ error: "Your application is approved. Sign out and sign in again to activate artist access." }, { status: 409 });
    }
    const ref = existing.empty ? adminDb.collection("artistApplications").doc() : existing.docs[0].ref;
    const application: Record<string, unknown> = {
      uid: user.uid, email: user.email ?? "", fullName, dateOfBirth, address, whatsapp,
      status: "pending", updatedAt: FieldValue.serverTimestamp(),
      expiresAt: Timestamp.fromMillis(Date.now() + 30 * 24 * 60 * 60 * 1000),
    };
    if (existing.empty) application.createdAt = FieldValue.serverTimestamp();
    else application.declinedAt = FieldValue.delete();
    await ref.set(application, { merge: true });
    return NextResponse.json({ ok: true, id: ref.id });
  } catch (error) {
    console.error("Artist application failed", error);
    return NextResponse.json({ error: "Sign in with Google before submitting the application." }, { status: 401 });
  }
}

