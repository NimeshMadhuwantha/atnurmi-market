import type { Metadata } from "next";
import { ArtManager } from "@/components/art-manager";
export const metadata: Metadata = { title: "My Art", robots: { index:false,follow:false } };
export default function MyArtsPage(){return <main className="page-main account-page"><header className="account-header"><p className="eyebrow">ARTIST STUDIO</p><h1>My artwork</h1><p>Create, edit, and monitor the work available in the marketplace.</p></header><section className="section"><ArtManager/></section></main>}

