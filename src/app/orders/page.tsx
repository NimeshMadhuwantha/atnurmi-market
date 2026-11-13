import Link from "next/link";
import type { Metadata } from "next";
import { ArrowIcon, BagIcon, CheckIcon, HeartIcon, PackageIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Your Orders", robots: { index: false, follow: false } };

export default function OrdersPage() {
  return <main className="page-main account-page orders-page">
    <header className="account-header orders-header">
      <div><p className="eyebrow">YOUR COLLECTION</p><h1>Orders</h1><p>Follow every original from the artist&apos;s studio to your door.</p></div>
      <div className="order-header-actions">
        <Link href="/cart" className="order-shortcut"><span><BagIcon size={20}/></span><div><small>Ready to order?</small><strong>Go to cart</strong></div><ArrowIcon size={17}/></Link>
        <Link href="/wishlist" className="order-shortcut"><span><HeartIcon size={20}/></span><div><small>Saved pieces</small><strong>View wishlist</strong></div><ArrowIcon size={17}/></Link>
      </div>
    </header>
    <section className="orders-overview">
      <article className="order-empty-row">
        <div className="empty-icon"><PackageIcon size={38}/></div>
        <div className="order-empty-copy"><p className="eyebrow">NOTHING ON THE WAY — YET</p><h2>Your first original is waiting to be found.</h2><p>Once you place an order, preparation notes, dispatch updates, delivery progress, and feedback will all live here.</p></div>
        <div className="order-empty-action"><span>BEGIN YOUR COLLECTION</span><p>Browse artist-made originals selected for craft, story, and presence.</p><Link href="/explore" className="button primary large">Explore original art <ArrowIcon size={18}/></Link></div>
      </article>
      <article className="order-process-row">
        <div className="order-process-heading"><p className="eyebrow">WHAT HAPPENS NEXT</p><h2>A clear journey from the artist&apos;s studio to your wall.</h2><p>Every important stage stays visible in your account.</p></div>
        <div className="order-journey"><div><span><CheckIcon size={17}/></span><p><strong>Order confirmed</strong><small>Your artist receives the details securely.</small></p></div><div><span><CheckIcon size={17}/></span><p><strong>Prepared with care</strong><small>Follow creation, packing, and dispatch updates.</small></p></div><div><span><CheckIcon size={17}/></span><p><strong>Delivered safely</strong><small>Confirm receipt and share moderated feedback.</small></p></div></div>
        <div className="order-help"><PackageIcon size={20}/><p><strong>Need help?</strong><small>Speak directly with Atnurmi support on WhatsApp.</small></p><a href="https://wa.me/94769963432" target="_blank" rel="noreferrer">Contact support <ArrowIcon size={14}/></a></div>
      </article>
    </section>
  </main>;
}
