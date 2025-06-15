import EventCard from '../event-card/event-card';
import { cn } from '@/lib/utils';
import { Rubik_Glitch } from 'next/font/google';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Event } from '@/payload-types';

const rubikGlitchFont = Rubik_Glitch({
  weight: '400',
  subsets: ['latin'],
});

type Props = { events: Event[] };

export default function EventsSection({ events }: Props) {
  const carouselContainerClass = events.length < 3 ? 'justify-center' : '';
  return (
    <section id="events" className="flex flex-col py-12">
      <div className="text-center">
        <h2
          className={cn(
            'text-[2.5rem] md:text-[4rem] font-semibold mb-12',
            rubikGlitchFont.className
          )}
        >
          Upcoming Screenings
        </h2>
      </div>
      <ScrollArea className="md:hidden">
        {events.map((event) => (
          <div
            key={event.id + '_scroll'}
            className="md:basis-1/2 lg:basis-1/3 p-4"
          >
            <div className="p-1">
              <EventCard {...event} />
            </div>
          </div>
        ))}
      </ScrollArea>
      <Carousel className="w-4/5 self-center hidden md:grid">
        <CarouselContent className={`${carouselContainerClass}`}>
          {events.map((event) => (
            <CarouselItem
              key={event.id + '_carousel'}
              className="md:basis-1/2 lg:basis-1/3 px-4"
            >
              <div className="p-1">
                <EventCard {...event} />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        {events.length > 3 && (
          <>
            <CarouselPrevious className="mx-3" variant="default" />
            <CarouselNext className="mx-3" variant="default" />
          </>
        )}
      </Carousel>
    </section>
  );
}
