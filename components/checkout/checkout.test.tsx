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
  LinkAuthenticationElement: () => <div data-testid="email-element" />,
  ExpressCheckoutElement: ({ onConfirm }: { onConfirm?: () => void }) => (
    <button type="button" data-testid="wallet" onClick={() => onConfirm?.()} />
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
