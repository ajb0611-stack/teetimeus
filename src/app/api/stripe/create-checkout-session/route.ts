import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey)
  : (null as unknown as Stripe);

export async function POST(req: Request) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return new Response("Missing STRIPE_SECRET_KEY", { status: 500 });
    }
    if (!process.env.STRIPE_PRICE_ID) {
      return new Response("Missing STRIPE_PRICE_ID", { status: 500 });
    }

    const body = await req.json().catch(() => ({}));
    const submissionId = body?.submissionId as string | undefined;

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
      success_url: `${siteUrl}/submit?success=1`,
      cancel_url: `${siteUrl}/submit?canceled=1`,
      metadata: submissionId ? { submissionId } : undefined,
    });

    return Response.json({ url: session.url });
  } catch (err: any) {
    console.error(err);
    return new Response(err?.message ?? "Error creating checkout session", {
      status: 500,
    });
  }
}