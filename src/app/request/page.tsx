"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

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

function AdminIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ display: "block" }}>
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

function isValidEmail(email: string) {
  if (!email.trim()) return true; // optional
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", fontWeight: 800 }}>{label}</div>
      {children}
    </label>
  );
}

function inputStyle(): React.CSSProperties {
  return {
    padding: "12px 14px",
    borderRadius: 14,
    border: `1px solid ${ui.border}`,
    background: "rgba(0,0,0,0.18)",
    color: ui.text,
    outline: "none",
  };
}

export default function RequestCoursePage() {
  const supabase = useMemo(() => supabaseBrowser(), []);

  const [courseName, setCourseName] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("FL");
  const [email, setEmail] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit() {
    setMsg(null);
    setErr(null);

    const name = courseName.trim();
    const cty = city.trim();
    const st = state.trim() || "FL";
    const em = email.trim();

    if (!name) return setErr("Course name is required.");
    if (!cty) return setErr("City is required.");
    if (!st) return setErr("State is required.");
    if (!isValidEmail(em)) return setErr("Please enter a valid email address (or leave it blank).");

    setSubmitting(true);

    const { error } = await supabase.from("course_requests").insert([
      {
        course_name: name,
        city: cty,
        state: st,
        requester_email: em || null,
      },
    ]);

    setSubmitting(false);

    if (error) {
      console.error(error);
      setErr(error.message);
      return;
    }

    setMsg("Request received. If we add this course, we’ll make it available on TeeTimeUs.");
    setCourseName("");
    setCity("");
    setState("FL");
    setEmail("");
  }

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
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "56px 16px 70px" }}>
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
              <div style={{ fontSize: 30, fontWeight: 950, letterSpacing: "-0.02em" }}>Request Your Local Course</div>
              <div style={{ marginTop: 6, color: ui.muted, fontSize: 14 }}>
                Don’t see a course listed? Request it and we’ll prioritize reaching out.
              </div>
              <div style={{ marginTop: 6, color: ui.muted, fontSize: 12 }}>
                Email is optional and <b style={{ color: ui.text }}>never public</b> — it’s only used to notify you if the
                course gets added.
              </div>
            </div>

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

          <div style={{ marginTop: 18, display: "grid", gap: 12 }}>
            <Field label="Course Name *">
              <input value={courseName} onChange={(e) => setCourseName(e.target.value)} placeholder="Eagle Harbor Golf Club" style={inputStyle()} />
            </Field>

            <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" }}>
              <Field label="City *">
                <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Fleming Island" style={inputStyle()} />
              </Field>
              <Field label="State *">
                <input value={state} onChange={(e) => setState(e.target.value)} placeholder="FL" style={inputStyle()} />
              </Field>
            </div>

            <Field label="Your Email (optional) — private, used only for notification">
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="alex.teetimeus@gmail.com" style={inputStyle()} />
            </Field>

            {err ? (
              <div
                style={{
                  padding: 12,
                  borderRadius: 14,
                  border: "1px solid rgba(239,68,68,0.35)",
                  background: "rgba(239,68,68,0.10)",
                }}
              >
                {err}
              </div>
            ) : null}

            {msg ? (
              <div
                style={{
                  padding: 12,
                  borderRadius: 14,
                  border: "1px solid rgba(34,197,94,0.35)",
                  background: "rgba(34,197,94,0.10)",
                }}
              >
                {msg}
              </div>
            ) : null}

            <button
              onClick={onSubmit}
              disabled={submitting}
              style={{
                padding: "12px 16px",
                borderRadius: 14,
                border: "1px solid rgba(34,197,94,0.45)",
                background: `linear-gradient(180deg, ${ui.accent}, ${ui.accent2})`,
                color: ui.black,
                fontWeight: 950,
                cursor: submitting ? "not-allowed" : "pointer",
                boxShadow: "0 10px 25px rgba(34,197,94,0.18)",
              }}
            >
              {submitting ? "Submitting…" : "Request Course"}
            </button>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 6 }}>
              <Link href="/courses" style={{ color: ui.muted, textDecoration: "none", fontWeight: 800 }}>
                ← Back to Courses
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}