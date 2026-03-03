"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

type Submission = {
  id: string;
  created_at: string;
  name: string;
  city: string | null;
  state: string | null;
  contact_email: string | null;
  approval_status: string | null;
  payment_status: string | null;
  stripe_checkout_url: string | null;
};

export default function AdminSubmissions() {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const [items, setItems] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from("course_submissions")
      .select("id,created_at,name,city,state,contact_email,approval_status,payment_status,stripe_checkout_url")
      .order("created_at", { ascending: false });

    if (error) {
      setError(error.message);
      setItems([]);
    } else {
      setItems((data as Submission[]) || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function approveAndEmail(submissionId: string) {
    setBusyId(submissionId);
    setError(null);

    try {
      const res = await fetch("/api/admin/approve-submission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Approve failed");

      // reload so you see updated approval/payment statuses + link
      await load();
    } catch (e: any) {
      setError(e?.message ?? "Approve failed");
    } finally {
      setBusyId(null);
    }
  }

  async function reject(submissionId: string) {
    setBusyId(submissionId);
    setError(null);

    try {
      const { error } = await supabase.from("course_submissions").delete().eq("id", submissionId);
      if (error) throw error;

      setItems((prev) => prev.filter((x) => x.id !== submissionId));
    } catch (e: any) {
      setError(e?.message ?? "Reject failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 16px 60px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div style={{ fontSize: 26, fontWeight: 950 }}>Admin • Submissions</div>
          <div style={{ marginTop: 6, opacity: 0.8, fontSize: 14 }}>
            Approve → automatically emails a Stripe payment link. Course goes live after payment.
          </div>
        </div>

        <Link
          href="/admin"
          style={{
            textDecoration: "none",
            padding: "10px 14px",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.14)",
            background: "rgba(255,255,255,0.06)",
            color: "rgba(255,255,255,0.92)",
            fontWeight: 800,
            fontSize: 13,
            whiteSpace: "nowrap",
          }}
        >
          Back to Admin
        </Link>
      </div>

      {error ? (
        <div
          style={{
            marginTop: 14,
            padding: 12,
            borderRadius: 14,
            border: "1px solid rgba(239,68,68,0.35)",
            background: "rgba(239,68,68,0.12)",
            color: "rgba(255,255,255,0.92)",
            fontSize: 13,
          }}
        >
          {error}
        </div>
      ) : null}

      <div style={{ marginTop: 16 }}>
        {loading ? (
          <div style={{ padding: 12, opacity: 0.8 }}>Loading…</div>
        ) : items.length === 0 ? (
          <div style={{ padding: 12, opacity: 0.8 }}>No submissions right now.</div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {items.map((s) => {
              const busy = busyId === s.id;
              const status = `${s.approval_status ?? "pending"} / ${s.payment_status ?? "unpaid"}`;

              return (
                <div
                  key={s.id}
                  style={{
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(255,255,255,0.05)",
                    borderRadius: 18,
                    padding: 16,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                    <div style={{ minWidth: 260 }}>
                      <div style={{ fontSize: 18, fontWeight: 950 }}>{s.name}</div>
                      <div style={{ marginTop: 6, fontSize: 13, opacity: 0.82 }}>
                        {[s.city, s.state].filter(Boolean).join(", ")}
                      </div>
                      <div style={{ marginTop: 6, fontSize: 12, opacity: 0.7 }}>
                        {new Date(s.created_at).toLocaleString()} • <b>{status}</b>
                      </div>
                      <div style={{ marginTop: 6, fontSize: 12, opacity: 0.8 }}>
                        Email: {s.contact_email ?? "—"}
                      </div>

                      {s.stripe_checkout_url ? (
                        <div style={{ marginTop: 10, fontSize: 12, opacity: 0.85, wordBreak: "break-all" }}>
                          Payment link:{" "}
                          <a href={s.stripe_checkout_url} target="_blank" rel="noreferrer" style={{ color: "rgba(34,197,94,0.95)" }}>
                            open
                          </a>
                        </div>
                      ) : null}
                    </div>

                    <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                      <button
                        disabled={busy}
                        onClick={() => approveAndEmail(s.id)}
                        style={{
                          padding: "10px 14px",
                          borderRadius: 12,
                          border: "1px solid rgba(34,197,94,0.45)",
                          background: "linear-gradient(180deg, rgba(34,197,94,1), rgba(22,163,74,1))",
                          color: "#0b1220",
                          fontWeight: 950,
                          cursor: busy ? "not-allowed" : "pointer",
                          opacity: busy ? 0.7 : 1,
                        }}
                      >
                        Approve + Email Payment Link
                      </button>

                      <button
                        disabled={busy}
                        onClick={() => reject(s.id)}
                        style={{
                          padding: "10px 14px",
                          borderRadius: 12,
                          border: "1px solid rgba(239,68,68,0.35)",
                          background: "rgba(239,68,68,0.14)",
                          color: "rgba(255,255,255,0.92)",
                          fontWeight: 900,
                          cursor: busy ? "not-allowed" : "pointer",
                          opacity: busy ? 0.7 : 1,
                        }}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ marginTop: 18, fontSize: 12, opacity: 0.75 }}>
        After payment, the webhook activates the course automatically.
      </div>
    </div>
  );
}