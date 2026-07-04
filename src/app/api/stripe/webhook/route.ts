import { getSupabaseAdmin } from "@/lib/supabase/admin";

function hasStripeConfig(): boolean {
  return !!(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET);
}

export async function POST(request: Request) {
  if (!hasStripeConfig()) {
    return Response.json({ received: true, mode: "demo" });
  }

  const Stripe = (await import("stripe")).default;
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const body = await request.text();
  const sig = request.headers.get("stripe-signature")!;

  try {
    const event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
    const supabase = getSupabaseAdmin();

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const userId = session.metadata?.user_id;
        if (!userId) break;

        await supabase.from("subscriptions").upsert({
          user_id: userId,
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: session.subscription as string,
          status: "active",
        });
        break;
      }
      case "customer.subscription.deleted":
      case "customer.subscription.updated": {
        const subscription = event.data.object;
        await supabase
          .from("subscriptions")
          .update({ status: subscription.status })
          .eq("stripe_subscription_id", subscription.id);
        break;
      }
    }
  } catch {
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  return Response.json({ received: true });
}
