"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function PayCancelPage() {
  const sp = useSearchParams();
  const submissionId = sp.get("submissionId");

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: 48, fontFamily: "system-ui" }}>
      <h1 style={{ fontSize: 32, marginBottom: 10 }}>Payment cancelled</h1>
      <p style={{ fontSize: 16, lineHeight: 1.5 }}>
        No worries—your submission is still saved. You can complete payment anytime after approval.
      </p>

      <div style={{ marginTop: 22, display: "flex", gap: 14, flexWrap: "wrap" }}>
        <Link href="/courses" style={{ textDecoration: "underline" }}>
          Back to Courses
        </Link>

        <Link href={submissionId ? `/admin/submissions` : "/"} style={{ textDecoration: "underline" }}>
          Return
        </Link>
      </div>
    </div>
  );
}