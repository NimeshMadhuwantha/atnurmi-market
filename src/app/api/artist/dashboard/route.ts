import { connection, NextResponse } from "next/server";
import { requireFirebaseUser } from "@/lib/api-auth";
import { adminDb } from "@/lib/firebase-admin";

const text = (value: unknown) => String(value ?? "");

export async function GET(request: Request) {
  await connection();
  try {
    const user = await requireFirebaseUser(request);
    if (user.role !== "artist") return NextResponse.json({ error: "Artist approval is required." }, { status: 403 });

    const artistRef = adminDb.collection("artists").doc(user.uid);
    const artist = await artistRef.get();
    if (!artist.exists || artist.data()?.status !== "active" || artist.data()?.blocked) {
      return NextResponse.json({ error: "This artist account is unavailable." }, { status: 403 });
    }

    const [artworks, orders] = await Promise.all([
      adminDb.collection("artworks").where("artistId", "==", user.uid).limit(50).get(),
      adminDb.collection("orders").where("artistId", "==", user.uid).limit(50).get(),
    ]);
    const profile = artist.data() ?? {};

    return NextResponse.json({
      profile: {
        displayName: text(profile.displayName || user.name || "Artist"),
        artworkLimit: Number(profile.artworkLimit ?? 10),
        rating: Number(profile.rating ?? 0),
        reviewCount: Number(profile.reviewCount ?? 0),
      },
      artworks: artworks.docs.map((item) => {
        const data = item.data();
        return {
          id: item.id,
          name: text(data.name),
          artist: text(data.artistName),
          artistId: text(data.artistId),
          category: text(data.category),
          price: Number(data.price ?? 0),
          size: text(data.size),
          medium: text(data.medium),
          materials: text(data.materials),
          rating: Number(data.rating ?? 0),
          reviews: Number(data.reviewCount ?? 0),
          delivery: text(data.deliveryLabel),
          deliveryCharge: Number(data.deliveryCharge ?? 0),
          description: text(data.description),
          imageUrls: data.thumbnailDataUrl ? [String(data.thumbnailDataUrl)] : [],
        };
      }),
      orders: orders.docs.map((item) => {
        const data = item.data();
        return {
          id: item.id,
          status: text(data.status || "pending"),
          total: Number(data.total ?? 0),
          artworkName: text(data.artworkSnapshot?.name || "Artwork"),
        };
      }),
    });
  } catch (error) {
    console.error("Artist dashboard read failed", error);
    return NextResponse.json({ error: "Unable to load the artist dashboard." }, { status: 500 });
  }
}
