import { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { user_id, email, price_id } = req.body;
  if (!user_id || !email) {
    return res.status(400).json({ error: "Missing user_id or email" });
  }

  // Check if user already has a Stripe customer
  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("user_id", user_id)
    .single();

  let customerId = profile?.stripe_customer_id;

  if (!customerId) {
    // Create Stripe customer
    const customer = await stripe.customers.create({
      email,
      metadata: { user_id },
    });
    customerId = customer.id;
    // Save to Supabase
    await supabase
      .from("profiles")
      .update({ stripe_customer_id: customerId })
      .eq("user_id", user_id);
  }

  // Use price_id from request, fallback to env
  const price = price_id || process.env.STRIPE_PRO_PRICE_ID;
  if (!price) {
    return res.status(400).json({ error: "No Stripe price ID provided" });
  }

  // Create Stripe Checkout session for subscription
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    customer: customerId,
    line_items: [
      {
        price,
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?checkout=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?checkout=cancel`,
    metadata: { user_id },
  });

  return res.status(200).json({ url: session.url });
}
