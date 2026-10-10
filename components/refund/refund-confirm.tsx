'use client';

import { useState } from 'react';

/**
 * Wording for the request flow. Blanks in [brackets] are Tom & Mary's to write
 * — replace each before this ships.
 */
const COPY = {
  submit: '[Tom & Mary: button label for sending the refund request]',
  working: 'Processing…',
  doneHeading: '[Tom & Mary: heading once the request is sent]',
  doneBody: '[Tom & Mary: what happens next, shown once the request is sent]',
};

type Props = {
  orderId: number;
  token: string;
  eventName: string;
  amount: number;
};

/** Files a refund request; an admin approves or declines it. */
export default function RefundConfirm({
  orderId,
  token,
  eventName,
  amount,
}: Props) {
  const [status, setStatus] = useState<'idle' | 'working' | 'done' | 'error'>(
    'idle'
  );
  const [message, setMessage] = useState<string | null>(null);

  if (status === 'done') {
    return (
      <div className="text-center">
        <p className="zvc-heading text-2xl mb-3">{COPY.doneHeading}</p>
        <p className="zvc-body text-glow/80">{COPY.doneBody}</p>
      </div>
    );
  }

  const confirm = async () => {
    setStatus('working');
    setMessage(null);
    try {
      const res = await fetch('/api/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: orderId, token }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus('done');
      } else {
        setStatus('error');
        setMessage(data.error ?? 'Something went wrong. Please email us.');
      }
    } catch {
      setStatus('error');
      setMessage('Something went wrong. Please email us.');
    }
  };

  return (
    <div className="text-center">
      <p className="zvc-body text-glow/80 mb-2">
        Refund <span className="text-blue-light font-bold">${amount.toFixed(2)}</span>{' '}
        for <span className="text-blue-light">{eventName}</span>?
      </p>
      <p className="zvc-body text-cult-classic text-sm mb-6">
        This will invalidate your ticket — you will no longer be admitted to the
        event.
      </p>
      <button
        onClick={confirm}
        disabled={status === 'working'}
        className="zvc-btn text-base py-3 disabled:opacity-60"
      >
        {status === 'working' ? COPY.working : COPY.submit}
      </button>
      {message && (
        <p className="zvc-body text-cult-classic text-sm mt-4">{message}</p>
      )}
    </div>
  );
}
