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
    <div className="flex flex-col gap-6 bg-background/50 backdrop-blur-sm rounded-2xl shadow-2xl shadow-primary/10 border-2 border-primary/20 p-6 md:p-8">
      {/* Event Title */}
      <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text">
        {name}
      </h1>

      {/* Event Image */}
      <div className="relative w-full aspect-[2/3] rounded-xl overflow-hidden border-2 border-primary/20 shadow-lg">
        <Image
          src={image.url}
          alt={image.alt}
          fill
          className="object-cover object-top transition-all duration-700 hover:scale-105"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
        />
        {/* Subtle gradient for depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/20" />
      </div>

      {/* Event Details */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3 text-foreground/90">
          <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
            <Calendar className="w-5 h-5 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs uppercase tracking-wider text-foreground/50 font-medium">
              When
            </span>
            <span className="text-base font-medium">
              {date.toLocaleString(undefined, {
                dateStyle: 'medium',
                timeStyle: 'short',
                timeZone: 'America/New_York',
              })}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-foreground/90">
          <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
            <MapPin className="w-5 h-5 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs uppercase tracking-wider text-foreground/50 font-medium">
              Where
            </span>
            <span className="text-base font-medium">{(location as Location).name}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-foreground/90">
          <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
            <DollarSign className="w-5 h-5 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs uppercase tracking-wider text-foreground/50 font-medium">
              Price
            </span>
            <span className="text-base font-bold text-primary">${price.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Event Description */}
      <div className="text-foreground/80 prose prose-invert max-w-none prose-headings:text-foreground prose-p:text-foreground/80 prose-strong:text-foreground prose-a:text-primary hover:prose-a:text-primary/80">
        <RichText data={description} />
      </div>
    </div>
  );
}
