"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  collection,
  doc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore/lite";
import { ArrowIcon, CartIcon, HeartIcon, PackageIcon } from "./icons";
import { useApp } from "./app-provider";
import { firestore } from "@/lib/firebase-client";
import { formatPrice } from "@/lib/data";

type Order = {
  id: string;
  artistId: string;
  status: string;
  total: number;
  artworkName: string;
  feedbackSubmitted: boolean;
};

export function CustomerOrders() {
  const { user, setAuthOpen } = useApp();
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!firestore || !user) return setOrders([]);
    const snapshot = await getDocs(query(collection(firestore, "orders"), where("buyerId", "==", user.uid), limit(100)));
    setOrders(snapshot.docs.map((item) => ({
      id: item.id,
      artistId: String(item.data().artistId),
      status: String(item.data().status ?? "pending"),
      total: Number(item.data().total ?? 0),
      artworkName: String(item.data().artworkSnapshot?.name ?? "Artwork"),
      feedbackSubmitted: Boolean(item.data().feedbackSubmitted),
    })));
  }, [user]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function received(order: Order) {
    if (!firestore) return;
    try {
      await updateDoc(doc(firestore, "orders", order.id), {
        status: "received",
        receivedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await load();
    } catch {
      setError("The order could not be updated.");
    }
  }

  async function feedback(order: Order) {
    if (!firestore || !user) return;
    const comment = prompt("Tell us about the artwork and service:")?.trim();
    if (!comment) return;
    const service = Number(prompt("Service rating from 1 to 5:", "5"));
    const artQuality = Number(prompt("Art quality rating from 1 to 5:", "5"));
    const satisfaction = Number(prompt("Satisfaction rating from 1 to 5:", "5"));
    const ratings = [service, artQuality, satisfaction];
    if (ratings.some((rating) => !Number.isInteger(rating) || rating < 1 || rating > 5)) {
      return setError("Every rating must be from 1 to 5.");
    }

    try {
      const batch = writeBatch(firestore);
      batch.set(doc(firestore, "feedback", order.id), {
        orderId: order.id,
        buyerId: user.uid,
        artistId: order.artistId,
        comment: comment.slice(0, 1000),
        service,
        artQuality,
        satisfaction,
        average: Math.round((service + artQuality + satisfaction) / 3 * 10) / 10,
        status: "pending",
        createdAt: serverTimestamp(),
      });
      batch.update(doc(firestore, "orders", order.id), {
        feedbackSubmitted: true,
        updatedAt: serverTimestamp(),
      });
      await batch.commit();
      await load();
    } catch {
      setError("Feedback could not be submitted or was already sent for this order.");
    }
  }

  return <main className="page-main account-page orders-page">
    <header className="account-header orders-header">
      <div><p className="eyebrow">YOUR COLLECTION</p><h1>Orders</h1><p>Follow every original from the artist&apos;s studio to your door.</p></div>
      <div className="order-header-actions">
        <Link href="/cart" className="order-shortcut"><span><CartIcon size={20}/></span><div><small>Ready to order?</small><strong>Go to cart</strong></div><ArrowIcon size={17}/></Link>
        <Link href="/wishlist" className="order-shortcut"><span><HeartIcon size={20}/></span><div><small>Saved pieces</small><strong>View wishlist</strong></div><ArrowIcon size={17}/></Link>
      </div>
    </header>
    <section className="orders-overview">
      {!user ? <article className="order-empty-row"><PackageIcon size={38}/><div><h2>Sign in to see your orders.</h2><button className="button primary" onClick={() => setAuthOpen(true)}>Continue with Google</button></div></article>
        : orders.length ? <div className="table-card">{error && <p className="admin-error">{error}</p>}<div className="table-row table-head"><span>Order</span><span>Artwork</span><span>Total</span><span>Status</span><span>Action</span></div>{orders.map((order) => <div className="table-row" key={order.id}><span>#{order.id.slice(0, 8)}</span><span>{order.artworkName}</span><span>{formatPrice(order.total)}</span><span>{order.status}</span><span>{order.status === "delivered" && <button className="approve" onClick={() => void received(order)}>Mark received</button>}{order.status === "received" && !order.feedbackSubmitted && <button className="approve" onClick={() => void feedback(order)}>Give feedback</button>}{order.feedbackSubmitted && "Feedback pending review"}</span></div>)}</div>
          : <article className="order-empty-row"><div className="empty-icon"><PackageIcon size={38}/></div><div className="order-empty-copy"><p className="eyebrow">NOTHING ON THE WAY — YET</p><h2>Your first original is waiting to be found.</h2><p>Real orders and delivery updates will appear here.</p></div><div className="order-empty-action"><Link href="/explore" className="button primary large">Explore original art <ArrowIcon size={18}/></Link></div></article>}
    </section>
  </main>;
}
