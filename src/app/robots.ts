import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: "*", allow: "/", disallow: ["/NurAdm", "/dashboard", "/seller/", "/settings"] }], sitemap: "https://market.atnurmi.com/sitemap.xml" };
}
