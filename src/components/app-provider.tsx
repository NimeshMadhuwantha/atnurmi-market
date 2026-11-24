"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import type { Artwork } from "@/lib/data";
import { firebaseAuth, firestore, requireFirebaseServices } from "@/lib/firebase-client";

type UserRole = "guest" | "customer" | "artist";
type UserProfile = {
  displayName?: string;
  email?: string;
  photoUrl?: string;
  phone?: string;
  role: "customer" | "artist";
};

async function saveUserProfile(nextUser: User, role: "customer" | "artist") {
  if (!firestore) return null;

  const userRef = doc(firestore, "users", nextUser.uid);
  const existing = await getDoc(userRef);
  const profile = {
    displayName: nextUser.displayName ?? "",
    email: nextUser.email ?? "",
    photoUrl: nextUser.photoURL ?? "",
    role,
    updatedAt: serverTimestamp(),
  };

  if (!existing.exists()) {
    await setDoc(userRef, { ...profile, createdAt: serverTimestamp() });
  }

  return existing.exists() ? existing.data() as UserProfile : profile;
}

type AppState = {
  role: UserRole;
  setRole: (role: UserRole) => void;
  accountRole: UserRole;
  user: User | null;
  profile: UserProfile | null;
  updateProfile: (changes: Partial<UserProfile>) => void;
  authLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  logOut: () => Promise<void>;
  toggleRoleView: () => void;
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
  const [accountRole, setAccountRole] = useState<UserRole>("guest");
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(() => Boolean(firebaseAuth));
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [authOpen, setAuthOpen] = useState(false);
  const [cart, setCart] = useState<string[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [savedReady, setSavedReady] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    const savedTheme = localStorage.getItem("atnurmi-theme") as "light" | "dark" | null;
    const nextTheme = savedTheme ?? (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
    document.documentElement.dataset.theme = nextTheme;
    const frame = requestAnimationFrame(() => setTheme(nextTheme));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    try {
      setCart(JSON.parse(localStorage.getItem("atnurmi-cart") ?? "[]"));
      setWishlist(JSON.parse(localStorage.getItem("atnurmi-wishlist") ?? "[]"));
    } finally { setSavedReady(true); }
  }, []);

  useEffect(() => { if (savedReady) localStorage.setItem("atnurmi-cart", JSON.stringify(cart)); }, [cart, savedReady]);
  useEffect(() => { if (savedReady) localStorage.setItem("atnurmi-wishlist", JSON.stringify(wishlist)); }, [wishlist, savedReady]);

  useEffect(() => {
    if (!firebaseAuth) {
      return;
    }

    return onAuthStateChanged(firebaseAuth, async (nextUser) => {
      setUser(nextUser);
      if (!nextUser) {
        setProfile(null);
        setAccountRole("guest");
        setRole("guest");
        setAuthLoading(false);
        return;
      }

      try {
        const token = await nextUser.getIdTokenResult();
        const nextRole = token.claims.role === "artist" ? "artist" as const : "customer" as const;
        setAccountRole(nextRole);
        setRole(nextRole);
        setProfile(await saveUserProfile(nextUser, nextRole));
      } catch (error) {
        console.error("Unable to load the Firebase user profile", error);
        setAccountRole("customer");
        setRole("customer");
        setProfile({
          displayName: nextUser.displayName ?? "",
          email: nextUser.email ?? "",
          photoUrl: nextUser.photoURL ?? "",
          role: "customer",
        });
      } finally {
        setAuthLoading(false);
      }
    });
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((current) => {
      const next = current === "dark" ? "light" : "dark";
      localStorage.setItem("atnurmi-theme", next);
      document.documentElement.dataset.theme = next;
      return next;
    });
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const { auth } = requireFirebaseServices();
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    await signInWithPopup(auth, provider);
  }, []);

  const logOut = useCallback(async () => {
    if (firebaseAuth) await signOut(firebaseAuth);
  }, []);

  const updateProfile = useCallback((changes: Partial<UserProfile>) => {
    setProfile((current) => current ? { ...current, ...changes } : current);
  }, []);

  const toggleRoleView = useCallback(() => {
    if (accountRole !== "artist") return;
    setRole((current) => current === "artist" ? "customer" : "artist");
  }, [accountRole]);

  const updateRole = useCallback((nextRole: UserRole) => {
    if (nextRole === "guest") {
      if (firebaseAuth) void signOut(firebaseAuth);
      return;
    }
    if (accountRole === "artist") setRole(nextRole);
  }, [accountRole]);

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

  const value = useMemo(() => ({
    role, setRole: updateRole, accountRole, user, profile, updateProfile, authLoading, signInWithGoogle,
    logOut, toggleRoleView, theme, toggleTheme, authOpen, setAuthOpen,
    cart, wishlist, addToCart, toggleWishlist, toast,
  }), [role, updateRole, accountRole, user, profile, updateProfile, authLoading, signInWithGoogle, logOut, toggleRoleView, theme, toggleTheme, authOpen, cart, wishlist, addToCart, toggleWishlist, toast]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const value = useContext(AppContext);
  if (!value) throw new Error("useApp must be used inside AppProvider");
  return value;
}
