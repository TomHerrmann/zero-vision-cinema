import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';

type Props = {
  eventName: string;
};

export default function CheckoutSuccess({ eventName }: Props) {
  return (
    <div className="zvc-card p-8 text-center">
      <div className="zvc-icon-frame w-16 h-16 mx-auto mb-6">
        <CheckCircle2 className="w-8 h-8" />
      </div>
      <h3 className="zvc-heading zvc-stamp text-3xl md:text-4xl mb-4">
        You&apos;re In!
      </h3>
      <p className="zvc-body text-glow/80 leading-relaxed mb-2">
        Your tickets to <span className="text-blue-light">{eventName}</span> are
        on their way.
      </p>
      <p className="zvc-body text-glow/60 mb-8">
        Check your inbox for your confirmation and tickets.
      </p>
      <Link href="/events" className="zvc-btn-outline text-base py-3">
        Back to Events
      </Link>
    </div>
  );
}
