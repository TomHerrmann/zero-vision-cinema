import Image from 'next/image';
import { Calendar, MapPin, DollarSign } from 'lucide-react';
import { Event, Location } from '@/payload-types';
import { RichText } from '@payloadcms/richtext-lexical/react';

type Props = Event;

export default function EventDetails({
  name,
  description,
  image,
  price,
  datetime,
  location,
}: Props) {
  const date = new Date(datetime);

  if (!image || typeof image === 'number' || !image?.url) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6 bg-sky-900 rounded-2xl shadow-lg p-6">
      {/* Event Title */}
      <h1 className="text-2xl md:text-3xl font-bold text-white">{name}</h1>

      {/* Event Image */}
      <div className="relative w-full aspect-[2/3] rounded-lg overflow-hidden">
        <Image
          src={image.url}
          alt={image.alt}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
        />
      </div>

      {/* Event Details */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 text-white">
          <Calendar className="w-5 h-5" />
          <span className="text-base">
            {date.toLocaleString(undefined, {
              dateStyle: 'medium',
              timeStyle: 'short',
              timeZone: 'America/New_York',
            })}
          </span>
        </div>

        <div className="flex items-center gap-2 text-white">
          <MapPin className="w-5 h-5" />
          <span className="text-base">{(location as Location).name}</span>
        </div>

        <div className="flex items-center gap-2 text-white">
          <DollarSign className="w-5 h-5" />
          <span className="text-base font-semibold">${price.toFixed(2)}</span>
        </div>
      </div>

      {/* Event Description */}
      <div className="text-white prose prose-invert max-w-none">
        <RichText data={description} />
      </div>
    </div>
  );
}
