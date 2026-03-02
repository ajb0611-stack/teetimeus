"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

type FormState = {
  course_name: string;
  address: string;
  city: string;
  state: string;
  phone: string;
  website_url: string;
  tee_time_url: string;
  image_url: string;
};

function isValidUrl(value: string) {
  const v = value.trim();
  if (!v) return false;
  try {
    const u = new URL(v);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export default function SubmitCoursePage() {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string>("");

  const [form, setForm] = useState<FormState>({
    course_name: "",
    address: "",
    city: "",
    state: "FL",
    phone: "",
    website_url: "",
    tee_time_url: "",
    image_url: "",
  });

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");

    const course_name = form.course_name.trim();
    const city = form.city.trim();
    const state = (form.state.trim() || "FL").toUpperCase();
    const tee_time_url = form.tee_time_url.trim();
    const website_url = form.website_url.trim();
    const image_url = form.image_url.trim();

    if (!course_name) return setMsg("Course name is required.");
    if (!city) return setMsg("City is required.");
    if (!tee_time_url) return setMsg("Booking (tee time) URL is required.");
    if (!isValidUrl(tee_time_url)) return setMsg("Booking URL must be a valid https:// link.");

    if (website_url && !isValidUrl(website_url)) return setMsg("Website URL must be a valid https:// link.");
    if (image_url && !isValidUrl(image_url)) return setMsg("Image URL must be a valid https:// link.");

    setBusy(true);

    const { error } = await supabase.from("course_submissions").insert({
      course_name,
      address: form.address.trim() || null,
      city,
      state: state || "FL",
      phone: form.phone.trim() || null,
      website_url: website_url || null,
      tee_time_url,
      image_url: image_url || null,
      status: "pending",
    });

    if (error) {
      setMsg(`Submission failed: ${error.message}`);
      setBusy(false);
      return;
    }

    setMsg("Success! Your course was submitted for review.");
    setBusy(false);

    setForm({
      course_name: "",
      address: "",
      city: "",
      state: "FL",
      phone: "",
      website_url: "",
      tee_time_url: "",
      image_url: "",
    });
  }

  return (
    <div className="container">
      <div className="shell" style={{ maxWidth: 720, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 28, fontWeight: 950, letterSpacing: "-0.02em" }}>Add Your Course</div>
            <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 14 }}>
              Submit your booking link. We’ll review before publishing.
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <Link className="btn" href="/courses">
              Back to Courses
            </Link>
          </div>
        </div>

        <form onSubmit={onSubmit} style={{ marginTop: 18, display: "grid", gap: 12 }}>
          <div style={{ display: "grid", gap: 6 }}>
            <label style={{ fontSize: 13, color: "var(--muted)" }}>Course Name *</label>
            <input
              className="input"
              value={form.course_name}
              onChange={(e) => setField("course_name", e.target.value)}
              placeholder="Example: Eagle Harbor Golf Club"
            />
          </div>

          <div style={{ display: "grid", gap: 6 }}>
            <label style={{ fontSize: 13, color: "var(--muted)" }}>City *</label>
            <input
              className="input"
              value={form.city}
              onChange={(e) => setField("city", e.target.value)}
              placeholder="Example: Fleming Island"
            />
          </div>

          <div style={{ display: "grid", gap: 6 }}>
            <label style={{ fontSize: 13, color: "var(--muted)" }}>State</label>
            <input
              className="input"
              value={form.state}
              onChange={(e) => setField("state", e.target.value)}
              placeholder="FL"
            />
          </div>

          <div style={{ display: "grid", gap: 6 }}>
            <label style={{ fontSize: 13, color: "var(--muted)" }}>Address (optional)</label>
            <input
              className="input"
              value={form.address}
              onChange={(e) => setField("address", e.target.value)}
              placeholder="Street address"
            />
          </div>

          <div style={{ display: "grid", gap: 6 }}>
            <label style={{ fontSize: 13, color: "var(--muted)" }}>Phone (optional)</label>
            <input
              className="input"
              value={form.phone}
              onChange={(e) => setField("phone", e.target.value)}
              placeholder="(904) 555-1234"
            />
          </div>

          <div style={{ display: "grid", gap: 6 }}>
            <label style={{ fontSize: 13, color: "var(--muted)" }}>Website URL (optional)</label>
            <input
              className="input"
              value={form.website_url}
              onChange={(e) => setField("website_url", e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div style={{ display: "grid", gap: 6 }}>
            <label style={{ fontSize: 13, color: "var(--muted)" }}>Booking (Tee Time) URL *</label>
            <input
              className="input"
              value={form.tee_time_url}
              onChange={(e) => setField("tee_time_url", e.target.value)}
              placeholder="https://... (direct booking page)"
            />
            <div style={{ fontSize: 12, color: "var(--muted)" }}>
              This should be the page where golfers actually see times and book.
            </div>
          </div>

          <div style={{ display: "grid", gap: 6 }}>
            <label style={{ fontSize: 13, color: "var(--muted)" }}>Image URL (optional)</label>
            <input
              className="input"
              value={form.image_url}
              onChange={(e) => setField("image_url", e.target.value)}
              placeholder="https://... (photo link)"
            />
          </div>

          <button className="btnPrimary" disabled={busy} type="submit" style={{ cursor: busy ? "not-allowed" : "pointer" }}>
            {busy ? "Submitting..." : "Submit for Review"}
          </button>

          {msg && (
            <div className="card" style={{ fontSize: 13, color: "var(--text)" }}>
              {msg}
            </div>
          )}

          <div style={{ fontSize: 12, color: "var(--muted)" }}>
            By submitting, you confirm this is a public course and the links are accurate.
          </div>
        </form>
      </div>
    </div>
  );
}