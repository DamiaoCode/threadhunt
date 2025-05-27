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
  const { user_id } = req.body;
  if (!user_id) {
    return res.status(400).json({ error: "Missing user_id" });
  }
  // Get stripe_customer_id from Supabase
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("user_id", user_id)
    .single();
  if (error || !profile?.stripe_customer_id) {
    return res.status(400).json({ error: "No Stripe customer found" });
  }
  const portalSession = await stripe.billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: process.env.NEXT_PUBLIC_BASE_URL + "/dashboard",
  });
  return res.status(200).json({ url: portalSession.url });
}
