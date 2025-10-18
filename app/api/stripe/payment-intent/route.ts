import { stripe } from '@/lib/stripe';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { eventId, amount, eventName } = await req.json();

    if (!eventId || !amount) {
      return NextResponse.json(
        { error: 'Missing eventId or amount' },
        { status: 400 }
      );
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount, // amount in cents
      currency: 'usd',
      metadata: {
        eventId,
        eventName,
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error('Payment Intent Error:', error);
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}
