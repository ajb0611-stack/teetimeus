import { NextResponse } from "next/server";
import Stripe from "stripe";
import { Resend } from "resend";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const resend = new Resend(process.env.RESEND_API_KEY!);

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
    const { submissionId } = await req.json();

    if (!submissionId) {
      return NextResponse.json({ error: "Missing submissionId" }, { status: 400 });
    }

    const supabaseUrl = mustEnv("SUPABASE_URL");
    const serviceRole = mustEnv("SUPABASE_SERVICE_ROLE_KEY");

    const getSubmission = await fetch(
      `${supabaseUrl}/rest/v1/course_submissions?id=eq.${submissionId}&select=*`,
      {
        headers: {
          apikey: serviceRole,
          Authorization: `Bearer ${serviceRole}`,
        },
      }
    );

    const rows = await getSubmission.json();
    const submission = rows?.[0];

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    const slug = slugify(submission.name);

    const courseInsert = await fetch(
      `${supabaseUrl}/rest/v1/courses?on_conflict=slug`,
      {
        method: "POST",
        headers: {
          apikey: serviceRole,
          Authorization: `Bearer ${serviceRole}`,
          "Content-Type": "application/json",
          Prefer: "resolution=merge-duplicates",
        },
        body: JSON.stringify([
          {
            name: submission.name,
            slug,
            address: submission.address,
            city: submission.city,
            state: submission.state,
            phone: submission.phone,
            website_url: submission.website_url,
            tee_time_url: submission.tee_time_url,
            image_url: submission.image_url,
            is_public: true,
            is_active: false,
            subscription_status: "inactive",
          },
        ]),
      }
    );

    if (!courseInsert.ok) {
      const txt = await courseInsert.text();
      throw new Error(txt);
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID!,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/billing/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/billing/cancel`,
      metadata: {
        courseSlug: slug,
        submissionId: submissionId,
      },
      subscription_data: {
        metadata: {
          courseSlug: slug,
          submissionId: submissionId,
        },
      },
    });

    await fetch(
      `${supabaseUrl}/rest/v1/course_submissions?id=eq.${submissionId}`,
      {
        method: "PATCH",
        headers: {
          apikey: serviceRole,
          Authorization: `Bearer ${serviceRole}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          approval_status: "approved",
          payment_status: "unpaid",
          stripe_checkout_url: session.url,
        }),
      }
    );

    await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to: submission.contact_email,
      subject: "Your TeeTimeUS course was approved",
      html: `
        <h2>Your course was approved</h2>
        <p>Complete your $14.99/month subscription to publish your course.</p>
        <a href="${session.url}" style="padding:12px 16px;background:#22c55e;border-radius:8px;color:black;text-decoration:none;font-weight:bold;">
          Activate Listing
        </a>
      `,
    });

    return NextResponse.json({ success: true });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}