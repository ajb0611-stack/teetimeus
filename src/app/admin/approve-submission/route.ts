import { NextResponse } from "next/server";
import Stripe from "stripe";
import { Resend } from "resend";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
});

const resend = new Resend(process.env.RESEND_API_KEY);

function mustEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export async function POST(req: Request) {
  try {
    const { submissionId } = (await req.json()) as { submissionId?: string };
    if (!submissionId) return NextResponse.json({ error: "Missing submissionId" }, { status: 400 });

    const supabaseUrl = mustEnv("SUPABASE_URL");
    const serviceRole = mustEnv("SUPABASE_SERVICE_ROLE_KEY");

    // 1) Fetch submission
    const getRes = await fetch(
      `${supabaseUrl}/rest/v1/course_submissions?id=eq.${encodeURIComponent(submissionId)}&select=*`,
      {
        headers: { apikey: serviceRole, Authorization: `Bearer ${serviceRole}` },
      }
    );
    if (!getRes.ok) {
      const t = await getRes.text();
      throw new Error(`Failed to fetch submission: ${t}`);
    }

    const rows = (await getRes.json()) as any[];
    const s = rows?.[0];
    if (!s) return NextResponse.json({ error: "Submission not found" }, { status: 404 });

    if (!s.contact_email) return NextResponse.json({ error: "Submission missing contact_email" }, { status: 400 });
    if (!s.tee_time_url) return NextResponse.json({ error: "Submission missing tee_time_url" }, { status: 400 });

    const courseSlug = s.slug || slugify(s.name);

    // 2) Create/Upsert course as public but inactive until paid
    const courseBody = {
      name: s.name,
      slug: courseSlug,
      address: s.address ?? null,
      city: s.city ?? null,
      state: s.state ?? null,
      phone: s.phone ?? null,
      website_url: s.website_url ?? null,
      tee_time_url: s.tee_time_url ?? null,
      image_url: s.image_url ?? null,
      is_public: true,
      is_active: false,
      subscription_status: "inactive",
    };

    const upsertRes = await fetch(`${supabaseUrl}/rest/v1/courses?on_conflict=slug`, {
      method: "POST",
      headers: {
        apikey: serviceRole,
        Authorization: `Bearer ${serviceRole}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify([courseBody]),
    });

    if (!upsertRes.ok) {
      const t = await upsertRes.text();
      throw new Error(`Course upsert failed: ${t}`);
    }

    // 3) Create Stripe checkout session
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const priceId = mustEnv("STRIPE_PRICE_ID");

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${siteUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/billing/cancel`,
      metadata: { courseSlug, submissionId },
      subscription_data: { metadata: { courseSlug, submissionId } },
      allow_promotion_codes: true,
    });

    if (!session.url) throw new Error("Stripe session missing url");

    // 4) Mark submission approved + store checkout URL + slug
    const patchRes = await fetch(`${supabaseUrl}/rest/v1/course_submissions?id=eq.${encodeURIComponent(submissionId)}`, {
      method: "PATCH",
      headers: {
        apikey: serviceRole,
        Authorization: `Bearer ${serviceRole}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        approval_status: "approved",
        payment_status: "unpaid",
        stripe_checkout_url: session.url,
        approved_at: new Date().toISOString(),
        slug: courseSlug,
      }),
    });

    if (!patchRes.ok) {
      const t = await patchRes.text();
      throw new Error(`Submission patch failed: ${t}`);
    }

    // 5) Email payment link
    const from = mustEnv("EMAIL_FROM");
    await resend.emails.send({
      from,
      to: s.contact_email,
      subject: "Your TeeTimeUS course was approved — complete payment to go live",
      html: `
        <div style="font-family:system-ui,Segoe UI,Arial,sans-serif;line-height:1.5">
          <h2 style="margin:0 0 10px 0">Your course is approved</h2>
          <p style="margin:0 0 14px 0">
            Complete your subscription ($14.99/month) to publish <b>${escapeHtml(s.name)}</b> on TeeTimeUS.
          </p>
          <p style="margin:0 0 18px 0">
            <a href="${session.url}" style="display:inline-block;padding:12px 16px;border-radius:12px;background:#22c55e;color:#0b1220;text-decoration:none;font-weight:800">
              Activate & Pay
            </a>
          </p>
          <p style="margin:0;color:#444;font-size:13px">
            If you didn’t request this, you can ignore this email.
          </p>
        </div>
      `,
    });

    return NextResponse.json({ ok: true, checkoutUrl: session.url, courseSlug });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Approve failed" }, { status: 500 });
  }
}

function escapeHtml(s: string) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}