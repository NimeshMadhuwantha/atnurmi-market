"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArtCard } from "./art-card";
import { FilterIcon, SearchIcon, XIcon } from "./icons";
import { artworks, categories } from "@/lib/data";

export function ExploreClient() {
  const params = useSearchParams();
  const [category, setCategory] = useState(params.get("category") ?? "All");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("featured");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [delivery, setDelivery] = useState("All delivery");

  const visible = useMemo(() => {
    let list = artworks.filter((art) => (category === "All" || art.category === category) && (`${art.name} ${art.artist} ${art.medium}`.toLowerCase().includes(query.toLowerCase())) && (delivery === "All delivery" || art.delivery.toLowerCase().includes(delivery.toLowerCase())));
    if (sort === "low") list = [...list].sort((a,b) => a.price - b.price);
    if (sort === "high") list = [...list].sort((a,b) => b.price - a.price);
    if (sort === "rating") list = [...list].sort((a,b) => b.rating - a.rating);
    return list;
  }, [category, query, sort, delivery]);

  return (
    <>
      <div className="category-tabs">{categories.map((item) => <button key={item} className={category === item ? "active" : ""} onClick={() => setCategory(item)}>{item}</button>)}</div>
      <div className="market-tools"><label className="search-box"><SearchIcon/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by artwork, artist, or medium" /></label><select aria-label="Sort artwork" value={sort} onChange={(event) => setSort(event.target.value)}><option value="featured">Featured first</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option><option value="rating">Highest rated</option></select><button className="button filter-button" onClick={() => setFiltersOpen(!filtersOpen)}><FilterIcon size={18}/> Filters</button></div>
      {filtersOpen && <div className="filter-panel"><div><strong>Delivery</strong>{["All delivery", "Free", "Cash on delivery", "Global"].map((item) => <label key={item}><input type="radio" name="delivery" checked={delivery === item} onChange={() => setDelivery(item)}/>{item}</label>)}</div><div><strong>Size</strong>{["A4 & smaller", "A3", "Medium", "Statement piece"].map((item) => <label key={item}><input type="checkbox"/>{item}</label>)}</div><div><strong>Medium</strong>{["Graphite", "Acrylic", "Watercolour", "Digital print"].map((item) => <label key={item}><input type="checkbox"/>{item}</label>)}</div><button className="icon-button" onClick={() => setFiltersOpen(false)} aria-label="Close filters"><XIcon/></button></div>}
      <div className="results-line"><p><strong>{visible.length}</strong> original works</p><span>Every listed piece is independently created.</span></div>
      {visible.length ? <div className="art-grid explore-grid">{visible.map((art) => <ArtCard art={art} key={art.id}/>)}</div> : <div className="empty-state"><SearchIcon size={40}/><h2>No pieces match just yet.</h2><p>Try a broader category or clear your search.</p><button className="button primary" onClick={() => {setCategory("All");setQuery("");setDelivery("All delivery");}}>Clear filters</button></div>}
    </>
  );
}

