"use client";

import { AuthModal } from "./auth-modal";
import { Footer } from "./footer";
import { Header } from "./header";
import { useApp } from "./app-provider";
import { usePathname } from "next/navigation";

export function Shell({ children }: { children: React.ReactNode }) {
  const { toast } = useApp();
  const pathname = usePathname();
  if (pathname === "/NurAdm") return <>{children}</>;
  return <><Header />{children}<Footer /><AuthModal />{toast && <div className="toast" role="status">{toast}</div>}</>;
}

