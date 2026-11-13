"use client";

import { useState } from "react";
import { useApp } from "./app-provider";
import { XIcon } from "./icons";

export function AuthModal() {
  const { authOpen, setAuthOpen, setRole } = useApp();
  const [mode, setMode] = useState<"customer" | "artist">("customer");
  if (!authOpen) return null;

  const signInDemo = (role: "customer" | "artist") => {
    setRole(role);
    setAuthOpen(false);
  };

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setAuthOpen(false)}>
      <section className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title">
        <button className="icon-button modal-close" onClick={() => setAuthOpen(false)} aria-label="Close sign in"><XIcon /></button>
        <div className="auth-brand"><span className="logo-gem" /> ATNURMI</div>
        <p className="eyebrow">WELCOME TO THE COLLECTIVE</p>
        <h2 id="auth-title">Sign in to discover original art</h2>
        <p className="muted">Save pieces, contact artists, and track every order in one place.</p>
        <div className="segmented">
          <button className={mode === "customer" ? "active" : ""} onClick={() => setMode("customer")}>Collector</button>
          <button className={mode === "artist" ? "active" : ""} onClick={() => setMode("artist")}>Artist</button>
        </div>
        {mode === "customer" ? (
          <>
            <button className="google-button" onClick={() => signInDemo("customer")}><span className="google-g">G</span> Continue with Google</button>
            <p className="microcopy">Google authentication activates after your Firebase public configuration is added.</p>
          </>
        ) : (
          <form onSubmit={(event) => { event.preventDefault(); signInDemo("artist"); }}>
            <label>Email address<input required type="email" placeholder="artist@example.com" /></label>
            <label>Password<input required type="password" minLength={8} placeholder="••••••••" /></label>
            <button className="button primary wide" type="submit">Sign in as artist</button>
            <p className="microcopy">Artist accounts are created only after Atnurmi approval.</p>
          </form>
        )}
        <p className="terms">By continuing, you agree to the marketplace terms and privacy policy.</p>
      </section>
    </div>
  );
}

