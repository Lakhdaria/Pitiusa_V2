import type { MetadataRoute } from "next";
import { legal } from "@/content/pitiusa";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // The contact endpoint only answers POST; there is nothing for a
      // crawler to index there, and every visit it makes counts against
      // the form's rate limit.
      disallow: "/api/",
    },
    sitemap: `${legal.url}/sitemap.xml`,
  };
}
