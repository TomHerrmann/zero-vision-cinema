'use client';

import { Event } from '@/payload-types';
import { Button } from '@react-email/components';
import { CheckoutProvider, PaymentElement } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

type Props = {
  event: Event;
};

export default function CheckoutClient({ event }: Props) {
  return (
    <CheckoutProvider
      stripe={stripePromise}
      options={{
        fetchClientSecret: async () => {
          const response = await fetch('/api/stripe/checkout-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              lineItems: [{ price: event.priceId, quantity: 1 }],
            }),
          });
          const data = await response.json();
          console.log('Fetched client response:', data);
          return data.clientSecret;
        },
      }}
    >
      <main>
        <form>
          <PaymentElement />
          <Button type="submit">Submit</Button>
        </form>
      </main>
    </CheckoutProvider>
  );
}
