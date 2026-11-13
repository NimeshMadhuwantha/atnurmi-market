import type { Metadata } from "next";
import { ArrowIcon } from "@/components/icons";
import { ImagePlaceholder } from "@/components/image-placeholder";
import { JoinArtist } from "@/components/join-artist";

export const metadata: Metadata = { title: "About Atnurmi", description: "Atnurmi is a Sri Lankan art, design and web studio connecting original artists with collectors around the world." };

const studioServices = [
  ["01", "Art & Creation", "Pencil portraits, character sketches, concept art, and original work.", "graphite", "https://www.atnurmi.com/pencil-art"],
  ["02", "Graphic Design", "Brand identities, promotional design, visual assets, and digital campaigns.", "koi", "https://www.atnurmi.com/graphic-design"],
  ["03", "UI/UX Design", "Clear, responsive digital experiences shaped around real user journeys.", "garden", "https://www.atnurmi.com/services-page"],
  ["04", "Web Development", "Fast, scalable websites and custom systems built with modern technology.", "ocean", "https://www.atnurmi.com/web-development"],
];

const deliveryPoints = [
  ["Pencil Art & Character Sketches", "Detailed, expressive work created by hand."],
  ["Modern Graphic Solutions", "Visual systems that make brands feel considered."],
  ["Precision-Driven UI/UX", "Useful interfaces shaped around real people."],
  ["Creative Web Development", "Fast digital products with a clear point of view."],
];

export default function AboutPage() {
  return <main className="page-main about-page">
    <section className="about-studio-hero">
      <div className="about-hero-backdrop"><ImagePlaceholder label="Atnurmi art, design and web studio" tone="orbit"/></div>
      <div className="about-studio-content"><p className="eyebrow">ESTABLISHED 2025 · SRI LANKA</p><h1>A T N U R M I</h1><h2>Art, Design &amp; Web Studio</h2><p>See the next level of vision. We connect artistic craft, thoughtful design, and modern technology—and give independent artists a trusted place to be discovered.</p><div><a className="button light" href="https://www.atnurmi.com" target="_blank" rel="noreferrer">Visit the main studio <ArrowIcon size={17}/></a><a className="text-link" href="#studio">Explore our services</a></div></div>
      <div className="about-hero-foot"><span>ART</span><i/><span>DESIGN</span><i/><span>TECHNOLOGY</span></div>
    </section>
    <section className="about-facts"><div><strong>2025</strong><span>Established in Sri Lanka</span></div><div><strong>4</strong><span>Creative disciplines</span></div><div><strong>Global</strong><span>Service and delivery</span></div><div><strong>Personal</strong><span>Direct collaboration</span></div></section>
    <section className="section about-story-v2"><div><p className="eyebrow">OUR STORY</p><h2>A creative studio, growing into a collective.</h2></div><div><p>Atnurmi brings traditional art, graphic design, UI/UX, and web development into one focused practice. Every project begins with a human idea and ends with something clear, useful, and carefully made.</p><p>The Marketplace extends that same care to independent artists. It helps collectors discover original work and commissions while keeping the maker, story, material, and delivery journey visible.</p><a href="https://www.atnurmi.com/services-page" target="_blank" rel="noreferrer" className="text-link">Discover the main studio <ArrowIcon size={16}/></a></div></section>
    <section className="section purpose-section"><div className="purpose-heading"><div><p className="eyebrow">VISION &amp; MISSION</p><h2>Built around the value of original work.</h2></div><p>Small enough to stay personal. Structured enough to earn trust.</p></div><div className="purpose-cards"><article><span>VISION / 01</span><h3>Make original creative work easier to discover, trust, and keep.</h3><p>A marketplace where the maker and story are as clear as the artwork itself.</p></article><article><span>MISSION / 02</span><h3>Give artists a thoughtful digital home and collectors a direct connection.</h3><p>Artist-led listings, personal commissions, careful delivery, and useful feedback.</p></article></div></section>
    <section className="studio-services" id="studio"><div className="section studio-services-inner">
      <div className="studio-intro"><div><p className="eyebrow">THE WIDER ATNURMI STUDIO</p><h2>What we offer.</h2></div><p>Four connected services. One clear creative direction—from the first pencil line to a complete digital experience.</p><a href="https://www.atnurmi.com/services-page" target="_blank" rel="noreferrer" className="button outline">View studio services <ArrowIcon size={17}/></a></div>
      <div className="service-category-grid">{studioServices.map(([number, title, description, tone, href]) => <a href={href} target="_blank" rel="noreferrer" className="service-category-card" key={number}><div className="service-image"><ImagePlaceholder label={`${title} service`} tone={tone}/><span>{number}</span></div><div><h3>{title}</h3><p>{description}</p><i><ArrowIcon size={18}/></i></div></a>)}</div>
      <div className="studio-deliver"><div className="studio-deliver-title"><p className="eyebrow">WHAT WE DELIVER</p><h2>Creative work with clarity and purpose.</h2></div><div className="delivery-point-grid">{deliveryPoints.map(([title, copy], index) => <article key={title}><span>0{index + 1}</span><h3>{title}</h3><p>{copy}</p></article>)}</div></div>
    </div></section>
    <JoinArtist/>
  </main>;
}
