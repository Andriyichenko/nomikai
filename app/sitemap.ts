import type { MetadataRoute } from "next";
import { getPublicEvents } from "@/lib/data";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const events = await getPublicEvents();
  return [
    { url: `${site}/` },
    { url: `${site}/archive` },
    ...events.map((e) => ({ url: `${site}/e/${e.slug}`, lastModified: e.created_at })),
  ];
}
