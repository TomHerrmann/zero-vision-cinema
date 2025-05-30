import { Section } from '@/components/ds';
import About from '@/components/about/about';
import EventsSection from '@/components/events-section/events-section';

const _f13 = {
  title: 'Friday the 13th 45th Anniversary Screening',
  description:
    'Zero Vision Cinema presents a 45th anniversary screening of the slasher classic "Friday the 13th". The film started a trend of copycat summer camp horror movies, and maybe it was a copycat itself.',
  ticketLink: 'https://buy.stripe.com/3cI14n4NefCbdmBgVSfIs01',
  imageUrl:
    'https://s7qtxjaxzhtgrxvy.public.blob.vercel-storage.com/fridaythe13th-on0YKYK71xtkSabXQAHc2ZRR4k0Znv.jpeg',
  price: 10,
  datetime: new Date(2025, 5, 13, 21, 30, 0),
  location: 'Grove 34',
};

const _28dl: FakeEvent = {
  title: '28 Days Later Screening',
  description:
    'Zero Vision Cinema presents one of the definitive horror films of the last 25 years. “28 Days Later” explores the darker side of human nature in a post apocalyptic world. See how Director Danny Boyle (Trainspotting, Slumdog Millionaire) and writer Alex Garland (Ex Machina, Annihilation) redefined zombie films before seeing the duo return for the upcoming “28 Years Later”.',
  ticketLink: 'https://buy.stripe.com/5kQdR9gvWfCb5U96hefIs00',
  imageUrl:
    'https://s7qtxjaxzhtgrxvy.public.blob.vercel-storage.com/28dayslater-9KVpQSnIA9HuBWuLOCgqFFDs9TDlEr.jpeg',
  price: 10,
  datetime: new Date(2025, 5, 4, 19, 0, 0),
  location: 'Single Cut',
};

export default async function Home() {
  // console.log(data);
  return (
    <>
      <About />
      <Section className="m-0 bg-white">
        <EventsSection events={[_f13, _28dl]} />
      </Section>
    </>
  );
}
