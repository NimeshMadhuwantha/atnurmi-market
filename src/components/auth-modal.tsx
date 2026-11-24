"use client";

import { useState } from "react";
import { useApp } from "./app-provider";
import { XIcon } from "./icons";

function authErrorMessage(cause: unknown) {
  const code = typeof cause === "object" && cause && "code" in cause ? String(cause.code) : "";
  const messages: Record<string, string> = {
    "auth/popup-closed-by-user": "The Google sign-in window was closed before sign-in finished.",
    "auth/popup-blocked": "Your browser blocked the Google sign-in window. Allow popups for this site and try again.",
    "auth/cancelled-popup-request": "A Google sign-in window is already open.",
    "auth/network-request-failed": "Google sign-in could not reach the network. Check your connection and try again.",
    "auth/unauthorized-domain": "This website address is not authorized in Firebase Authentication.",
    "auth/operation-not-allowed": "Google sign-in is not enabled in Firebase Authentication.",
    "auth/internal-error": "Google sign-in could not start. Refresh the page and try again.",
  };
  return messages[code] ?? "Unable to sign in with Google. Please try again.";
}

export function AuthModal() {
  const { authOpen, setAuthOpen, signInWithGoogle } = useApp();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  if (!authOpen) return null;

  async function signIn() {
    setBusy(true);
    setError("");
    try {
      await signInWithGoogle();
      setAuthOpen(false);
    } catch (cause) {
      setError(authErrorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setAuthOpen(false)}>
    <section className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title">
      <button className="icon-button modal-close" onClick={() => setAuthOpen(false)} aria-label="Close sign in"><XIcon /></button>
      <div className="auth-brand"><span className="logo-gem" /> ATNURMI</div>
      <p className="eyebrow">ONE ACCOUNT FOR EVERYTHING</p>
      <h2 id="auth-title">Continue with Google</h2>
      <p className="muted">Use one Google account to collect art. Approved members automatically receive artist tools on the same account.</p>
      <button className="google-button" disabled={busy} onClick={() => void signIn()}><span className="google-g">G</span> {busy ? "Connecting…" : "Continue with Google"}</button>
      {error && <p className="admin-error" role="alert">{error}</p>}
      <p className="terms">Artist access is requested from the About Us page and activated only after Atnurmi approval.</p>
    </section>
  </div>;
}
