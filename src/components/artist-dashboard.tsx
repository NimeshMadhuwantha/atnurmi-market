"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArtCard } from "./art-card";
import { ArrowIcon, GridIcon, OrdersIcon, StarIcon } from "./icons";
import { useApp } from "./app-provider";
import type { Artwork } from "@/lib/data";
import { formatPrice } from "@/lib/data";

type Order = { id: string; status: string; total: number; artworkName: string };

export function ArtistDashboard() {
  const { user, accountRole } = useApp();
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [profile, setProfile] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user || accountRole !== "artist") return;
    let active = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const response = await fetch("/api/artist/dashboard", { cache: "no-store", headers: { Authorization: `Bearer ${await user!.getIdToken()}` } });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error ?? "Unable to load the artist dashboard.");
        if (!active) return;
        setArtworks((result.artworks ?? []).map((item: Artwork) => ({ ...item, tone: "ocean" })));
        setOrders(result.orders ?? []);
        setProfile(result.profile ?? {});
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : "Unable to load the artist dashboard.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, [user, accountRole]);

  if (!user || accountRole !== "artist") return <main className="page-main"><div className="empty-state"><h1>Artist access required</h1><p>Use the About Us page to request artist access.</p><Link className="button primary" href="/about#join">Request access</Link></div></main>;
  if (loading) return <main className="page-main"><div className="empty-state"><h1>Loading artist dashboard…</h1></div></main>;
  if (error) return <main className="page-main"><div className="empty-state"><h1>Dashboard unavailable</h1><p>{error}</p><button className="button primary" onClick={() => window.location.reload()}>Try again</button></div></main>;

  const active = orders.filter((item) => !["received", "cancelled"].includes(item.status));
  const earnings = orders.filter((item) => ["delivered", "received"].includes(item.status)).reduce((sum, item) => sum + item.total, 0);
  const artLimit = Number(profile.artworkLimit ?? 10);

  return <main className="page-main dashboard-page">
    <header className="dashboard-header"><div><p className="eyebrow">ARTIST STUDIO</p><h1>Welcome, {String(profile.displayName ?? user.displayName ?? "Artist")}.</h1><p>Your live marketplace activity is shown below.</p></div></header>
    <section className="stat-grid"><div><span>ARTWORKS</span><strong>{artworks.length} <small>/ {artLimit}</small></strong><p>{Math.max(0, artLimit - artworks.length)} listing spaces available</p><GridIcon/></div><div><span>ACTIVE ORDERS</span><strong>{active.length}</strong><p>Orders requiring progress</p><OrdersIcon/></div><div><span>COMPLETED SALES</span><strong>{formatPrice(earnings)}</strong><p>Delivered and received orders</p><ArrowIcon/></div><div><span>AVERAGE RATING</span><strong>{Number(profile.rating ?? 0).toFixed(1)}</strong><p>{Number(profile.reviewCount ?? 0)} approved reviews</p><StarIcon/></div></section>
    <section className="dashboard-split"><div className="dashboard-panel"><div className="panel-heading"><div><p className="eyebrow">ACTION NEEDED</p><h2>Current orders</h2></div><Link href="/seller/orders">View all <ArrowIcon size={16}/></Link></div>{active.length ? active.slice(0, 4).map((order) => <div className="order-row" key={order.id}><span>#{order.id.slice(0, 8)}</span><strong>{order.artworkName}</strong><i>{order.status}</i><small>{formatPrice(order.total)}</small></div>) : <p>No active orders.</p>}</div><div className="dashboard-panel quick-panel"><p className="eyebrow">QUICK ACTIONS</p><h2>Keep the studio moving.</h2><Link href="/my-arts" className="button primary">Add new artwork <ArrowIcon size={16}/></Link><Link href="/my-arts" className="button outline">Manage listings</Link><div className="limit-meter"><span><i style={{ width: `${Math.min(100, artworks.length / artLimit * 100)}%` }}/></span><p>{artworks.length} of {artLimit} artwork spaces used</p></div></div></section>
    <section className="section dashboard-art"><div className="panel-heading"><div><p className="eyebrow">YOUR LISTINGS</p><h2>Recently active</h2></div><Link href="/my-arts">Manage all <ArrowIcon size={16}/></Link></div>{artworks.length ? <div className="art-grid">{artworks.slice(0, 3).map((art) => <ArtCard art={art} key={art.id} compact variant="artist"/>)}</div> : <p>No artwork published yet.</p>}</section>
  </main>;
}
