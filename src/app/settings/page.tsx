import type { Metadata } from "next";
import { SettingsForm } from "@/components/settings-form";
export const metadata: Metadata = { title: "Settings", robots: { index: false, follow: false } };
export default function SettingsPage() { return <main className="page-main account-page settings-page"><header className="account-header settings-header"><div><p className="eyebrow">YOUR ACCOUNT</p><h1>Settings</h1><p>Manage your profile, delivery details, preferences, and security in one place.</p></div><div className="settings-summary" aria-label="Settings sections"><span>Profile</span><i/><span>Delivery</span><i/><span>Appearance</span><i/><span>Security</span></div></header><section className="section settings-section"><SettingsForm/></section></main>; }
