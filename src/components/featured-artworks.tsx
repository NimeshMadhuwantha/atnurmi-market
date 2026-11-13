"use client";

import { ArtCard } from "./art-card";
import { useArtworks } from "@/hooks/use-artworks";

export function FeaturedArtworks() {
  const { artworks } = useArtworks();
  return <div className="art-grid">{artworks.slice(0, 4).map((art) => <ArtCard key={art.id} art={art} />)}</div>;
}
