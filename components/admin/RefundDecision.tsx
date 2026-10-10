'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useDocumentInfo } from '@payloadcms/ui';
import type { RefundRequestSummary } from '@/lib/refundRequests';

const STRIPE_PAYMENT_URL = 'https://dashboard.stripe.com/payments/';

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    timeZone: 'America/New_York',
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

/**
 * Decision panel on a refund request: what the refund would do, then Approve
 * (issues the Stripe refund) or Decline. Both go through the collection's
 * guarded endpoints, so a second click or a second admin gets "already
 * decided" instead of a second refund.
 */
export function RefundDecision() {
  const { id } = useDocumentInfo();
  const [summary, setSummary] = useState<RefundRequestSummary | null>(null);
  const [voidRewards, setVoidRewards] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    const res = await fetch(`/api/refund-requests/${id}/summary`, { credentials: 'include' });
    if (res.ok) {
      const data: RefundRequestSummary = await res.json();
      setSummary(data);
      setVoidRewards(data.loyalty.otherUsableCodes.length > 0);
    } else {
      setMessage('Could not load this request.');
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const decide = async (action: 'approve' | 'decline') => {
    if (!summary) return;
    const question =
      action === 'approve'
        ? `Refund $${summary.amountPaid.toFixed(2)} to the buyer now? This can't be undone.`
        : 'Decline this refund request?';
    if (!window.confirm(question)) return;

    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/refund-requests/${id}/${action}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(action === 'approve' ? { voidRewards } : {}),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error ?? 'Something went wrong.');
      } else if (action === 'approve') {
        const voided = data.voidedCodes?.length ? ` Voided ${data.voidedCodes.join(', ')}.` : '';
        setMessage(`Refunded (${data.refundId}). The refund email goes out automatically.${voided}`);
      } else {
        setMessage(
          data.declineEmail
            ? 'Declined. The buyer is being emailed.'
            : 'Declined. No email was sent (the decline wording isn’t written yet), so reply to the buyer yourself.'
        );
      }
      await load();
    } catch {
      setMessage('Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  if (!id) return null;
  if (!summary) return <p style={styles.box}>{message ?? 'Loading…'}</p>;

  const { loyalty } = summary;
  const pending = summary.status === 'pending';

  return (
    <div style={styles.box}>
      <h3 style={{ margin: '0 0 12px' }}>
        {pending ? 'Approve or decline' : `Request ${summary.status}`}
      </h3>
      <dl style={styles.dl}>
        <dt>Order</dt>
        <dd>
          <a href={`/admin/collections/orders/${summary.orderId}`}>#{summary.orderId}</a>
          {summary.paymentIntentId && (
            <>
              {' · '}
              <a href={`${STRIPE_PAYMENT_URL}${summary.paymentIntentId}`} target="_blank" rel="noreferrer">
                Stripe payment
              </a>
            </>
          )}
        </dd>
        <dt>Event</dt>
        <dd>
          {summary.eventName ?? '—'}
          {summary.eventDate &&
            ` · ${fmtDate(summary.eventDate)}${summary.eventPassed ? ' (already happened)' : ''}`}
        </dd>
        <dt>Tickets</dt>
        <dd>{summary.quantity}</dd>
        <dt>Amount</dt>
        <dd>${summary.amountPaid.toFixed(2)}</dd>
        <dt>Requested</dt>
        <dd>
          {fmtDate(summary.requestedAt)} ({summary.source === 'buyer' ? 'buyer, from their ticket email' : 'filed by an admin'})
        </dd>
        <dt>Loyalty</dt>
        <dd>
          {loyalty.earnedCode
            ? `This order helped earn ${loyalty.earnedCode}; refunding it voids that code automatically.`
            : loyalty.countsTowardProgress
              ? 'Refunding drops this purchase from their free-ticket progress.'
              : 'This order doesn’t count toward their progress.'}
        </dd>
        {summary.stripeRefundId && (
          <>
            <dt>Stripe refund</dt>
            <dd>{summary.stripeRefundId}</dd>
          </>
        )}
        {summary.voidedRewardCodes && (
          <>
            <dt>Codes voided</dt>
            <dd>{summary.voidedRewardCodes}</dd>
          </>
        )}
      </dl>

      {pending && summary.orderRefundedAt && (
        <p>This order was already refunded some other way. Decline to close the request.</p>
      )}

      {pending && loyalty.otherUsableCodes.length > 0 && (
        <label style={{ display: 'block', margin: '12px 0' }}>
          <input
            type="checkbox"
            checked={voidRewards}
            onChange={(e) => setVoidRewards(e.target.checked)}
            disabled={busy}
          />{' '}
          Also void their free-ticket code {loyalty.otherUsableCodes.join(', ')}. The purchases that
          earned it stay used up, so they won&apos;t count toward a new one.
        </label>
      )}

      {pending && (
        <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
          <button
            type="button"
            className="btn btn--style-primary btn--size-medium"
            disabled={busy || Boolean(summary.orderRefundedAt)}
            onClick={() => decide('approve')}
          >
            Approve refund
          </button>
          <button
            type="button"
            className="btn btn--style-secondary btn--size-medium"
            disabled={busy}
            onClick={() => decide('decline')}
          >
            Decline
          </button>
        </div>
      )}

      {message && <p style={{ marginTop: 12 }}>{message}</p>}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  box: {
    border: '1px solid var(--theme-elevation-150)',
    borderRadius: 4,
    padding: 20,
    marginBottom: 24,
  },
  dl: {
    display: 'grid',
    gridTemplateColumns: 'max-content 1fr',
    gap: '6px 16px',
    margin: 0,
  },
};
