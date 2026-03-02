import Link from "next/link";
import { supabaseService } from "@/lib/supabaseClients";

export default async function CoursePage({ params }: { params: { slug: string } }) {
  const supabase = supabaseService();
  const { data, error } = await supabase
    .from("courses")
    .select("*")
    .eq("slug", params.slug)
    .eq("is_public", true)
    .single();

  if (error || !data) {
    return (
      <div>
        <h1 style={{ margin: 0 }}>Course not found</h1>
        <Link href="/search" style={{ textDecoration: "none" }}>Back to search</Link>
      </div>
    );
  }

  const location = [data.address, data.city, data.state, data.zip].filter(Boolean).join(", ");

  return (
    <div>
      <div style={{ borderRadius: 18, overflow: "hidden", border: "1px solid rgba(0,0,0,0.1)", background: "rgba(0,0,0,0.03)" }}>
        {data.image_url ? (
          <img src={data.image_url} alt={data.name} style={{ width: "100%", height: 320, objectFit: "cover" }} />
        ) : (
          <div style={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.7 }}>No photo yet</div>
        )}
      </div>

      <div style={{ marginTop: 14, display: "flex", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 34 }}>{data.name}</h1>
          <div style={{ marginTop: 8, opacity: 0.8 }}>{location || "Florida"}</div>
          {data.phone ? <div style={{ marginTop: 6, opacity: 0.8 }}>{data.phone}</div> : null}
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link href={`/r/${data.id}`} style={{ padding: "12px 14px", borderRadius: 14, border: "1px solid rgba(0,0,0,0.14)", textDecoration: "none", fontWeight: 900 }}>
            Tee Times →
          </Link>
          {data.website_url ? (
            <a href={data.website_url} target="_blank" rel="noreferrer" style={{ padding: "12px 14px", borderRadius: 14, border: "1px solid rgba(0,0,0,0.14)", textDecoration: "none", color: "inherit" }}>
              Course website
            </a>
          ) : null}
          <Link href="/search" style={{ padding: "12px 14px", borderRadius: 14, border: "1px solid rgba(0,0,0,0.14)", textDecoration: "none", opacity: 0.9 }}>
            Back to search
          </Link>
        </div>
      </div>

      <div style={{ marginTop: 10, opacity: 0.8, fontSize: 14 }}>
        We don’t sell tee times—we send you directly to the course’s booking page.
      </div>
    </div>
  );
}
