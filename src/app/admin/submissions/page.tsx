"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

type Submission = {
  id: string;
  created_at: string;
  status: "pending" | "approved" | "rejected";
  course_name: string;
  address: string | null;
  city: string;
  state: string;
  phone: string | null;
  website_url: string | null;
  tee_time_url: string;
  image_url: string | null;
  notes: string | null;
};

function slugify(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function AdminSubmissionsPage() {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Submission[]>([]);
  const [msg, setMsg] = useState<string>("");

  async function requireAdmin() {
    const { data: userRes } = await supabase.auth.getUser();
    const user = userRes.user;

    if (!user) {
      window.location.href = "/admin/login";
      return false;
    }

    const { data: admins, error } = await supabase
      .from("admins")
      .select("user_id")
      .eq("user_id", user.id)
      .limit(1);

    if (error || !admins || admins.length === 0) {
      await supabase.auth.signOut();
      window.location.href = "/admin/login";
      return false;
    }

    return true;
  }

  async function load() {
    setMsg("");
    setLoading(true);

    const ok = await requireAdmin();
    if (!ok) return;

    const { data, error } = await supabase
      .from("course_submissions")
      .select(
        "id,created_at,status,course_name,address,city,state,phone,website_url,tee_time_url,image_url,notes"
      )
      .order("created_at", { ascending: false });

    if (error) {
      setRows([]);
      setMsg(`Load failed: ${error.message}`);
    } else {
      setRows((data as Submission[]) || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function approve(sub: Submission) {
    setMsg("");

    const slug = slugify(sub.course_name);

    // 1) Upsert into courses (requires slug + is_public in your schema)
    const { error: upsertError } = await supabase.from("courses").upsert(
      [
        {
          name: sub.course_name,
          slug,
          address: sub.address,
          city: sub.city,
          state: sub.state,
          phone: sub.phone,
          website_url: sub.website_url,
          tee_time_url: sub.tee_time_url,
          image_url: sub.image_url,
          is_public: true,
        },
      ],
      { onConflict: "slug" }
    );

    if (upsertError) {
      setMsg(`Approve failed (courses): ${upsertError.message}`);
      return;
    }

    // 2) Mark submission approved
    const { error: updateError } = await supabase
      .from("course_submissions")
      .update({ status: "approved" })
      .eq("id", sub.id);

    if (updateError) {
      setMsg(`Approve failed (submission status): ${updateError.message}`);
      return;
    }

    setMsg(`Approved: ${sub.course_name}`);
    await load();
  }

  async function reject(sub: Submission) {
    setMsg("");

    const { error } = await supabase
      .from("course_submissions")
      .update({ status: "rejected" })
      .eq("id", sub.id);

    if (error) {
      setMsg(`Reject failed: ${error.message}`);
      return;
    }

    setMsg(`Rejected: ${sub.course_name}`);
    await load();
  }

  const pending = rows.filter((r) => r.status === "pending");
  const approved = rows.filter((r) => r.status === "approved");
  const rejected = rows.filter((r) => r.status === "rejected");

  return (
    <div className="container">
      <div className="shell">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 28, fontWeight: 950, letterSpacing: "-0.02em" }}>
              Course Submissions
            </div>
            <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 14 }}>
              Approve to publish to /courses. Reject to archive.
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <Link className="btn" href="/admin">
              Dashboard
            </Link>
            <Link className="btn" href="/courses">
              Public Site
            </Link>
            <button className="btn" onClick={load}>
              Refresh
            </button>
          </div>
        </div>

        <div style={{ marginTop: 12, color: "var(--muted)", fontSize: 13 }}>
          Pending: <b style={{ color: "var(--text)" }}>{pending.length}</b> • Approved:{" "}
          <b style={{ color: "var(--text)" }}>{approved.length}</b> • Rejected:{" "}
          <b style={{ color: "var(--text)" }}>{rejected.length}</b>
        </div>

        {msg && (
          <div className="card" style={{ marginTop: 12, fontSize: 13 }}>
            {msg}
          </div>
        )}

        <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
          {loading ? (
            <div style={{ color: "var(--muted)" }}>Loading…</div>
          ) : rows.length === 0 ? (
            <div style={{ color: "var(--muted)" }}>No submissions yet.</div>
          ) : (
            rows.map((s) => (
              <div key={s.id} className="card" style={{ display: "grid", gap: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ fontWeight: 950 }}>{s.course_name}</div>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>
                    {new Date(s.created_at).toLocaleString()} •{" "}
                    <b style={{ color: "var(--text)" }}>{s.status}</b>
                  </div>
                </div>

                <div style={{ fontSize: 13, color: "var(--muted)" }}>
                  {[
                    s.address,
                    `${s.city}, ${s.state}`,
                    s.phone ? `Phone: ${s.phone}` : null,
                  ]
                    .filter(Boolean)
                    .join(" • ")}
                </div>

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {s.website_url ? (
                    <a className="btn" href={s.website_url} target="_blank" rel="noreferrer">
                      Website
                    </a>
                  ) : null}
                  <a className="btn" href={s.tee_time_url} target="_blank" rel="noreferrer">
                    Booking URL
                  </a>
                  {s.image_url ? (
                    <a className="btn" href={s.image_url} target="_blank" rel="noreferrer">
                      Image
                    </a>
                  ) : null}

                  <div style={{ flex: 1 }} />

                  {s.status === "pending" ? (
                    <>
                      <button className="btn" onClick={() => reject(s)}>
                        Reject
                      </button>
                      <button className="btnPrimary" onClick={() => approve(s)}>
                        Approve & Publish
                      </button>
                    </>
                  ) : (
                    <span style={{ fontSize: 12, color: "var(--muted)" }}>
                      No actions (already {s.status})
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}