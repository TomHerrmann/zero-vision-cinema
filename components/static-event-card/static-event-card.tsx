import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Calendar, MapPin, Clock } from 'lucide-react';
import Image from 'next/image';

type StaticEvent = {
  date: string;
  location: string;
  eventName?: string;
  time?: string;
  image?: string;
};

type Props = {
  event: StaticEvent;
};

const StaticEventCard = ({ event }: Props) => {
  return (
    <Card className="flex flex-col h-full rounded-2xl shadow-md hover:shadow-lg transition bg-sky-900 overflow-hidden">
      <CardHeader className="pb-1 pt-4">
        {event.eventName && (
          <CardTitle className="text-center text-2xl font-bold line-clamp-2 min-h-[4rem]">
            {event.eventName}
          </CardTitle>
        )}
      </CardHeader>
      {event.image && (
        <div className="relative w-full aspect-[4/5] px-4 pb-2">
          <div className="relative w-full h-full rounded-lg overflow-hidden">
            <Image
              src={event.image}
              alt={event.eventName || 'Event image'}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          </div>
        </div>
      )}
      <CardContent className="flex flex-col gap-3 flex-1">
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>{event.date}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            <span className="line-clamp-2">{event.location}</span>
          </div>
          {event.time && (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{event.time}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default StaticEventCard;
