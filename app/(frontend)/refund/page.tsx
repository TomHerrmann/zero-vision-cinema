import { Metadata } from 'next';
import { getPayload } from 'payload';
import payloadConfig from '@payload-config';
import { verifyRefundToken } from '@/lib/refundToken';
import RefundConfirm from '@/components/refund/refund-confirm';
import type { Event } from '@/payload-types';

export const metadata: Metadata = {
  title: 'Request a Refund — Zero Vision Cinema',
  robots: { index: false, follow: false },
};

const FORTY_EIGHT_HOURS = 48 * 60 * 60 * 1000;

type Props = {
  searchParams: Promise<{ order?: string; token?: string }>;
};

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-blackout">
      <div
        className="absolute inset-0 zvc-grain pointer-events-none"
        aria-hidden="true"
      />
      <div className="relative z-10 max-w-xl mx-auto px-6 py-32 md:py-40">
        <span className="zvc-kicker block mb-3 text-center">Refund</span>
        <h1 className="zvc-heading text-4xl md:text-5xl mb-8 text-center">
          Request a Refund
        </h1>
        <div className="zvc-card p-8">{children}</div>
      </div>
    </main>
  );
}

export default async function RefundPage({ searchParams }: Props) {
  const { order, token } = await searchParams;
  const orderId = Number(order);

  if (!orderId || !token || !verifyRefundToken(orderId, token)) {
    return (
      <Shell>
        <p className="zvc-body text-glow/80 text-center">
          This refund link is invalid or has expired. Please use the link in your
          ticket email, or contact us for help.
        </p>
      </Shell>
    );
  }

  const payload = await getPayload({ config: payloadConfig });
  const orderDoc = await payload.findByID({
    collection: 'orders',
    id: orderId,
    depth: 0,
    disableErrors: true,
  });

  if (!orderDoc) {
    return (
      <Shell>
        <p className="zvc-body text-glow/80 text-center">
          We couldn&apos;t find that order.
        </p>
      </Shell>
    );
  }

  if (orderDoc.refundedAt) {
    return (
      <Shell>
        <p className="zvc-body text-glow/80 text-center">
          This order has already been refunded. If you have questions, just reply
          to your ticket email.
        </p>
      </Shell>
    );
  }

  const eventDocs = await payload.find({
    collection: 'events',
    disableErrors: true,
    limit: 1,
    depth: 0,
    where: { productId: { equals: orderDoc.productId } },
  });
  const event_ = eventDocs.docs[0] as Event | undefined;

  const withinWindow = event_
    ? new Date(event_.datetime).getTime() - Date.now() < FORTY_EIGHT_HOURS
    : false;

  return (
    <Shell>
      <RefundConfirm
        orderId={orderId}
        token={token}
        eventName={event_?.name ?? 'your event'}
        amount={orderDoc.amountPaid}
        withinWindow={withinWindow}
      />
    </Shell>
  );
}
