import { Section } from '@/components/ds';
import About from '@/components/about/about';
import EventsSection from '@/components/events-section/events-section';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL; // Set this in .env.local

// const res = await fetch(`${baseUrl}/api/events`);
// const data = await res.json();

export default async function Home() {
  // console.log(data);
  return (
    <>
      <About />
      <Section className="m-0 bg-white">
        <EventsSection events={[]} />
      </Section>
    </>
  );
}
