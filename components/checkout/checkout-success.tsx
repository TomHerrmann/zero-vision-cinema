import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';

type Props = {
  eventName: string;
};

export default function CheckoutSuccess({ eventName }: Props) {
  return (
    <div className="zvc-card p-8 text-center">
      <div className="zvc-icon-frame w-7.5 h-7.5 mx-auto mb-6">
        <CheckCircle2 className="w-5 h-5" />
      </div>
      <h3 className="zvc-heading zvc-stamp text-3xl md:text-4xl m-4">
        You&apos;re In!
      </h3>
      <p className="zvc-body text-glow/80 leading-relaxed text-lg mb-2">
        Your tickets to <span className="text-blue-light">{eventName}</span> are
        on their way.
      </p>
      <p className="zvc-body text-lg text-glow/60 mb-8">
        Check your inbox for your confirmation and tickets.
      </p>
      <Link href="/events" className="zvc-btn-outline text-base py-3">
        Back to Events
      </Link>
    </div>
  );
}
