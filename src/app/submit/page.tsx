"use  client";

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
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function isValidUrl(url: string) {
  try {
    const u = new URL(url.trim());
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export default function SubmitCoursePage() {
  const supabase = useMemo(() => supabaseBrowser(), []);

  const [courseName, setCourseName] = useState("");
  const [contactEmail, setContactEmail] = useState("");

  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("FL");
  const [phone, setPhone] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [teeTimeUrl, setTeeTimeUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit() {
    setMsg(null);
    setErr(null);

    const name = courseName.trim();
    const email = contactEmail.trim();

    const addr = address.trim();
    const cty = city.trim();
    const st = state.trim();
    const ph = phone.trim();
    const web = websiteUrl.trim();
    const tee = teeTimeUrl.trim();
    const img = imageUrl.trim();

    // Required fields
    if (!name) return setErr("Course name is required.");
    if (!email) return setErr("Contact email is required.");
    if (!isValidEmail(email)) return setErr("Please enter a valid email address.");

    if (!addr) return setErr("Address is required.");
    if (!cty) return setErr("City is required.");
    if (!st) return setErr("State is required.");
    if (!ph) return setErr("Phone is required.");

    if (!web) return setErr("Website URL is required.");
    if (!isValidUrl(web)) return setErr("Website URL must be a valid https:// or http:// link.");

    if (!tee) return setErr("Tee time booking URL is required.");
    if (!isValidUrl(tee)) return setErr("Tee time booking URL must be a valid https:// or http:// link.");

    // If you truly want image URL required, keep these 2 lines.
    // If you want it optional, delete these 2 lines.
    if (!img) return setErr("Image URL is required.");
    if (!isValidUrl(img)) return setErr("Image URL must be a valid https:// or http:// link.");

    setSubmitting(true);

    const { error } = await supabase.from("course_submissions").insert([
      {
        // PUBLIC COURSE DATA (reviewed before publish)
        name,
        address: addr,
        city: cty,
        state: st,
        phone: ph,
        website_url: web,
        tee_time_url: tee,
        image_url: img,

        // PRIVATE CONTACT DATA (DO NOT PUBLISH)
        contact_email: email,

        status: "pending",
      },
    ]);

    setSubmitting(false);

    if (error) {
      console.error(error);
      setErr(error.message);
      return;
    }

    setMsg("Submitted! We’ll review it and email you a payment link if approved.");
    setCourseName("");
    setContactEmail("");
    setAddress("");
    setCity("");
    setState("FL");
    setPhone("");
    setWebsiteUrl("");
    setTeeTimeUrl("");
    setImageUrl("");
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
              <div style={{ fontSize: 30, fontWeight: 950, letterSpacing: "-0.02em" }}>Submit Your Course</div>
              <div style={{ marginTop: 6, color: ui.muted, fontSize: 14 }}>
                All fields are required. If approved, we’ll email you a subscription payment link.
              </div>
              <div style={{ marginTop: 6, color: ui.muted, fontSize: 12 }}>
                Your email is used only for review + billing and is never shown publicly.
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
              <input value={courseName} onChange={(e) => setCourseName(e.target.value)} placeholder="TPC Sawgrass" style={inputStyle()} />
            </Field>

            <Field label="Contact Email * (private)">
              <input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="you@example.com" style={inputStyle()} />
            </Field>

            <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" }}>
              <Field label="City *">
                <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Jacksonville" style={inputStyle()} />
              </Field>
              <Field label="State *">
                <input value={state} onChange={(e) => setState(e.target.value)} placeholder="FL" style={inputStyle()} />
              </Field>
            </div>

            <Field label="Address *">
              <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="110 Championship Way" style={inputStyle()} />
            </Field>

            <Field label="Phone *">
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(904) 555-1234" style={inputStyle()} />
            </Field>

            <Field label="Website URL *">
              <input value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="https://..." style={inputStyle()} />
            </Field>

            <Field label="Tee Time Booking URL *">
              <input value={teeTimeUrl} onChange={(e) => setTeeTimeUrl(e.target.value)} placeholder="https://... (actual booking page)" style={inputStyle()} />
            </Field>

            <Field label="Image URL *">
              <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://...jpg" style={inputStyle()} />
            </Field>

            {err ? (
              <div style={{ padding: 12, borderRadius: 14, border: `1px solid rgba(239,68,68,0.35)`, background: "rgba(239,68,68,0.10)", color: ui.text }}>
                {err}
              </div>
            ) : null}

            {msg ? (
              <div style={{ padding: 12, borderRadius: 14, border: `1px solid rgba(34,197,94,0.35)`, background: "rgba(34,197,94,0.10)", color: ui.text }}>
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
              {submitting ? "Submitting…" : "Submit for Review"}
            </button>

            <div style={{ fontSize: 12, color: ui.muted }}>
              By submitting, you agree we can display your course publicly after approval and payment.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", fontWeight: 700 }}>{label}</div>
      {children}
    </label>
  );
}

function inputStyle(): React.CSSProperties {
  return {
    padding: "12px 14px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(0,0,0,0.18)",
    color: "rgba(255,255,255,0.92)",
    outline: "none",
  };
}