// src/app/admin/layout.tsx
import Link from "next/link";

function AdminIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      style={{ display: "block" }}
    >
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

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Admin-only top nav */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "18px 16px 0" }}>
        <div
          style={{
            border: "1px solid var(--border)",
            background: "var(--surface)",
            borderRadius: 18,
            padding: 12,
            boxShadow: "0 10px 30px rgba(0,0,0,0.20)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 14,
                border: "1px solid var(--border)",
                background: "var(--surface2)",
                display: "grid",
                placeItems: "center",
                fontWeight: 950,
              }}
              aria-hidden="true"
            >
              T
            </div>

            <div style={{ display: "grid" }}>
              <div style={{ fontWeight: 950, letterSpacing: "-0.01em" }}>Admin</div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>Manage courses + links</div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <Link className="btn" href="/admin">
              Dashboard
            </Link>

            <Link className="btn" href="/admin/courses">
              Import Courses
            </Link>

            {/* NEW: Submissions link */}
            <Link className="btn" href="/admin/submissions">
              Submissions
            </Link>

            {/* Icon pill back to public site */}
            <Link
              href="/courses"
              className="btn"
              title="Public site"
              aria-label="Public site"
              style={{ width: 44, height: 44, padding: 0, borderRadius: 14 }}
            >
              <AdminIcon />
            </Link>
          </div>
        </div>
      </div>

      {/* Render existing admin pages exactly as they are */}
      {children}
    </>
  );
}