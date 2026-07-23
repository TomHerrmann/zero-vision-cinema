'use client';

import { useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from '@stripe/react-stripe-js';
import { Loader2Icon } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import CheckoutSuccess from './checkout-success';

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
// loadStripe is memoized at module scope so it isn't re-called on every render.
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

type Props = {
  eventId: number;
  eventName: string;
  /** Hosted Stripe payment link, shown as a fallback if embedded checkout fails. */
  paymentLink?: string | null;
};

export default function EmbeddedCheckoutClient({
  eventId,
  eventName,
  paymentLink,
}: Props) {
  const [completed, setCompleted] = useState(false);

  if (completed) {
    return <CheckoutSuccess eventName={eventName} />;
  }

  if (!stripePromise) {
    return (
      <p className="zvc-body text-glow/70">
        Checkout is temporarily unavailable. Please try again later.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      <CheckoutInner
        eventId={eventId}
        paymentLink={paymentLink}
        onComplete={() => setCompleted(true)}
      />
    </div>
  );
}

function CheckoutInner({
  eventId,
  paymentLink,
  onComplete,
}: {
  eventId: number;
  paymentLink?: string | null;
  onComplete: () => void;
}) {
  const [newsletter, setNewsletter] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    setClientSecret(null);
    setError(false);

    fetch('/api/stripe/checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId, newsletter }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('session failed');
        const data = await res.json();
        if (!data.clientSecret) throw new Error('missing client secret');
        return data.clientSecret as string;
      })
      .then((secret) => {
        if (active) setClientSecret(secret);
      })
      .catch(() => {
        if (active) setError(true);
      });

    return () => {
      active = false;
    };
  }, [eventId, newsletter]);

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="zvc-body text-glow/70 mb-5">
          We couldn&apos;t start checkout right now.
        </p>
        {paymentLink ? (
          <a
            href={paymentLink}
            target="_blank"
            rel="noopener noreferrer"
            className="zvc-btn text-base py-3"
          >
            Continue to Payment
          </a>
        ) : (
          <p className="zvc-body text-glow/50 text-sm">
            Please try again in a moment.
          </p>
        )}
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2Icon className="w-6 h-6 animate-spin text-blue-light" />
      </div>
    );
  }

  return (
    <div className="border-2 border-glow/15 bg-glow p-1">
      {/* Newsletter opt-in — unchecked by default. Toggling remounts the inner
          checkout (keyed below) so the choice is baked into the session. */}
      <label className="flex items-start gap-3 cursor-pointer select-none">
        <Checkbox
          checked={newsletter}
          onCheckedChange={(v) => setNewsletter(v === true)}
          className="mt-1 border-blue-light data-[state=checked]:bg-blue-light data-[state=checked]:border-blue-light"
        />
        <span className="zvc-body text-glow/80 text-sm leading-relaxed">
          Subscribe to the ZVC newsletter for upcoming screenings and cult film
          picks.
        </span>
      </label>
      <EmbeddedCheckoutProvider
        stripe={stripePromise}
        options={{ clientSecret, onComplete }}
      >
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}
