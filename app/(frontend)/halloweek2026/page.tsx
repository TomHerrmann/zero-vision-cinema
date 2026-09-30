import type { Metadata } from 'next';
import Link from 'next/link';
import '../globals.css';
import {
  CalendarDays,
  Ghost,
  HelpCircle,
  Handshake,
  MapPin,
} from 'lucide-react';
import SectionHeading from '@/components/ui/section-heading';
import { Button } from '@/components/ui/button';
import { NewsletterSignup } from '@/components/newsletter-signup/newsletter-signup';
import {
  HALLOWEEK,
  HALLOWEEK_FAQS,
  HALLOWEEK_SCHEDULE,
  HALLOWEEK_SPONSORS,
  formatDayLong,
} from './halloweek.data';
import SlotCard from './components/slot-card';
import ScheduleCarousel from './components/schedule-carousel';
import SponsorCard from './components/sponsor-card';
import FaqList from './components/faq-list';

export const metadata: Metadata = {
  title: `${HALLOWEEK.name} ${HALLOWEEK.year} | Zero Vision Cinema`,
  description: `${HALLOWEEK.dateRange} — ${HALLOWEEK.tagline}`,
  alternates: { canonical: '/halloweek2026' },
};

export default function Halloweek2026Page() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-blackout">
      {/* Texture */}
      <div
        className="absolute inset-0 zvc-grain pointer-events-none"
        aria-hidden="true"
      />

      {/* ---------------------------------------------------------------- Hero */}
      <section className="relative overflow-hidden border-b-2 border-blue-light/20">
        <div
          className="absolute inset-0 bg-blue-light/10 pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 zvc-halftone pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 zvc-scanlines pointer-events-none"
          aria-hidden="true"
        />

        <div className="relative z-10 max-w-[1600px] mx-auto px-6 md:px-12 pt-32 md:pt-44 pb-16 md:pb-24 text-center">
          <span className="zvc-badge mb-8">
            <CalendarDays className="w-4 h-4" aria-hidden="true" />
            {HALLOWEEK.dateRange}
          </span>

          <h1 className="zvc-heading text-[3.5rem] sm:text-[5rem] md:text-[8rem] lg:text-[10rem] mb-6">
            {HALLOWEEK.name}
          </h1>

          <span className="zvc-rule mx-auto mb-8" aria-hidden="true" />

          <p className="zvc-body text-xl md:text-3xl text-glow/90 max-w-3xl mx-auto mb-6">
            {HALLOWEEK.tagline}
          </p>

          <div className="flex flex-col gap-4 max-w-2xl mx-auto mb-10">
            {HALLOWEEK.intro.map((paragraph, i) => (
              <p
                key={i}
                className="zvc-body text-base md:text-xl text-retro-blue/90 leading-relaxed"
              >
                {paragraph}
              </p>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg">
              <Link href="#schedule">See the lineup</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="#newsletter">Get announcements</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------- Schedule */}
      <section
        id="schedule"
        className="relative z-10 max-w-[1600px] mx-auto px-6 md:px-12 py-20 md:py-28 scroll-mt-24"
      >
        <SectionHeading
          kicker="Eight Nights"
          title="The Schedule"
          icon={Ghost}
          className="mb-12"
        />

        {/*
          Two presentations of the same cards, chosen by CSS so the page stays
          server-rendered with no breakpoint flash: a plain stack on phones,
          where vertical scrolling is the native gesture and a full-blurb card
          runs taller than the screen; the carousel from `md` up, where cards
          fit side by side and a page-length list was the thing to avoid.
        */}
        <div className="flex flex-col gap-8 md:hidden">
          {HALLOWEEK_SCHEDULE.map((slot) => (
            <SlotCard key={slot.id} slot={slot} />
          ))}
        </div>

        <div className="hidden md:block">
          <ScheduleCarousel
            slides={HALLOWEEK_SCHEDULE.map((slot) => (
              <SlotCard key={slot.id} slot={slot} />
            ))}
            labels={HALLOWEEK_SCHEDULE.map(
              (slot) => `${formatDayLong(slot.datetime)} — ${slot.title}`
            )}
          />
        </div>
      </section>

      {/* ----------------------------------------------------------- Sponsors */}
      {HALLOWEEK_SPONSORS.length > 0 && (
        <section
          id="sponsors"
          className="relative overflow-hidden border-y-2 border-blue-light/20 scroll-mt-24"
        >
          <div
            className="absolute inset-0 bg-blue-light/10 pointer-events-none"
            aria-hidden="true"
          />
          <div
            className="absolute inset-0 zvc-halftone pointer-events-none"
            aria-hidden="true"
          />

          <div className="relative z-10 max-w-[1600px] mx-auto px-6 md:px-12 py-20 md:py-28">
            <SectionHeading
              kicker="With Thanks To"
              title="Sponsors"
              icon={Handshake}
              className="mb-8"
            />

            <p className="zvc-body text-lg md:text-xl text-center max-w-3xl mx-auto mb-16">
              We&rsquo;re so excited to announce that we have multiple amazing
              sponsors this year for Halloweek, and we hope you check them out.
            </p>

            <div className="flex flex-col gap-8 max-w-5xl mx-auto">
              {HALLOWEEK_SPONSORS.map((sponsor) => (
                <SponsorCard key={sponsor.name} sponsor={sponsor} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ---------------------------------------------------------------- FAQ */}
      <section
        id="faq"
        className="relative z-10 max-w-[1600px] mx-auto px-6 md:px-12 pb-20 md:pb-28 scroll-mt-24"
      >
        <SectionHeading
          kicker="Before You Come"
          title="Good To Know"
          icon={HelpCircle}
          className="mb-16"
        />

        <FaqList faqs={HALLOWEEK_FAQS} />
      </section>

      {/* --------------------------------------------------------- Newsletter */}
      <NewsletterSignup />
    </main>
  );
}
