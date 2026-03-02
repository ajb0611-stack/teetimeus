"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

export default function AdminLogin() {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string>("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");

    const e2 = email.trim();
    if (!e2 || !password) {
      setMsg("Enter your email and password.");
      return;
    }

    setBusy(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: e2,
      password,
    });

    if (error) {
      setMsg(error.message);
      setBusy(false);
      return;
    }

    window.location.href = "/admin";
  }

  return (
    <div className="container">
      <div className="shell" style={{ maxWidth: 620, margin: "0 auto" }}>
        <div className="spread">
          <div>
            <h1 className="h1" style={{ fontSize: 28 }}>Admin Login</h1>
            <p className="p">Restricted access.</p>
          </div>

          <div className="row">
            <Link className="btn" href="/courses">
              Public Site
            </Link>
          </div>
        </div>

        <form onSubmit={onSubmit} style={{ marginTop: 18, display: "grid", gap: 12 }}>
          <div style={{ display: "grid", gap: 6 }}>
            <label style={{ fontSize: 13, color: "var(--muted)" }}>Email</label>
            <input
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="you@example.com"
            />
          </div>

          <div style={{ display: "grid", gap: 6 }}>
            <label style={{ fontSize: 13, color: "var(--muted)" }}>Password</label>
            <input
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              type="password"
              placeholder="••••••••"
            />
          </div>

          <button className="btnPrimary" disabled={busy} type="submit" style={{ cursor: busy ? "not-allowed" : "pointer" }}>
            {busy ? "Signing in..." : "Sign in"}
          </button>

          {msg && (
            <div className="card" style={{ fontSize: 13 }}>
              {msg}
            </div>
          )}
        </form>

        <div style={{ marginTop: 14, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <Link href="/courses" style={{ color: "var(--muted)", textDecoration: "underline", fontSize: 13 }}>
            Back to courses
          </Link>
          <span style={{ color: "var(--muted)", fontSize: 12 }}>Golf is hard. Booking it shouldn’t be.</span>
        </div>
      </div>
    </div>
  );
}