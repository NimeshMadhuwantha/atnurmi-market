"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { GridIcon, OrdersIcon, SettingsIcon, StarIcon, UserIcon } from "./icons";

type Row = Record<string, unknown> & { id: string };
type AdminData = { applications: Row[]; artists: Row[]; artworks: Row[]; orders: Row[]; feedback: Row[] };
const empty: AdminData = { applications: [], artists: [], artworks: [], orders: [], feedback: [] };
const tabs = ["Dashboard", "Order manage", "Seller manage", "Feedback manage", "Settings"];
const text = (value: unknown) => String(value ?? "");
const money = (value: unknown) => `LKR ${new Intl.NumberFormat("en-LK").format(Number(value) || 0)}`;

export function AdminPanel() {
  const [logged, setLogged] = useState<boolean | null>(null);
  const [tab, setTab] = useState("Dashboard");
  const [data, setData] = useState<AdminData>(empty);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const response = await fetch("/api/admin/marketplace", { cache: "no-store" });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error ?? "Unable to load Firebase data.");
    setData(result);
  }, []);

  useEffect(() => { fetch("/api/admin/session", { cache: "no-store" }).then((response) => response.json()).then(async (result) => { setLogged(Boolean(result.authenticated)); if (result.authenticated) await load(); }).catch(() => setLogged(false)); }, [load]);

  async function signIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: form.get("email"), password: form.get("password") }) });
    const result = await response.json();
    if (!response.ok) { setError(result.error ?? "Unable to sign in."); setBusy(false); return; }
    setLogged(true);
    try { await load(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to load Firebase data."); }
    setBusy(false);
  }

  async function action(actionName: string, id: string, value?: number | boolean | string) {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/admin/marketplace", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: actionName, id, value }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Action failed.");
      await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Action failed."); }
    finally { setBusy(false); }
  }

  if (logged === null) return <main className="admin-login"><p>Checking secure admin session…</p></main>;
  if (!logged) return <main className="admin-login"><div className="admin-login-art"><span>ATN / INTERNAL</span><h1>Marketplace<br/>control room.</h1><p>Restricted access for the Atnurmi marketplace administrator.</p></div><form onSubmit={signIn}><div className="auth-brand"><span className="logo-gem"/> ATNURMI</div><p className="eyebrow">SECURE ADMIN ACCESS</p><h2>Sign in to continue</h2><label>Administrator email<input name="email" type="email" required/></label><label>Password<input name="password" type="password" required minLength={8}/></label>{error && <p className="admin-error">{error}</p>}<button className="button primary wide" disabled={busy}>{busy ? "Verifying…" : "Open admin panel"}</button><small>Five failed attempts temporarily lock sign-in from the same address.</small></form></main>;

  return <main className="admin-shell"><aside className="admin-sidebar"><div className="brand"><span className="logo-gem"/><span>ATNURMI</span><small>ADMINISTRATION</small></div><nav>{tabs.map((item, index) => { const Icon = [GridIcon, OrdersIcon, UserIcon, StarIcon, SettingsIcon][index]; return <button key={item} onClick={() => setTab(item)} className={tab === item ? "active" : ""}><Icon size={18}/>{item}</button>; })}</nav><button className="admin-profile" onClick={async () => { await fetch("/api/admin/session", { method: "DELETE" }); setLogged(false); }}><span>JM</span><small>Administrator<br/>Log out</small></button></aside><section className="admin-main"><header><div><p className="eyebrow">LIVE FIREBASE CONTROL</p><h1>{tab}</h1></div><div className="admin-header-actions"><button disabled={busy} onClick={async () => { setBusy(true); setError(""); try { await load(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to refresh Firebase data."); } finally { setBusy(false); } }}>Refresh Firebase</button><span className="status-pill">{busy ? "Updating…" : "Connected"}</span></div></header>{error && <p className="admin-error" role="alert">{error}</p>}{tab === "Dashboard" && <AdminDashboard data={data} action={action}/>} {tab === "Order manage" && <AdminOrders rows={data.orders} action={action}/>} {tab === "Seller manage" && <AdminSellers rows={data.artists} action={action}/>} {tab === "Feedback manage" && <AdminFeedback rows={data.feedback} action={action}/>} {tab === "Settings" && <div className="admin-card"><h2>Administration settings</h2><p>Credentials are stored only in server environment variables. Firebase Admin credentials are never sent to the browser.</p><p>{data.applications.length} applications · {data.artists.length} artists · {data.artworks.length} artworks currently loaded.</p></div>}</section></main>;
}

function AdminDashboard({ data, action }: { data: AdminData; action: (name: string, id: string, value?: number | boolean | string) => Promise<void> }) {
  const pending = data.applications.filter((item) => item.status === "pending");
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
  const completed = data.orders.filter((item) => ["received", "delivered"].includes(text(item.status)));
  const monthlySales = completed.filter((item) => !item.createdAt || new Date(text(item.createdAt)) >= monthStart).reduce((sum, item) => sum + Number(item.total ?? 0), 0);
  const statusCounts = useMemo(() => Object.entries(data.orders.reduce<Record<string, number>>((all, item) => { const status = text(item.status || "pending"); all[status] = (all[status] ?? 0) + 1; return all; }, {})), [data.orders]);
  const recentArtworks = useMemo(() => [...data.artworks].sort((a, b) => Date.parse(text(b.createdAt)) - Date.parse(text(a.createdAt))).slice(0, 5), [data.artworks]);
  return <><div className="stat-grid admin-stats"><div><span>TOTAL ARTWORKS</span><strong>{data.artworks.length}</strong><p>Live Firestore records</p></div><div><span>COMPLETED SALES</span><strong>{money(monthlySales)}</strong><p>{completed.length} delivered/received orders</p></div><div><span>ACTIVE ARTISTS</span><strong>{data.artists.filter((item) => !item.blocked).length}</strong><p>{pending.length} awaiting approval</p></div><div><span>PENDING FEEDBACK</span><strong>{data.feedback.filter((item) => item.status === "pending").length}</strong><p>Requires moderation</p></div></div><div className="admin-grid"><div className="admin-card"><p className="eyebrow">APPLICATION QUEUE</p><h2>Artist approvals</h2>{pending.length ? pending.map((item) => <div className="approval-row" key={item.id}><span>{text(item.fullName)[0] ?? "A"}</span><div><strong>{text(item.fullName)}</strong><small>{text(item.email)} · {text(item.whatsapp)}</small></div><button className="approve" onClick={() => action("approve-artist", item.id)}>Approve</button><button className="reject" onClick={() => action("decline-artist", item.id)}>Decline</button></div>) : <p>No pending artist applications.</p>}</div><div className="admin-card"><p className="eyebrow">AT A GLANCE</p><h2>Order status</h2>{statusCounts.length ? statusCounts.map(([name, value]) => <div className="bar-row" key={name}><span>{name}</span><i><b style={{ width: `${Math.min(100, value * 10)}%` }}/></i><strong>{value}</strong></div>) : <p>No orders yet.</p>}</div></div><div className="table-card"><div className="table-row table-head"><span>Recent artwork</span><span>Artist</span><span>Category</span><span>Price</span><span>Status</span></div>{recentArtworks.length ? recentArtworks.map((item) => <div className="table-row" key={item.id}><strong>{text(item.name || "Untitled artwork")}</strong><span>{text(item.artistName || item.artistId)}</span><span>{text(item.category)}</span><span>{money(item.price)}</span><span>{text(item.status || "published")}</span></div>) : <p className="admin-card">No artwork listings in Firestore yet.</p>}</div></>;
}

function AdminOrders({ rows, action }: { rows: Row[]; action: (name: string, id: string) => Promise<void> }) {
  if (!rows.length) return <div className="admin-card"><h2>No orders yet</h2><p>Real customer orders will appear here.</p></div>;
  return <div className="table-card"><div className="table-row table-head"><span>Order</span><span>Collector</span><span>Artist</span><span>Value</span><span>Status</span></div>{rows.map((item) => <div className="table-row" key={item.id}><span>#{item.id.slice(0, 8).toUpperCase()}</span><span>{text(item.buyerName || item.buyerId)}</span><span>{text(item.artistName || item.artistId)}</span><span>{money(item.total)}</span><span>{text(item.status)} <button className="reject" onClick={() => action("delete-order", item.id)}>Delete</button></span></div>)}</div>;
}

function AdminSellers({ rows, action }: { rows: Row[]; action: (name: string, id: string, value?: number | boolean | string) => Promise<void> }) {
  return <div className="admin-card"><div className="panel-heading"><div><p className="eyebrow">{rows.length} APPROVED ARTISTS</p><h2>Artist controls</h2></div></div>{rows.length ? rows.map((item) => <div className="seller-admin-row" key={item.id}><span>{text(item.displayName).split(" ").map((part) => part[0]).join("").slice(0, 2)}</span><div><strong>{text(item.displayName)}</strong><small>{text(item.email)}{item.whatsapp ? ` · WhatsApp ${text(item.whatsapp)}` : ""} · {Number(item.reviewCount ?? 0)} reviews</small></div><label>Art limit<select value={Number(item.artworkLimit ?? 10)} onChange={(event) => action("artist-limit", item.id, Number(event.target.value))}><option>10</option><option>15</option><option>20</option></select></label><button onClick={() => action("block-artist", item.id, !item.blocked)}>{item.blocked ? "Unblock" : "Block"}</button><button className="reject" onClick={() => confirm("Permanently delete this artist account?") && action("delete-artist", item.id)}>Delete</button></div>) : <p>No approved artists yet.</p>}</div>;
}

function AdminFeedback({ rows, action }: { rows: Row[]; action: (name: string, id: string, value?: string) => Promise<void> }) {
  if (!rows.length) return <div className="admin-card"><h2>No feedback yet</h2><p>Submitted order feedback will appear here for moderation.</p></div>;
  return <div className="feedback-grid">{rows.map((item) => <article className="admin-card" key={item.id}><div className="rating-row"><StarIcon size={16}/><strong>{Number(item.average ?? 0).toFixed(1)}</strong><span>{text(item.status)}</span></div><p>“{text(item.comment)}”</p><small>Service {text(item.service)} · Art quality {text(item.artQuality)} · Satisfaction {text(item.satisfaction)}</small><div>{item.status !== "approved" && <button className="approve" onClick={() => action("approve-feedback", item.id)}>Approve</button>}<button onClick={() => { const next = prompt("Edit feedback", text(item.comment)); if (next) void action("edit-feedback", item.id, next); }}>Edit</button><button className="reject" onClick={() => action("delete-feedback", item.id)}>Delete</button></div></article>)}</div>;
}
