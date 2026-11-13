"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArtCard } from "./art-card";
import { ChevronDownIcon, FilterIcon, SearchIcon, XIcon } from "./icons";
import { categories } from "@/lib/data";
import { useArtworks } from "@/hooks/use-artworks";

export function ExploreClient() {
  const { artworks, source } = useArtworks();
  const params = useSearchParams();
  const [category, setCategory] = useState(params.get("category") ?? "All");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("featured");
  const [delivery, setDelivery] = useState("All delivery");
  const [size, setSize] = useState("All sizes");
  const [medium, setMedium] = useState("All media");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const visible = useMemo(() => {
    let list = artworks.filter((art) =>
      (category === "All" || art.category === category) &&
      `${art.name} ${art.artist} ${art.medium}`.toLowerCase().includes(query.toLowerCase()) &&
      (delivery === "All delivery" || art.delivery.toLowerCase().includes(delivery.toLowerCase())) &&
      (size === "All sizes" || art.size.toLowerCase().includes(size.toLowerCase())) &&
      (medium === "All media" || art.medium.toLowerCase().includes(medium.toLowerCase()))
    );
    if (sort === "low") list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "high") list = [...list].sort((a, b) => b.price - a.price);
    if (sort === "rating") list = [...list].sort((a, b) => b.rating - a.rating);
    return list;
  }, [artworks, category, query, sort, delivery, size, medium]);

  const activeFilterCount = [delivery !== "All delivery", size !== "All sizes", medium !== "All media"].filter(Boolean).length;
  const hasAnySelection = category !== "All" || Boolean(query) || sort !== "featured" || activeFilterCount > 0;
  const clearMenuFilters = () => { setDelivery("All delivery"); setSize("All sizes"); setMedium("All media"); };
  const resetAll = () => { setCategory("All"); setQuery(""); setSort("featured"); clearMenuFilters(); };

  return <>
    <div className="category-tabs category-rail">{categories.map((item) => <button key={item} className={category === item ? "active" : ""} onClick={() => setCategory(item)}>{item}</button>)}</div>
    <div className="discovery-toolbar">
      <label className="discovery-search"><SearchIcon size={20}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search art, artist or medium" aria-label="Search artwork"/>{query && <button type="button" onClick={() => setQuery("")} aria-label="Clear search"><XIcon size={16}/></button>}</label>
      <div className="discovery-actions">
        <label className="sort-menu"><span>Sort by</span><select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort artwork"><option value="featured">Featured</option><option value="low">Price: low first</option><option value="high">Price: high first</option><option value="rating">Highest rated</option></select><ChevronDownIcon size={16}/></label>
        <button type="button" className={`filters-menu-button ${filtersOpen ? "active" : ""}`} onClick={() => setFiltersOpen((open) => !open)} aria-expanded={filtersOpen}><FilterIcon size={18}/><span>Filters</span>{activeFilterCount > 0 && <b>{activeFilterCount}</b>}<ChevronDownIcon size={15}/></button>
        {hasAnySelection && <button type="button" className="toolbar-clear" onClick={resetAll}>Reset</button>}
      </div>
      {filtersOpen && <div className="filters-dropdown">
        <div className="filters-dropdown-head"><div><strong>Refine your search</strong><span>Choose any combination</span></div><button type="button" onClick={() => setFiltersOpen(false)} aria-label="Close filters"><XIcon size={17}/></button></div>
        <div className="filters-dropdown-grid">
          <label><span>Artwork size</span><select value={size} onChange={(event) => setSize(event.target.value)}><option>All sizes</option><option>A3</option><option value="60">Medium</option><option value="75">Statement</option></select></label>
          <label><span>Medium</span><select value={medium} onChange={(event) => setMedium(event.target.value)}><option>All media</option><option>Graphite</option><option>Acrylic</option><option>Watercolour</option><option>Digital</option></select></label>
          <label><span>Delivery</span><select value={delivery} onChange={(event) => setDelivery(event.target.value)}><option>All delivery</option><option>Free</option><option>Cash on delivery</option><option>Global</option></select></label>
        </div>
        <div className="filters-dropdown-foot"><button type="button" onClick={clearMenuFilters} disabled={!activeFilterCount}>Clear filters</button><button type="button" className="button primary" onClick={() => setFiltersOpen(false)}>Show {visible.length} works</button></div>
      </div>}
    </div>
    <div className="results-line"><p><strong>{visible.length}</strong> original works</p><span>{source === "demo" ? "Preview data · connect Firebase to show seller listings" : "Live seller listings from Atnurmi artists"}</span></div>
    {visible.length ? <div className="art-grid explore-grid">{visible.map((art) => <ArtCard art={art} key={art.id}/>)}</div> : <div className="empty-state"><SearchIcon size={40}/><h2>No pieces match just yet.</h2><p>Try a broader category or clear your search.</p><button className="button primary" onClick={resetAll}>Clear filters</button></div>}
  </>;
}
