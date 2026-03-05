import { NextResponse } from "next/server";
import Stripe from "stripe";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  // IMPORTANT: do NOT hardcode apiVersion here (caused your previous build errors)
});

const resend = new Resend(process.env.RESEND_API_KEY!);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const submissionId = params.id;

    // Fetch submission
    const { data: sub, error: subErr } = await supabaseAdmin
      .from("course_submissions")
      .select(
        "id,name,contact_email,status,payment_status,stripe_checkout_session_id"
      )
      .eq("id", submissionId)
      .single();

    if (subErr || !sub) {
      return NextResponse.json(
        { error: subErr?.message ?? "Submission not found" },
        { status: 404 }
      );
    }

    if (!sub.contact_email) {
      return NextResponse.json(
        { error: "Submission missing contact_email." },
        { status: 400 }
      );
    }

    // If we already created a checkout session, reuse it (avoid spamming)
    if (sub.stripe_checkout_session_id) {
      const session = await stripe.checkout.sessions.retrieve(
        sub.stripe_checkout_session_id
      );

      return NextResponse.json({
        ok: true,
        reused: true,
        checkoutUrl: session.url,
      });
    }

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    // Create Stripe Checkout session for subscription
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: sub.contact_email,
      line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
      success_url: `${siteUrl}/submit/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/submit`,
      metadata: {
        submission_id: sub.id,
      },
    });

    // Mark approved + store checkout session
    const { error: updErr } = await supabaseAdmin
      .from("course_submissions")
      .update({
        status: "approved_pending_payment",
        approved_at: new Date().toISOString(),
        payment_status: "unpaid",
        stripe_checkout_session_id: session.id,
      })
      .eq("id", sub.id);

    if (updErr) {
      return NextResponse.json({ error: updErr.message }, { status: 500 });
    }

    // Email the payment link
    const fromEmail = process.env.EMAIL_FROM!;
    const subject = "TeeTimeUs – Your course was approved (payment link)";
    const html = `
      <div style="font-family:Arial,sans-serif;line-height:1.5">
        <h2 style="margin:0 0 12px 0;">Your course was approved</h2>
        <p style="margin:0 0 12px 0;">
          Good news — your course submission (<b>${escapeHtml(
            sub.name
          )}</b>) was approved.
        </p>
        <p style="margin:0 0 16px 0;">
          To publish your course on TeeTimeUs, please complete your subscription payment:
        </p>
        <p style="margin:0 0 18px 0;">
          <a href="${session.url}" style="display:inline-block;padding:12px 16px;border-radius:10px;background:#22c55e;color:#0b1220;text-decoration:none;font-weight:700">
            Complete Payment
          </a>
        </p>
        <p style="color:#666;margin:0;">
          After payment is completed, your course will be published automatically.
        </p>
      </div>
    `;

    await resend.emails.send({
      from: fromEmail,
      to: sub.contact_email,
      subject,
      html,
    });

    return NextResponse.json({
      ok: true,
      checkoutUrl: session.url,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}

function escapeHtml(input: string) {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}