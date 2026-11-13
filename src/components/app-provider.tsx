"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Artwork } from "@/lib/data";

type UserRole = "guest" | "customer" | "artist";

type AppState = {
  role: UserRole;
  setRole: (role: UserRole) => void;
  theme: "light" | "dark";
  toggleTheme: () => void;
  authOpen: boolean;
  setAuthOpen: (open: boolean) => void;
  cart: string[];
  wishlist: string[];
  addToCart: (art: Artwork) => void;
  toggleWishlist: (art: Artwork) => void;
  toast: string;
};

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<UserRole>("guest");
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [authOpen, setAuthOpen] = useState(false);
  const [cart, setCart] = useState<string[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [toast, setToast] = useState("");

  useEffect(() => {
    const savedTheme = localStorage.getItem("atnurmi-theme") as "light" | "dark" | null;
    const savedRole = localStorage.getItem("atnurmi-role") as UserRole | null;
    const nextTheme = savedTheme ?? (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
    document.documentElement.dataset.theme = nextTheme;
    const frame = requestAnimationFrame(() => {
      setTheme(nextTheme);
      if (savedRole) setRole(savedRole);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((current) => {
      const next = current === "dark" ? "light" : "dark";
      localStorage.setItem("atnurmi-theme", next);
      document.documentElement.dataset.theme = next;
      return next;
    });
  }, []);

  const updateRole = useCallback((next: UserRole) => {
    setRole(next);
    localStorage.setItem("atnurmi-role", next);
  }, []);

  const announce = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2200);
  }, []);

  const addToCart = useCallback((art: Artwork) => {
    setCart((items) => items.includes(art.id) ? items : [...items, art.id]);
    announce(`${art.name} added to your cart`);
  }, [announce]);

  const toggleWishlist = useCallback((art: Artwork) => {
    setWishlist((items) => items.includes(art.id) ? items.filter((id) => id !== art.id) : [...items, art.id]);
    announce(wishlist.includes(art.id) ? "Removed from wishlist" : "Saved to wishlist");
  }, [announce, wishlist]);

  const value = useMemo(() => ({ role, setRole: updateRole, theme, toggleTheme, authOpen, setAuthOpen, cart, wishlist, addToCart, toggleWishlist, toast }), [role, updateRole, theme, toggleTheme, authOpen, cart, wishlist, addToCart, toggleWishlist, toast]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const value = useContext(AppContext);
  if (!value) throw new Error("useApp must be used inside AppProvider");
  return value;
}

