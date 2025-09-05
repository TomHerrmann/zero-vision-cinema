import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2022-08-01',
});

export async function POST(req: Request) {
  try {
    const { lineItems } = await req.json();

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: lineItems,
      success_url: `${req.headers.get('origin')}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/cancel`,
    });

    return NextResponse.json({ clientSecret: session.client_secret });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Failed to create Checkout Session' },
      { status: 500 }
    );
  }
}
