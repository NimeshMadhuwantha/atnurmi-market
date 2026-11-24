"use client";

import { useState } from "react";
import { useApp } from "./app-provider";
import { GoogleIcon, XIcon } from "./icons";
import { BrandMark } from "./brand-mark";

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
    <section className="auth-modal google-auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title">
      <button className="icon-button modal-close" onClick={() => setAuthOpen(false)} aria-label="Close sign in"><XIcon /></button>
      <div className="auth-brand"><BrandMark size={42}/><span>ATNURMI</span></div>
      <div className="google-auth-kicker"><GoogleIcon size={18}/> Google sign-in</div>
      <h2 id="auth-title">Continue with <span className="google-wordmark" aria-label="Google"><i>G</i><i>o</i><i>o</i><i>g</i><i>l</i><i>e</i></span></h2>
      <p className="auth-intro">Save the art you love, follow your orders, and connect with artists.</p>
      <button className="google-button" disabled={busy} onClick={() => void signIn()}><GoogleIcon size={20}/><span>{busy ? "Connecting…" : "Continue with Google"}</span></button>
      {error && <p className="admin-error" role="alert">{error}</p>}
      <p className="terms">Google securely confirms your identity. Atnurmi never receives your Google password.</p>
    </section>
  </div>;
}
