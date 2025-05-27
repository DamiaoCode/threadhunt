import { NextApiRequest, NextApiResponse } from "next";
import { buffer } from "micro";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const config = {
  api: {
    bodyParser: false,
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).end("Method Not Allowed");
  }

  const buf = await buffer(req);
  const sig = req.headers["stripe-signature"]!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(buf, sig, endpointSecret);
  } catch (err: any) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle subscription events
  if (
    event.type === "checkout.session.completed" ||
    event.type === "customer.subscription.created" ||
    event.type === "customer.subscription.updated"
  ) {
    let subscription, customerId, userId, renewalDate;
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      customerId = session.customer as string;
      userId = session.metadata?.user_id;
      // Get subscription from session
      subscription = session.subscription;
    } else {
      subscription = event.data.object as Stripe.Subscription;
      customerId = subscription.customer as string;
      userId = subscription.metadata?.user_id;
    }

    // Fetch subscription details if needed
    let stripeSub: any = null;
    if (typeof subscription === "string") {
      try {
        stripeSub = await stripe.subscriptions.retrieve(subscription);
      } catch (e) {
        console.error("Failed to retrieve subscription from Stripe:", e);
      }
    } else if (subscription && typeof subscription === "object") {
      stripeSub = subscription;
    }

    // Log the subscription object for debugging
    console.log("Stripe subscription object:", JSON.stringify(stripeSub, null, 2));

    // Get renewal date from the first subscription item
    let subscriptionId = null;
    if (stripeSub && stripeSub.items && stripeSub.items.data && stripeSub.items.data[0]) {
      const item = stripeSub.items.data[0];
      if (typeof item.current_period_end === "number") {
        renewalDate = new Date(item.current_period_end * 1000).toISOString();
      }
      subscriptionId = stripeSub.id;
    }

    // Update Supabase profile
    if (userId) {
      await supabase
        .from("profiles")
        .update({
          plan: "Pro",
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          plan_renewal_date: renewalDate,
        })
        .eq("user_id", userId);
    }
  }

  res.status(200).json({ received: true });
}
