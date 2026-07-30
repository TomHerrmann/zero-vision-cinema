import { Metadata } from 'next';
import {
  LLC_NAME,
  ZVC_EMAIL_ADDRESS,
  ADDRESS_LINE_1,
  ADDRESS_LINE_2,
} from '@/app/contsants/constants';

export const metadata: Metadata = {
  title: 'Terms of Service & Refund Policy — Zero Vision Cinema',
  description:
    'Terms of Service, refund, and cancellation policy for Zero Vision Cinema ticket purchases.',
};

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-10">
      <h2 className="font-display uppercase text-glow text-2xl mb-3">{title}</h2>
      <div className="zvc-body text-glow/80 leading-relaxed space-y-3">
        {children}
      </div>
    </section>
  );
}

export default function TermsPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-blackout">
      <div
        className="absolute inset-0 zvc-grain pointer-events-none"
        aria-hidden="true"
      />
      <div className="relative z-10 max-w-3xl mx-auto px-6 md:px-12 py-28 md:py-36">
        <span className="zvc-kicker block mb-3">Legal</span>
        <h1 className="zvc-heading text-4xl md:text-6xl mb-4">
          Terms of Service &amp; Refund Policy
        </h1>
        <p className="zvc-body text-glow/50 text-sm mb-12">
          Last updated {new Date().getFullYear()}
        </p>

        <Section title="Who We Are">
          <p>
            These terms govern ticket purchases from {LLC_NAME} (“Zero Vision
            Cinema,” “we,” “us”). Our registered address is {ADDRESS_LINE_1},{' '}
            {ADDRESS_LINE_2}. Questions? Email{' '}
            <a
              href={`mailto:${ZVC_EMAIL_ADDRESS}`}
              className="text-blue-light underline"
            >
              {ZVC_EMAIL_ADDRESS}
            </a>
            .
          </p>
        </Section>

        <Section title="Tickets & Purchases">
          <p>
            Ticket prices are shown in U.S. dollars and charged at checkout via
            our payment processor, Stripe. Your order confirmation email serves
            as your ticket and your receipt. Tickets are for the specific event,
            date, and time listed and are non-transferable except as permitted by
            us.
          </p>
          <p>
            We reserve the right to reschedule or cancel an event. If we cancel an
            event, you will be refunded in full.
          </p>
        </Section>

        <Section title="Refund & Cancellation Policy">
          <p>
            <strong className="text-glow">
              Refunds are automatic when requested at least 48 hours before an
              event&apos;s scheduled start time.
            </strong>{' '}
            Use the “Request a refund” link in your ticket email to cancel and
            receive a full refund to your original payment method. Refunds
            typically take 5–10 business days to appear, depending on your bank.
          </p>
          <p>
            <strong className="text-glow">
              Within 48 hours of the event, refunds are no longer automatic.
            </strong>{' '}
            To request one, email{' '}
            <a
              href={`mailto:${ZVC_EMAIL_ADDRESS}`}
              className="text-blue-light underline"
            >
              {ZVC_EMAIL_ADDRESS}
            </a>{' '}
            and we&apos;ll review your request. Refunding a ticket invalidates it —
            you will no longer be admitted to the event.
          </p>
          <p>
            If we cancel or materially reschedule an event, you are entitled to a
            full refund regardless of timing.
          </p>
        </Section>

        <Section title="Event Attendance">
          <p>
            Please arrive on time; latecomers may be seated at our discretion.
            Venues and showtimes are subject to change — check your email for
            updates. Contact us in advance for accessibility accommodations.
          </p>
        </Section>

        <Section title="Payments & Data">
          <p>
            Payments are processed by Stripe; we do not store your card details.
            We use your email only to deliver tickets, receipts, event reminders,
            and — if you opt in — our newsletter. You can unsubscribe from
            marketing email at any time.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            {LLC_NAME}
            <br />
            {ADDRESS_LINE_1}, {ADDRESS_LINE_2}
            <br />
            <a
              href={`mailto:${ZVC_EMAIL_ADDRESS}`}
              className="text-blue-light underline"
            >
              {ZVC_EMAIL_ADDRESS}
            </a>
          </p>
        </Section>
      </div>
    </main>
  );
}
