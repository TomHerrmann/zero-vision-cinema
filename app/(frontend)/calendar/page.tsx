import { Metadata } from 'next';
import { CalendarHeart } from 'lucide-react';
import SectionHeading from '@/components/ui/section-heading';
import { CALENDAR_NAME } from '@/utils/eventCalendar';
import { calendarSubscribeLinks } from '@/utils/calendarSubscribe';
import '../globals.css';

export const metadata: Metadata = {
  title: `Subscribe — ${CALENDAR_NAME}`,
  description:
    'Every Zero Vision Cinema event in your own calendar, kept up to date.',
};

/**
 * Landing page for the subscribable calendar, linked from emails (where
 * webcal:// links get stripped) and bios. One big button per calendar app.
 */
export default function CalendarPage() {
  const links = calendarSubscribeLinks();
  const options = [
    { label: 'Apple Calendar', href: links.apple },
    { label: 'Google Calendar', href: links.google },
    { label: 'Outlook', href: links.outlook },
  ];

  return (
    <main className="relative min-h-screen overflow-hidden bg-blackout">
      <div
        className="absolute inset-0 zvc-grain pointer-events-none"
        aria-hidden="true"
      />
      <div className="relative z-10 max-w-3xl mx-auto px-6 md:px-12 pt-32 md:pt-40 pb-24">
        <SectionHeading
          as="h1"
          kicker="Event Calendar"
          title="Subscribe"
          icon={CalendarHeart}
          className="mb-12"
        />

        <div className="flex flex-col gap-4 max-w-md mx-auto">
          {options.map((opt) => (
            <a key={opt.label} href={opt.href} className="zvc-btn justify-center text-lg py-4">
              {opt.label}
            </a>
          ))}
        </div>

        <p className="zvc-body text-glow/70 text-center mt-10 break-all">
          Other apps: subscribe by URL with{' '}
          <span className="text-glow">{links.feed}</span>
        </p>
      </div>
    </main>
  );
}
