// src/app/api/stripe/create-checkout-session/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function requireEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

export async function POST(req: Request) {
  try {
    const { email, submissionId } = (await req.json()) as {
      email?: string;
      submissionId?: string;
    };

    if (!email) return NextResponse.json({ error: "Missing email" }, { status: 400 });

    const stripe = new Stripe(requireEnv("STRIPE_SECRET_KEY"));
    const priceId = requireEnv("STRIPE_PRICE_ID");
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://teetimeus.com";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${siteUrl}/submit?paid=1`,
      cancel_url: `${siteUrl}/submit?paid=0`,
      metadata: submissionId ? { submission_id: submissionId } : undefined,
    });

    return NextResponse.json({ url: session.url });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Unknown error" },
      { status: 500 }
    );
  }
}