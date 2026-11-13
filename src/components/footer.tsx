import Link from "next/link";
import { ArrowIcon, WhatsAppIcon } from "./icons";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-cta">
        <div><p className="eyebrow">A PIECE WORTH KEEPING</p><h2>Find art that feels<br />like it was made for you.</h2></div>
        <Link href="/explore" className="button light">Explore the collection <ArrowIcon size={17} /></Link>
      </div>
      <div className="footer-grid">
        <div><Link href="/" className="brand footer-brand"><span className="logo-gem" /><span>ATNURMI</span><small>MARKETPLACE</small></Link><p>Original artwork, thoughtful commissions, and direct connections with independent artists.</p><a className="whatsapp-link" href="https://wa.me/94769963432" target="_blank" rel="noreferrer"><WhatsAppIcon size={18} /> WhatsApp us</a></div>
        <div><h3>Marketplace</h3><Link href="/explore">Explore art</Link><Link href="/artist-gigs">Meet artists</Link><Link href="/orders">Track orders</Link><Link href="/wishlist">Wishlist</Link></div>
        <div><h3>Atnurmi</h3><Link href="/about">About us</Link><a href="https://www.atnurmi.com" target="_blank" rel="noreferrer">Main website</a><a href="mailto:atnurmi.info@gmail.com">Email us</a><Link href="/about#join">Join as an artist</Link></div>
        <div><h3>Stay inspired</h3><p>Occasional new arrivals and artist stories. No clutter.</p><form className="newsletter"><label className="sr-only" htmlFor="newsletter-email">Email address</label><input id="newsletter-email" type="email" placeholder="Email address" /><button aria-label="Subscribe"><ArrowIcon /></button></form><div className="socials"><a href="#">Instagram</a><a href="#">Facebook</a><a href="#">Pinterest</a></div></div>
      </div>
      <div className="footer-bottom"><span>© 2026 Atnurmi Marketplace. All rights reserved.</span><span>Made in Sri Lanka · Created for art everywhere.</span></div>
    </footer>
  );
}

