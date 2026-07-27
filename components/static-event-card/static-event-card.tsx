import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, MapPin, Clock } from 'lucide-react';
import Image from 'next/image';

type StaticEvent = {
  date: string;
  location: string;
  eventName?: string;
  time?: string;
  description?: string;
  image?: string;
};

type Props = {
  event: StaticEvent;
};

const StaticEventCard = ({ event }: Props) => {
  return (
    <Card className="group flex flex-col h-full overflow-hidden">
      <CardHeader className="pb-1 pt-4">
        {event.eventName && (
          <CardTitle>
            <h2 className="zvc-heading text-center text-3xl md:text-5xl line-clamp-2 min-h-[4rem]">
              {event.eventName}
            </h2>
          </CardTitle>
        )}
      </CardHeader>
      {event.image && (
        <div className="relative w-full aspect-[4/5] pb-2">
          <div className="relative w-full h-full overflow-hidden">
            <Image
              src={event.image}
              alt={event.eventName || 'Event image'}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          </div>
        </div>
      )}
      <CardContent className="flex flex-col gap-3 flex-1">
        {event.description && (
          <p className="zvc-body text-base leading-relaxed line-clamp-3">
            {event.description}
          </p>
        )}
        <div className="flex flex-col gap-2 text-md mt-auto text-glow/90">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-light" />
            <span>{event.date}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-light" />
            <span className="line-clamp-2">{event.location}</span>
          </div>
          {event.time && (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-light" />
              <span>{event.time}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default StaticEventCard;
