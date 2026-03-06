"use client";

import Link from "next/link";

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

function CardLink({
  href,
  title,
  desc,
  accent = false,
}: {
  href: string;
  title: string;
  desc: string;
  accent?: boolean;
}) {
  return (
    <Link
      href={href}
      style={{
        display: "block",
        textDecoration: "none",
        borderRadius: 18,
        border: `1px solid ${accent ? "rgba(34,197,94,0.35)" : ui.border}`,
        background: accent ? "rgba(34,197,94,0.08)" : "rgba(255,255,255,0.04)",
        padding: 18,
        boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
        transition: "transform 140ms ease, border-color 140ms ease, background 140ms ease",
        color: ui.text,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-2px)";
        (e.currentTarget as HTMLAnchorElement).style.background = accent
          ? "rgba(34,197,94,0.10)"
          : "rgba(255,255,255,0.06)";
        (e.currentTarget as HTMLAnchorElement).style.borderColor = accent
          ? "rgba(34,197,94,0.45)"
          : "rgba(255,255,255,0.16)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(0px)";
        (e.currentTarget as HTMLAnchorElement).style.background = accent
          ? "rgba(34,197,94,0.08)"
          : "rgba(255,255,255,0.04)";
        (e.currentTarget as HTMLAnchorElement).style.borderColor = accent
          ? "rgba(34,197,94,0.35)"
          : ui.border;
      }}
    >
      <div style={{ fontSize: 18, fontWeight: 950, letterSpacing: "-0.01em" }}>{title}</div>
      <div style={{ marginTop: 8, fontSize: 13, color: ui.muted, lineHeight: 1.35 }}>{desc}</div>

      <div
        style={{
          marginTop: 14,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "10px 14px",
          borderRadius: 14,
          border: accent ? "1px solid rgba(34,197,94,0.45)" : `1px solid ${ui.border}`,
          background: accent ? `linear-gradient(180deg, ${ui.accent}, ${ui.accent2})` : ui.surface2,
          color: accent ? ui.black : ui.text,
          fontWeight: 950,
          fontSize: 13,
          boxShadow: accent ? "0 10px 25px rgba(34,197,94,0.18)" : "none",
          width: "fit-content",
        }}
      >
        Open
      </div>
    </Link>
  );
}

export default function AdminHome() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: `radial-gradient(1200px 700px at 20% -10%, rgba(34,197,94,0.18), transparent 60%),
                     radial-gradient(900px 600px at 90% 0%, rgba(59,130,246,0.12), transparent 55%),
                     ${ui.bg}`,
        color: ui.text,
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "56px 16px 70px" }}>
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
              <div style={{ fontSize: 30, fontWeight: 950, letterSpacing: "-0.02em" }}>Admin Dashboard</div>
              <div style={{ marginTop: 6, color: ui.muted, fontSize: 14 }}>
                Manage submissions, requests, and your published course directory.
              </div>
            </div>

            <Link
              href="/courses"
              style={{
                padding: "10px 14px",
                borderRadius: 14,
                border: `1px solid ${ui.border}`,
                background: ui.surface2,
                color: ui.text,
                textDecoration: "none",
                fontWeight: 900,
                fontSize: 13,
              }}
            >
              Back to Courses
            </Link>
          </div>
        </div>

        <div
          style={{
            marginTop: 16,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 12,
          }}
        >
          <CardLink
            href="/admin/submissions"
            title="Course Submissions"
            desc="Review course-owner submissions, approve, and send payment links."
            accent
          />

          <CardLink
            href="/admin/requests"
            title="Course Requests"
            desc="Private demand intel from golfers. Use this list to prioritize outreach."
          />

          <CardLink
            href="/admin/courses"
            title="Courses Import"
            desc="Import CSVs and manage your existing course directory."
          />
        </div>

        <div style={{ marginTop: 18, color: ui.muted, fontSize: 12 }}>
          Tip: Requests are private and never appear on the public site.
        </div>
      </div>
    </div>
  );
}