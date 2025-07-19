import Link from 'next/link';
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, DollarSign } from 'lucide-react';
import { Event, Location, Media } from '@/payload-types';

type Props = Event;

const EventCard = ({
  name,
  paymentLink,
  image,
  price,
  datetime,
  location,
}: Props) => {
  const date = new Date(datetime);

  if (!image || typeof image === 'number' || !image?.url || !paymentLink) {
    return null;
  }

  return (
    <Card className="flex flex-col h-full rounded-2xl shadow-md hover:shadow-lg transition bg-sky-900">
      <CardHeader className="pb-2">
        <CardTitle
          className="text-center font-semibold mb-4 h-[4rem] md:h-[7rem]"
          style={{
            fontSize: `clamp(2rem, ${Math.max(5, Math.min(8, 80 / (name.length || 1)))}vw, 3rem)`,
            height: 'auto',
            minHeight: '3rem',
            maxHeight: 'none',
            overflowWrap: 'anywhere',
          }}
        >
          {name}
        </CardTitle>
        <style jsx>{`
          @media (min-width: 768px) {
            .card-title {
              font-size: clamp(
                1.5rem,
                ${Math.max(2, Math.min(4, 40 / (name.length || 1)))}vw,
                2.5rem
              ) !important;
              height: 4rem !important;
              min-height: 4rem !important;
              max-height: 7rem !important;
            }
          }
        `}</style>
        <div className="relative w-full aspect-[2/3] rounded-lg overflow-hidden">
          <Image
            src={image.url}
            alt={image.alt}
            fill
            className="object-cover"
          />
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-3 flex-1 text-col">
        <div className="flex flex-col gap-2 text-lg">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {date.toLocaleString(undefined, {
              dateStyle: 'medium',
              timeStyle: 'short',
              timeZone: 'America/New_York',
            })}
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            {(location as Location).name}
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />${price.toFixed(2)}
          </div>
        </div>
      </CardContent>

      <CardFooter className="mt-auto">
        <Button asChild className="w-full">
          <Link target="_blank" href={paymentLink}>
            Buy Tickets
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default EventCard;
