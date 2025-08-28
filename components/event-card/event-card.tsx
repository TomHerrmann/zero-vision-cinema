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
import { Event, Location } from '@/payload-types';
import { RichText } from '@payloadcms/richtext-lexical/react';
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';
import { Separator } from '../ui/separator';

type Orientation = 'vert' | 'horz';

type Props = Event & {
  orientation?: Orientation;
};

const EventCard = ({
  name,
  description,
  paymentLink,
  image,
  price,
  datetime,
  location,
  orientation = 'vert',
}: Props) => {
  const date = new Date(datetime);

  if (!image || typeof image === 'number' || !image?.url || !paymentLink) {
    return null;
  }

  if (orientation === 'horz') {
    return (
      <Card className="flex flex-row h-full rounded-2xl shadow-md hover:shadow-lg transition bg-sky-900 overflow-hidden p-[8px] gap-0 md:gap-4 m-0">
        <div className="relative w-40 min-w-40 aspect-[2/3] md:w-56 md:min-w-56">
          <Image
            src={image.url}
            alt={image.alt}
            fill
            className="object-cover rounded-[10px]"
            sizes="(max-width: 768px) 160px, 224px"
          />
        </div>
        <div className="flex flex-col flex-1">
          <CardHeader className="pb-4 md:pb-2 px-2">
            <CardTitle className="text-left text-xl md:text-[1.5rem] font-semibold line-clamp-2 pl-2">
              {name}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex md:flex-col md:gap-3 gap-1 flex-1">
            <RichText
              data={description}
              className="md:flex flex-col gap-[.5rem] hidden md:visible"
            />
            <div className="flex flex-col gap-2 text-sm justify-start">
              <div className="flex flex-row items-center gap-1">
                <Calendar className="w-4 h-4" />
                {date.toLocaleString(undefined, {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                  timeZone: 'America/New_York',
                })}
              </div>
              <Separator orientation="vertical" className="hidden md:visible" />
              <Separator orientation="horizontal" className="md:hidden" />
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {(location as Location).name}
              </div>
              <Separator orientation="vertical" className="hidden md:visible" />
              <Separator orientation="horizontal" className="md:hidden" />
              <div className="flex items-center gap-1">
                <DollarSign className="w-4 h-4" />${price.toFixed(2)}
              </div>
            </div>
          </CardContent>
          <CardFooter className="mt-[1.5rem] mb-[.5rem]">
            <Button asChild className="w-full px-[.5rem]">
              <Link target="_blank" href={paymentLink} className="text-md">
                Buy Tickets
              </Link>
            </Button>
          </CardFooter>
        </div>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-full rounded-2xl shadow-md hover:shadow-lg transition bg-sky-900">
      <CardHeader className="pb-2">
        <CardTitle className="text-center text-xl md:text-[1.5rem] font-semibold line-clamp-2 h-[4rem] md:h-[6rem] scale-text">
          {name}
        </CardTitle>
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
        <div className="flex flex-col gap-2 text-sm">
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
