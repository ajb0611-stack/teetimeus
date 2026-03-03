"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

const ui = {
  border: "rgba(255,255,255,0.12)",
  surface: "rgba(255,255,255,0.05)",
  text: "rgba(255,255,255,0.92)",
  muted: "rgba(255,255,255,0.70)",
  bg: "#0b1220",
  accent: "#22c55e",
  accent2: "#16a34a",
  black: "#0b1220",
};

export default function SubmitCoursePage() {
  const supabase = useMemo(() => supabaseBrowser(), []);

  const [form, setForm] = useState({
    name: "",
    address: "",
    city: "",
    state: "FL",
    phone: "",
    website_url: "",
    tee_time_url: "",
    image_url: "",
    contact_email: "",
  });

  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setField<K extends keyof typeof form>(key: K, value: string) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.name.trim()) return setError("Course name is required.");
    if (!form.contact_email.trim()) return setError("Contact email is required.");
    if (!form.tee_time_url.trim()) return setError("Booking URL is required.");

    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        address: form.address.trim() || null,
        city: form.city.trim() || null,
        state: form.state.trim() || "FL",
        phone: form.phone.trim() || null,
        website_url: form.website_url.trim() || null,
        tee_time_url: form.tee_time_url.trim() || null,
        image_url: form.image_url.trim() || null,
        contact_email: form.contact_email.trim().toLowerCase(),

        approval_status: "pending",
        payment_status: "unpaid",
      };

      const { error } = await supabase.from("course_submissions").insert([payload]);
      if (error) throw error;

      setOk(true);
    } catch (err: any) {
      setError(err?.message || "Submission failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: ui.bg,
        color: ui.text,
        padding: "56px 16px",
      }}
    >
      <div style={{ maxWidth: 780, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 30, fontWeight: 950, letterSpacing: "-0.02em" }}>Add Your Course</div>
            <div style={{ marginTop: 8, color: ui.muted }}>
              Submit for review. If approved, we’ll email you a payment link to go live ($14.99/mo).
            </div>
          </div>

          <Link
            href="/courses"
            style={{
              textDecoration: "none",
              padding: "10px 14px",
              borderRadius: 12,
              border: `1px solid ${ui.border}`,
              background: ui.surface,
              color: ui.text,
              fontWeight: 800,
              height: 40,
              display: "inline-flex",
              alignItems: "center",
            }}
          >
            Back to Courses
          </Link>
        </div>

        <div style={{ marginTop: 18, border: `1px solid ${ui.border}`, background: ui.surface, borderRadius: 18, padding: 18 }}>
          {ok ? (
            <div>
              <div style={{ fontSize: 18, fontWeight: 950 }}>Submitted</div>
              <div style={{ marginTop: 10, color: ui.muted }}>
                Thanks — your course is now pending review. If approved, you’ll receive an email with a Stripe payment link.
              </div>
              <div style={{ marginTop: 14 }}>
                <Link
                  href="/courses"
                  style={{
                    display: "inline-flex",
                    padding: "10px 14px",
                    borderRadius: 12,
                    border: `1px solid ${ui.border}`,
                    background: ui.surface,
                    color: ui.text,
                    fontWeight: 900,
                    textDecoration: "none",
                  }}
                >
                  Return to Courses
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
              {error ? (
                <div style={{ padding: 12, borderRadius: 14, border: "1px solid rgba(239,68,68,0.35)", background: "rgba(239,68,68,0.12)" }}>
                  {error}
                </div>
              ) : null}

              <Field label="Course Name *">
                <input value={form.name} onChange={(e) => setField("name", e.target.value)} placeholder="Example: Timuquana Country Club"
                  style={inputStyle()} />
              </Field>

              <Field label="Contact Email * (we send the payment link here)">
                <input value={form.contact_email} onChange={(e) => setField("contact_email", e.target.value)} placeholder="name@course.com"
                  style={inputStyle()} />
              </Field>

              <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" }}>
                <Field label="City">
                  <input value={form.city} onChange={(e) => setField("city", e.target.value)} placeholder="Jacksonville"
                    style={inputStyle()} />
                </Field>
                <Field label="State">
                  <input value={form.state} onChange={(e) => setField("state", e.target.value)} placeholder="FL"
                    style={inputStyle()} />
                </Field>
              </div>

              <Field label="Address">
                <input value={form.address} onChange={(e) => setField("address", e.target.value)} placeholder="123 Golf Rd"
                  style={inputStyle()} />
              </Field>

              <Field label="Phone">
                <input value={form.phone} onChange={(e) => setField("phone", e.target.value)} placeholder="(904) 555-1234"
                  style={inputStyle()} />
              </Field>

              <Field label="Website URL">
                <input value={form.website_url} onChange={(e) => setField("website_url", e.target.value)} placeholder="https://course.com"
                  style={inputStyle()} />
              </Field>

              <Field label="Booking URL * (direct tee time booking page)">
                <input value={form.tee_time_url} onChange={(e) => setField("tee_time_url", e.target.value)} placeholder="https://.../tee-times"
                  style={inputStyle()} />
              </Field>

              <Field label="Image URL">
                <input value={form.image_url} onChange={(e) => setField("image_url", e.target.value)} placeholder="https://.../photo.jpg"
                  style={inputStyle()} />
              </Field>

              <button
                disabled={loading}
                type="submit"
                style={{
                  marginTop: 6,
                  padding: "12px 16px",
                  borderRadius: 14,
                  border: "1px solid rgba(34,197,94,0.45)",
                  background: `linear-gradient(180deg, ${ui.accent}, ${ui.accent2})`,
                  color: ui.black,
                  fontWeight: 950,
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? "Submitting..." : "Submit for Review"}
              </button>

              <div style={{ fontSize: 12, color: ui.muted }}>
                Submissions are reviewed before publishing. Approved courses must subscribe to go live.
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      <div style={{ fontSize: 13, fontWeight: 800, opacity: 0.9 }}>{label}</div>
      {children}
    </label>
  );
}

function inputStyle(): React.CSSProperties {
  return {
    padding: "12px 14px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(0,0,0,0.18)",
    color: "rgba(255,255,255,0.92)",
    outline: "none",
  };
}