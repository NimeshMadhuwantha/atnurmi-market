"use client";

import Link from "next/link";
import Image from "next/image";
import type { Artwork } from "@/lib/data";
import { formatPrice } from "@/lib/data";
import { BagIcon, HeartIcon, ShareIcon, StarIcon } from "./icons";
import { ImagePlaceholder } from "./image-placeholder";
import { useApp } from "./app-provider";

export function ArtCard({ art, compact = false }: { art: Artwork; compact?: boolean }) {
  const { wishlist, addToCart, toggleWishlist } = useApp();
  const saved = wishlist.includes(art.id);

  const share = async () => {
    const url = `${location.origin}/explore?art=${art.id}`;
    if (navigator.share) await navigator.share({ title: art.name, text: `Discover ${art.name} by ${art.artist}`, url });
    else await navigator.clipboard.writeText(url);
  };

  return (
    <article className={compact ? "art-card compact" : "art-card"}>
      <div className="art-image-wrap">{art.imageUrls?.[0] ? <Image className="art-photo" src={art.imageUrls[0]} alt={`${art.name} by ${art.artist}`} fill sizes="(max-width: 760px) 100vw, (max-width: 1080px) 50vw, 33vw" /> : <ImagePlaceholder label={`${art.name} artwork`} tone={art.tone} />}<span className="delivery-label">{art.delivery}</span><button className={`floating-action heart ${saved ? "saved" : ""}`} onClick={() => toggleWishlist(art)} aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}><HeartIcon size={19} /></button></div>
      <div className="art-card-body"><div className="card-meta"><span>{art.category}</span><span>{art.size}</span></div><h3>{art.name}</h3><p className="artist-line">by {art.artist} <span><StarIcon size={14} /> {art.rating}</span></p><strong className="price">{formatPrice(art.price)}</strong><div className="card-actions"><Link href={`/explore?art=${art.id}`} className="button ghost">View details</Link><button className="button primary icon-cart" onClick={() => addToCart(art)}><BagIcon size={17} /> <span>Add to cart</span></button><button className="icon-button" onClick={share} aria-label="Share artwork"><ShareIcon size={17} /></button></div></div>
    </article>
  );
}
