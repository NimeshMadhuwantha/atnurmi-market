"use client";

import { useState } from "react";
import { useApp } from "./app-provider";
import { CheckIcon, WhatsAppIcon, XIcon } from "./icons";

export function JoinArtist() {
  const { user, accountRole, setAuthOpen } = useApp();
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return setAuthOpen(true);
    setBusy(true);
    setError("");
    const data = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/artist/application", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${await user.getIdToken()}` },
        body: JSON.stringify({
          fullName: data.get("fullName"), dateOfBirth: data.get("dateOfBirth"),
          address: data.get("address"), whatsapp: data.get("whatsapp"),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Application could not be submitted.");
      setSent(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Application could not be submitted.");
    } finally { setBusy(false); }
  }

  return <section className="join-section" id="join">
    <div className="join-copy"><p className="eyebrow">CREATE WITH ATNURMI</p><h2>There is room<br/>for your point of view.</h2><p>Approved artists use the same Google account for collecting and selling. No separate seller login or password is needed.</p><div className="join-steps"><div><b>01</b><span><strong>Share your portfolio</strong>Send your CV, full name, and sample artwork by WhatsApp or email.</span></div><div><b>02</b><span><strong>Meet the team</strong>We review your craft and hold a short artist interview.</span></div><div><b>03</b><span><strong>Request artist access</strong>Sign in with Google and submit the verified details below.</span></div></div></div>
    <div className="join-panel"><span className="panel-number">ARTIST / 01</span><h3>Apply to the<br/>artist collective</h3><p>Begin with a portfolio review. After the interview, submit your details using the same signed-in email.</p><a href="https://wa.me/94769963432?text=Hello%20Atnurmi%2C%20I%20would%20like%20to%20apply%20as%20an%20artist." target="_blank" rel="noreferrer" className="button whatsapp-button"><WhatsAppIcon size={18}/> Send portfolio on WhatsApp</a><a href="mailto:atnurmi.info@gmail.com?subject=Atnurmi%20Artist%20Application" className="button outline">Apply by email</a><div className="divider"><span>after your interview</span></div>
      {accountRole === "artist" ? <a className="button primary wide" href="/dashboard">Open artist dashboard</a> : <button className="text-link centered-link" onClick={() => user ? setOpen(true) : setAuthOpen(true)}>{user ? "Continue with signed-in email" : "Sign in with Google to continue"} <span>→</span></button>}
    </div>
    {open && <div className="modal-backdrop" onMouseDown={(event) => event.currentTarget === event.target && setOpen(false)}><section className="auth-modal join-modal" role="dialog" aria-modal="true" aria-labelledby="join-title"><button className="icon-button modal-close" onClick={() => setOpen(false)} aria-label="Close"><XIcon/></button>{sent ? <div className="success-state"><span><CheckIcon size={32}/></span><p className="eyebrow">APPLICATION RECEIVED</p><h2>Your request is awaiting admin approval.</h2><p>We will verify it against your portfolio review. After approval, sign out and sign in again to activate the artist dashboard.</p><button className="button primary" onClick={() => setOpen(false)}>Done</button></div> : <><p className="eyebrow">SIGNED IN AS {user?.email}</p><h2 id="join-title">Request artist access</h2><p className="muted">The email is taken securely from your Google account and cannot be changed here.</p><form className="form-grid" onSubmit={submit}><label className="full">Full legal name<input name="fullName" required autoComplete="name" defaultValue={user?.displayName ?? ""}/></label><label>Date of birth<input name="dateOfBirth" required type="date"/></label><label>Email address<input type="email" value={user?.email ?? ""} disabled/></label><label className="full">Address<textarea name="address" required rows={3}/></label><label className="full">WhatsApp number<input name="whatsapp" required type="tel" autoComplete="tel" placeholder="+94 7X XXX XXXX"/></label>{error && <p className="admin-error full" role="alert">{error}</p>}<button className="button primary wide full" disabled={busy} type="submit">{busy ? "Submitting…" : "Submit for admin approval"}</button></form></>}</section></div>}
  </section>;
}
