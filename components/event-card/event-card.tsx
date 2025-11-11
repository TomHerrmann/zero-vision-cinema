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
import { Calendar, MapPin, DollarSign, Ticket } from 'lucide-react';
import { Event, Location } from '@/payload-types';
import { RichText } from '@payloadcms/richtext-lexical/react';
import { cn } from '@/utils/utils';

type Orientation = 'vert' | 'horz';

type Props = Event & {
  orientation?: Orientation;
  isSoldOut?: boolean;
};

const EventCard = ({
  id,
  name,
  description,
  paymentLink,
  image,
  price,
  datetime,
  location,
  orientation = 'vert',
  isSoldOut,
}: Props) => {
  const date = new Date(datetime);

  if (!image || typeof image === 'number' || !image?.url || !paymentLink) {
    return null;
  }

  if (orientation === 'horz') {
    return (
      <Card className="group relative flex flex-col md:flex-row h-full overflow-hidden border-2 border-primary/20 px-2 bg-background/50 backdrop-blur-sm hover:border-primary/40 transition-all duration-500 shadow-xl hover:shadow-2xl hover:shadow-primary/20">
        {/* Image Section */}
        <div className="relative w-full md:w-80 md:min-w-80 aspect-[2/3] overflow-hidden">
          <Image
            src={image.url}
            alt={image.alt}
            fill
            className={cn(
              'object-cover object-center transition-all duration-700 group-hover:scale-110',
              isSoldOut ? 'grayscale opacity-30' : 'group-hover:brightness-90'
            )}
            sizes="(max-width: 768px) 100vw, 320px"
            loading="lazy"
          />

          {/* Gradient overlay for better text contrast */}
          <div className="absolute inset-0 bg-gradient-to-r md:bg-gradient-to-r from-transparent to-background/20" />

          {/* Sold Out Overlay */}
          {isSoldOut && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/90 backdrop-blur-md z-20">
              <div className="text-center">
                <div className="font-rubik-glitch text-destructive-alt text-4xl md:text-5xl transform -rotate-12 tracking-widest drop-shadow-lg">
                  SOLD OUT
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="flex flex-col flex-1 p-6 md:p-8 relative">
          {/* Price badge - top right */}
          <div className="absolute top-6 right-6 md:top-8 md:right-8">
            <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 backdrop-blur-sm rounded-full">
              <DollarSign className="w-4 h-4 text-primary" />
              <span className="text-lg font-bold text-primary">
                ${price.toFixed(2)}
              </span>
            </div>
          </div>

          <CardHeader className="p-0 pb-6">
            <CardTitle className="text-2xl md:text-3xl lg:text-4xl font-bold line-clamp-2 bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-transparent pr-24">
              {name}
            </CardTitle>
          </CardHeader>

          <CardContent className="p-0 flex flex-col gap-6 flex-1">
            {/* Description */}
            <RichText
              data={description}
              className="text-foreground/70 text-base md:text-lg leading-relaxed line-clamp-3"
            />

            {/* Event Info */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 text-foreground/90">
                <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs uppercase tracking-wider text-foreground/50 font-medium">
                    When
                  </span>
                  <span className="text-sm md:text-base font-medium">
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
                  <span className="text-sm md:text-base font-medium line-clamp-1">
                    {(location as Location).name}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter className="p-0 pt-6">
            {isSoldOut ? (
              <Button
                className="w-full md:w-auto md:min-w-[200px]"
                disabled
                variant="secondary"
                size="lg"
              >
                Sold Out
              </Button>
            ) : (
              <Button
                asChild
                className={cn(
                  'w-full md:w-auto md:min-w-[200px] group/btn relative overflow-hidden',
                  'bg-primary text-primary-foreground',
                  'hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/30',
                  'transition-all duration-300 border border-primary/20'
                )}
                size="lg"
              >
                <Link
                  target="_blank"
                  href={paymentLink}
                  className="flex items-center justify-center gap-2 text-primary-foreground"
                >
                  <Ticket className="w-5 h-5 transition-transform group-hover/btn:rotate-12 relative z-10" />
                  <span className="font-semibold relative z-10">
                    Get Tickets
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />
                </Link>
              </Button>
            )}
          </CardFooter>
        </div>
      </Card>
    );
  }
  return (
    <Card className="group relative flex flex-col h-full overflow-hidden border-2 border-primary/20 bg-background/50 backdrop-blur-sm hover:border-primary/40 transition-all duration-500 shadow-xl hover:shadow-2xl hover:shadow-primary/20">
      {/* Poster Image - Reduced height for better balance */}
      <div className="relative w-full aspect-[3/4] overflow-hidden">
        <Image
          src={image.url}
          alt={image.alt}
          fill
          className={cn(
            'object-cover object-top transition-all duration-700 group-hover:scale-105',
            isSoldOut ? 'grayscale opacity-30' : 'group-hover:brightness-90'
          )}
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          loading="lazy"
        />

        {/* Subtle gradient for depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/40" />

        {/* Sold Out Overlay */}
        {isSoldOut && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/90 backdrop-blur-md z-20">
            <div className="text-center">
              <div className="font-rubik-glitch text-destructive-alt text-5xl md:text-6xl transform -rotate-12 tracking-widest mb-4 drop-shadow-lg">
                SOLD OUT
              </div>
              <div className="text-foreground/60 text-sm uppercase tracking-wider">
                Event at capacity
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Content Section - Outside image, more spacious */}
      <div className="flex flex-col flex-1 p-5">
        {/* Title */}
        <CardTitle className="text-xl md:text-2xl font-bold mb-4 line-clamp-2 leading-tight">
          {name}
        </CardTitle>

        {/* Event details - cleaner spacing */}
        <div className="space-y-3 mb-5">
          <div className="flex items-center gap-3 text-foreground/90">
            <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-4 h-4 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs uppercase tracking-wide text-foreground/50 font-medium">
                When
              </span>
              <span className="text-sm font-medium">
                {date.toLocaleString(undefined, {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                  timeZone: 'America/New_York',
                })}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-foreground/90">
            <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-4 h-4 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs uppercase tracking-wide text-foreground/50 font-medium">
                Where
              </span>
              <span className="text-sm font-medium line-clamp-1">
                {(location as Location).name}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-foreground/90">
            <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
              <DollarSign className="w-4 h-4 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs uppercase tracking-wide text-foreground/50 font-medium">
                Price
              </span>
              <span className="text-base font-bold text-primary">
                ${price.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* CTA Button - spacer to push to bottom */}
        <div className="mt-auto pt-2">
          {isSoldOut ? (
            <Button className="w-full" disabled variant="secondary" size="lg">
              Sold Out
            </Button>
          ) : (
            <Button
              asChild
              className={cn(
                'w-full group/btn relative overflow-hidden',
                'bg-primary text-primary-foreground',
                'hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/30',
                'transition-all duration-300 border border-primary/20'
              )}
              size="lg"
            >
              <Link
                target="_blank"
                href={paymentLink}
                className="flex items-center justify-center gap-2"
              >
                <Ticket className="w-5 h-5 transition-transform group-hover/btn:rotate-12" />
                <span className="font-semibold">Get Tickets</span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Film grain texture overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.015] mix-blend-overlay">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>
    </Card>
  );
};

export default EventCard;
