import type { Metadata } from "next";
import { Suspense } from "react";
import { ExploreClient } from "@/components/explore-client";

export const metadata: Metadata = { title: "Explore Original Art", description: "Browse original canvas, pencil, watercolour, colour pencil, graphic and digital art by independent artists." };

export default function ExplorePage() {
  return <main className="page-main"><header className="page-hero editorial-hero"><p className="eyebrow">THE MARKETPLACE</p><h1>Find the piece<br/>that stays with you.</h1><p>Original work from independent artists. Browse by medium, feeling, size, or the story it tells.</p></header><section className="section marketplace"><Suspense fallback={<div className="loading-grid">Loading the collection…</div>}><ExploreClient/></Suspense></section></main>;
}

