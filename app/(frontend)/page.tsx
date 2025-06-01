import { Section } from '@/components/ds';
import About from '@/components/about/about';
import EventsSection from '@/components/events-section/events-section';

const _f13 = {
  title: 'Friday the 13th | 45th Anniversary',
  description:
    'Zero Vision Cinema presents a 45th anniversary screening of the slasher classic "Friday the 13th". The film started a trend of copycat summer camp horror movies, and maybe it was a copycat itself.',
  ticketLink: 'https://buy.stripe.com/3cI14n4NefCbdmBgVSfIs01',
  imageUrl:
    'https://s7qtxjaxzhtgrxvy.public.blob.vercel-storage.com/fridaythe13th_poster',
  price: 10,
  datetime: new Date(2025, 5, 13, 21, 30, 0),
  location: 'Grove 34',
};

const _28dl: FakeEvent = {
  title: '28 Days Later',
  description:
    'Zero Vision Cinema presents one of the definitive horror films of the last 25 years. “28 Days Later” explores the darker side of human nature in a post apocalyptic world. See how Director Danny Boyle (Trainspotting, Slumdog Millionaire) and writer Alex Garland (Ex Machina, Annihilation) redefined zombie films before seeing the duo return for the upcoming “28 Years Later”.',
  ticketLink: 'https://buy.stripe.com/5kQdR9gvWfCb5U96hefIs00',
  imageUrl:
    'https://s7qtxjaxzhtgrxvy.public.blob.vercel-storage.com/28dayslater_poster',
  price: 10,
  datetime: new Date(2025, 5, 4, 19, 0, 0),
  location: 'Single Cut',
};

const _baw: FakeEvent = {
  title: 'Bloody Axe Wound | Director Q&A',
  description: '',
  ticketLink: 'https://buy.stripe.com/14AfZh5RifCb2HX0WUfIs02',
  imageUrl:
    'https://s7qtxjaxzhtgrxvy.public.blob.vercel-storage.com/bloodyaxwound_poster',
  price: 0,
  datetime: new Date(2025, 5, 29, 19, 0, 0),
  location: '',
};

export default async function Home() {
  // console.log(data);
  return (
    <>
      <EventsSection events={[_28dl, _f13, _baw]} />
      <About />
    </>
  );
}
