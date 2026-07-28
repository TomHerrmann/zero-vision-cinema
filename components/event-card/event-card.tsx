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
import { Calendar, MapPin, Ticket, Film } from 'lucide-react';
import { Event, Location } from '@/payload-types';
import { RichText } from '@payloadcms/richtext-lexical/react';
import { cn } from '@/utils/utils';
import { fetchMovieDataByImdbId } from '@/lib/omdb';
import { richTextIsEmpty } from '@/utils/richText';

type Orientation = 'vert' | 'horz';

type Props = Event & {
  orientation?: Orientation;
  isSoldOut?: boolean;
};

function PriceTag({ price }: { price: number }) {
  return (
    <div className="zvc-badge text-glow border-blue-light/50 bg-blackout/70">
      <span className="text-lg font-normal text-blue-light">
        {price === 0 ? 'FREE' : `$${price.toFixed(2)}`}
      </span>
    </div>
  );
}

function SoldOutStamp({ size = 'lg' }: { size?: 'md' | 'lg' }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-blackout/90 z-20">
      <div className="text-center">
        <div
          className={cn(
            'zvc-stamp font-display text-destructive tracking-widest border-4 border-destructive px-4 py-1',
            size === 'lg' ? 'text-5xl md:text-6xl' : 'text-4xl md:text-5xl'
          )}
          style={{ textShadow: 'none' }}
        >
          SOLD OUT
        </div>
        {size === 'lg' && (
          <div className="mt-4 font-utility text-glow/60 text-lg uppercase tracking-wider">
            Event at capacity
          </div>
        )}
      </div>
    </div>
  );
}

function PosterPlaceholder() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-card">
      <Film className="w-12 h-12 text-glow/20" />
    </div>
  );
}

const EventCard = async ({
  id,
  name,
  imdbId,
  description,
  image,
  price,
  datetime,
  location,
  orientation = 'vert',
  isSoldOut,
}: Props) => {
  const date = new Date(datetime);

  const imageObj = image && typeof image === 'object' ? image : null;
  const descriptionIsEmpty = richTextIsEmpty(description);

  // Pull OMDB (cached 30 days) only when we actually need a fallback.
  const needsOmdb = !!imdbId && (!imageObj?.url || descriptionIsEmpty);
  const movie = needsOmdb ? await fetchMovieDataByImdbId(imdbId!) : null;

  const posterUrl = imageObj?.url ?? movie?.poster ?? null;
  const posterAlt = imageObj?.alt || name;

  // Paid events route to the on-site ticket page by id. Free events (incl. the
  // static Eventbrite event) render no ticket button.
  const ticketHref = `/events/${id}`;
  const showTicketButton = (price ?? 0) > 0;

  if (orientation === 'horz') {
    return (
      <Card className="group flex flex-col md:flex-row h-full overflow-hidden">
        {/* Image Section */}
        <div className="relative w-full md:w-80 md:min-w-[450px] aspect-[2/3] overflow-hidden">
          {posterUrl ? (
            <Image
              src={posterUrl}
              alt={posterAlt}
              fill
              className={cn(
                'object-fit object-center',
                isSoldOut ? 'grayscale opacity-30' : 'group-hover:brightness-90'
              )}
              loading="lazy"
            />
          ) : (
            <PosterPlaceholder />
          )}
          {isSoldOut && <SoldOutStamp size="md" />}
        </div>

        {/* Content Section */}
        <div className="flex flex-col flex-1 p-6 md:p-8 relative">
          <div className="absolute top-6 right-6 md:top-8 md:right-8">
            <PriceTag price={price ?? 0} />
          </div>

          <CardHeader className="p-0 pb-6">
            <CardTitle>
              <h2 className="zvc-heading text-4xl md:text-5xl line-clamp-2 pr-24">
                {name}
              </h2>
            </CardTitle>
          </CardHeader>

          <CardContent className="p-0 flex flex-col gap-3 flex-1">
            {!descriptionIsEmpty ? (
              <RichText
                data={description!}
                className="zvc-body text-base md:text-lg leading-relaxed line-clamp-3"
              />
            ) : movie?.plot ? (
              <p className="zvc-body text-base md:text-lg leading-relaxed line-clamp-3">
                {movie.plot}
              </p>
            ) : null}

            <div className="flex flex-col gap-4">
              <InfoRow
                icon={Calendar}
                label="When"
                value={date.toLocaleString(undefined, {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                  timeZone: 'America/New_York',
                })}
              />
              {location && typeof location === 'object' && (
                <InfoRow icon={MapPin} label="Where" value={location.name} />
              )}
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
            ) : showTicketButton ? (
              <Button
                asChild
                size="lg"
                className="w-full md:w-auto md:min-w-[200px]"
              >
                <Link
                  href={ticketHref}
                  className="flex items-center justify-center gap-2"
                >
                  <Ticket className="w-5 h-5" />
                  <span>Get Tickets</span>
                </Link>
              </Button>
            ) : null}
          </CardFooter>
        </div>
      </Card>
    );
  }

  return (
    <Card className="group flex flex-col h-full overflow-hidden">
      {/* Poster Image */}
      <div className="relative w-full aspect-[3/4] overflow-hidden">
        {posterUrl ? (
          <Image
            src={posterUrl}
            alt={posterAlt}
            fill
            className={cn(
              'object-cover object-top transition-all duration-700',
              isSoldOut ? 'grayscale opacity-30' : 'group-hover:brightness-90'
            )}
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            loading="lazy"
          />
        ) : (
          <PosterPlaceholder />
        )}
        {isSoldOut && <SoldOutStamp size="lg" />}
      </div>

      {/* Content Section */}
      <div className="flex flex-col flex-1 p-2 md:p-5">
        <h2 className="zvc-heading text-3xl md:text-5xl mb-4 line-clamp-2">
          {name}
        </h2>

        <div className="space-y-3 mb-5">
          <InfoRow
            icon={Calendar}
            label="When"
            value={date.toLocaleString(undefined, {
              dateStyle: 'medium',
              timeStyle: 'short',
              timeZone: 'America/New_York',
            })}
          />
          {location && typeof location === 'object' && (
            <InfoRow icon={MapPin} label="Where" value={location.name} />
          )}
          <div className="flex items-center gap-3">
            <div className="zvc-icon-frame w-9 h-9 flex-shrink-0">
              <span className="font-utility text-lg">$</span>
            </div>
            <div className="flex flex-col text-lg">
              <span className="font-utility uppercase tracking-wide text-glow/50">
                Price
              </span>
              <span className="font-bold text-blue-light">
                {(price ?? 0) === 0 ? 'FREE' : `$${(price ?? 0).toFixed(2)}`}
              </span>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <div className="mt-auto pt-2">
          {isSoldOut ? (
            <Button className="w-full" disabled variant="secondary" size="lg">
              Sold Out
            </Button>
          ) : showTicketButton ? (
            <Button asChild size="lg" className="w-full">
              <Link
                href={ticketHref}
                className="flex items-center justify-center gap-2"
              >
                <Ticket className="w-5 h-5" />
                <span>Get Tickets</span>
              </Link>
            </Button>
          ) : null}
        </div>
      </div>

      {/* Film grain overlay */}
      <div
        className="absolute inset-0 pointer-events-none zvc-grain"
        aria-hidden="true"
      />
    </Card>
  );
};

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Calendar;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 text-glow/90">
      <div className="zvc-icon-frame w-9 h-9 flex-shrink-0">
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex flex-col min-w-0">
        <span className="font-utility text-lg uppercase tracking-wide text-glow/50">
          {label}
        </span>
        <span className="text-lg font-medium line-clamp-1">{value}</span>
      </div>
    </div>
  );
}

export default EventCard;
