import { buffer } from 'micro';
import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export const config = {
  api: {
    bodyParser: false, // necessário para verificar a assinatura
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // usa a service role key
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'] as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(buf, sig, endpointSecret);
  } catch (err: any) {
    console.error('⚠️ Webhook signature verification failed.', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    const userId = session.metadata?.userId;
    const projectId = session.metadata?.projectId;

    console.log(`✅ Subscrição confirmada para user ${userId}`);

    // Atualiza o plano do utilizador no Supabase
    if (userId) {
      await supabase
        .from('profiles')
        .update({ plan: 'Pro' })
        .eq('user_id', userId);
    }

    // Podes também guardar info no projeto, se quiseres
    if (projectId) {
      await supabase
        .from('projects')
        .update({ upgraded: true })
        .eq('id', projectId);
    }
  }

  res.json({ received: true });
}
