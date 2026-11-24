import type { Metadata } from "next";
import { ArtistOrders } from "@/components/artist-orders";
export const metadata: Metadata = { title: "Artist Orders", robots: { index: false, follow: false } };
export default function SellerOrdersPage() { return <ArtistOrders/>; }
