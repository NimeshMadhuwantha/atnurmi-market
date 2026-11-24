"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { collection, getDocs, limit, query, where } from "firebase/firestore/lite";
import type { Artist } from "@/lib/data";
import { firestore } from "@/lib/firebase-client";
import { ImagePlaceholder } from "./image-placeholder";
import { ChevronDownIcon, FilterIcon, SearchIcon, StarIcon, WhatsAppIcon, XIcon } from "./icons";

export function ArtistDirectory() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [queryText, setQueryText] = useState("");
  const [type, setType] = useState("All artists");
  const [rating, setRating] = useState("All ratings");
  const [sort, setSort] = useState("recommended");
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    if (!firestore) return;
    getDocs(query(collection(firestore, "artists"), where("status", "==", "active"), where("blocked", "==", false), limit(100))).then((snapshot) => {
      setArtists(snapshot.docs.filter((item) => !item.data().blocked).map((item) => {
        const data = item.data();
        const name = String(data.displayName ?? "Atnurmi Artist");
        return { id: item.id, name, initials: name.split(" ").map((part) => part[0]).join("").slice(0, 2), rating: Number(data.rating ?? 0), reviews: Number(data.reviewCount ?? 0), specialties: Array.isArray(data.specialties) ? data.specialties.map(String) : ["Original Art"], location: String(data.location ?? "Sri Lanka"), whatsapp: String(data.whatsapp ?? ""), tone: "ocean", photoUrl: String(data.photoUrl ?? "") };
      }));
    }).catch(() => setArtists([]));
  }, []);

  const list = useMemo(() => {
    let visible = artists.filter((artist) => `${artist.name} ${artist.specialties.join(" ")}`.toLowerCase().includes(queryText.toLowerCase()) && (type === "All artists" || artist.specialties.some((specialty) => specialty.includes(type))) && (rating === "All ratings" || artist.rating >= Number(rating)));
    if (sort === "rating") visible = [...visible].sort((a, b) => b.rating - a.rating);
    if (sort === "reviews") visible = [...visible].sort((a, b) => b.reviews - a.reviews);
    return visible;
  }, [artists, queryText, type, rating, sort]);

  const activeFilterCount = [type !== "All artists", rating !== "All ratings"].filter(Boolean).length;
  const resetAll = () => { setQueryText(""); setSort("recommended"); setType("All artists"); setRating("All ratings"); };
  return <>
    <div className="discovery-toolbar artist-discovery-toolbar"><label className="discovery-search"><SearchIcon size={20}/><input value={queryText} onChange={(event) => setQueryText(event.target.value)} placeholder="Search artists or specialties" aria-label="Search artists"/>{queryText && <button type="button" onClick={() => setQueryText("")} aria-label="Clear search"><XIcon size={16}/></button>}</label><div className="discovery-actions"><label className="sort-menu"><span>Sort by</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="recommended">Recommended</option><option value="rating">Highest rated</option><option value="reviews">Most reviewed</option></select><ChevronDownIcon size={16}/></label><button type="button" className={`filters-menu-button ${filtersOpen ? "active" : ""}`} onClick={() => setFiltersOpen(!filtersOpen)}><FilterIcon size={18}/><span>Filters</span>{activeFilterCount > 0 && <b>{activeFilterCount}</b>}</button><button type="button" className="toolbar-clear" onClick={resetAll}>Reset</button></div>{filtersOpen && <div className="filters-dropdown artist-filters-dropdown"><div className="filters-dropdown-grid"><label><span>Art specialty</span><select value={type} onChange={(event) => setType(event.target.value)}><option>All artists</option><option>Original Art</option><option>Digital Art</option><option>Pencil Art</option></select></label><label><span>Minimum rating</span><select value={rating} onChange={(event) => setRating(event.target.value)}><option>All ratings</option><option value="4">4+ stars</option><option value="4.5">4.5+ stars</option></select></label></div></div>}</div>
    <div className="directory-results"><strong>{list.length}</strong> approved artists available</div>
    {list.length ? <div className="artist-grid">{list.map((artist) => <article className="artist-card" key={artist.id}><div className="artist-visual">{artist.photoUrl ? <Image src={artist.photoUrl} alt={artist.name} fill sizes="400px" /> : <ImagePlaceholder label={`${artist.name} profile`} tone={artist.tone}/>}<span className="available-dot">Available</span></div><div className="artist-info"><div className="artist-title"><div className="avatar">{artist.initials}</div><div><h2>{artist.name}</h2><p>{artist.location}</p></div></div><div className="rating-row"><StarIcon size={16}/><strong>{artist.rating || "New"}</strong><span>({artist.reviews} approved reviews)</span></div><div className="tag-row">{artist.specialties.map((tag) => <span key={tag}>{tag}</span>)}</div>{artist.whatsapp && <a className="button whatsapp-button" href={`https://wa.me/${artist.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer"><WhatsAppIcon size={18}/> Discuss your idea</a>}</div></article>)}</div> : <div className="empty-state"><h2>No approved artists yet.</h2><p>Approved artist profiles will appear here automatically.</p></div>}
  </>;
}
