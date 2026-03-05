"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

type ReqRow = {
  id: string;
  created_at: string;
  course_name: string;
  city: string;
  state: string;
  requester_email: string | null;
};

function keyFor(r: ReqRow) {
  return `${r.course_name.trim().toLowerCase()}|${r.city.trim().toLowerCase()}|${r.state.trim().toLowerCase()}`;
}

export default function AdminRequestsPage() {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const [rows, setRows] = useState<ReqRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      const { data, error } = await supabase
        .from("course_requests")
        .select("id,created_at,course_name,city,state,requester_email")
        .order("created_at", { ascending: false })
        .limit(500);

      if (!alive) return;

      if (error) {
        console.error(error);
        setRows([]);
      } else {
        setRows((data as ReqRow[]) || []);
      }

      setLoading(false);
    }

    load();

    return () => {
      alive = false;
    };
  }, [supabase]);

  const aggregated = useMemo(() => {
    const map = new Map<
      string,
      {
        course_name: string;
        city: string;
        state: string;
        count: number;
        last: string;
        emails: Set<string>;
      }
    >();

    for (const r of rows) {
      const k = keyFor(r);
      if (!map.has(k)) {
        map.set(k, {
          course_name: r.course_name,
          city: r.city,
          state: r.state,
          count: 0,
          last: r.created_at,
          emails: new Set<string>(),
        });
      }
      const item = map.get(k)!;
      item.count += 1;
      if (new Date(r.created_at).getTime() > new Date(item.last).getTime()) item.last = r.created_at;
      if (r.requester_email) item.emails.add(r.requester_email);
    }

    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [rows]);

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "28px 16px 60px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <div>
          <h1 style={{ margin: 0 }}>Admin • Course Requests</h1>
          <div style={{ marginTop: 6, color: "rgba(255,255,255,0.70)" }}>
            Private list for targeting courses. Sorted by request count.
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link href="/admin" style={{ color: "inherit" }}>
            Back to Admin
          </Link>
          <Link href="/courses" style={{ color: "inherit" }}>
            View Site
          </Link>
        </div>
      </div>

      <div style={{ marginTop: 18, border: "1px solid rgba(255,255,255,0.12)", borderRadius: 14, overflow: "hidden" }}>
        <div style={{ padding: 12, background: "rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.12)" }}>
          {loading ? "Loading…" : `${aggregated.length} unique course(s) requested • ${rows.length} total request(s)`}
        </div>

        {!loading && aggregated.length === 0 ? (
          <div style={{ padding: 12 }}>No requests yet.</div>
        ) : (
          <div style={{ width: "100%", overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ textAlign: "left" }}>
                  <th style={{ padding: 12, borderBottom: "1px solid rgba(255,255,255,0.12)" }}>Course</th>
                  <th style={{ padding: 12, borderBottom: "1px solid rgba(255,255,255,0.12)" }}>City</th>
                  <th style={{ padding: 12, borderBottom: "1px solid rgba(255,255,255,0.12)" }}>State</th>
                  <th style={{ padding: 12, borderBottom: "1px solid rgba(255,255,255,0.12)" }}>Requests</th>
                  <th style={{ padding: 12, borderBottom: "1px solid rgba(255,255,255,0.12)" }}>Emails waiting</th>
                  <th style={{ padding: 12, borderBottom: "1px solid rgba(255,255,255,0.12)" }}>Last request</th>
                </tr>
              </thead>
              <tbody>
                {aggregated.map((r) => (
                  <tr key={`${r.course_name}-${r.city}-${r.state}`}>
                    <td style={{ padding: 12, borderBottom: "1px solid rgba(255,255,255,0.08)", fontWeight: 800 }}>{r.course_name}</td>
                    <td style={{ padding: 12, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>{r.city}</td>
                    <td style={{ padding: 12, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>{r.state}</td>
                    <td style={{ padding: 12, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>{r.count}</td>
                    <td style={{ padding: 12, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>{r.emails.size}</td>
                    <td style={{ padding: 12, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                      {new Date(r.last).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={{ marginTop: 12, color: "rgba(255,255,255,0.70)", fontSize: 12 }}>
        Admin-only access is enforced by Supabase RLS via <code>is_admin()</code>.
      </div>
    </div>
  );
}