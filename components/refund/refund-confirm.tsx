'use client';

import { useState } from 'react';
import { ZVC_EMAIL_ADDRESS } from '@/app/contsants/constants';

type Props = {
  orderId: number;
  token: string;
  eventName: string;
  amount: number;
  /** True when the event is within 48h — self-service refund is disabled. */
  withinWindow: boolean;
};

export default function RefundConfirm({
  orderId,
  token,
  eventName,
  amount,
  withinWindow,
}: Props) {
  const [status, setStatus] = useState<'idle' | 'working' | 'done' | 'error'>(
    'idle'
  );
  const [message, setMessage] = useState<string | null>(null);

  if (withinWindow) {
    return (
      <div className="text-center">
        <p className="zvc-body text-glow/80 mb-4">
          This event is within 48 hours, so refunds are no longer automatic. To
          request one, email us and we&apos;ll take care of it.
        </p>
        <a
          href={`mailto:${ZVC_EMAIL_ADDRESS}?subject=Refund request — Order ${orderId}`}
          className="zvc-btn text-base py-3"
        >
          Email us for a refund
        </a>
      </div>
    );
  }

  if (status === 'done') {
    return (
      <div className="text-center">
        <p className="zvc-heading text-2xl mb-3">Refund issued</p>
        <p className="zvc-body text-glow/80">
          Your refund for <span className="text-blue-light">{eventName}</span> is
          on its way (5–10 business days). A confirmation email is on the way, and
          your ticket has been invalidated.
        </p>
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
        {status === 'working' ? 'Processing…' : 'Yes, refund my ticket'}
      </button>
      {message && (
        <p className="zvc-body text-cult-classic text-sm mt-4">{message}</p>
      )}
    </div>
  );
}
