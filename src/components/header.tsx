/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { CartIcon, HeartIcon, MenuIcon, MoonIcon, SunIcon, UserIcon, XIcon } from "./icons";
import { useApp } from "./app-provider";
import { BrandMark } from "./brand-mark";

const customerLinks = [
  ["Home", "/"], ["Explore Arts", "/explore"], ["Artist Gigs", "/artist-gigs"],
  ["Orders", "/orders"], ["About Us", "/about"], ["Settings", "/settings"],
];
const artistLinks = [["Dashboard", "/dashboard"], ["Orders", "/seller/orders"], ["My Arts", "/my-arts"], ["Settings", "/settings"]];

export function Header() {
  const pathname = usePathname();
  const { role, user, profile, theme, toggleTheme, setAuthOpen, cart, wishlist } = useApp();
  const [open, setOpen] = useState(false);
  const links = role === "artist" ? artistLinks : customerLinks;
  const displayName = (profile?.displayName || user?.displayName || "").trim();
  const firstName = displayName.split(/\s+/)[0] || "My profile";
  const avatarUrl = profile?.photoUrl || user?.photoURL || "";
  const avatarFallback = (displayName || user?.email || "U")[0].toUpperCase();

  return (
    <header className="site-header">
      <Link href="/" className="brand" aria-label="Atnurmi Marketplace home"><BrandMark size={34} priority/><span>ATNURMI</span><small>MARKETPLACE</small></Link>
      <nav className={open ? "main-nav open" : "main-nav"} aria-label="Main navigation">
        {links.map(([label, href]) => <Link key={href} href={href} className={pathname === href ? "active" : ""} onClick={() => setOpen(false)}>{label}</Link>)}
      </nav>
      <div className="header-actions">
        <button className="icon-button theme-toggle" onClick={toggleTheme} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}>{theme === "dark" ? <SunIcon /> : <MoonIcon />}</button>
        {role !== "artist" && <>
          <Link className="icon-button badge-wrap" href="/wishlist" aria-label="Wishlist"><HeartIcon />{wishlist.length > 0 && <b>{wishlist.length}</b>}</Link>
          <Link className="icon-button badge-wrap" href="/cart" aria-label="Cart"><CartIcon />{cart.length > 0 && <b>{cart.length}</b>}</Link>
        </>}
        {role === "guest" ? <button className="signin-button" onClick={() => setAuthOpen(true)}><UserIcon size={18} /> <span>Sign in</span></button> : <Link href="/settings" className="profile-chip"><span>{avatarUrl ? <img src={avatarUrl} alt={`${displayName || "User"} profile`}/> : avatarFallback}</span><small>{firstName}</small></Link>}
        <button className="icon-button menu-button" onClick={() => setOpen(!open)} aria-label="Toggle menu">{open ? <XIcon /> : <MenuIcon />}</button>
      </div>
    </header>
  );
}

