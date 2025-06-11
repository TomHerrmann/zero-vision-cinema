import { Section } from '@/components/ds';
import About from '@/components/about/about';
import EventsSection from '@/components/events-section/events-section';
import { NewsletterSignup } from '@/components/newsletter-signup/newsletter-signup';
import ContactSection from '@/components/contact-section/contact-section';

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

const _bnd: FakeEvent = {
  title: 'Bound',
  description: '',
  ticketLink: 'https://buy.stripe.com/5kQcN57ZqfCb2HXdJGfIs03',
  imageUrl:
    'https://s7qtxjaxzhtgrxvy.public.blob.vercel-storage.com/boundposter-H38HzhrVVr3kczL2AGwlrDP4hZXOdB.jpg',
  price: 10,
  datetime: new Date(2025, 5, 25, 19, 30, 0),
  location: 'Single Cut',
};

const _baw: FakeEvent = {
  title: 'Bloody Axe Wound | Director Q&A',
  description: '',
  ticketLink: 'https://buy.stripe.com/14AfZh5RifCb2HX0WUfIs02',
  imageUrl:
    'https://s7qtxjaxzhtgrxvy.public.blob.vercel-storage.com/bloodyaxwound_poster',
  price: 10,
  datetime: new Date(2025, 5, 29, 19, 0, 0),
  location: 'Focal Point Beer Co.',
};

export default async function Home() {
  return (
    <>
      <EventsSection events={[_f13, _bnd, _baw]} />
      <About />
      <NewsletterSignup />
      <ContactSection />
    </>
  );
}
