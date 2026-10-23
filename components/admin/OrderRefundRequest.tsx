'use client';

import React, { useState } from 'react';
import { useDocumentInfo, useFormFields } from '@payloadcms/ui';

/**
 * On an order: file a refund request for a buyer who emailed in, then open it
 * to approve or decline. Nothing is refunded from here.
 */
export function OrderRefundRequest() {
  const { id } = useDocumentInfo();
  const refundedAt = useFormFields(([fields]) => fields.refundedAt?.value);
  const paymentIntentId = useFormFields(([fields]) => fields.paymentIntentId?.value);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (!id || refundedAt || !paymentIntentId) return null;

  const start = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/refund-requests/for-order/${id}`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok) {
        window.location.href = `/admin/collections/refund-requests/${data.id}`;
        return;
      }
      setMessage(data.error ?? 'Something went wrong.');
    } catch {
      setMessage('Something went wrong.');
    }
    setBusy(false);
  };

  return (
    <div style={{ marginBottom: 24 }}>
      <button
        type="button"
        className="btn btn--style-secondary btn--size-medium"
        disabled={busy}
        onClick={start}
      >
        Start a refund request
      </button>
      {message && <p>{message}</p>}
    </div>
  );
}
