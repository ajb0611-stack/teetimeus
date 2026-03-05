"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function PaySuccessPage() {
  const sp = useSearchParams();
  const sid = sp.get("sid");

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: 48, fontFamily: "system-ui" }}>
      <h1 style={{ fontSize: 32, marginBottom: 10 }}>Payment received</h1>
      <p style={{ fontSize: 16, lineHeight: 1.5 }}>
        Thank you. Your payment was successful and your course will now be published.
      </p>

      {sid ? (
        <p style={{ marginTop: 14, fontSize: 12, opacity: 0.75 }}>
          Confirmation: <code>{sid}</code>
        </p>
      ) : null}

      <div style={{ marginTop: 22 }}>
        <Link href="/courses" style={{ textDecoration: "underline" }}>
          Go to Courses
        </Link>
      </div>
    </div>
  );
}