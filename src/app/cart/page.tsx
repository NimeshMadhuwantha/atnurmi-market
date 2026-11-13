import type { Metadata } from "next";import { SavedItems } from "@/components/saved-items";
export const metadata:Metadata={title:"Your Cart",robots:{index:false,follow:false}};
export default function CartPage(){return <main className="page-main account-page"><header className="account-header"><p className="eyebrow">YOUR SELECTION</p><h1>Cart</h1></header><section className="section"><SavedItems type="cart"/></section></main>}

