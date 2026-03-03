"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

type Course = {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  phone: string | null;
  website_url: string | null;
  tee_time_url: string | null;
  image_url?: string | null;
};

function normalizeCity(city: string | null) {
  const c = (city ?? "").trim();
  return c.length ? c : "Unknown";
}

function courseMatches(c: Course, q: string, city: string) {
  const cityOk =
    city === "ALL"
      ? true
      : normalizeCity(c.city).toLowerCase() === city.toLowerCase();
  if (!cityOk) return false;

  const query = q.trim().toLowerCase();
  if (!query) return true;

  const hay = `${c.name} ${c.city ?? ""} ${c.address ?? ""}`.toLowerCase();
  return hay.includes(query);
}

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

// Used when image_url is missing or fails to load
const DEFAULT_COURSE_IMAGE_URL = "https://placehold.co/300x300/png";

function Chip({ children }: { children: React.ReactNode }) {
  return (
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
      {children}
    </span>
  );
}

function AdminIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      style={{ display: "block" }}
    >
      <path
        d="M12 12a4.25 4.25 0 1 0-4.25-4.25A4.25 4.25 0 0 0 12 12Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M4.5 20a7.5 7.5 0 0 1 15 0"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CourseCard({ c }: { c: Course }) {
  const hasImage = Boolean(c.image_url && c.image_url.trim().length);

  return (
    <div
      style={{
        border: `1px solid ${ui.border}`,
        background: "rgba(255,255,255,0.04)",
        borderRadius: 18,
        padding: 16,
        boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
        transition:
          "transform 140ms ease, border-color 140ms ease, background 140ms ease",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
        (e.currentTarget as HTMLDivElement).style.background =
          "rgba(255,255,255,0.06)";
        (e.currentTarget as HTMLDivElement).style.borderColor =
          "rgba(255,255,255,0.16)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(0px)";
        (e.currentTarget as HTMLDivElement).style.background =
          "rgba(255,255,255,0.04)";
        (e.currentTarget as HTMLDivElement).style.borderColor = ui.border;
      }}
    >
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
        {/* Fixed-size image slot (always present) */}
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
          {hasImage ? (
            <img
              src={c.image_url as string}
              alt={c.name}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
              onError={(e) => {
                // Keep the box, swap to a known placeholder if the URL fails
                (e.currentTarget as HTMLImageElement).src =
                  DEFAULT_COURSE_IMAGE_URL;
              }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background:
                  "linear-gradient(135deg, rgba(34,197,94,0.20), rgba(255,255,255,0.06))",
                color: ui.muted,
                fontSize: 12,
              }}
            >
              No photo
            </div>
          )}
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
                {c.city ? <Chip>{c.city}</Chip> : null}
                {c.phone ? <Chip>{c.phone}</Chip> : null}
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

export default function CoursesPage() {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");
  const [city, setCity] = useState("ALL");
  const [view, setView] = useState<"list" | "grouped">("list");

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);

      const { data, error } = await supabase
        .from("courses")
        .select("id,name,address,city,state,phone,website_url,tee_time_url,image_url")
        .eq("is_public", true)
        .eq("is_active", true)
        .order("name", { ascending: true });

      if (!alive) return;

      if (error) {
        console.error(error);
        setCourses([]);
      } else {
        setCourses((data as Course[]) || []);
      }

      setLoading(false);
    }

    load();

    return () => {
      alive = false;
    };
  }, [supabase]);

  const cityCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const c of courses) {
      const v = normalizeCity(c.city);
      counts.set(v, (counts.get(v) ?? 0) + 1);
    }
    return counts;
  }, [courses]);

  const cities = useMemo(() => {
    const unique = Array.from(cityCounts.keys()).sort((a, b) =>
      a.localeCompare(b)
    );
    return ["ALL", ...unique];
  }, [cityCounts]);

  const filtered = useMemo(() => {
    return courses.filter((c) => courseMatches(c, q, city));
  }, [courses, q, city]);

  const grouped = useMemo(() => {
    const map = new Map<string, Course[]>();
    for (const c of filtered) {
      const key = normalizeCity(c.city);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(c);
    }
    const entries = Array.from(map.entries()).sort((a, b) =>
      a[0].localeCompare(b[0])
    );
    for (const [, list] of entries) list.sort((a, b) => a.name.localeCompare(b.name));
    return entries;
  }, [filtered]);

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
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "56px 16px 70px" }}>
        <div
          style={{
            border: `1px solid ${ui.border}`,
            background: ui.surface,
            borderRadius: 22,
            padding: 20,
            boxShadow: "0 20px 50px rgba(0,0,0,0.28)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: 14, alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 34, fontWeight: 950, letterSpacing: "-0.02em" }}>
                Florida Tee Times
              </div>
              <div style={{ marginTop: 6, color: ui.muted, fontSize: 15 }}>
                Golf is hard. Booking it shouldn’t be.
              </div>
            </div>

            {/* Admin icon pill */}
            <Link
              href="/admin/login"
              aria-label="Admin"
              title="Admin"
              style={{
                width: 42,
                height: 42,
                borderRadius: 14,
                border: `1px solid ${ui.border}`,
                background: ui.surface2,
                color: ui.text,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 10px 25px rgba(0,0,0,0.22)",
              }}
            >
              <AdminIcon />
            </Link>
          </div>

          <div style={{ marginTop: 16, display: "flex", gap: 12, flexWrap: "wrap" }}>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by course or city..."
              style={{
                flex: "1 1 320px",
                padding: "12px 14px",
                borderRadius: 14,
                border: `1px solid ${ui.border}`,
                background: "rgba(0,0,0,0.18)",
                color: ui.text,
                outline: "none",
              }}
            />

            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              style={{
                padding: "12px 14px",
                borderRadius: 14,
                border: `1px solid ${ui.border}`,
                background: "rgba(0,0,0,0.18)",
                color: ui.text,
                minWidth: 260,
                outline: "none",
              }}
            >
              {cities.map((c) => {
                if (c === "ALL") {
                  return (
                    <option key="ALL" value="ALL">
                      All Cities ({courses.length})
                    </option>
                  );
                }
                return (
                  <option key={c} value={c}>
                    {c} ({cityCounts.get(c) ?? 0})
                  </option>
                );
              })}
            </select>

            <select
              value={view}
              onChange={(e) =>
                setView(e.target.value as "list" | "grouped")
              }
              style={{
                padding: "12px 14px",
                borderRadius: 14,
                border: `1px solid ${ui.border}`,
                background: "rgba(0,0,0,0.18)",
                color: ui.text,
                minWidth: 220,
                outline: "none",
              }}
            >
              <option value="list">View: List</option>
              <option value="grouped">View: Grouped by City</option>
            </select>

            <button
              onClick={() => {
                setQ("");
                setCity("ALL");
              }}
              style={{
                padding: "12px 14px",
                borderRadius: 14,
                border: `1px solid ${ui.border}`,
                background: ui.surface2,
                color: ui.text,
                cursor: "pointer",
                fontWeight: 800,
              }}
            >
              Clear
            </button>
          </div>

          <div style={{ marginTop: 12, fontSize: 13, color: ui.muted }}>
            Showing <b style={{ color: ui.text }}>{filtered.length}</b> of{" "}
            <b style={{ color: ui.text }}>{courses.length}</b> courses
          </div>
        </div>

        <div style={{ marginTop: 18 }}>
          {loading ? (
            <div style={{ padding: 16, color: ui.muted }}>Loading courses…</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 16, color: ui.muted }}>
              No courses found. Try clearing filters.
            </div>
          ) : view === "list" ? (
            <div style={{ display: "grid", gap: 12 }}>
              {filtered.map((c) => (
                <CourseCard key={c.id} c={c} />
              ))}
            </div>
          ) : (
            <div style={{ display: "grid", gap: 18 }}>
              {grouped.map(([cityName, list]) => (
                <div key={cityName}>
                  <div
                    style={{
                      margin: "8px 0 12px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "baseline",
                      padding: "0 4px",
                    }}
                  >
                    <div style={{ fontSize: 18, fontWeight: 950, letterSpacing: "-0.01em" }}>
                      {cityName}
                    </div>
                    <div style={{ fontSize: 12, color: ui.muted }}>
                      {list.length} course(s)
                    </div>
                  </div>

                  <div style={{ display: "grid", gap: 12 }}>
                    {list.map((c) => (
                      <CourseCard key={c.id} c={c} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Step 1 CTA: Add your course */}
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
            Own or manage a public golf course?
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
            Add your course to Florida Tee Times and make booking simple for golfers
            across the state.
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

          <div style={{ marginTop: 10, fontSize: 12, color: ui.muted }}>
            All submissions are reviewed before publishing.
          </div>
        </div>

        <div style={{ marginTop: 18, color: ui.muted, fontSize: 12 }}>
          Built for speed: find a course → click book → go play.
        </div>
      </div>
    </div>
  );
}