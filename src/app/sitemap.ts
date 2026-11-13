import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["", "/explore", "/artist-gigs", "/orders", "/about"];
  return routes.map((route) => ({ url: `https://market.atnurmi.com${route}`, lastModified: new Date(), changeFrequency: route === "" || route === "/explore" ? "daily" : "monthly", priority: route === "" ? 1 : .8 }));
}

