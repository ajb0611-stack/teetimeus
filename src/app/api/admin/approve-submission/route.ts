// src/app/api/admin/approve-submission/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { Resend } from "resend";
import { supabaseService } from "@/lib/supabaseClients";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function requireEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

export async function POST(req: Request) {
  try {
    const { submissionId } = (await req.json()) as { submissionId?: string };

    if (!submissionId) {
      return NextResponse.json({ error: "Missing submissionId" }, { status: 400 });
    }

    // Read env vars ONLY when the request runs (prevents build-time crashes)
    const STRIPE_SECRET_KEY = requireEnv("STRIPE_SECRET_KEY");
    const STRIPE_PRICE_ID = requireEnv("STRIPE_PRICE_ID");
    const RESEND_API_KEY = requireEnv("RESEND_API_KEY");
    const EMAIL_FROM = requireEnv("EMAIL_FROM");
    const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://teetimeus.com";

    const stripe = new Stripe(STRIPE_SECRET_KEY);
    const resend = new Resend(RESEND_API_KEY);

    // 1) Load submission (must include email)
    const { data: sub, error: subErr } = await supabaseService()
      .from("course_submissions")
      .select("id, course_name, contact_email")
      .eq("id", submissionId)
      .single();

    if (subErr || !sub) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    if (!sub.contact_email) {
      return NextResponse.json(
        { error: "Submission missing contact_email (required to send payment link)" },
        { status: 400 }
      );
    }

    // 2) Mark submission "approved_pending_payment"
    const { error: upErr } = await supabaseService()
      .from("course_submissions")
      .update({ status: "approved_pending_payment" })
      .eq("id", submissionId);

    if (upErr) {
      return NextResponse.json({ error: "Failed to update submission status" }, { status: 500 });
    }

    // 3) Create Stripe Checkout Session (subscription)
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: sub.contact_email,
      line_items: [{ price: STRIPE_PRICE_ID, quantity: 1 }],
      success_url: `${SITE_URL}/submit?paid=1`,
      cancel_url: `${SITE_URL}/submit?paid=0`,
      metadata: {
        submission_id: submissionId,
      },
    });

    if (!session.url) {
      return NextResponse.json({ error: "Stripe session missing url" }, { status: 500 });
    }

    // 4) Email the payment link
    await resend.emails.send({
      from: EMAIL_FROM,
      to: sub.contact_email,
      subject: "Your TeeTimeUs listing was approved — complete payment to go live",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5;">
          <h2 style="margin: 0 0 12px;">Approved ✅</h2>
          <p style="margin: 0 0 12px;">
            Your course submission <b>${escapeHtml(sub.course_name || "your course")}</b> was approved.
            To publish it on TeeTimeUs, please complete your subscription payment:
          </p>
          <p style="margin: 16px 0;">
            <a href="${session.url}" style="display:inline-block;padding:12px 16px;border-radius:10px;background:#22c55e;color:#0b1220;text-decoration:none;font-weight:700;">
              Complete Payment
            </a>
          </p>
          <p style="margin: 0;color:#6b7280;font-size: 12px;">
            If you have questions, just reply to this email.
          </p>
        </div>
      `,
    });

    return NextResponse.json({ ok: true, checkoutUrl: session.url });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Unknown error" },
      { status: 500 }
    );
  }
}

function escapeHtml(str: string) {
  return str.replace(/[&<>"']/g, (m) => {
    switch (m) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#039;";
      default:
        return m;
    }
  });
}