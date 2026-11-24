import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { requireFirebaseUser } from "@/lib/api-auth";
import { sameOrigin } from "@/lib/admin-session";
import { adminDb } from "@/lib/firebase-admin";

const CATEGORIES = ["Canvas Art", "Watercolour", "Colour Pencil", "Pencil Art", "Graphic Art", "Digital Art"];
const DELIVERY_OPTIONS = ["Cash on delivery", "After full payment", "Global delivery", "Free delivery"];

function text(value: unknown, max: number) {
  return String(value ?? "").trim().slice(0, max);
}

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

function listingFrom(body: Record<string, unknown>) {
  const name = text(body.name, 120);
  const description = text(body.description, 2_000);
  const category = text(body.category, 40);
  const size = text(body.size, 80);
  const medium = text(body.medium, 100);
  const materials = text(body.materials, 200);
  const note = text(body.note, 500);
  const price = Number(body.price);
  const requestedDelivery = Array.isArray(body.deliveryOptions) ? body.deliveryOptions.map(String) : [];
  const deliveryOptions = [...new Set(requestedDelivery.filter((option) => DELIVERY_OPTIONS.includes(option)))];
  const freeDelivery = deliveryOptions.includes("Free delivery");
  const deliveryCharge = freeDelivery ? 0 : Math.max(0, Number(body.deliveryCharge) || 0);

  if (name.length < 2 || description.length < 10 || size.length < 2 || medium.length < 2 || materials.length < 2) {
    return { error: "Complete the artwork name, description, size, medium, and materials." } as const;
  }
  if (!CATEGORIES.includes(category)) return { error: "Choose a valid artwork category." } as const;
  if (!deliveryOptions.length || deliveryOptions.length !== requestedDelivery.length) return { error: "Choose valid delivery options." } as const;
  if (!Number.isFinite(price) || price <= 0 || price > 100_000_000) return { error: "Enter a valid artwork price." } as const;
  if (!Number.isFinite(deliveryCharge) || deliveryCharge > 10_000_000) return { error: "Enter a valid delivery charge." } as const;

  return { data: {
    name,
    description,
    category,
    size,
    medium,
    materials,
    deliveryOptions,
    deliveryLabel: freeDelivery ? "Free delivery" : deliveryOptions.join(" · "),
    price,
    deliveryCharge,
    note,
  } } as const;
}

function imagesFrom(body: Record<string, unknown>, required: boolean) {
  if (!Array.isArray(body.images) && !required) return { data: null } as const;
  const images = Array.isArray(body.images) ? body.images.map(String) : [];
  const thumbnail = String(body.thumbnail ?? "");
  if (images.length !== 3 || images.some((item) => !isWebpDataUrl(item, 100_000))) {
    return { error: "Three valid WebP images below 100 KB each are required." } as const;
  }
  if (!isWebpDataUrl(thumbnail, 25_000)) return { error: "The artwork thumbnail must be a valid WebP below 25 KB." } as const;
  return { data: { images, thumbnail } } as const;
}

async function approvedArtist(uid: string) {
  const snapshot = await adminDb.collection("artists").doc(uid).get();
  if (!snapshot.exists || snapshot.data()?.blocked || snapshot.data()?.status !== "active") return null;
  return snapshot;
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  try {
    const user = await requireFirebaseUser(request);
    if (user.role !== "artist") return NextResponse.json({ error: "Artist approval is required." }, { status: 403 });
    const artist = await approvedArtist(user.uid);
    if (!artist) return NextResponse.json({ error: "This artist account is unavailable." }, { status: 403 });

    const body = await request.json() as Record<string, unknown>;
    const listing = listingFrom(body);
    if ("error" in listing) return NextResponse.json({ error: listing.error }, { status: 400 });
    const imageData = imagesFrom(body, true);
    if ("error" in imageData) return NextResponse.json({ error: imageData.error }, { status: 400 });

    const current = await adminDb.collection("artworks").where("artistId", "==", user.uid).count().get();
    const limit = Number(artist.data()?.artworkLimit ?? 10);
    if (current.data().count >= limit) return NextResponse.json({ error: `Your artwork limit is ${limit}.` }, { status: 409 });

    const ref = adminDb.collection("artworks").doc();
    const batch = adminDb.batch();
    batch.set(ref, {
      ...listing.data,
      artistId: user.uid,
      artistName: artist.data()?.displayName ?? user.name ?? "Atnurmi Artist",
      thumbnailDataUrl: imageData.data!.thumbnail,
      status: "published",
      rating: Number(artist.data()?.rating ?? 0),
      reviewCount: Number(artist.data()?.reviewCount ?? 0),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    batch.set(adminDb.collection("artworkImages").doc(ref.id), {
      artistId: user.uid,
      images: imageData.data!.images,
      updatedAt: FieldValue.serverTimestamp(),
    });
    await batch.commit();
    return NextResponse.json({ ok: true, id: ref.id });
  } catch (error) {
    console.error("Artwork creation failed", error);
    return NextResponse.json({ error: "Unable to create the artwork." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  try {
    const user = await requireFirebaseUser(request);
    if (user.role !== "artist") return NextResponse.json({ error: "Artist approval is required." }, { status: 403 });
    const id = new URL(request.url).searchParams.get("id") ?? "";
    const [artist, artwork] = await Promise.all([
      approvedArtist(user.uid),
      adminDb.collection("artworks").doc(id).get(),
    ]);
    if (!artist) return NextResponse.json({ error: "This artist account is unavailable." }, { status: 403 });
    if (!artwork.exists || artwork.data()?.artistId !== user.uid) return NextResponse.json({ error: "Artwork not found." }, { status: 404 });

    const body = await request.json() as Record<string, unknown>;
    const listing = listingFrom(body);
    if ("error" in listing) return NextResponse.json({ error: listing.error }, { status: 400 });
    const imageData = imagesFrom(body, false);
    if ("error" in imageData) return NextResponse.json({ error: imageData.error }, { status: 400 });

    const batch = adminDb.batch();
    batch.update(artwork.ref, {
      ...listing.data,
      artistName: artist.data()?.displayName ?? user.name ?? "Atnurmi Artist",
      ...(imageData.data ? { thumbnailDataUrl: imageData.data.thumbnail } : {}),
      updatedAt: FieldValue.serverTimestamp(),
    });
    if (imageData.data) {
      batch.set(adminDb.collection("artworkImages").doc(id), {
        artistId: user.uid,
        images: imageData.data.images,
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
    }
    await batch.commit();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Artwork update failed", error);
    return NextResponse.json({ error: "Unable to update the artwork." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  try {
    const user = await requireFirebaseUser(request);
    if (user.role !== "artist") return NextResponse.json({ error: "Artist approval is required." }, { status: 403 });
    const id = new URL(request.url).searchParams.get("id") ?? "";
    const ref = adminDb.collection("artworks").doc(id);
    const snapshot = await ref.get();
    if (!snapshot.exists || snapshot.data()?.artistId !== user.uid) return NextResponse.json({ error: "Artwork not found." }, { status: 404 });
    const batch = adminDb.batch();
    batch.delete(ref);
    batch.delete(adminDb.collection("artworkImages").doc(id));
    await batch.commit();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Artwork deletion failed", error);
    return NextResponse.json({ error: "Unable to delete the artwork." }, { status: 500 });
  }
}
