import About from '@/components/about/about';
import EventsSection from '@/components/events-section/events-section';
import { NewsletterSignup } from '@/components/newsletter-signup/newsletter-signup';
import ContactSection from '@/components/contact-section/contact-section';
import { getPayload } from 'payload';
import payloadConfig from '@/payload.config';
import Hero from '@/components/hero/hero';

const payload = await getPayload({ config: payloadConfig });

const nowPlus2Hours = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

export default async function Home() {
  const eventsDocs = await payload.find({
    collection: 'events',
    where: {
      _status: {
        equals: 'published',
      },
      datetime: {
        greater_than: nowPlus2Hours,
      },
    },
    sort: ['datetime'],
    depth: 1,
  });

  return (
    <>
      <Hero />
      <EventsSection events={eventsDocs.docs} />
      <About />
      <NewsletterSignup />
      <ContactSection />
    </>
  );
}
