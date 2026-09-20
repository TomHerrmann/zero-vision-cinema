'use client';

import {
  useCallback,
  useEffect,
  useRef,
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
    // Placeholder / secondary text: cool retro-blue instead of the warm tan
    // Stripe would otherwise derive from the cream colorText.
    colorTextPlaceholder: 'rgba(158, 183, 204, 0.7)', // retro-blue
    colorTextSecondary: 'rgba(158, 183, 204, 0.9)', // retro-blue
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
    '.Input::placeholder': { color: 'rgba(158, 183, 204, 0.6)' },
    '.Label': { color: 'rgba(255, 253, 246, 0.7)' },
    '.Tab, .Block': {
      border: '2px solid rgba(255, 253, 246, 0.15)',
      backgroundColor: '#1F1F1F',
    },
  },
};

// Basic email sanity check — the ticket email has no recipient without one, so
// every checkout path must yield a deliverable address before we charge.
const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

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

  // Reserve a stable height so the box is the same size while loading (skeleton),
  // after loading (form), and on error — no layout shift between states. Sized to
  // the fully-rendered Stripe card form (~1010px); it can still grow if the buyer
  // switches to a taller payment method, which is Stripe's own dynamic element.
  const STABLE = 'min-h-[64rem]';

  if (!stripePromise) {
    return (
      <div className={`${STABLE} flex items-center justify-center`}>
        <p className="zvc-body text-glow/70 text-center">
          Checkout is temporarily unavailable. Please try again later.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${STABLE} flex items-center justify-center`}>
        <CheckoutError paymentLink={paymentLink} />
      </div>
    );
  }

  if (!clientSecret || !paymentIntentId) {
    return <CheckoutSkeleton className={STABLE} />;
  }

  const options: StripeElementsOptions = { clientSecret, appearance };

  return (
    <div className={STABLE}>
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
    </div>
  );
}

// Exported for unit testing (double-submit guard). Rendered by CheckoutClient
// inside <Elements>, so it can assume the Stripe context is available.
export function CheckoutForm({
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
  // Free-ticket reward code: `rewardCode` is set once the server says the code
  // is usable, which switches the form to a single free ticket (no payment).
  const [codeOpen, setCodeOpen] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [codeError, setCodeError] = useState<string | null>(null);
  const [checkingCode, setCheckingCode] = useState(false);
  const [rewardCode, setRewardCode] = useState<string | null>(null);

  const total = rewardCode ? 0 : price * quantity;
  const returnUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/events/${eventId}?checkout=success`
      : '';

  // Tracks the in-flight metadata/amount sync so payment confirmation can wait
  // for it to finish before charging (see `confirm`). `tokenRef` identifies the
  // latest sync so a superseded one doesn't clear the spinner early.
  const pendingSync = useRef<Promise<void> | null>(null);
  const tokenRef = useRef<symbol | null>(null);
  // Synchronous re-entrancy guard: prevents a second charge if `confirm` is
  // invoked again (rapid double-click, or the wallet's onConfirm) before React
  // has re-rendered the disabled button. This is the real double-charge guard;
  // the button's `disabled` state is only a visual affordance on top of it.
  const submittingRef = useRef(false);

  // Push quantity/newsletter changes to the PaymentIntent, then re-sync Elements
  // so the card form and wallet sheet reflect the new amount.
  const syncIntent = useCallback(
    (nextQuantity: number, nextNewsletter: boolean): Promise<void> => {
      if (!elements) return Promise.resolve();
      setSyncing(true);
      const token = Symbol('sync');
      tokenRef.current = token;
      const run = (async () => {
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
          // Only clear the spinner if no newer sync superseded this one.
          if (tokenRef.current === token) setSyncing(false);
        }
      })();
      pendingSync.current = run;
      return run;
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

  const confirm = useCallback(
    async (overrideEmail?: string) => {
      if (!stripe || !elements) return;
      // Bail if a charge is already in flight (checked/set synchronously so it
      // holds even before the button's disabled state renders).
      if (submittingRef.current) return;

      // Require a deliverable email before charging so the post-purchase ticket
      // email always has a recipient. Wallet payments supply it via
      // `overrideEmail` (ExpressCheckoutElement is set with emailRequired); the
      // card path uses the LinkAuthenticationElement value in `email`. Guard
      // before the in-flight flag so an invalid email doesn't lock the button.
      const effectiveEmail = (overrideEmail ?? email).trim();
      if (!isValidEmail(effectiveEmail)) {
        setMessage('Please enter a valid email so we can send your ticket.');
        return;
      }

      submittingRef.current = true;
      setSubmitting(true);
      setMessage(null);

      // Wait for any in-flight quantity/newsletter sync to finish so the
      // PaymentIntent's amount and metadata are current before we charge. The
      // wallet (Express Checkout) button isn't blocked by React's disabled state,
      // so without this a fast tap could confirm against a stale PaymentIntent.
      if (pendingSync.current) await pendingSync.current;

      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: returnUrl,
          receipt_email: effectiveEmail,
        },
        redirect: 'if_required',
      });

      if (error) {
        // Payment failed — allow another attempt.
        submittingRef.current = false;
        setMessage(error.message ?? 'Payment failed. Please try again.');
        setSubmitting(false);
        return;
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        onComplete();
        return;
      }

      // Redirecting to complete (e.g. 3DS) — leave the submitting state (and the
      // guard) set; the page is navigating away.
    },
    [stripe, elements, returnUrl, email, onComplete]
  );

  const applyCode = async () => {
    const code = codeInput.trim();
    if (!code || checkingCode) return;
    setCheckingCode(true);
    setCodeError(null);
    try {
      const res = await fetch('/api/rewards/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.valid) {
        setCodeError(data.error ?? 'That code is invalid, expired, or already used.');
        return;
      }
      setRewardCode(data.code ?? code);
      setMessage(null);
    } catch {
      setCodeError('Could not check that code. Please try again.');
    } finally {
      setCheckingCode(false);
    }
  };

  const removeCode = () => {
    setRewardCode(null);
    setCodeInput('');
    setCodeError(null);
    setMessage(null);
  };

  // Free ticket: no Stripe charge — the server records a $0 order and emails the
  // ticket. Shares the synchronous double-submit guard with `confirm`.
  const redeem = async () => {
    if (!rewardCode || submittingRef.current) return;
    const effectiveEmail = email.trim();
    if (!isValidEmail(effectiveEmail)) {
      setMessage('Enter the email address you bought your tickets with.');
      return;
    }
    submittingRef.current = true;
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch('/api/rewards/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, code: rewardCode, email: effectiveEmail }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(data.error ?? 'Could not claim your free ticket. Please email us.');
        submittingRef.current = false;
        setSubmitting(false);
        return;
      }
      onComplete();
    } catch {
      setMessage('Could not claim your free ticket. Please try again.');
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  const handleCardSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (rewardCode) await redeem();
    else await confirm();
  };

  return (
    <form onSubmit={handleCardSubmit} className="space-y-5">
      <div className="flex items-center justify-between">
        {rewardCode ? (
          <span className="zvc-body text-glow/80 text-sm">1 free ticket</span>
        ) : (
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
        )}
        {rewardCode ? (
          <span className="flex flex-col items-end leading-tight">
            <s className="zvc-body text-sm text-glow/50">
              <span className="sr-only">Regular price </span>$
              {price.toFixed(2)}
            </s>
            <span className="text-xl font-bold text-blue-light">
              <span className="sr-only">Your price </span>$0.00
            </span>
          </span>
        ) : (
          <span className="text-xl font-bold text-blue-light">
            ${total.toFixed(2)}
          </span>
        )}
      </div>

      {/* Free-ticket reward code */}
      {rewardCode ? (
        <div className="flex items-center justify-between gap-3 border-2 border-blue-light/40 bg-blue-light/5 px-3 py-2">
          <span className="zvc-body text-sm text-glow/80">
            Code <span className="font-bold text-blue-light">{rewardCode}</span>{' '}
            applied
          </span>
          <button
            type="button"
            onClick={removeCode}
            disabled={submitting}
            className="zvc-body text-sm text-glow/50 underline disabled:opacity-60"
          >
            Remove
          </button>
        </div>
      ) : codeOpen ? (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  void applyCode();
                }
              }}
              placeholder="ZVC-XXXX-XXXX"
              aria-label="Free-ticket code"
              autoComplete="off"
              autoCapitalize="characters"
              className="flex-1 min-w-0 bg-blackout border-2 border-glow/15 text-glow px-3 py-2 uppercase outline-none focus:border-blue-light"
            />
            <button
              type="button"
              onClick={() => void applyCode()}
              disabled={checkingCode || !codeInput.trim()}
              className="zvc-btn-outline text-sm px-4 py-2 disabled:opacity-60"
            >
              {checkingCode ? 'Checking…' : 'Apply'}
            </button>
          </div>
          {codeError && (
            <p className="zvc-body text-cult-classic text-sm">{codeError}</p>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setCodeOpen(true)}
          className="zvc-body text-sm text-glow/60 underline"
        >
          Have a free-ticket code?
        </button>
      )}

      {rewardCode ? (
        // Plain email field for the free path: the code only works with the
        // address it was earned with, and there's no payment for Link to fill.
        <label className="block space-y-2">
          <span className="zvc-body text-glow/70 text-sm">
            Email (the one you bought your tickets with)
          </span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
            className="w-full bg-blackout border-2 border-glow/15 text-glow px-3 py-2 outline-none focus:border-blue-light"
          />
        </label>
      ) : (
        /* Email — needed to send the ticket and to create the Stripe customer.
           LinkAuthenticationElement also enables Link's saved-payment prefill. */
        <LinkAuthenticationElement
          options={{ defaultValues: { email } }}
          onChange={(e) => setEmail(e.value.email)}
        />
      )}

      {/* Wallet buttons (Apple Pay / Google Pay / Link). Hidden entirely when no
          wallet is available so the divider below doesn't dangle. */}
      <div className={walletAvailable && !rewardCode ? 'space-y-5' : 'hidden'}>
        {/* While a quantity/newsletter sync is in flight, block the wallet so its
            payment sheet can't open against a stale amount. */}
        <div className={syncing ? 'pointer-events-none opacity-60' : undefined}>
          <ExpressCheckoutElement
            options={{ emailRequired: true }}
            onConfirm={(e) => confirm(e.billingDetails?.email)}
            onReady={(e: StripeExpressCheckoutElementReadyEvent) =>
              setWalletAvailable(Boolean(e.availablePaymentMethods))
            }
          />
        </div>
        <div className="flex items-center gap-3">
          <span className="h-px flex-1 bg-glow/15" />
          <span className="zvc-body text-glow/50 text-xs uppercase tracking-wide">
            or pay with card
          </span>
          <span className="h-px flex-1 bg-glow/15" />
        </div>
      </div>

      {/* Kept mounted (just hidden) while a code is applied so removing the
          code doesn't make the buyer re-enter their card. */}
      <div className={rewardCode ? 'hidden' : undefined}>
        <PaymentElement options={{ layout: 'tabs' }} />
      </div>

      <label
        className={`flex items-start gap-3 cursor-pointer select-none ${rewardCode ? 'hidden' : ''}`}
      >
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

      {message && (
        <p className="zvc-body text-cult-classic text-sm">{message}</p>
      )}

      <button
        type="submit"
        disabled={!stripe || submitting || syncing}
        className="zvc-btn w-full text-base py-3 disabled:opacity-60"
      >
        {submitting
          ? 'Processing…'
          : rewardCode
            ? 'Claim free ticket'
            : `Pay $${total.toFixed(2)}`}
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

/**
 * Placeholder shown while the PaymentIntent + Stripe Elements load. Mirrors the
 * form's structure (quantity, email, payment fields, newsletter, pay button) so
 * the box height stays stable and doesn't jump when the real form mounts.
 */
function CheckoutSkeleton({ className }: { className?: string }) {
  const block = 'bg-glow/10 border-2 border-glow/10';
  return (
    <div
      className={`flex flex-col space-y-5 animate-pulse ${className ?? ''}`}
      aria-hidden="true"
    >
      {/* Quantity + total */}
      <div className="flex items-center justify-between">
        <div className="h-10 w-28 bg-glow/10" />
        <div className="h-6 w-20 bg-blue-light/20" />
      </div>
      {/* Email */}
      <div className={`h-[76px] w-full ${block}`} />
      {/* Wallet buttons */}
      <div className="grid grid-cols-2 gap-3">
        <div className="h-11 bg-glow/10" />
        <div className="h-11 bg-glow/10" />
      </div>
      {/* Divider */}
      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-glow/15" />
        <span className="h-3 w-24 bg-glow/10" />
        <span className="h-px flex-1 bg-glow/15" />
      </div>
      {/* Payment element — fills remaining height so the box height is stable */}
      <div className="flex-1 flex flex-col gap-3">
        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={`h-14 ${block}`} />
          ))}
        </div>
        <div className={`flex-1 w-full ${block}`} />
      </div>
      {/* Newsletter */}
      <div className="flex items-start gap-3">
        <div className="h-5 w-5 bg-glow/10 border border-blue-light/30" />
        <div className="h-4 flex-1 bg-glow/10" />
      </div>
      {/* Pay button */}
      <div className="h-12 w-full bg-glow/20" />
    </div>
  );
}
