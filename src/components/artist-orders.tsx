"use client";

import { useCallback, useEffect, useState } from "react";
import { collection, doc, getDocs, limit, query, serverTimestamp, updateDoc, where } from "firebase/firestore/lite";
import { useApp } from "./app-provider";
import { firestore } from "@/lib/firebase-client";
import { formatPrice } from "@/lib/data";

type Order = { id: string; status: string; total: number; buyerName: string; artworkName: string };
const statuses = ["pending", "confirmed", "processing", "dispatched", "delivered"];

export function ArtistOrders() {
  const { user, accountRole } = useApp();
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!firestore || !user) return;
    const snapshot = await getDocs(query(collection(firestore, "orders"), where("artistId", "==", user.uid), limit(100)));
    setOrders(snapshot.docs.map((item) => ({
      id: item.id,
      status: String(item.data().status ?? "pending"),
      total: Number(item.data().total ?? 0),
      buyerName: String(item.data().buyerName ?? item.data().buyerId ?? "Collector"),
      artworkName: String(item.data().artworkSnapshot?.name ?? "Artwork"),
    })));
  }, [user]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function change(id: string, status: string) {
    if (!firestore) return;
    try {
      await updateDoc(doc(firestore, "orders", id), { status, updatedAt: serverTimestamp() });
      await load();
    } catch {
      setError("Status update was rejected. Orders must move forward one step at a time.");
    }
  }

  if (!user || accountRole !== "artist") return <main className="page-main"><div className="empty-state"><h1>Artist access required</h1></div></main>;
  const active = orders.filter((item) => !["delivered", "received", "cancelled"].includes(item.status));

  return <main className="page-main account-page">
    <header className="account-header"><p className="eyebrow">ARTIST STUDIO</p><h1>Order management</h1><p>Keep collectors informed from confirmation to delivery.</p></header>
    <section className="section">
      <div className="mini-stats"><div><span>Active</span><strong>{active.length}</strong></div><div><span>Awaiting dispatch</span><strong>{orders.filter((item) => item.status === "processing").length}</strong></div><div><span>Delivered</span><strong>{orders.filter((item) => ["delivered", "received"].includes(item.status)).length}</strong></div><div><span>Order value</span><strong>{formatPrice(orders.reduce((sum, item) => sum + item.total, 0))}</strong></div></div>
      {error && <p className="admin-error">{error}</p>}
      {orders.length ? <div className="table-card"><div className="table-row table-head"><span>Order</span><span>Artwork / collector</span><span>Value</span><span>Status</span><span>Update</span></div>{orders.map((item) => {
        const currentIndex = statuses.indexOf(item.status);
        const next = currentIndex >= 0 ? statuses[currentIndex + 1] : undefined;
        return <div className="table-row" key={item.id}><span>#{item.id.slice(0, 8)}</span><span>{item.artworkName} · {item.buyerName}</span><span>{formatPrice(item.total)}</span><span>{item.status}</span>{next ? <button className="approve" onClick={() => void change(item.id, next)}>Mark {next}</button> : <span>{item.status === "received" ? "Received by collector" : "No update needed"}</span>}</div>;
      })}</div> : <div className="empty-state"><h2>No artist orders yet.</h2><p>New real orders will appear here.</p></div>}
    </section>
  </main>;
}
