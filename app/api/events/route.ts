// app/api/events/route.ts
import Stripe from 'stripe';
import { NextRequest } from 'next/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function GET(req: NextRequest) {
  try {
    const events = await stripe.events.list({
      limit: 10, // Change to fetch more or paginate
    });

    return Response.json(events);
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
