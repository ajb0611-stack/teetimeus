import Stripe from "stripe";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs"; // important for Stripe libs

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
});

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const rawBody = await req.text();
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err?.message);
    return NextResponse.json({ error: "Bad signature" }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      const submissionId = session.metadata?.submissionId;
      const checkoutSessionId = session.id;

      if (!submissionId) {
        console.error("checkout.session.completed missing metadata.submissionId");
        return NextResponse.json({ received: true }, { status: 200 });
      }

      // 1) Mark submission as paid + approved
      const { data: updatedSubmission, error: upErr } = await supabaseAdmin
        .from("course_submissions")
        .update({
          payment_status: "paid",
          status: "approved",
          stripe_checkout_session_id: checkoutSessionId,
        })
        .eq("id", submissionId)
        .select("*")
        .single();

      if (upErr) {
        console.error("Failed updating submission:", upErr);
        return NextResponse.json({ received: true }, { status: 200 });
      }

      // 2) Publish to courses table
      // Adjust these fields if your DB column names differ.
      const { error: insertErr } = await supabaseAdmin.from("courses").insert([
        {
          name: updatedSubmission.name,
          address: updatedSubmission.address,
          city: updatedSubmission.city,
          state: updatedSubmission.state,
          phone: updatedSubmission.phone,
          website_url: updatedSubmission.website_url,
          tee_time_url: updatedSubmission.tee_time_url,
          image_url: updatedSubmission.image_url,

          is_public: true,
          is_active: true,
        },
      ]);

      if (insertErr) {
        console.error("Failed inserting into courses:", insertErr);
        // still return 200 so Stripe doesn't retry forever
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (e: any) {
    console.error("Webhook handler error:", e);
    // Return 200 to prevent Stripe retry storms while you debug
    return NextResponse.json({ received: true }, { status: 200 });
  }
}