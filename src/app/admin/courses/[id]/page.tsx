"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { z } from "zod";
import { supabaseAnon } from "@/lib/supabaseClients";
import { slugify } from "@/lib/slugify";

const CourseSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2),
  slug: z.string().min(2),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().min(2).max(2),
  zip: z.string().optional().nullable(),
  image_url: z.string().url().optional().nullable(),
  tee_time_url: z.string().url(),
  website_url: z.string().url().optional().nullable(),
  phone: z.string().optional().nullable(),
  is_public: z.boolean()
});

export default function AdminCourseEdit() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const isNew = id === "new";

  const supabase = useMemo(() => supabaseAnon(), []);
  const [token, setToken] = useState("");
  const [adminOk, setAdminOk] = useState(false);
  const [status, setStatus] = useState<"loading"|"idle"|"saving"|"saved"|"error">("loading");
  const [msg, setMsg] = useState("");

  const [form, setForm] = useState({
    name: "",
    slug: "",
    address: "",
    city: "",
    state: "FL",
    zip: "",
    image_url: "",
    tee_time_url: "",
    website_url: "",
    phone: "",
    is_public: true
  });

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      const t = data.session?.access_token ?? "";
      setToken(t);
      if (!t) { setStatus("error"); setMsg("Not signed in."); return; }

      const me = await fetch("/api/admin/me", { headers: { Authorization: `Bearer ${t}` } });
      const mj = await me.json();
      if (!me.ok || !mj.is_admin) { setStatus("error"); setMsg("Not an admin."); return; }
      setAdminOk(true);

      if (isNew) { setStatus("idle"); return; }

      const res = await fetch(`/api/admin/courses/${id}`, { headers: { Authorization: `Bearer ${t}` } });
      const json = await res.json();
      if (!res.ok) { setStatus("error"); setMsg(json.error ?? "Failed to load"); return; }

      setForm({
        name: json.course.name ?? "",
        slug: json.course.slug ?? "",
        address: json.course.address ?? "",
        city: json.course.city ?? "",
        state: json.course.state ?? "FL",
        zip: json.course.zip ?? "",
        image_url: json.course.image_url ?? "",
        tee_time_url: json.course.tee_time_url ?? "",
        website_url: json.course.website_url ?? "",
        phone: json.course.phone ?? "",
        is_public: Boolean(json.course.is_public)
      });
      setStatus("idle");
    };
    init();
  }, [supabase, id, isNew]);

  function setField(key: string, value: any) {
    setForm((f) => ({ ...f, [key]: value } as any));
  }

  function autoSlug(name: string) {
    if (!form.slug || form.slug === slugify(form.name)) setField("slug", slugify(name));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    setMsg("");

    const payload = {
      ...(isNew ? {} : { id }),
      name: form.name,
      slug: form.slug || slugify(form.name),
      address: form.address || null,
      city: form.city || null,
      state: form.state || "FL",
      zip: form.zip || null,
      image_url: form.image_url || null,
      tee_time_url: form.tee_time_url,
      website_url: form.website_url || null,
      phone: form.phone || null,
      is_public: form.is_public
    };

    const parsed = CourseSchema.safeParse(payload);
    if (!parsed.success) {
      setStatus("error");
      setMsg(parsed.error.issues.map(i => i.message).join(", "));
      return;
    }

    const res = await fetch(isNew ? "/api/admin/courses" : `/api/admin/courses/${id}`, {
      method: isNew ? "POST" : "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(parsed.data)
    });

    const json = await res.json();
    if (!res.ok) { setStatus("error"); setMsg(json.error ?? "Save failed"); return; }

    setStatus("saved");
    setMsg("Saved.");
    if (isNew && json.course?.id) window.location.href = `/admin/course/${json.course.id}`;
  }

  async function del() {
    if (!confirm("Delete this course?")) return;
    const res = await fetch(`/api/admin/courses/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });
    const json = await res.json();
    if (!res.ok) { setStatus("error"); setMsg(json.error ?? "Delete failed"); return; }
    window.location.href = "/admin";
  }

  if (status === "loading") return <div>Loading…</div>;
  if (!adminOk && status === "error") {
    return (
      <div>
        <h1 style={{ margin: "0 0 8px", fontSize: 28 }}>Admin</h1>
        <div style={{ padding: 12, border: "1px solid rgba(255,0,0,0.25)", borderRadius: 12 }}>{msg}</div>
        <div style={{ marginTop: 12 }}><Link href="/admin/login" style={{ textDecoration: "none" }}>Go to login</Link></div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 760 }}>
      <h1 style={{ margin: "0 0 6px", fontSize: 28 }}>{isNew ? "Add course" : "Edit course"}</h1>
      <div style={{ opacity: 0.8 }}><Link href="/admin" style={{ textDecoration: "none" }}>← Back to admin</Link></div>

      <form onSubmit={save} style={{ marginTop: 16, display: "grid", gap: 12 }}>
        <label style={{ display: "grid", gap: 6 }}>
          <div style={{ fontWeight: 800 }}>Course name</div>
          <input value={form.name} onChange={(e) => { setField("name", e.target.value); autoSlug(e.target.value); }}
            style={{ padding: "12px 12px", borderRadius: 12, border: "1px solid rgba(0,0,0,0.14)" }} />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <div style={{ fontWeight: 800 }}>Slug</div>
          <input value={form.slug} onChange={(e) => setField("slug", e.target.value)}
            style={{ padding: "12px 12px", borderRadius: 12, border: "1px solid rgba(0,0,0,0.14)" }} />
        </label>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <label style={{ display: "grid", gap: 6 }}>
            <div style={{ fontWeight: 800 }}>City</div>
            <input value={form.city} onChange={(e) => setField("city", e.target.value)}
              style={{ padding: "12px 12px", borderRadius: 12, border: "1px solid rgba(0,0,0,0.14)" }} />
          </label>
          <label style={{ display: "grid", gap: 6 }}>
            <div style={{ fontWeight: 800 }}>Zip</div>
            <input value={form.zip} onChange={(e) => setField("zip", e.target.value)}
              style={{ padding: "12px 12px", borderRadius: 12, border: "1px solid rgba(0,0,0,0.14)" }} />
          </label>
        </div>

        <label style={{ display: "grid", gap: 6 }}>
          <div style={{ fontWeight: 800 }}>Address (optional)</div>
          <input value={form.address} onChange={(e) => setField("address", e.target.value)}
            style={{ padding: "12px 12px", borderRadius: 12, border: "1px solid rgba(0,0,0,0.14)" }} />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <div style={{ fontWeight: 800 }}>Tee time booking URL</div>
          <input value={form.tee_time_url} onChange={(e) => setField("tee_time_url", e.target.value)} placeholder="https://..."
            style={{ padding: "12px 12px", borderRadius: 12, border: "1px solid rgba(0,0,0,0.14)" }} />
        </label>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <label style={{ display: "grid", gap: 6 }}>
            <div style={{ fontWeight: 800 }}>Course website (optional)</div>
            <input value={form.website_url} onChange={(e) => setField("website_url", e.target.value)} placeholder="https://..."
              style={{ padding: "12px 12px", borderRadius: 12, border: "1px solid rgba(0,0,0,0.14)" }} />
          </label>
          <label style={{ display: "grid", gap: 6 }}>
            <div style={{ fontWeight: 800 }}>Photo URL (optional)</div>
            <input value={form.image_url} onChange={(e) => setField("image_url", e.target.value)} placeholder="https://..."
              style={{ padding: "12px 12px", borderRadius: 12, border: "1px solid rgba(0,0,0,0.14)" }} />
          </label>
        </div>

        <label style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <input type="checkbox" checked={form.is_public} onChange={(e) => setField("is_public", e.target.checked)} />
          <span style={{ fontWeight: 800 }}>Visible on site</span>
        </label>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button type="submit" disabled={status === "saving"} style={{ padding: "12px 14px", borderRadius: 14, border: "1px solid rgba(0,0,0,0.14)", fontWeight: 900 }}>
            {status === "saving" ? "Saving..." : "Save"}
          </button>
          {!isNew ? (
            <button type="button" onClick={del} style={{ padding: "12px 14px", borderRadius: 14, border: "1px solid rgba(255,0,0,0.25)", fontWeight: 900 }}>
              Delete
            </button>
          ) : null}
        </div>

        {msg ? <div style={{ padding: 12, borderRadius: 12, border: status === "error" ? "1px solid rgba(255,0,0,0.25)" : "1px solid rgba(0,128,0,0.25)" }}>{msg}</div> : null}
      </form>
    </div>
  );
}
