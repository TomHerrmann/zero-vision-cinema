import About from '@/components/about/about';
import EventsSection from '@/components/events-section/events-section';
import { NewsletterSignup } from '@/components/newsletter-signup/newsletter-signup';
import ContactSection from '@/components/contact-section/contact-section';
import Hero from '@/components/hero/hero';
import SubstackSection from '@/components/substack-section/substack-section';
import { getUpcomingZvcEvents } from '@/utils/getEvents';
import { getLatestSubstackPosts } from '@/utils/getLatestSubstackPosts';

// Revalidate every 5 minutes (300 seconds)
export const revalidate = 300;

// 1 shows a single wide feature card; 2+ switches to a grid of cards.
const SUBSTACK_POST_COUNT = 1;

export default async function Home() {
  const [events, substackPosts] = await Promise.all([
    getUpcomingZvcEvents(),
    getLatestSubstackPosts(SUBSTACK_POST_COUNT),
  ]);

  return (
    <>
      <Hero />
      <EventsSection events={events} />
      <About />
      <SubstackSection posts={substackPosts} />
      <NewsletterSignup />
      <ContactSection />
    </>
  );
}
