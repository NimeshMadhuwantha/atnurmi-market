import Link from "next/link";
import { ArtCard } from "@/components/art-card";
import { ImagePlaceholder } from "@/components/image-placeholder";
import { ArrowIcon, CheckIcon, StarIcon } from "@/components/icons";
import { artworks } from "@/lib/data";

const categoryDetails = [
  ["Canvas Art", "Original texture, presence, and colour", "ocean"],
  ["Watercolour", "Light-filled washes and delicate stories", "garden"],
  ["Colour Pencil", "Vivid detail built one layer at a time", "koi"],
  ["Pencil Art", "Portraits shaped by graphite and patience", "graphite"],
];

export default function Home() {
  return (
    <main>
      <section className="hero">
        <div className="hero-art" aria-hidden="true"><div className="hero-shape shape-one"/><div className="hero-shape shape-two"/><div className="hero-shape shape-three"/><div className="hero-grid"/></div>
        <div className="hero-content"><p className="eyebrow">CURATED ORIGINALS · DIRECT FROM ARTISTS</p><h1>Art that makes<br />a space <em>your own.</em></h1><p className="hero-copy">Discover original pieces and thoughtful commissions by independent artists—created with care and delivered safely to your door.</p><div className="hero-actions"><Link href="/explore" className="button primary large">Explore original art <ArrowIcon size={18}/></Link><Link href="/artist-gigs" className="text-link">Commission an artist <span>↗</span></Link></div><div className="hero-trust"><span><CheckIcon size={15}/> Artist-verified originals</span><span><CheckIcon size={15}/> Safe delivery</span><span><CheckIcon size={15}/> Sri Lanka & worldwide</span></div></div>
        <div className="arrival-toast"><span className="arrival-thumb tone-garden"/><div><small>JUST ARRIVED</small><strong>Garden After Rain</strong><span>Watercolour · by Savi</span></div><Link href="/explore?art=garden-after-rain">View</Link></div>
        <div className="hero-index"><span>01</span><i/><span>05</span></div>
      </section>

      <section className="section category-section"><div className="section-heading split"><div><p className="eyebrow">FIND YOUR MEDIUM</p><h2>Explore art, your way.</h2></div><Link href="/explore" className="text-link">View every category <ArrowIcon size={17}/></Link></div><div className="category-grid">{categoryDetails.map(([name, copy, tone], index) => <Link href={`/explore?category=${encodeURIComponent(name)}`} key={name} className="category-card"><ImagePlaceholder label={`${name} category`} tone={tone}/><div><span>0{index + 1}</span><h3>{name}</h3><p>{copy}</p><i><ArrowIcon/></i></div></Link>)}</div></section>

      <section className="section featured-section"><div className="section-heading split"><div><p className="eyebrow">CURATOR&apos;S EDIT</p><h2>Featured originals.</h2><p>Distinctive work selected for its craft, story, and presence.</p></div><div className="collection-stat"><strong>06</strong><span>works in this week’s edit</span></div></div><div className="art-grid">{artworks.slice(0,4).map((art) => <ArtCard key={art.id} art={art}/>)}</div><div className="center-action"><Link href="/explore" className="button outline">View all artwork <ArrowIcon size={17}/></Link></div></section>

      <section className="commission-section"><div className="commission-image"><ImagePlaceholder label="Artist creating a custom portrait" tone="graphite"/><div className="image-caption"><span>01</span><p>From your story<br/>to their canvas.</p></div></div><div className="commission-copy"><p className="eyebrow">COMMISSION SOMETHING PERSONAL</p><h2>Your idea.<br/><em>An artist’s hand.</em><br/>One original.</h2><p>Turn a memory, person, place, or imagined world into a piece that exists nowhere else. Share your idea directly with an artist whose style feels right.</p><ul><li><CheckIcon/> Choose a specialist by medium</li><li><CheckIcon/> Discuss the concept on WhatsApp</li><li><CheckIcon/> Approve the direction before creation</li></ul><Link href="/artist-gigs" className="button light">Meet commission artists <ArrowIcon size={18}/></Link></div></section>

      <section className="section digital-section"><div className="section-heading centered"><p className="eyebrow">DIGITAL, BUT DEEPLY PERSONAL</p><h2>Imagination without a frame.</h2><p>Custom character art, concepts, wallpapers, and digital portraits—made around your story.</p></div><div className="digital-showcase"><ImagePlaceholder label="Digital character concept" tone="orbit"/><div className="digital-card"><span className="small-number">ATN / 05</span><h3>Bring a world<br/>to life.</h3><p>Work one-to-one with a digital artist to shape characters, environments, and visual ideas.</p><Link href="/artist-gigs" className="button primary">Contact a digital artist <ArrowIcon size={17}/></Link></div><ImagePlaceholder label="Digital landscape artwork" tone="ocean"/></div></section>

      <section className="proof-strip"><div><strong><StarIcon/> 4.9</strong><span>collector rating</span></div><div><strong>Original</strong><span>artist-made work</span></div><div><strong>Protected</strong><span>careful packaging</span></div><div><strong>Global</strong><span>delivery available</span></div></section>
    </main>
  );
}
