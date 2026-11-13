import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/components/app-provider";
import { Shell } from "@/components/shell";

export const metadata: Metadata = {
  metadataBase: new URL("https://market.atnurmi.com"),
  title: { default: "Atnurmi Marketplace | Original Art from Sri Lanka", template: "%s | Atnurmi Marketplace" },
  description: "Discover and buy original canvas, watercolour, colour pencil, pencil and digital art directly from trusted independent artists, with safe local and global delivery.",
  keywords: ["original art Sri Lanka", "buy art online", "pencil art", "canvas art", "custom portraits", "Atnurmi Marketplace"],
  openGraph: { title: "Atnurmi Marketplace", description: "Original art. Real artists. Delivered safely.", url: "https://market.atnurmi.com", siteName: "Atnurmi Marketplace", type: "website" },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AppProvider><Shell>{children}</Shell></AppProvider>
      </body>
    </html>
  );
}
