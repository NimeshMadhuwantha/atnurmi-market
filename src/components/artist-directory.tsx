"use client";

import { useMemo, useState } from "react";
import { artists } from "@/lib/data";
import { ImagePlaceholder } from "./image-placeholder";
import { SearchIcon, StarIcon, WhatsAppIcon } from "./icons";

export function ArtistDirectory() {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("All artists");
  const list = useMemo(() => artists.filter((artist) => `${artist.name} ${artist.specialties.join(" ")}`.toLowerCase().includes(query.toLowerCase()) && (type === "All artists" || artist.specialties.some((s) => s.includes(type)))), [query, type]);
  return <><div className="market-tools artist-tools"><label className="search-box"><SearchIcon/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search artists or specialties"/></label><select value={type} onChange={(e) => setType(e.target.value)}><option>All artists</option><option>Original Art</option><option>Digital Art</option><option>Pencil Art</option></select></div><div className="artist-grid">{list.map((artist) => <article className="artist-card" key={artist.id}><div className="artist-visual"><ImagePlaceholder label={`${artist.name} profile`} tone={artist.tone}/><span className="available-dot">Available</span></div><div className="artist-info"><div className="artist-title"><div className="avatar">{artist.initials}</div><div><h2>{artist.name}</h2><p>{artist.location}</p></div></div><div className="rating-row"><StarIcon size={16}/><strong>{artist.rating}</strong><span>({artist.reviews} approved reviews)</span></div><div className="tag-row">{artist.specialties.map((tag) => <span key={tag}>{tag}</span>)}</div><p>Open for personal commissions and carefully crafted original work.</p><a className="button whatsapp-button" href={`https://wa.me/${artist.whatsapp}?text=${encodeURIComponent(`Hello, I found ${artist.name} on Atnurmi Marketplace and would like to discuss a commission.`)}`} target="_blank" rel="noreferrer"><WhatsAppIcon size={18}/> Discuss your idea</a></div></article>)}</div></>;
}

