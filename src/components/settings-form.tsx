/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import { useApp } from "./app-provider";
import { CameraIcon, MoonIcon, SunIcon, TrashIcon, XIcon } from "./icons";
import { optimizeProfileDataUrl } from "@/lib/image-optimizer";

type Address = {
  line1?: string;
  line2?: string;
  town?: string;
  postalCode?: string;
  district?: string;
  country?: string;
};

type Profile = {
  displayName: string;
  phone: string;
  optionalPhone: string;
  whatsapp: string;
  photoUrl: string;
  address: Address;
};

const blankProfile = (): Profile => ({
  displayName: "",
  phone: "",
  optionalPhone: "",
  whatsapp: "",
  photoUrl: "",
  address: { country: "Sri Lanka" },
});

export function SettingsForm() {
  const { user, role, accountRole, theme, toggleTheme, logOut, setAuthOpen, updateProfile } = useApp();
  const [profile, setProfile] = useState<Profile>(blankProfile);
  const [confirm, setConfirm] = useState<"logout" | "delete" | null>(null);
  const [deleteText, setDeleteText] = useState("");
  const [message, setMessage] = useState("");
  const [messageLocation, setMessageLocation] = useState<"profile" | "address">("profile");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      return;
    }

    let active = true;
    async function loadProfile() {
      setLoading(true);
      setMessage("");
      try {
        const response = await fetch("/api/account", {
          cache: "no-store",
          headers: { Authorization: `Bearer ${await user!.getIdToken()}` },
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error ?? "Unable to load your profile.");
        if (!active) return;
        const saved = result.profile ?? {};
        setProfile({
          displayName: String(saved.displayName ?? user!.displayName ?? ""),
          phone: String(saved.phone ?? ""),
          optionalPhone: String(saved.optionalPhone ?? ""),
          whatsapp: String(saved.whatsapp ?? ""),
          photoUrl: String(saved.photoUrl ?? user!.photoURL ?? ""),
          address: { ...blankProfile().address, ...(saved.address ?? {}) },
        });
      } catch (cause) {
        if (active) setMessage(cause instanceof Error ? cause.message : "Unable to load your profile.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadProfile();
    return () => { active = false; };
  }, [user, accountRole]);

  async function save(location: "profile" | "address") {
    if (!user) return setAuthOpen(true);
    setBusy(true);
    setMessage("");
    setMessageLocation(location);
    try {
      const response = await fetch("/api/account", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await user.getIdToken()}`,
        },
        body: JSON.stringify(profile),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Unable to save your profile.");
      const saved = result.profile ?? profile;
      setProfile((current) => ({ ...current, ...saved, address: { ...current.address, ...(saved.address ?? {}) } }));
      updateProfile({
        displayName: String(saved.displayName ?? profile.displayName),
        photoUrl: String(saved.photoUrl ?? profile.photoUrl),
        phone: String(saved.phone ?? profile.phone),
        optionalPhone: String(saved.optionalPhone ?? profile.optionalPhone),
        whatsapp: String(saved.whatsapp ?? profile.whatsapp),
      });
      setMessage(location === "profile" ? "Profile details saved." : "Delivery address saved.");
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Unable to save your profile.");
    } finally {
      setBusy(false);
    }
  }

  async function photo(file?: File) {
    if (!file) return;
    setMessageLocation("profile");
    try {
      setMessage("Optimizing profile image…");
      const photoUrl = await optimizeProfileDataUrl(file);
      setProfile((current) => ({ ...current, photoUrl }));
      setMessage("Profile image ready. Select Save profile to apply it everywhere.");
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Image could not be processed.");
    }
  }

  async function removeAccount() {
    if (!user) return;
    setBusy(true);
    try {
      const response = await fetch("/api/account", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${await user.getIdToken()}` },
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Unable to delete account.");
      setConfirm(null);
      await logOut();
    } catch (cause) {
      setMessageLocation("profile");
      setMessage(cause instanceof Error ? cause.message : "Unable to delete account.");
    } finally {
      setBusy(false);
    }
  }

  if (!user) return <div className="empty-state"><h2>Sign in to manage settings.</h2><button className="button primary" onClick={() => setAuthOpen(true)}>Continue with Google</button></div>;
  if (loading) return <div className="empty-state compact-state"><h2>Loading your profile…</h2></div>;

  const field = (key: keyof Omit<Profile, "address">, value: string) => setProfile((current) => ({ ...current, [key]: value }));
  const address = (key: keyof Address, value: string) => setProfile((current) => ({ ...current, address: { ...current.address, [key]: value } }));
  const avatarFallback = (profile.displayName || user.email || "U").trim()[0]?.toUpperCase() ?? "U";

  return <>
    <div className="settings-layout">
      <aside className="settings-nav"><a href="#profile" className="active">Profile details</a><a href="#address">Delivery address</a><a href="#appearance">Appearance</a><a href="#security">Account & security</a></aside>
      <div className="settings-content">
        <section id="profile" className="settings-card">
          <div className="settings-title"><div><p className="eyebrow">YOUR IDENTITY</p><h2>Profile details</h2></div><span className="status-pill">{role === "artist" ? "Artist view" : "Collector view"}</span></div>
          <div className="profile-upload"><div>{profile.photoUrl ? <img src={profile.photoUrl} alt={`${profile.displayName || "User"} profile`}/> : avatarFallback}</div><label className="button outline"><CameraIcon size={17}/> Change photo<input hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => void photo(event.target.files?.[0])}/></label><p>JPG, PNG, or WebP up to 12 MB. Saved as an optimized WebP.</p></div>
          <div className="form-grid">
            <label>Display name<input value={profile.displayName} onChange={(event) => field("displayName", event.target.value)}/></label>
            <label>Email address<input value={user.email ?? ""} disabled/></label>
            <label>Main mobile number<input type="tel" autoComplete="tel" value={profile.phone} onChange={(event) => field("phone", event.target.value)}/></label>
            <label>Optional mobile number<input type="tel" value={profile.optionalPhone} onChange={(event) => field("optionalPhone", event.target.value)}/></label>
            <label className="full">{accountRole === "artist" ? "WhatsApp number (public artist contact)" : "WhatsApp number"}<input type="tel" autoComplete="tel" placeholder="+94 7X XXX XXXX" value={profile.whatsapp} onChange={(event) => field("whatsapp", event.target.value)}/></label>
            <button className="button primary" disabled={busy} type="button" onClick={() => void save("profile")}>{busy ? "Saving…" : "Save profile"}</button>
            {message && messageLocation === "profile" && <p className="image-status full" role="status">{message}</p>}
          </div>
        </section>
        <section id="address" className="settings-card">
          <div className="settings-title"><div><p className="eyebrow">SAFE DELIVERY</p><h2>Delivery address</h2></div></div>
          <div className="form-grid">
            <label className="full">Address line 1<input value={profile.address.line1 ?? ""} onChange={(event) => address("line1", event.target.value)}/></label>
            <label className="full">Address line 2<input value={profile.address.line2 ?? ""} onChange={(event) => address("line2", event.target.value)}/></label>
            <label>Town / city<input value={profile.address.town ?? ""} onChange={(event) => address("town", event.target.value)}/></label>
            <label>Postal code<input value={profile.address.postalCode ?? ""} onChange={(event) => address("postalCode", event.target.value)}/></label>
            <label>District<input value={profile.address.district ?? ""} onChange={(event) => address("district", event.target.value)}/></label>
            <label>Country<input value="Sri Lanka" disabled/></label>
            <button className="button primary" disabled={busy} type="button" onClick={() => void save("address")}>{busy ? "Saving…" : "Save delivery address"}</button>
            {message && messageLocation === "address" && <p className="image-status full" role="status">{message}</p>}
          </div>
        </section>
        <section id="appearance" className="settings-card"><div className="settings-title"><div><p className="eyebrow">MAKE IT YOURS</p><h2>Appearance</h2></div></div><button className="theme-choice" onClick={toggleTheme}>{theme === "dark" ? <MoonIcon size={25}/> : <SunIcon size={25}/>}<span><strong>{theme === "dark" ? "Dark mode" : "Light mode"}</strong><small>Switch appearance</small></span><i className="switch active"/></button></section>
        <section id="security" className="settings-card danger-card"><div><p className="eyebrow">ACCOUNT & SECURITY</p><h2>Session controls</h2></div><button className="button outline" onClick={() => setConfirm("logout")}>Log out</button><button className="button danger" onClick={() => setConfirm("delete")}><TrashIcon size={17}/> Delete account</button></section>
      </div>
    </div>
    {confirm && <div className="modal-backdrop"><section className="confirm-modal"><button className="icon-button modal-close" onClick={() => setConfirm(null)} aria-label="Close confirmation"><XIcon/></button><h2>{confirm === "logout" ? "Log out of Atnurmi?" : "Permanently delete this account?"}</h2><p>{confirm === "logout" ? "You can sign in again with Google at any time." : "Active orders must be completed first. This cannot be undone."}</p>{confirm === "delete" && <label>Type <strong>Delete</strong> to confirm<input value={deleteText} onChange={(event) => setDeleteText(event.target.value)}/></label>}<div><button className="button outline" onClick={() => setConfirm(null)}>Cancel</button><button className="button danger" disabled={busy || (confirm === "delete" && deleteText !== "Delete")} onClick={() => void (confirm === "logout" ? logOut().then(() => setConfirm(null)) : removeAccount())}>Yes, {confirm === "logout" ? "log out" : "delete account"}</button></div></section></div>}
  </>;
}
