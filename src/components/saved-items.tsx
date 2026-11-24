"use client";
import Link from "next/link";
import { useApp } from "./app-provider";
import { ArtCard } from "./art-card";
import { formatPrice } from "@/lib/data";
import { useArtworks } from "@/hooks/use-artworks";
import { ArrowIcon, BagIcon, HeartIcon } from "./icons";
export function SavedItems({ type }: { type: "cart" | "wishlist" }) {
  const { cart, wishlist } = useApp(); const { artworks } = useArtworks(); const ids = type === "cart" ? cart : wishlist; const items = artworks.filter((item) => ids.includes(item.id)); const total = items.reduce((sum, item) => sum + item.price, 0);
  if (!items.length) return <div className="empty-state saved-empty">{type === "cart" ? <BagIcon size={44}/> : <HeartIcon size={44}/>}<h2>Your {type} is waiting.</h2><p>{type === "cart" ? "Add an original and it will be kept here for checkout." : "Save artwork you love and return whenever you are ready."}</p><Link href="/explore" className="button primary">Explore art <ArrowIcon size={17}/></Link></div>;
  return <div className="saved-layout"><div className="art-grid">{items.map((item) => <ArtCard art={item} key={item.id}/>)}</div>{type === "cart" && <aside className="cart-summary"><p className="eyebrow">ORDER SUMMARY</p><div><span>Artwork subtotal</span><strong>{formatPrice(total)}</strong></div><div><span>Delivery</span><strong>Calculated per artwork</strong></div><hr/><div className="total"><span>Estimated total</span><strong>{formatPrice(total)}</strong></div><button className="button primary wide" disabled>Payments coming later</button><p>Your cart is saved on this device.</p></aside>}</div>;
}
