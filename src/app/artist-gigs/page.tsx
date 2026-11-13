import type { Metadata } from "next";
import { ArtistDirectory } from "@/components/artist-directory";

export const metadata: Metadata = { title: "Commission an Artist", description: "Meet approved Atnurmi artists for original, pencil, canvas and digital art commissions." };
export default function ArtistGigsPage() { return <main className="page-main"><header className="page-hero artist-hero"><p className="eyebrow">THE ARTIST DIRECTORY</p><h1>Start with an idea.<br/><em>Find the hand for it.</em></h1><p>Browse approved artists, discover their specialties, and begin your commission directly.</p></header><section className="section"><ArtistDirectory/></section></main>; }

