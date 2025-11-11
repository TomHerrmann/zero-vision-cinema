import { stripe } from '@/lib/stripe';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { eventId, amount, eventName, quantity } = await req.json();

    if (!eventId || !amount) {
      return NextResponse.json(
        { error: 'Missing eventId or amount' },
        { status: 400 }
      );
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount, // amount in cents
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        eventId,
        eventName,
        quantity: quantity?.toString() || '1',
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error('Payment Intent Error:', error);
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { paymentIntentId, amount, quantity } = await req.json();

    if (!paymentIntentId || !amount) {
      return NextResponse.json(
        { error: 'Missing paymentIntentId or amount' },
        { status: 400 }
      );
    }

    const paymentIntent = await stripe.paymentIntents.update(paymentIntentId, {
      amount, // amount in cents
      metadata: {
        quantity: quantity?.toString() || '1',
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error('Payment Intent Update Error:', error);
    return NextResponse.json(
      { error: 'Failed to update payment intent' },
      { status: 500 }
    );
  }
}
