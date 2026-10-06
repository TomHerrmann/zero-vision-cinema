import { Metadata } from 'next';
import {
  LLC_NAME,
  ZVC_EMAIL_ADDRESS,
  ADDRESS_LINE_1,
  ADDRESS_LINE_2,
} from '@/app/contsants/constants';

export const metadata: Metadata = {
  title: 'Privacy Policy — Zero Vision Cinema',
  description:
    'How Zero Vision Cinema collects, uses, and protects your information.',
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
      <h2 className="font-display uppercase text-glow text-2xl mb-3">
        {title}
      </h2>
      <div className="zvc-body text-glow/80 leading-relaxed space-y-3">
        {children}
      </div>
    </section>
  );
}

function EmailLink() {
  return (
    <a
      href={`mailto:${ZVC_EMAIL_ADDRESS}`}
      className="text-blue-light underline"
    >
      {ZVC_EMAIL_ADDRESS}
    </a>
  );
}

function ExternalLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-light underline"
    >
      {children}
    </a>
  );
}

export default function PrivacyPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-blackout">
      <div
        className="absolute inset-0 zvc-grain pointer-events-none"
        aria-hidden="true"
      />
      <div className="relative z-10 max-w-3xl mx-auto px-6 md:px-12 py-28 md:py-36">
        <span className="zvc-kicker block mb-3">Legal</span>
        <h1 className="zvc-heading text-4xl md:text-6xl mb-4">
          Privacy Policy
        </h1>
        <p className="zvc-body text-glow/50 text-sm mb-12">
          Last updated October 6, 2026
        </p>

        <Section title="Who We Are">
          <p>
            This policy explains how {LLC_NAME} (“Zero Vision Cinema,” “we,”
            “us”) handles information when you visit zerovisioncinema.com, buy
            a ticket, join our newsletter, or contact us. Questions? Email{' '}
            <EmailLink />.
          </p>
        </Section>

        <Section title="What We Collect">
          <p>We only collect what we need to run our events and newsletter:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong className="text-glow">Ticket purchases:</strong> your
              name, email, and payment details, entered directly into our
              payment processor, Stripe.
            </li>
            <li>
              <strong className="text-glow">Newsletter signups:</strong> your
              email address and where you signed up from (for example, our
              website or a QR code at an event).
            </li>
            <li>
              <strong className="text-glow">Contact form:</strong> your name,
              email, and message, which are emailed to our inbox.
            </li>
            <li>
              <strong className="text-glow">Site analytics:</strong> anonymous,
              aggregated visit and performance statistics (such as page views,
              page load speed, and referring sites). These do not use cookies
              or identify you personally.
            </li>
          </ul>
        </Section>

        <Section title="Where Your Information Lives">
          <p>
            We don&apos;t keep your personal details in our own database.
            They&apos;re held by the services we use to run things:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong className="text-glow">Stripe</strong> processes payments
              and stores purchase details. We never see or store your full card
              number.{' '}
              <ExternalLink href="https://stripe.com/privacy">
                Stripe&apos;s privacy policy
              </ExternalLink>
              .
            </li>
            <li>
              <strong className="text-glow">Resend</strong> sends our ticket
              emails and newsletter and stores newsletter contacts.{' '}
              <ExternalLink href="https://resend.com/legal/privacy-policy">
                Resend&apos;s privacy policy
              </ExternalLink>
              .
            </li>
            <li>
              <strong className="text-glow">Vercel</strong> hosts this website
              and provides our anonymous site analytics.{' '}
              <ExternalLink href="https://vercel.com/legal/privacy-policy">
                Vercel&apos;s privacy policy
              </ExternalLink>
              .
            </li>
          </ul>
        </Section>

        <Section title="How We Use It">
          <p>
            We use your information to deliver tickets and receipts, process
            refunds, send event updates, send our newsletter if you signed up,
            reply to your messages, and understand which parts of the site are
            useful. We do not sell, rent, or trade your personal information,
            and we don&apos;t use it for third-party advertising.
          </p>
        </Section>

        <Section title="YouTube & Google Data">
          <p>
            We use YouTube API Services to read analytics for Zero Vision
            Cinema&apos;s own YouTube channel, such as views and watch time, so
            we can understand how our videos perform. This access is read-only
            and limited to our own channel. We don&apos;t collect, store, or
            share data about YouTube viewers or any other Google user, and we
            don&apos;t post, edit, or delete anything on YouTube through it.
          </p>
          <p>
            By using our YouTube content, you are also subject to the{' '}
            <ExternalLink href="https://www.youtube.com/t/terms">
              YouTube Terms of Service
            </ExternalLink>{' '}
            and the{' '}
            <ExternalLink href="https://policies.google.com/privacy">
              Google Privacy Policy
            </ExternalLink>
            . Access granted to our app can be revoked at any time from{' '}
            <ExternalLink href="https://myaccount.google.com/permissions">
              Google&apos;s security settings
            </ExternalLink>
            .
          </p>
        </Section>

        <Section title="Your Choices">
          <p>
            You can unsubscribe from our newsletter at any time using the link
            in any email. To see, correct, or delete the information we hold
            about you, email <EmailLink /> and we&apos;ll take care of it.
            Records we&apos;re legally required to keep, such as payment
            records, may be retained as the law requires.
          </p>
        </Section>

        <Section title="Children">
          <p>
            Our site and events are not directed at children under 13, and we
            don&apos;t knowingly collect information from them.
          </p>
        </Section>

        <Section title="Changes">
          <p>
            If we change this policy, we&apos;ll update it here and change the
            date at the top.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            {LLC_NAME}
            <br />
            {ADDRESS_LINE_1}, {ADDRESS_LINE_2}
            <br />
            <EmailLink />
          </p>
        </Section>
      </div>
    </main>
  );
}
