import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

const SITE_URL = "https://www.teetimeus.com";

function getSupabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  return createClient(url, anon);
}

function cityToSlug(city: string) {
  return city
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

async function getAllActiveCities() {
  const supabase = getSupabaseServer();

  const { data, error } = await supabase
    .from("courses")
    .select("city")
    .eq("is_public", true)
    .eq("is_active", true);

  if (error || !data) {
    return [];
  }

  const uniqueCities = Array.from(
    new Set(
      data.map((row) => (row.city ?? "").trim()).filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b));

  return uniqueCities;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${SITE_URL}/courses`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/submit`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/request`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
  ];

  const cities = await getAllActiveCities();

  const cityPages: MetadataRoute.Sitemap = cities.map((city) => ({
    url: `${SITE_URL}/cities/${cityToSlug(city)}`,
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.8,
  }));

  const teeTimePages: MetadataRoute.Sitemap = cities.map((city) => ({
    url: `${SITE_URL}/tee-times/${cityToSlug(city)}`,
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.85,
  }));

  return [...staticPages, ...cityPages, ...teeTimePages];
}