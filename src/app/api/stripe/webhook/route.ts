import Stripe from "stripe";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { slugify } from "@/lib/slugify";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  // IMPORTANT: do NOT hardcode apiVersion here
});

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return NextResponse.json(
      { error: "Missing Stripe webhook signature or secret." },
      { status: 400 }
    );
  }

  const body = await req.text();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${err.message}` },
      { status: 400 }
    );
  }

  try {
    // We care about checkout completion for subscription checkout
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      const submissionId = (session.metadata?.submission_id as string) || null;

      // Fallback: look up by session id if metadata missing
      let submissionQuery = supabaseAdmin
        .from("course_submissions")
        .select("*")
        .limit(1);

      if (submissionId) {
        submissionQuery = submissionQuery.eq("id", submissionId);
      } else {
        submissionQuery = submissionQuery.eq(
          "stripe_checkout_session_id",
          session.id
        );
      }

      const { data: found, error: findErr } = await submissionQuery.single();

      if (findErr || !found) {
        return NextResponse.json(
          { ok: true, note: "No matching submission found." },
          { status: 200 }
        );
      }

      // Insert into courses (publish)
      const courseName = found.name as string;
      const slug = slugify(courseName);

      const { data: newCourse, error: courseErr } = await supabaseAdmin
        .from("courses")
        .insert([
          {
            name: courseName,
            slug,
            address: found.address,
            city: found.city,
            state: found.state,
            phone: found.phone,
            website_url: found.website_url,
            tee_time_url: found.tee_time_url,
            image_url: found.image_url,
            is_public: true,
            is_active: true,
          },
        ])
        .select("id")
        .single();

      if (courseErr) {
        return NextResponse.json(
          { error: `Failed to publish course: ${courseErr.message}` },
          { status: 500 }
        );
      }

      // Update submission as paid + published
      await supabaseAdmin
        .from("course_submissions")
        .update({
          payment_status: "paid",
          status: "published",
          stripe_subscription_id:
            typeof session.subscription === "string"
              ? session.subscription
              : null,
          published_course_id: newCourse.id,
        })
        .eq("id", found.id);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Webhook handler error" },
      { status: 500 }
    );
  }
}