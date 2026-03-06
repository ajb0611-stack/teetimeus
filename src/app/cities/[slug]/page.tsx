import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import type { Metadata } from "next";

export const revalidate = 3600;

type Course = {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  phone: string | null;
  website_url: string | null;
  tee_time_url: string | null;
  image_url: string | null;
};

const ui = {
  bg: "#0b1220",
  surface: "rgba(255,255,255,0.06)",
  surface2: "rgba(255,255,255,0.08)",
  border: "rgba(255,255,255,0.10)",
  text: "rgba(255,255,255,0.92)",
  muted: "rgba(255,255,255,0.68)",
  subtle: "rgba(255,255,255,0.55)",
  accent: "#22c55e",
  accent2: "#16a34a",
  black: "#0b1220",
};

const DEFAULT_COURSE_IMAGE_URL = "https://placehold.co/300x300/png";
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

function slugToTitle(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

async function getAllActiveCities() {
  const supabase = getSupabaseServer();

  const { data, error } = await supabase
    .from("courses")
    .select("city")
    .eq("is_public", true)
    .eq("is_active", true);

  if (error || !data) return [];

  const unique = Array.from(
    new Set(data.map((row) => (row.city ?? "").trim()).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b));

  return unique;
}

async function getCoursesByCity(city: string) {
  const supabase = getSupabaseServer();

  const { data, error } = await supabase
    .from("courses")
    .select("id,name,address,city,state,phone,website_url,tee_time_url,image_url")
    .eq("is_public", true)
    .eq("is_active", true)
    .eq("city", city)
    .order("name", { ascending: true });

  if (error || !data) return [];

  return data as Course[];
}

export async function generateStaticParams() {
  const cities = await getAllActiveCities();

  return cities.map((city) => ({
    slug: cityToSlug(city),
  }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const cityTitle = slugToTitle(params.slug);
  const canonicalUrl = `${SITE_URL}/cities/${params.slug}`;
  const description = `Explore public golf courses in ${cityTitle}, Florida and quickly access tee time booking links in one place on TeeTimeUs.`;

  return {
    title: `${cityTitle} Golf Courses | TeeTimeUs`,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${cityTitle} Golf Courses | TeeTimeUs`,
      description,
      url: canonicalUrl,
      siteName: "TeeTimeUs",
      type: "website",
    },
  };
}

function CourseCard({ c }: { c: Course }) {
  const imageSrc =
    c.image_url && c.image_url.trim().length
      ? c.image_url
      : DEFAULT_COURSE_IMAGE_URL;

  return (
    <div
      style={{
        border: `1px solid ${ui.border}`,
        background: "rgba(255,255,255,0.04)",
        borderRadius: 18,
        padding: 16,
        boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
      }}
    >
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
        <div
          style={{
            width: 92,
            height: 92,
            borderRadius: 16,
            overflow: "hidden",
            border: `1px solid ${ui.border}`,
            background: ui.surface,
            flex: "0 0 auto",
          }}
        >
          <img
            src={imageSrc}
            alt={c.name}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div style={{ minWidth: 260 }}>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 900,
                  color: ui.text,
                  lineHeight: 1.15,
                }}
              >
                {c.name}
              </div>
              <div style={{ fontSize: 13, color: ui.muted, marginTop: 6 }}>
                {[c.address, c.city, c.state].filter(Boolean).join(", ")}
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                  marginTop: 10,
                }}
              >
                {c.city ? (
                  <span
                    style={{
                      fontSize: 12,
                      color: ui.muted,
                      border: `1px solid ${ui.border}`,
                      background: ui.surface,
                      padding: "6px 10px",
                      borderRadius: 999,
                    }}
                  >
                    {c.city}
                  </span>
                ) : null}

                {c.phone ? (
                  <span
                    style={{
                      fontSize: 12,
                      color: ui.muted,
                      border: `1px solid ${ui.border}`,
                      background: ui.surface,
                      padding: "6px 10px",
                      borderRadius: 999,
                    }}
                  >
                    {c.phone}
                  </span>
                ) : null}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: 10,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              {c.website_url && (
                <a
                  href={c.website_url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    padding: "10px 14px",
                    borderRadius: 14,
                    border: `1px solid ${ui.border}`,
                    background: ui.surface,
                    color: ui.text,
                    textDecoration: "none",
                    fontWeight: 700,
                    fontSize: 13,
                  }}
                >
                  Website
                </a>
              )}

              {c.tee_time_url ? (
                <a
                  href={c.tee_time_url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    padding: "10px 16px",
                    borderRadius: 14,
                    border: "1px solid rgba(34,197,94,0.45)",
                    background: `linear-gradient(180deg, ${ui.accent}, ${ui.accent2})`,
                    color: ui.black,
                    textDecoration: "none",
                    fontWeight: 900,
                    fontSize: 13,
                    boxShadow: "0 10px 25px rgba(34,197,94,0.18)",
                  }}
                >
                  Book Tee Time
                </a>
              ) : (
                <span style={{ fontSize: 12, color: ui.subtle }}>
                  No booking link yet
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function CityPage({
  params,
}: {
  params: { slug: string };
}) {
  const allCities = await getAllActiveCities();

  const matchedCity =
    allCities.find((city) => cityToSlug(city) === params.slug) ?? null;

  if (!matchedCity) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: ui.bg,
          color: ui.text,
          padding: "56px 16px",
        }}
      >
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <div
            style={{
              border: `1px solid ${ui.border}`,
              background: ui.surface,
              borderRadius: 22,
              padding: 22,
            }}
          >
            <div style={{ fontSize: 28, fontWeight: 950 }}>City not found</div>
            <div style={{ marginTop: 8, color: ui.muted }}>
              We couldn’t find an active city page for this location yet.
            </div>

            <div
              style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap" }}
            >
              <Link
                href="/courses"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "12px 16px",
                  borderRadius: 14,
                  border: `1px solid ${ui.border}`,
                  background: ui.surface2,
                  color: ui.text,
                  textDecoration: "none",
                  fontWeight: 900,
                }}
              >
                Back to Courses
              </Link>

              <Link
                href="/request"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "12px 16px",
                  borderRadius: 14,
                  border: "1px solid rgba(34,197,94,0.45)",
                  background: `linear-gradient(180deg, ${ui.accent}, ${ui.accent2})`,
                  color: ui.black,
                  textDecoration: "none",
                  fontWeight: 950,
                  boxShadow: "0 10px 25px rgba(34,197,94,0.18)",
                }}
              >
                Request a Course
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const courses = await getCoursesByCity(matchedCity);
  const citySlug = cityToSlug(matchedCity);
  const pageUrl = `${SITE_URL}/cities/${citySlug}`;

  const itemListElements = courses.map((course, index) => {
    const courseUrl =
      course.tee_time_url || course.website_url || pageUrl;

    return {
      "@type": "ListItem",
      position: index + 1,
      url: courseUrl,
      item: {
        "@type": "GolfCourse",
        name: course.name,
        telephone: course.phone || undefined,
        image:
          course.image_url && course.image_url.trim().length
            ? course.image_url
            : DEFAULT_COURSE_IMAGE_URL,
        url: courseUrl,
        address: {
          "@type": "PostalAddress",
          streetAddress: course.address || undefined,
          addressLocality: course.city || undefined,
          addressRegion: course.state || "FL",
          addressCountry: "US",
        },
      },
    };
  });

  const cityPageSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${matchedCity} Golf Courses`,
    url: pageUrl,
    description: `Explore public golf courses in ${matchedCity}, Florida and quickly access tee time booking links in one place on TeeTimeUs.`,
    isPartOf: {
      "@type": "WebSite",
      name: "TeeTimeUs",
      url: SITE_URL,
    },
    about: {
      "@type": "Place",
      name: matchedCity,
      address: {
        "@type": "PostalAddress",
        addressLocality: matchedCity,
        addressRegion: "FL",
        addressCountry: "US",
      },
    },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: courses.length,
      itemListElement: itemListElements,
    },
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: `radial-gradient(1200px 700px at 20% -10%, rgba(34,197,94,0.22), transparent 60%),
                     radial-gradient(900px 600px at 90% 0%, rgba(59,130,246,0.18), transparent 55%),
                     ${ui.bg}`,
        color: ui.text,
      }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(cityPageSchema),
        }}
      />

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "56px 16px 70px" }}>
        <div
          style={{
            border: `1px solid ${ui.border}`,
            background: ui.surface,
            borderRadius: 22,
            padding: 22,
            boxShadow: "0 20px 50px rgba(0,0,0,0.28)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div>
              <div style={{ fontSize: 34, fontWeight: 950, letterSpacing: "-0.02em" }}>
                {matchedCity} Golf Courses
              </div>
              <div
                style={{
                  marginTop: 8,
                  color: ui.muted,
                  fontSize: 14,
                  maxWidth: 760,
                  lineHeight: 1.5,
                }}
              >
                Explore public golf courses in {matchedCity}, Florida and quickly
                access tee time booking links in one place on TeeTimeUs. Browse
                active listings below and click through to book directly with each
                course.
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link
                href="/courses"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "12px 16px",
                  borderRadius: 14,
                  border: `1px solid ${ui.border}`,
                  background: ui.surface2,
                  color: ui.text,
                  textDecoration: "none",
                  fontWeight: 900,
                }}
              >
                All Courses
              </Link>

              <Link
                href="/request"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "12px 16px",
                  borderRadius: 14,
                  border: `1px solid ${ui.border}`,
                  background: ui.surface2,
                  color: ui.text,
                  textDecoration: "none",
                  fontWeight: 900,
                }}
              >
                Request a Course
              </Link>
            </div>
          </div>

          <div style={{ marginTop: 14, fontSize: 13, color: ui.muted }}>
            Showing <b style={{ color: ui.text }}>{courses.length}</b> active
            course(s) in <b style={{ color: ui.text }}>{matchedCity}</b>
          </div>
        </div>

        <div style={{ marginTop: 18 }}>
          {courses.length === 0 ? (
            <div
              style={{
                border: `1px solid ${ui.border}`,
                background: ui.surface,
                borderRadius: 22,
                padding: 22,
              }}
            >
              <div style={{ fontSize: 20, fontWeight: 950 }}>No active courses yet</div>
              <div style={{ marginTop: 8, color: ui.muted }}>
                We don’t have any active courses listed in {matchedCity} yet.
              </div>

              <div
                style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}
              >
                <Link
                  href="/request"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "12px 16px",
                    borderRadius: 14,
                    border: "1px solid rgba(34,197,94,0.45)",
                    background: `linear-gradient(180deg, ${ui.accent}, ${ui.accent2})`,
                    color: ui.black,
                    textDecoration: "none",
                    fontWeight: 950,
                    boxShadow: "0 10px 25px rgba(34,197,94,0.18)",
                  }}
                >
                  Request a Course
                </Link>

                <Link
                  href="/submit"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "12px 16px",
                    borderRadius: 14,
                    border: `1px solid ${ui.border}`,
                    background: ui.surface2,
                    color: ui.text,
                    textDecoration: "none",
                    fontWeight: 900,
                  }}
                >
                  Add Your Course
                </Link>
              </div>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {courses.map((c) => (
                <CourseCard key={c.id} c={c} />
              ))}
            </div>
          )}
        </div>

        <div
          style={{
            marginTop: 28,
            border: `1px solid ${ui.border}`,
            background: ui.surface,
            borderRadius: 22,
            padding: 22,
            textAlign: "center",
            boxShadow: "0 20px 50px rgba(0,0,0,0.28)",
          }}
        >
          <div style={{ fontSize: 22, fontWeight: 950, letterSpacing: "-0.01em" }}>
            Own or manage a golf course in {matchedCity}?
          </div>
          <div
            style={{
              marginTop: 8,
              color: ui.muted,
              fontSize: 14,
              maxWidth: 560,
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            Add your course to TeeTimeUs and make booking simple for golfers
            searching in {matchedCity}.
          </div>

          <div style={{ marginTop: 14 }}>
            <Link
              href="/submit"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "12px 18px",
                borderRadius: 14,
                border: "1px solid rgba(34,197,94,0.45)",
                background: `linear-gradient(180deg, ${ui.accent}, ${ui.accent2})`,
                color: ui.black,
                textDecoration: "none",
                fontWeight: 950,
                boxShadow: "0 10px 25px rgba(34,197,94,0.18)",
              }}
            >
              Add Your Course
            </Link>
          </div>
        </div>

        <div style={{ marginTop: 18, color: ui.muted, fontSize: 12 }}>
          Exact city match SEO page • URL: /cities/{params.slug}
        </div>
      </div>
    </div>
  );
}