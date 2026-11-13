"use client";

import { useMemo, useState } from "react";
import { artists } from "@/lib/data";
import { ImagePlaceholder } from "./image-placeholder";
import { ChevronDownIcon, FilterIcon, SearchIcon, StarIcon, WhatsAppIcon, XIcon } from "./icons";

export function ArtistDirectory() {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("All artists");
  const [rating, setRating] = useState("All ratings");
  const [sort, setSort] = useState("recommended");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const list = useMemo(() => {
    let visible = artists.filter((artist) => `${artist.name} ${artist.specialties.join(" ")}`.toLowerCase().includes(query.toLowerCase()) && (type === "All artists" || artist.specialties.some((specialty) => specialty.includes(type))) && (rating === "All ratings" || artist.rating >= Number(rating)));
    if (sort === "rating") visible = [...visible].sort((a, b) => b.rating - a.rating);
    if (sort === "reviews") visible = [...visible].sort((a, b) => b.reviews - a.reviews);
    return visible;
  }, [query, type, rating, sort]);

  const activeFilterCount = [type !== "All artists", rating !== "All ratings"].filter(Boolean).length;
  const hasAnySelection = Boolean(query) || sort !== "recommended" || activeFilterCount > 0;
  const clearMenuFilters = () => { setType("All artists"); setRating("All ratings"); };
  const resetAll = () => { setQuery(""); setSort("recommended"); clearMenuFilters(); };

  return <>
    <div className="discovery-toolbar artist-discovery-toolbar">
      <label className="discovery-search"><SearchIcon size={20}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search artists or specialties" aria-label="Search artists"/>{query && <button type="button" onClick={() => setQuery("")} aria-label="Clear search"><XIcon size={16}/></button>}</label>
      <div className="discovery-actions">
        <label className="sort-menu"><span>Sort by</span><select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort artists"><option value="recommended">Recommended</option><option value="rating">Highest rated</option><option value="reviews">Most reviewed</option></select><ChevronDownIcon size={16}/></label>
        <button type="button" className={`filters-menu-button ${filtersOpen ? "active" : ""}`} onClick={() => setFiltersOpen((open) => !open)} aria-expanded={filtersOpen}><FilterIcon size={18}/><span>Filters</span>{activeFilterCount > 0 && <b>{activeFilterCount}</b>}<ChevronDownIcon size={15}/></button>
        {hasAnySelection && <button type="button" className="toolbar-clear" onClick={resetAll}>Reset</button>}
      </div>
      {filtersOpen && <div className="filters-dropdown artist-filters-dropdown">
        <div className="filters-dropdown-head"><div><strong>Find the right artist</strong><span>Filter by specialty and rating</span></div><button type="button" onClick={() => setFiltersOpen(false)} aria-label="Close filters"><XIcon size={17}/></button></div>
        <div className="filters-dropdown-grid">
          <label><span>Art specialty</span><select value={type} onChange={(event) => setType(event.target.value)}><option>All artists</option><option>Original Art</option><option>Digital Art</option><option>Pencil Art</option></select></label>
          <label><span>Minimum rating</span><select value={rating} onChange={(event) => setRating(event.target.value)}><option>All ratings</option><option value="4">4+ stars</option><option value="4.5">4.5+ stars</option><option value="4.8">4.8+ stars</option></select></label>
        </div>
        <div className="filters-dropdown-foot"><button type="button" onClick={clearMenuFilters} disabled={!activeFilterCount}>Clear filters</button><button type="button" className="button primary" onClick={() => setFiltersOpen(false)}>Show {list.length} artists</button></div>
      </div>}
    </div>
    <div className="directory-results"><strong>{list.length}</strong> artists available for commissions</div>
    <div className="artist-grid">{list.map((artist) => <article className="artist-card" key={artist.id}><div className="artist-visual"><ImagePlaceholder label={`${artist.name} profile`} tone={artist.tone}/><span className="available-dot">Available</span></div><div className="artist-info"><div className="artist-title"><div className="avatar">{artist.initials}</div><div><h2>{artist.name}</h2><p>{artist.location}</p></div></div><div className="rating-row"><StarIcon size={16}/><strong>{artist.rating}</strong><span>({artist.reviews} approved reviews)</span></div><div className="tag-row">{artist.specialties.map((tag) => <span key={tag}>{tag}</span>)}</div><p>Open for personal commissions and carefully crafted original work.</p><a className="button whatsapp-button" href={`https://wa.me/${artist.whatsapp}?text=${encodeURIComponent(`Hello, I found ${artist.name} on Atnurmi Marketplace and would like to discuss a commission.`)}`} target="_blank" rel="noreferrer"><WhatsAppIcon size={18}/> Discuss your idea</a></div></article>)}</div>
  </>;
}
