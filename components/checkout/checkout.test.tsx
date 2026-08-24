import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Shared, hoisted mock handles so the module factory below and the tests both
// reference the same spies.
const h = vi.hoisted(() => ({
  confirmPayment: vi.fn(),
  fetchUpdates: vi.fn().mockResolvedValue({}),
}));

// Stub Stripe so `useStripe`/`useElements` return our controllable spies and the
// Element components render as inert nodes. The ExpressCheckoutElement stub
// exposes its `onConfirm` via a button so we can simulate a wallet confirmation
// — the path that isn't gated by React's disabled button state.
vi.mock('@stripe/react-stripe-js', () => ({
  useStripe: () => ({ confirmPayment: h.confirmPayment }),
  useElements: () => ({ fetchUpdates: h.fetchUpdates }),
  Elements: ({ children }: { children: React.ReactNode }) => children,
  PaymentElement: () => <div data-testid="payment-element" />,
  // Clicking it simulates the buyer entering a valid email (fires onChange), so
  // tests can satisfy the required-email guard on the card path.
  LinkAuthenticationElement: ({
    onChange,
  }: {
    onChange?: (e: { value: { email: string }; complete: boolean }) => void;
  }) => (
    <button
      type="button"
      data-testid="email-element"
      onClick={() =>
        onChange?.({ value: { email: 'buyer@example.com' }, complete: true })
      }
    />
  ),
  // The wallet supplies its own email (emailRequired), mirrored here via the
  // onConfirm event's billingDetails.
  ExpressCheckoutElement: ({
    onConfirm,
  }: {
    onConfirm?: (e: { billingDetails?: { email?: string } }) => void;
  }) => (
    <button
      type="button"
      data-testid="wallet"
      onClick={() =>
        onConfirm?.({ billingDetails: { email: 'buyer@example.com' } })
      }
    />
  ),
}));

import { CheckoutForm } from './checkout';

/** A promise we can resolve on demand, to hold `confirmPayment` "in flight". */
function deferred<T>() {
  let resolve!: (v: T) => void;
  const promise = new Promise<T>((r) => (resolve = r));
  return { promise, resolve };
}

const props = {
  eventId: 44,
  price: 10,
  paymentIntentId: 'pi_test_123',
  maxQuantity: 5,
  paymentLink: null,
  onComplete: vi.fn(),
};

beforeEach(() => {
  h.confirmPayment.mockReset();
  h.fetchUpdates.mockReset().mockResolvedValue({});
  props.onComplete.mockReset();
});

describe('CheckoutForm double-submit guard', () => {
  it('calls confirmPayment only once when the card button is clicked repeatedly while a charge is in flight', async () => {
    const d = deferred<{ paymentIntent: { status: string } }>();
    h.confirmPayment.mockReturnValue(d.promise);

    render(<CheckoutForm {...props} />);
    // Satisfy the required-email guard before charging.
    fireEvent.click(screen.getByTestId('email-element'));
    const payButton = screen.getByRole('button', { name: /pay \$10/i });

    // Fire several rapid clicks before the (still-pending) charge resolves.
    fireEvent.click(payButton);
    fireEvent.click(payButton);
    fireEvent.click(payButton);

    expect(h.confirmPayment).toHaveBeenCalledTimes(1);

    // Button reflects the in-flight state.
    expect(screen.getByRole('button', { name: /processing/i })).toBeDisabled();

    // Resolve the charge as succeeded → completion fires exactly once.
    d.resolve({ paymentIntent: { status: 'succeeded' } });
    await waitFor(() => expect(props.onComplete).toHaveBeenCalledTimes(1));
    expect(h.confirmPayment).toHaveBeenCalledTimes(1);
  });

  it('calls confirmPayment only once when the wallet confirms while a charge is already in flight', async () => {
    const d = deferred<{ paymentIntent: { status: string } }>();
    h.confirmPayment.mockReturnValue(d.promise);

    render(<CheckoutForm {...props} />);
    // Satisfy the required-email guard before charging.
    fireEvent.click(screen.getByTestId('email-element'));

    // Card submit starts the charge, then the wallet fires its onConfirm — the
    // race the synchronous ref guard exists to close (the wallet button is not
    // covered by React's disabled state).
    fireEvent.click(screen.getByRole('button', { name: /pay \$10/i }));
    fireEvent.click(screen.getByTestId('wallet'));
    fireEvent.click(screen.getByTestId('wallet'));

    expect(h.confirmPayment).toHaveBeenCalledTimes(1);

    d.resolve({ paymentIntent: { status: 'succeeded' } });
    await waitFor(() => expect(props.onComplete).toHaveBeenCalledTimes(1));
  });

  it('re-enables the button and allows another attempt after a failed payment', async () => {
    // First attempt fails.
    h.confirmPayment.mockResolvedValueOnce({
      error: { message: 'Your card was declined.' },
    });

    render(<CheckoutForm {...props} />);
    // Satisfy the required-email guard before charging.
    fireEvent.click(screen.getByTestId('email-element'));
    fireEvent.click(screen.getByRole('button', { name: /pay \$10/i }));

    // Error surfaces and the button returns to the payable state.
    await screen.findByText(/your card was declined/i);
    const payButton = await screen.findByRole('button', { name: /pay \$10/i });
    expect(payButton).not.toBeDisabled();
    expect(h.confirmPayment).toHaveBeenCalledTimes(1);

    // Second attempt succeeds — the guard did not permanently block retries.
    const d = deferred<{ paymentIntent: { status: string } }>();
    h.confirmPayment.mockReturnValueOnce(d.promise);
    fireEvent.click(payButton);
    expect(h.confirmPayment).toHaveBeenCalledTimes(2);

    d.resolve({ paymentIntent: { status: 'succeeded' } });
    await waitFor(() => expect(props.onComplete).toHaveBeenCalledTimes(1));
  });
});

describe('CheckoutForm required-email guard', () => {
  it('does not charge and prompts for an email when the card button is clicked without one', async () => {
    render(<CheckoutForm {...props} />);

    // No email entered → clicking Pay must not reach Stripe.
    fireEvent.click(screen.getByRole('button', { name: /pay \$10/i }));

    await screen.findByText(/enter a valid email/i);
    expect(h.confirmPayment).not.toHaveBeenCalled();
    // Button stays payable so the buyer can fix it and retry.
    expect(
      screen.getByRole('button', { name: /pay \$10/i })
    ).not.toBeDisabled();
  });

  it('charges via the wallet using the email it supplies, even if the card email field is untouched', async () => {
    h.confirmPayment.mockResolvedValue({
      paymentIntent: { status: 'succeeded' },
    });

    render(<CheckoutForm {...props} />);
    // Never touch the card email field; the wallet provides its own email.
    fireEvent.click(screen.getByTestId('wallet'));

    await waitFor(() => expect(h.confirmPayment).toHaveBeenCalledTimes(1));
    expect(h.confirmPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        confirmParams: expect.objectContaining({
          receipt_email: 'buyer@example.com',
        }),
      })
    );
    await waitFor(() => expect(props.onComplete).toHaveBeenCalledTimes(1));
  });
});
