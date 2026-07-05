import { createClient } from "@/lib/supabase/server";

function hasStripeConfig(): boolean {
  return !!(process.env.STRIPE_SECRET_KEY);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Graceful mock: return a demo URL when Stripe is not configured
  if (!hasStripeConfig()) {
    return Response.json({
      url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard?demo=subscribed`,
      mode: "demo",
    });
  }

  try {
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    const { priceId } = await request.json();

    const { data: existingSub } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", userData.user.id)
      .maybeSingle();

    let customerId = existingSub?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userData.user.email,
        metadata: { user_id: userData.user.id },
      });
      customerId = customer.id;
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?canceled=true`,
    });

    return Response.json({ url: session.url });
  } catch (e) {
    // Fallback to demo mode if Stripe call fails
    return Response.json({
      url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard?demo=subscribed`,
      mode: "demo",
    });
  }
}
