import About from '@/components/about/about';
import EventsSection from '@/components/events-section/events-section';
import { NewsletterSignup } from '@/components/newsletter-signup/newsletter-signup';
import ContactSection from '@/components/contact-section/contact-section';
import Hero from '@/components/hero/hero';
import { getUpcomingEvents } from '@/utils/getEvents';

// Revalidate every 5 minutes (300 seconds)
export const revalidate = 300;

export default async function Home() {
  const events = await getUpcomingEvents();

  return (
    <>
      <Hero />
      <EventsSection events={events} />
      <About />
      <NewsletterSignup />
      <ContactSection />
    </>
  );
}
