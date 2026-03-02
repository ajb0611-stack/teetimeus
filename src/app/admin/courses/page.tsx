"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Papa from "papaparse";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

export default function AdminCourses() {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const [msg, setMsg] = useState<string>("");
  const [busy, setBusy] = useState(false);

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

  function pick(r: any, keys: string[]) {
    for (const k of keys) {
      const v = r?.[k];
      if (v !== undefined && v !== null && String(v).trim() !== "") return String(v).trim();
    }
    return "";
  }

  function slugify(name: string) {
    return name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    setMsg("");

    const ok = await requireAdmin();
    if (!ok) return;

    const file = e.target.files?.[0];
    if (!file) return;

    setBusy(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results: any) => {
        const rows = (results.data || [])
          .map((r: any) => {
            const name = pick(r, ["name", "course_name", "course", "Course Name", "Course", "Name"]);
            const address = pick(r, ["address", "street", "Address", "Street", "Street Address"]);
            const city = pick(r, ["city", "City", "Town"]);
            const state = pick(r, ["state", "State"]) || "FL";
            const phone = pick(r, ["phone", "Phone", "phone_number", "Phone Number", "tel", "Telephone"]);
            const website_url = pick(r, ["website_url", "website", "Website", "url", "URL"]);
            const tee_time_url = pick(r, [
              "tee_time_url",
              "tee times",
              "Tee Times",
              "booking_url",
              "Booking URL",
              "schedule_url",
              "Schedule URL",
              "Reservation URL",
              "Reservation Link",
              "Book Tee Time",
              "Book Tee Times",
            ]);
            const image_url = pick(r, [
              "image_url",
              "Image URL",
              "image",
              "Image",
              "photo_url",
              "Photo URL",
              "photo",
              "Photo",
            ]);

            const slug = name ? slugify(name) : "";

            return {
              name,
              slug,
              address: address || null,
              city: city || null,
              state: state || "FL",
              phone: phone || null,
              website_url: website_url || null,
              tee_time_url: tee_time_url || null,
              image_url: image_url || null,
            };
          })
          .filter((r: any) => r.name && r.name.length > 0 && r.slug.length > 0);

        if (rows.length === 0) {
          setMsg("No valid rows found. Make sure your CSV has a course name column.");
          setBusy(false);
          return;
        }

        const { error } = await supabase.from("courses").upsert(rows, { onConflict: "slug" });

        if (error) {
          setMsg(`Upsert failed: ${error.message}`);
        } else {
          setMsg(`Success! Upserted ${rows.length} courses.`);
        }

        setBusy(false);
      },
      error: (err: any) => {
        setMsg(`CSV parse error: ${err.message}`);
        setBusy(false);
      },
    });
  }

  return (
    <div className="container">
      <div className="shell" style={{ maxWidth: 980, margin: "0 auto" }}>
        <div className="spread">
          <div>
            <h1 className="h1" style={{ fontSize: 28 }}>Courses Import</h1>
            <p className="p">Upload a CSV — we upsert by slug so you can re-import anytime.</p>
          </div>

          <div className="row">
            <Link className="btn" href="/admin">
              Dashboard
            </Link>
            <Link className="btn" href="/courses">
              Public Site
            </Link>
          </div>
        </div>

        <div style={{ marginTop: 14, color: "var(--muted)", fontSize: 13, lineHeight: 1.45 }}>
          Supported headers include:
          <div style={{ marginTop: 8 }}>
            <span className="badge">
              Course Name, Address, City, State, Phone, Website, Booking URL, Image URL
            </span>
          </div>
        </div>

        <div className="card" style={{ marginTop: 16 }}>
          <input type="file" accept=".csv" onChange={handleFile} disabled={busy} style={{ color: "var(--muted)" }} />
          <div style={{ marginTop: 10, fontSize: 13, color: "var(--muted)" }}>
            {busy ? "Importing..." : "Choose a CSV file to import."}
          </div>

          {msg && (
            <div className="card" style={{ marginTop: 12, fontSize: 13 }}>
              {msg}
            </div>
          )}
        </div>

        <div style={{ marginTop: 14, color: "var(--muted)", fontSize: 12 }}>
          Tip: Re-upload the same CSV anytime — existing rows update instead of duplicating.
        </div>
      </div>
    </div>
  );
}