import type { MetadataRoute } from "next";
import { legal } from "@/content/pitiusa";

// The whole site is three documents. Listing them by hand is clearer than
// deriving them, and it means a new page is a deliberate line here rather
// than something that silently appears in search results.
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    {
      url: legal.url,
      lastModified,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${legal.url}/legal-notice`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${legal.url}/privacy-policy`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
