"use client";
import Link from "next/link";
import { useApp } from "./app-provider";
import { ArtCard } from "./art-card";
import { artworks, formatPrice } from "@/lib/data";
import { ArrowIcon, BagIcon, HeartIcon } from "./icons";
export function SavedItems({type}:{type:"cart"|"wishlist"}){const {cart,wishlist}=useApp();const ids=type==="cart"?cart:wishlist;const items=artworks.filter(a=>ids.includes(a.id));const total=items.reduce((sum,a)=>sum+a.price,0);if(!items.length)return <div className="empty-state saved-empty">{type==="cart"?<BagIcon size={44}/>:<HeartIcon size={44}/>}<h2>Your {type} is waiting.</h2><p>{type==="cart"?"Add an original and it will be kept here for checkout.":"Save artwork you love and return whenever you are ready."}</p><Link href="/explore" className="button primary">Explore art <ArrowIcon size={17}/></Link></div>;return <div className="saved-layout"><div className="art-grid">{items.map(a=><ArtCard art={a} key={a.id}/>)}</div>{type==="cart"&&<aside className="cart-summary"><p className="eyebrow">ORDER SUMMARY</p><div><span>Artwork subtotal</span><strong>{formatPrice(total)}</strong></div><div><span>Delivery</span><strong>Calculated per artwork</strong></div><hr/><div className="total"><span>Estimated total</span><strong>{formatPrice(total)}</strong></div><button className="button primary wide" disabled>Checkout coming soon</button><p>Payments will be added in the next release. Your cart is saved on this device.</p></aside>}</div>}

