import type { Metadata } from "next";import { SavedItems } from "@/components/saved-items";
export const metadata:Metadata={title:"Wishlist",robots:{index:false,follow:false}};
export default function WishlistPage(){return <main className="page-main account-page"><header className="account-header"><p className="eyebrow">SAVED FOR LATER</p><h1>Wishlist</h1></header><section className="section"><SavedItems type="wishlist"/></section></main>}

