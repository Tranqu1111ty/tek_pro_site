import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date("2026-09-02T00:00:00+07:00");

  return [
    {
      url: "https://tekpro.ru/",
      lastModified,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: "https://tekpro.ru/cookie-policy",
      lastModified,
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];
}
