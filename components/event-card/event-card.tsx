import Link from 'next/link';
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, DollarSign } from 'lucide-react';

type EventProps = {
  title: string;
  description: string;
  ticketLink: string;
  imageUrl: string;
  price: number;
  datetime: Date;
  location: string;
};

const EventCard = ({
  title,
  description,
  ticketLink,
  imageUrl,
  price,
  datetime,
  location,
}: EventProps) => {
  return (
    <Card className="flex flex-col h-full rounded-2xl shadow-md hover:shadow-lg transition bg-sky-900">
      <CardHeader className="pb-2">
        <CardTitle className="text-center text-xl md:text-[1.5rem] font-semibold line-clamp-2 h-[4rem] md:h-[6rem] scale-text">
          {title}
        </CardTitle>
        <div className="relative w-full aspect-[2/3] rounded-lg overflow-hidden">
          <Image
            src={imageUrl}
            alt={`${title} poster`}
            fill
            className="object-cover"
          />
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-3 flex-1 text-col">
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {datetime.toLocaleString(undefined, {
              dateStyle: 'medium',
              timeStyle: 'short',
            })}
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            {location}
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />${price.toFixed(2)}
          </div>
        </div>
      </CardContent>

      <CardFooter className="mt-auto">
        <Button asChild className="w-full">
          <Link target="_blank" href={ticketLink}>
            Buy Tickets
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default EventCard;
