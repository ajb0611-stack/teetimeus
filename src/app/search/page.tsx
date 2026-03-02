import Link from "next/link";
import { supabaseService } from "@/lib/supabaseClients";
import type { Course } from "@/lib/types";

function clean(v: string | undefined) { return (v ?? "").trim(); }

export default async function SearchPage({ searchParams }: { searchParams?: Record<string, string | string[] | undefined> }) {
  const q = typeof searchParams?.q === "string" ? clean(searchParams.q) : "";
  const city = typeof searchParams?.city === "string" ? clean(searchParams.city) : "";
  const zip = typeof searchParams?.zip === "string" ? clean(searchParams.zip) : "";

  const supabase = supabaseService();
  let query = supabase
    .from("courses")
    .select("*")
    .eq("state", "FL")
    .eq("is_public", true)
    .order("name", { ascending: true })
    .limit(100);

  if (q) query = query.ilike("name", `%${q}%`);
  if (city) query = query.ilike("city", `%${city}%`);
  if (zip) query = query.eq("zip", zip);

  const { data, error } = await query;
  const courses = (data ?? []) as Course[];

  return (
    <div>
      <h1 style={{ margin: "0 0 6px", fontSize: 28 }}>Search</h1>

      <form action="/search" method="get" style={{ marginTop: 14, display: "grid", gap: 10, gridTemplateColumns: "1fr 180px 140px 120px" }}>
        <input name="q" defaultValue={q} placeholder="Course name" style={{ padding: "12px 12px", borderRadius: 12, border: "1px solid rgba(0,0,0,0.14)" }} />
        <input name="city" defaultValue={city} placeholder="City" style={{ padding: "12px 12px", borderRadius: 12, border: "1px solid rgba(0,0,0,0.14)" }} />
        <input name="zip" defaultValue={zip} placeholder="Zip" style={{ padding: "12px 12px", borderRadius: 12, border: "1px solid rgba(0,0,0,0.14)" }} />
        <button type="submit" style={{ padding: "12px 12px", borderRadius: 12, border: "1px solid rgba(0,0,0,0.14)", fontWeight: 900 }}>Search</button>
      </form>

      {error ? (
        <div style={{ marginTop: 16, padding: 12, border: "1px solid rgba(255,0,0,0.25)", borderRadius: 12 }}>
          <strong>Error:</strong> {error.message}
        </div>
      ) : null}

      <p style={{ marginTop: 12, opacity: 0.8 }}>{courses.length} course{courses.length === 1 ? "" : "s"} found.</p>

      <div style={{ marginTop: 14, display: "grid", gap: 14 }}>
        {courses.map((c) => (
          <div key={c.id} style={{ border: "1px solid rgba(0,0,0,0.1)", borderRadius: 16, overflow: "hidden", display: "grid", gridTemplateColumns: "160px 1fr", gap: 16 }}>
            <div style={{ background: "rgba(0,0,0,0.04)", minHeight: 120, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {c.image_url ? (
                <img src={c.image_url} alt={c.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <span style={{ fontSize: 12, opacity: 0.7 }}>No photo</span>
              )}
            </div>
            <div style={{ padding: 16, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontWeight: 900, fontSize: 18 }}>{c.name}</div>
                <div style={{ marginTop: 6, opacity: 0.75, fontSize: 14 }}>
                  {[c.city, c.state, c.zip].filter(Boolean).join(", ") || "Florida"}
                </div>
              </div>

              <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Link href={`/course/${c.slug}`} style={{ padding: "10px 12px", borderRadius: 12, border: "1px solid rgba(0,0,0,0.12)", textDecoration: "none" }}>
                  View course
                </Link>
                <Link href={`/r/${c.id}`} style={{ padding: "10px 12px", borderRadius: 12, border: "1px solid rgba(0,0,0,0.12)", textDecoration: "none", fontWeight: 900 }}>
                  Tee Times →
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
