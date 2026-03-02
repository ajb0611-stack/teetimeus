"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

function DashboardCard({
  title,
  desc,
  href,
  primary,
}: {
  title: string;
  desc: string;
  href: string;
  primary?: boolean;
}) {
  return (
    <Link href={href} className={primary ? "btnPrimary" : "btn"} style={{ borderRadius: 18, padding: 16, height: "100%" }}>
      <div style={{ display: "grid", gap: 6 }}>
        <div style={{ fontSize: 16, fontWeight: 950 }}>{title}</div>
        <div style={{ fontSize: 13, color: primary ? "rgba(11,18,32,0.78)" : "var(--muted)" }}>{desc}</div>
      </div>
    </Link>
  );
}

export default function AdminDashboard() {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const [loading, setLoading] = useState(true);
  const [authedEmail, setAuthedEmail] = useState("");

  async function requireAdmin() {
    const { data: userRes } = await supabase.auth.getUser();
    const user = userRes.user;

    if (!user) {
      window.location.href = "/admin/login";
      return false;
    }

    setAuthedEmail(user.email ?? "");

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

  useEffect(() => {
    let alive = true;

    (async () => {
      const ok = await requireAdmin();
      if (!alive) return;
      setLoading(!ok);
      if (ok) setLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/courses";
  }

  return (
    <div className="container">
      <div className="shell">
        <div className="spread">
          <div>
            <h1 className="h1" style={{ fontSize: 28 }}>Admin Dashboard</h1>
            <p className="p">Keep courses clean and booking links accurate.</p>
          </div>

          <div className="row">
            <Link className="btn" href="/courses">
              Public Site
            </Link>
            <button className="btn" onClick={logout}>
              Log out
            </button>
          </div>
        </div>

        <div style={{ marginTop: 10, color: "var(--muted)", fontSize: 12 }}>
          {loading ? "Checking access…" : authedEmail ? `Signed in as ${authedEmail}` : ""}
        </div>

        <div style={{ marginTop: 18, display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
          <DashboardCard
            title="Courses Import"
            desc="Upload a CSV and update courses safely."
            href="/admin/courses"
            primary
          />
          <DashboardCard
            title="Test Public Page"
            desc="Open /courses and verify buttons + links."
            href="/courses"
          />
          <DashboardCard
            title="Admin Login"
            desc="Return to login (useful for testing)."
            href="/admin/login"
          />
        </div>

        <div style={{ marginTop: 16, color: "var(--muted)", fontSize: 13, lineHeight: 1.45 }}>
          Tip: your edge is simplicity — always use the link that goes directly to the tee time booking page.
        </div>
      </div>
    </div>
  );
}