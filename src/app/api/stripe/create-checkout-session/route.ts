import Stripe from "stripe";
import { NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const submissionId = body?.submissionId as string | undefined;

    if (!submissionId) {
      return NextResponse.json({ error: "Missing submissionId" }, { status: 400 });
    }

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";

    // success/cancel pages we will create below
    const successUrl = `${siteUrl}/pay/success?sid={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${siteUrl}/pay/cancel?submissionId=${encodeURIComponent(submissionId)}`;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,

      // We use metadata to connect Stripe -> your DB submission row
      metadata: {
        submissionId,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (e: any) {
    console.error("create-checkout-session error:", e);
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}