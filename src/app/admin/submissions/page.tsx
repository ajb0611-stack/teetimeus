"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

type Submission = {
  id: string;
  created_at: string;
  status: string | null;
  payment_status: string | null;

  name: string;
  city: string | null;
  state: string | null;

  contact_email: string | null;
  stripe_checkout_session_id: string | null;
};

const ui = {
  bg: "#0b1220",
  surface: "rgba(255,255,255,0.06)",
  surface2: "rgba(255,255,255,0.08)",
  border: "rgba(255,255,255,0.10)",
  text: "rgba(255,255,255,0.92)",
  muted: "rgba(255,255,255,0.68)",
  accent: "#22c55e",
  accent2: "#16a34a",
  black: "#0b1220",
  danger: "#ef4444",
};

export default function AdminSubmissionsPage() {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const [rows, setRows] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);
    setMsg(null);

    const { data, error } = await supabase
      .from("course_submissions")
      .select(
        "id,created_at,status,payment_status,name,city,state,contact_email,stripe_checkout_session_id"
      )
      .order("created_at", { ascending: false });

    if (error) {
      setErr(error.message);
      setRows([]);
    } else {
      setRows((data as Submission[]) || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function approveAndEmail(submissionId: string) {
    setBusyId(submissionId);
    setErr(null);
    setMsg(null);

    try {
      const res = await fetch(`/api/admin/submissions/${submissionId}/approve`, {
        method: "POST",
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error ?? "Approve request failed");
      }

      setMsg("Approved. Payment link emailed to the contact email.");
      await load();
    } catch (e: any) {
      setErr(e?.message ?? "Unknown error");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: ui.bg,
        color: ui.text,
        padding: "40px 16px",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div
          style={{
            border: `1px solid ${ui.border}`,
            background: ui.surface,
            borderRadius: 18,
            padding: 18,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div>
            <div style={{ fontSize: 22, fontWeight: 950 }}>
              Course Submissions
            </div>
            <div style={{ color: ui.muted, fontSize: 13, marginTop: 6 }}>
              Approve → email payment link → Stripe webhook auto-publishes after
              payment.
            </div>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <Link
              href="/admin"
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                border: `1px solid ${ui.border}`,
                background: ui.surface2,
                color: ui.text,
                textDecoration: "none",
                fontWeight: 800,
                fontSize: 13,
              }}
            >
              Admin Home
            </Link>

            <button
              onClick={load}
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                border: `1px solid ${ui.border}`,
                background: ui.surface2,
                color: ui.text,
                fontWeight: 800,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              Refresh
            </button>
          </div>
        </div>

        {err ? (
          <div
            style={{
              marginTop: 12,
              padding: 12,
              borderRadius: 14,
              border: `1px solid rgba(239,68,68,0.35)`,
              background: "rgba(239,68,68,0.10)",
            }}
          >
            {err}
          </div>
        ) : null}

        {msg ? (
          <div
            style={{
              marginTop: 12,
              padding: 12,
              borderRadius: 14,
              border: `1px solid rgba(34,197,94,0.35)`,
              background: "rgba(34,197,94,0.10)",
            }}
          >
            {msg}
          </div>
        ) : null}

        <div
          style={{
            marginTop: 14,
            border: `1px solid ${ui.border}`,
            background: ui.surface,
            borderRadius: 18,
            overflow: "hidden",
          }}
        >
          {loading ? (
            <div style={{ padding: 16, color: ui.muted }}>Loading…</div>
          ) : rows.length === 0 ? (
            <div style={{ padding: 16, color: ui.muted }}>
              No submissions yet.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      color: ui.muted,
                      fontSize: 12,
                      textAlign: "left",
                    }}
                  >
                    <th style={thStyle}>Submitted</th>
                    <th style={thStyle}>Course</th>
                    <th style={thStyle}>Location</th>
                    <th style={thStyle}>Contact Email (private)</th>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>Payment</th>
                    <th style={thStyle}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const canApprove =
                      r.status === "pending" ||
                      r.status === null ||
                      r.status === "approved_pending_payment";

                    return (
                      <tr key={r.id} style={{ borderTop: `1px solid ${ui.border}` }}>
                        <td style={tdStyle}>
                          {new Date(r.created_at).toLocaleString()}
                        </td>
                        <td style={tdStyle}>
                          <div style={{ fontWeight: 900 }}>{r.name}</div>
                        </td>
                        <td style={tdStyle}>
                          {[r.city, r.state].filter(Boolean).join(", ")}
                        </td>
                        <td style={tdStyle}>{r.contact_email ?? "—"}</td>
                        <td style={tdStyle}>{r.status ?? "pending"}</td>
                        <td style={tdStyle}>{r.payment_status ?? "unpaid"}</td>
                        <td style={tdStyle}>
                          <button
                            disabled={!canApprove || busyId === r.id}
                            onClick={() => approveAndEmail(r.id)}
                            style={{
                              padding: "10px 12px",
                              borderRadius: 12,
                              border: "1px solid rgba(34,197,94,0.45)",
                              background: `linear-gradient(180deg, ${ui.accent}, ${ui.accent2})`,
                              color: ui.black,
                              fontWeight: 950,
                              cursor:
                                !canApprove || busyId === r.id
                                  ? "not-allowed"
                                  : "pointer",
                              opacity:
                                !canApprove || busyId === r.id ? 0.6 : 1,
                            }}
                          >
                            {busyId === r.id
                              ? "Working…"
                              : "Approve + Email Payment"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div style={{ marginTop: 14, color: ui.muted, fontSize: 12 }}>
          Tip: once payment completes, the Stripe webhook will auto-publish the
          course into the public Courses list.
        </div>
      </div>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  padding: "12px 12px",
  borderBottom: "1px solid rgba(255,255,255,0.08)",
  whiteSpace: "nowrap",
};

const tdStyle: React.CSSProperties = {
  padding: "12px 12px",
  verticalAlign: "top",
  fontSize: 13,
};