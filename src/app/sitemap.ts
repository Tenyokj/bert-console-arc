import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { path: "", priority: 1 },
    { path: "/funding", priority: 0.8 },
    { path: "/communities", priority: 0.8 },
    { path: "/explore", priority: 0.7 },
    { path: "/deployments", priority: 0.6 },
    { path: "/console", priority: 0.6 },
  ].map(({ path, priority }) => ({
    url: `${siteUrl}${path}`,
    changeFrequency: "weekly" as const,
    priority,
  }));
}
