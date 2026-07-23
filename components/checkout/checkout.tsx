'use client';

import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
} from 'react';
import {
  Elements,
  ExpressCheckoutElement,
  LinkAuthenticationElement,
  PaymentElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js';
import type {
  Appearance,
  StripeElementsOptions,
  StripeExpressCheckoutElementReadyEvent,
} from '@stripe/stripe-js';
import { Loader2Icon } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { getStripe } from '@/utils/stripeUtils';
import CheckoutSuccess from './checkout-success';

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = publishableKey ? getStripe() : null;

// Stripe Elements themed to the ZVC grindhouse palette (see tailwind.config.ts).
const appearance: Appearance = {
  theme: 'night',
  variables: {
    colorPrimary: '#4A8CC6', // blue-light
    colorBackground: '#1F1F1F', // blackout
    colorText: '#FFFDF6', // glow
    colorDanger: '#7F0028', // cult-classic
    fontFamily: 'ui-sans-serif, system-ui, sans-serif',
    borderRadius: '0px',
    spacingUnit: '4px',
  },
  rules: {
    '.Input': {
      border: '2px solid rgba(255, 253, 246, 0.15)',
      backgroundColor: '#1F1F1F',
    },
    '.Input:focus': {
      border: '2px solid #4A8CC6',
      boxShadow: 'none',
    },
    '.Label': { color: 'rgba(255, 253, 246, 0.7)' },
    '.Tab, .Block': {
      border: '2px solid rgba(255, 253, 246, 0.15)',
      backgroundColor: '#1F1F1F',
    },
  },
};

type Props = {
  eventId: number;
  eventName: string;
  price: number;
  /** Hosted Stripe payment link, shown as a fallback if checkout can't start. */
  paymentLink?: string | null;
};

export default function CheckoutClient({
  eventId,
  eventName,
  price,
  paymentLink,
}: Props) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [maxQuantity, setMaxQuantity] = useState(5);
  const [error, setError] = useState(false);
  const [completed, setCompleted] = useState(false);

  // If we're returning from a redirect-based payment (e.g. 3DS), resolve the
  // outcome from the URL instead of starting a new PaymentIntent.
  const [returning] = useState(() => {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).has(
      'payment_intent_client_secret'
    );
  });

  useEffect(() => {
    if (!returning || !stripePromise) return;
    const cs = new URLSearchParams(window.location.search).get(
      'payment_intent_client_secret'
    );
    if (!cs) return;
    let active = true;
    stripePromise
      .then((stripe) => stripe?.retrievePaymentIntent(cs))
      .then((res) => {
        if (active && res?.paymentIntent?.status === 'succeeded') {
          setCompleted(true);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [returning]);

  // Create the PaymentIntent once on mount.
  useEffect(() => {
    if (returning || !stripePromise) return;
    let active = true;
    fetch('/api/stripe/payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId, quantity: 1, newsletter: false }),
    })
      .then((res) => {
        if (!res.ok) throw new Error('intent failed');
        return res.json();
      })
      .then((data) => {
        if (!data.clientSecret) throw new Error('missing client secret');
        if (!active) return;
        setClientSecret(data.clientSecret);
        setPaymentIntentId(data.paymentIntentId);
        setMaxQuantity(data.maxQuantity ?? 5);
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, [eventId, returning]);

  if (completed) return <CheckoutSuccess eventName={eventName} />;

  if (!stripePromise) {
    return (
      <p className="zvc-body text-glow/70">
        Checkout is temporarily unavailable. Please try again later.
      </p>
    );
  }

  if (error) return <CheckoutError paymentLink={paymentLink} />;

  if (!clientSecret || !paymentIntentId) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2Icon className="w-6 h-6 animate-spin text-blue-light" />
      </div>
    );
  }

  const options: StripeElementsOptions = { clientSecret, appearance };

  return (
    <Elements stripe={stripePromise} options={options}>
      <CheckoutForm
        eventId={eventId}
        price={price}
        paymentIntentId={paymentIntentId}
        maxQuantity={maxQuantity}
        paymentLink={paymentLink}
        onComplete={() => setCompleted(true)}
      />
    </Elements>
  );
}

function CheckoutForm({
  eventId,
  price,
  paymentIntentId,
  maxQuantity,
  paymentLink,
  onComplete,
}: {
  eventId: number;
  price: number;
  paymentIntentId: string;
  maxQuantity: number;
  paymentLink?: string | null;
  onComplete: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();

  const [quantity, setQuantity] = useState(1);
  const [email, setEmail] = useState('');
  const [newsletter, setNewsletter] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [walletAvailable, setWalletAvailable] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const total = price * quantity;
  const returnUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/events/${eventId}?checkout=success`
      : '';

  // Push quantity/newsletter changes to the PaymentIntent, then re-sync Elements
  // so the card form and wallet sheet reflect the new amount.
  const syncIntent = useCallback(
    async (nextQuantity: number, nextNewsletter: boolean) => {
      if (!elements) return;
      setSyncing(true);
      try {
        await fetch('/api/stripe/payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventId,
            quantity: nextQuantity,
            newsletter: nextNewsletter,
            paymentIntentId,
          }),
        });
        await elements.fetchUpdates();
      } finally {
        setSyncing(false);
      }
    },
    [elements, eventId, paymentIntentId]
  );

  const handleQuantity = (value: number) => {
    setQuantity(value);
    void syncIntent(value, newsletter);
  };

  const handleNewsletter = (value: boolean) => {
    setNewsletter(value);
    void syncIntent(quantity, value);
  };

  const confirm = useCallback(async () => {
    if (!stripe || !elements) return;
    setSubmitting(true);
    setMessage(null);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: returnUrl,
        receipt_email: email || undefined,
      },
      redirect: 'if_required',
    });

    if (error) {
      setMessage(error.message ?? 'Payment failed. Please try again.');
      setSubmitting(false);
      return;
    }

    if (paymentIntent && paymentIntent.status === 'succeeded') {
      onComplete();
      return;
    }

    // Redirecting to complete (e.g. 3DS) — leave the submitting state.
  }, [stripe, elements, returnUrl, onComplete]);

  const handleCardSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await confirm();
  };

  return (
    <form onSubmit={handleCardSubmit} className="space-y-5">
      <div className="flex items-center justify-between">
        <label className="zvc-body text-glow/80 text-sm flex items-center gap-3">
          Quantity
          <select
            value={quantity}
            onChange={(e) => handleQuantity(Number(e.target.value))}
            disabled={submitting}
            className="bg-blackout border-2 border-glow/15 text-glow px-3 py-2 outline-none focus:border-blue-light disabled:opacity-60"
          >
            {Array.from({ length: maxQuantity }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <span className="text-xl font-bold text-blue-light">
          ${total.toFixed(2)}
        </span>
      </div>

      {/* Email — needed to send the ticket and to create the Stripe customer.
          LinkAuthenticationElement also enables Link's saved-payment prefill. */}
      <LinkAuthenticationElement
        onChange={(e) => setEmail(e.value.email)}
      />

      {/* Wallet buttons (Apple Pay / Google Pay / Link). Hidden entirely when no
          wallet is available so the divider below doesn't dangle. */}
      <div className={walletAvailable ? 'space-y-5' : 'hidden'}>
        <ExpressCheckoutElement
          onConfirm={confirm}
          onReady={(e: StripeExpressCheckoutElementReadyEvent) =>
            setWalletAvailable(Boolean(e.availablePaymentMethods))
          }
        />
        <div className="flex items-center gap-3">
          <span className="h-px flex-1 bg-glow/15" />
          <span className="zvc-body text-glow/50 text-xs uppercase tracking-wide">
            or pay with card
          </span>
          <span className="h-px flex-1 bg-glow/15" />
        </div>
      </div>

      <PaymentElement options={{ layout: 'tabs' }} />

      <label className="flex items-start gap-3 cursor-pointer select-none">
        <Checkbox
          checked={newsletter}
          onCheckedChange={(v) => handleNewsletter(v === true)}
          disabled={submitting}
          className="mt-1 border-blue-light data-[state=checked]:bg-blue-light data-[state=checked]:border-blue-light"
        />
        <span className="zvc-body text-glow/80 text-sm leading-relaxed">
          Subscribe to the ZVC newsletter for upcoming screenings and cult film
          picks.
        </span>
      </label>

      {message && <p className="zvc-body text-cult-classic text-sm">{message}</p>}

      <button
        type="submit"
        disabled={!stripe || submitting || syncing}
        className="zvc-btn w-full text-base py-3 disabled:opacity-60"
      >
        {submitting ? 'Processing…' : `Pay $${total.toFixed(2)}`}
      </button>

      {paymentLink && (
        <a
          href={paymentLink}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-center zvc-body text-glow/50 text-sm underline"
        >
          Trouble checking out? Use our secure payment link.
        </a>
      )}
    </form>
  );
}

function CheckoutError({ paymentLink }: { paymentLink?: string | null }) {
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
