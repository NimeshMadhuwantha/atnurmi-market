"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, limit, orderBy, query, where } from "firebase/firestore/lite";
import type { Artwork } from "@/lib/data";
import { firestore } from "@/lib/firebase-client";

export function useArtworks() {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [source, setSource] = useState<"loading" | "firebase" | "error">(() => firestore ? "loading" : "error");

  useEffect(() => {
    let active = true;
    if (!firestore) return;

    getDocs(query(
      collection(firestore, "artworks"),
      where("status", "==", "published"),
      orderBy("createdAt", "desc"),
      limit(20),
    )).then((snapshot) => {
      if (!active) return;
      setArtworks(snapshot.docs.map((item) => {
        const fields = item.data();
        const thumbnail = String(fields.thumbnailDataUrl ?? "");
        return {
          id: item.id,
          name: String(fields.name ?? "Untitled artwork"),
          artist: String(fields.artistName ?? "Atnurmi Artist"),
          artistId: String(fields.artistId ?? ""),
          category: String(fields.category ?? "Original Art"),
          price: Number(fields.price ?? 0),
          size: String(fields.size ?? "Size on request"),
          medium: String(fields.medium ?? "Mixed media"),
          materials: String(fields.materials ?? "Artist materials"),
          rating: Number(fields.rating ?? 0),
          reviews: Number(fields.reviewCount ?? 0),
          delivery: String(fields.deliveryLabel ?? "Delivery available"),
          description: String(fields.description ?? ""),
          tone: "ocean",
          note: fields.note ? String(fields.note) : undefined,
          imageUrls: thumbnail ? [thumbnail] : [],
        };
      }));
      setSource("firebase");
    }).catch((error) => {
      console.error("Published artwork query failed", error);
      if (!active) return;
      setArtworks([]);
      setSource("error");
    });

    return () => { active = false; };
  }, []);

  return { artworks, source };
}
