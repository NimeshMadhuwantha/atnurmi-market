import type { Metadata } from "next";
import { SettingsForm } from "@/components/settings-form";
export const metadata: Metadata = { title: "Settings", robots: { index: false, follow: false } };
export default function SettingsPage() { return <main className="page-main account-page"><header className="account-header"><p className="eyebrow">ACCOUNT</p><h1>Settings</h1><p>Manage your profile, delivery details, and preferences.</p></header><section className="section settings-section"><SettingsForm/></section></main>; }
