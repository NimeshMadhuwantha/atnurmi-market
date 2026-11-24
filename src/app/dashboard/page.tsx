import type { Metadata } from "next";
import { ArtistDashboard } from "@/components/artist-dashboard";
export const metadata: Metadata = { title: "Artist Dashboard", robots: { index: false, follow: false } };
export default function DashboardPage() { return <ArtistDashboard/>; }

