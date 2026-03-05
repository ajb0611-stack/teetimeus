import Link from "next/link";

export const dynamic = "force-dynamic";

const ui = {
  bg: "#0b1220",
  surface: "rgba(255,255,255,0.06)",
  border: "rgba(255,255,255,0.10)",
  text: "rgba(255,255,255,0.92)",
  muted: "rgba(255,255,255,0.68)",
  accent: "#22c55e",
  accent2: "#16a34a",
  black: "#0b1220",
};

type PageProps = {
  searchParams?: {
    submission_id?: string;
  };
};

export default function PayCancelPage({ searchParams }: PageProps) {
  const submissionId = searchParams?.submission_id;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: `radial-gradient(1200px 700px at 20% -10%, rgba(34,197,94,0.22), transparent 60%),
                     radial-gradient(900px 600px at 90% 0%, rgba(59,130,246,0.18), transparent 55%),
                     ${ui.bg}`,
        color: ui.text,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "56px 16px",
      }}
    >
      <div
        style={{
          maxWidth: 760,
          width: "100%",
          border: `1px solid ${ui.border}`,
          background: ui.surface,
          borderRadius: 22,
          padding: 22,
          boxShadow: "0 20px 50px rgba(0,0,0,0.28)",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 30, fontWeight: 950, letterSpacing: "-0.02em" }}>
          Payment canceled
        </div>

        <div style={{ marginTop: 10, color: ui.muted, fontSize: 14, lineHeight: 1.5 }}>
          No charge was made.
          <br />
          Your course will remain pending until payment is completed.
        </div>

        <div
          style={{
            marginTop: 14,
            padding: 12,
            borderRadius: 14,
            border: `1px solid ${ui.border}`,
            background: "rgba(0,0,0,0.18)",
            color: ui.muted,
            fontSize: 12,
            textAlign: "left",
          }}
        >
          <div style={{ fontWeight: 800, color: ui.text, marginBottom: 6 }}>Submission</div>
          <div>submission_id: {submissionId ?? "—"}</div>
        </div>

        <div style={{ marginTop: 18, display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <Link
            href="/"
            style={{
              padding: "12px 16px",
              borderRadius: 14,
              border: `1px solid ${ui.border}`,
              background: "rgba(255,255,255,0.06)",
              color: ui.text,
              textDecoration: "none",
              fontWeight: 900,
            }}
          >
            Back to Courses
          </Link>

          <Link
            href="/submit"
            style={{
              padding: "12px 16px",
              borderRadius: 14,
              border: "1px solid rgba(34,197,94,0.45)",
              background: `linear-gradient(180deg, ${ui.accent}, ${ui.accent2})`,
              color: ui.black,
              textDecoration: "none",
              fontWeight: 950,
              boxShadow: "0 10px 25px rgba(34,197,94,0.18)",
            }}
          >
            Submit another course
          </Link>
        </div>

        <div style={{ marginTop: 12, color: ui.muted, fontSize: 12 }}>
          If you need the payment link resent, contact us at alex.teetimeus@gmail.com.
        </div>
      </div>
    </div>
  );
}