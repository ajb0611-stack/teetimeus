import Link from "next/link";

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

export default function SubmissionReceivedPage() {
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
      }}
    >
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "56px 16px" }}>
        <div
          style={{
            border: `1px solid ${ui.border}`,
            background: ui.surface,
            borderRadius: 22,
            padding: 22,
            boxShadow: "0 20px 50px rgba(0,0,0,0.28)",
          }}
        >
          <div style={{ fontSize: 30, fontWeight: 950, letterSpacing: "-0.02em" }}>
            Submission received
          </div>

          <div style={{ marginTop: 10, color: ui.muted, fontSize: 14, lineHeight: 1.5 }}>
            Thanks — your course is now in our review queue.
            <br />
            If approved, you’ll receive an email with a secure Stripe payment link.
            <br />
            After payment, your course will be published on TeeTimeUs.
          </div>

          <div style={{ marginTop: 18, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link
              href="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "12px 16px",
                borderRadius: 14,
                border: `1px solid ${ui.border}`,
                background: "rgba(0,0,0,0.18)",
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
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
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

          <div style={{ marginTop: 12, fontSize: 12, color: ui.muted }}>
            Payment is only requested after approval.
          </div>
        </div>
      </div>
    </div>
  );
}