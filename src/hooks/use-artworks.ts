"use client";

import { useEffect, useState } from "react";
import type { Artwork } from "@/lib/data";
import { demoArtworks } from "@/lib/data";
import { listPublishedArtworks } from "@/lib/firestore-rest";

export function useArtworks() {
  const [artworks, setArtworks] = useState<Artwork[]>(demoArtworks);
  const [source, setSource] = useState<"loading" | "firebase" | "demo">("loading");
  useEffect(() => {
    let active = true;
    listPublishedArtworks().then((records) => {
      if (!active) return;
      setArtworks(records);
      setSource(records === demoArtworks ? "demo" : "firebase");
    }).catch(() => {
      if (!active) return;
      setArtworks(demoArtworks);
      setSource("demo");
    });
    return () => { active = false; };
  }, []);
  return { artworks, source };
}

