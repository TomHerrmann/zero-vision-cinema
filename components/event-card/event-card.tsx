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
      <Card className="group relative flex flex-row h-full overflow-hidden border-2 border-primary/20 bg-card/50 backdrop-blur-sm hover:border-primary/40 transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-primary/10">
        <div className="relative aspect-[2/3] md:w-56 md:min-w-56">
          <Image
            src={image.url}
            alt={image.alt}
            fill
            className={cn(
              'object-cover transition-transform duration-500 group-hover:scale-105',
              isSoldOut ? 'grayscale opacity-40' : ''
            )}
            sizes="(max-width: 768px) 100vw, 224px"
            loading="lazy"
          />
          {isSoldOut && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
              <div className="font-rubik-glitch text-destructive-alt text-4xl transform -rotate-12 tracking-widest">
                SOLD OUT
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-col flex-1 p-6">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-xl md:text-2xl font-bold line-clamp-2">
              {name}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex flex-col gap-4 flex-1">
            <RichText
              data={description}
              className="text-foreground/70 text-sm line-clamp-3 hidden md:block"
            />
            <div className="flex flex-col gap-3 text-sm">
              <div className="flex items-center gap-2 text-foreground/80">
                <Calendar className="w-4 h-4 text-primary" />
                {date.toLocaleString(undefined, {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                  timeZone: 'America/New_York',
                })}
              </div>
              <div className="flex items-center gap-2 text-foreground/80">
                <MapPin className="w-4 h-4 text-primary" />
                {(location as Location).name}
              </div>
              <div className="flex items-center gap-2 text-foreground/80">
                <DollarSign className="w-4 h-4 text-primary" />
                <span className="font-semibold">${price.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="p-0 pt-4">
            {isSoldOut ? (
              <Button className="w-full" disabled variant="secondary">
                Sold Out
              </Button>
            ) : (
              <Button asChild className="w-full group/btn">
                <Link target="_blank" href={paymentLink} className="flex items-center gap-2">
                  <Ticket className="w-4 h-4" />
                  Buy Tickets
                </Link>
              </Button>
            )}
          </CardFooter>
        </div>
      </Card>
    );
  }

  // OPTION 1: CINEMATIC FILM POSTER
  return (
    <Card className="group relative flex flex-col h-full overflow-hidden border-2 border-primary/20 bg-background/50 backdrop-blur-sm hover:border-primary/40 transition-all duration-500 shadow-xl hover:shadow-2xl hover:shadow-primary/20">
      {/* Poster Image - Full card background */}
      <div className="relative w-full aspect-[2/3] overflow-hidden">
        <Image
          src={image.url}
          alt={image.alt}
          fill
          className={cn(
            'object-cover transition-all duration-700 group-hover:scale-110',
            isSoldOut ? 'grayscale opacity-30' : 'group-hover:brightness-75'
          )}
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          loading="lazy"
        />

        {/* Gradient overlay - always visible */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent opacity-90" />

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

        {/* Title overlay - top */}
        <div className="absolute top-0 left-0 right-0 p-4 z-10">
          <div className="backdrop-blur-md bg-background/40 border border-primary/20 p-3 rounded-lg">
            <CardTitle className="text-lg md:text-xl font-bold text-foreground line-clamp-2 leading-tight">
              {name}
            </CardTitle>
          </div>
        </div>

        {/* Info panel - bottom (glass-morphism) */}
        <div className="absolute bottom-0 left-0 right-0 p-4 z-10 transform translate-y-0 group-hover:translate-y-0 transition-transform duration-300">
          <div className="backdrop-blur-xl bg-card/80 border border-primary/30 rounded-lg p-4 space-y-3">
            {/* Event details */}
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-foreground/90">
                <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-4 h-4 text-primary" />
                </div>
                <span className="font-medium">
                  {date.toLocaleString(undefined, {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                    timeZone: 'America/New_York',
                  })}
                </span>
              </div>

              <div className="flex items-center gap-2 text-foreground/90">
                <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-4 h-4 text-primary" />
                </div>
                <span className="font-medium line-clamp-1">{(location as Location).name}</span>
              </div>

              <div className="flex items-center gap-2 text-foreground/90">
                <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
                  <DollarSign className="w-4 h-4 text-primary" />
                </div>
                <span className="text-lg font-bold text-primary">${price.toFixed(2)}</span>
              </div>
            </div>

            {/* CTA Button */}
            <div className="pt-2">
              {isSoldOut ? (
                <Button
                  className="w-full"
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
                    'w-full group/btn relative overflow-hidden',
                    'bg-primary text-primary-foreground',
                    'hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/30',
                    'transition-all duration-300 border border-primary/20'
                  )}
                  size="lg"
                >
                  <Link target="_blank" href={paymentLink} className="flex items-center justify-center gap-2">
                    <Ticket className="w-5 h-5 transition-transform group-hover/btn:rotate-12" />
                    <span className="font-semibold">Get Tickets</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Film grain texture overlay (optional cinematic effect) */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.015] mix-blend-overlay">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }} />
      </div>
    </Card>
  );
};

export default EventCard;
