import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { RichText } from '@payloadcms/richtext-lexical/react';
import { Calendar, MapPin, DollarSign, Star } from 'lucide-react';
import { getEventById } from '@/utils/getEvents';
import { Location, Media } from '@/payload-types';
import { fetchMovieDataByImdbId } from '@/lib/omdb';
import { richTextIsEmpty } from '@/utils/richText';
import CheckoutClient from '@/components/checkout/checkout';
import { cn } from '@/utils/utils';
import SoldOutStamp from '@/components/sold-out/sold-out-stamp';
import { isSoldOut } from '@/utils/isSoldOut';

export const revalidate = 300;

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const event = Number.isNaN(Number(id))
    ? null
    : await getEventById(Number(id));
  if (!event) return { title: 'Event Not Found' };
  return {
    title: `${event.name} — Tickets`,
    description: `Get tickets for ${event.name}.`,
  };
}

function SpecRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex flex-col sm:flex-row sm:gap-3 py-2 border-b border-glow/10">
      <span className="font-utility uppercase tracking-wide text-xs text-blue-light w-28 shrink-0">
        {label}
      </span>
      <span className="zvc-body text-glow/85">{value}</span>
    </div>
  );
}

export default async function EventTicketPage({ params }: Props) {
  const { id } = await params;
  const event = Number.isNaN(Number(id))
    ? null
    : await getEventById(Number(id));

  if (!event) notFound();

  // Fetch OMDB (cached 30 days) only when an IMDb id is present.
  const movie = event.imdbId
    ? await fetchMovieDataByImdbId(event.imdbId)
    : null;

  const image = typeof event.image === 'object' ? (event.image as Media) : null;
  const location =
    typeof event.location === 'object' ? (event.location as Location) : null;

  // Prefer the OMDB poster / summary when the event has none.
  const posterUrl = movie?.poster ?? image?.url ?? null;
  const posterAlt = image?.alt || event.name;
  const descriptionIsEmpty = richTextIsEmpty(event.description);

  const date = new Date(event.datetime);
  const dateLabel = date.toLocaleString(undefined, {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'America/New_York',
  });

  const price = event.price ?? 0;
  const isPurchasable = price > 0 && !!event.priceId && !isSoldOut(event);

  return (
    <main className="relative min-h-screen overflow-hidden bg-blackout">
      <div
        className="absolute inset-0 zvc-grain pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-[1400px] mx-auto px-6 md:px-12 py-24 md:py-32 pt-32 md:pt-40">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          {/* Left — poster + details */}
          <div>
            {posterUrl && (
              <div className="relative w-full aspect-[2/3] max-w-md mb-8">
                <Image
                  src={posterUrl}
                  alt={posterAlt}
                  fill
                  className={cn(
                    'object-cover border-2 border-glow/15 shadow-[8px_8px_0_0_rgba(0,0,0,0.55)] zvc-worn-edge',
                    isSoldOut(event)
                      ? 'grayscale opacity-30'
                      : 'group-hover:brightness-90'
                  )}
                  sizes="(max-width: 1024px) 100vw, 400px"
                  priority
                />
                {isSoldOut(event) && (
                  // Lazy-load the stamp as a small component; z-20 ensures it
                  // sits above the image's styling.
                  <SoldOutStamp size="lg" />
                )}
              </div>
            )}

            <span className="zvc-kicker block mb-3">Screening</span>
            <h1 className="zvc-heading text-4xl md:text-6xl mb-6">
              {event.name}
            </h1>

            <div className="space-y-3 mb-8">
              <div className="flex items-center gap-3 text-glow/90">
                <div className="zvc-icon-frame w-9 h-9 flex-shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <span className="zvc-body">{dateLabel}</span>
              </div>
              {location && (
                <div className="flex items-center gap-3 text-glow/90">
                  <div className="zvc-icon-frame w-9 h-9 flex-shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <span className="zvc-body">
                    {location.name}
                    {location.address ? ` — ${location.address}` : ''}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-3 text-glow/90">
                <div className="zvc-icon-frame w-9 h-9 flex-shrink-0">
                  <DollarSign className="w-4 h-4" />
                </div>
                <span className="text-xl font-bold text-blue-light">
                  {price === 0 ? 'FREE' : `$${price.toFixed(2)}`}
                </span>
              </div>
            </div>

            {/* Description — event's own, or the OMDB summary as a fallback */}
            {!descriptionIsEmpty ? (
              <div className="prose prose-invert zvc-article max-w-none mb-10">
                <RichText data={event.description!} />
              </div>
            ) : movie?.plot ? (
              <p className="zvc-body text-glow/80 leading-relaxed mb-10">
                {movie.plot}
              </p>
            ) : null}

            {/* OMDB movie details */}
            {movie && (movie.director || movie.plot) && (
              <div className="zvc-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display uppercase text-glow text-2xl">
                    About the Film
                  </h2>
                  {movie.imdbRating && (
                    <span className="flex items-center gap-1.5 text-blue-light font-utility">
                      <Star className="w-4 h-4 fill-current" />
                      {movie.imdbRating}
                    </span>
                  )}
                </div>
                <SpecRow label="Director" value={movie.director} />
                <SpecRow label="Starring" value={movie.actors} />
                <SpecRow label="Year" value={movie.year} />
                <SpecRow
                  label="Rated · Runtime"
                  value={[movie.rated, movie.runtime]
                    .filter(Boolean)
                    .join(' · ')}
                />
                <SpecRow label="Genre" value={movie.genre} />
              </div>
            )}
          </div>

          {/* Right — checkout */}
          <div className="lg:sticky lg:top-28">
            <div className="zvc-card p-6 md:p-8 zvc-logo-tab">
              <h2 className="zvc-heading text-3xl mb-6">Get Tickets</h2>

              {isSoldOut(event) ? (
                <div className="text-center py-10">
                  <div className="zvc-stamp inline-block font-display text-destructive text-4xl md:text-5xl tracking-widest border-4 border-destructive px-4 py-1">
                    SOLD OUT
                  </div>
                  <p className="zvc-body text-glow/60 mt-4">
                    This screening is at capacity.
                  </p>
                </div>
              ) : isPurchasable ? (
                <CheckoutClient
                  eventId={event.id}
                  eventName={event.name}
                  price={price}
                  paymentLink={event.paymentLink}
                />
              ) : (
                <p className="zvc-body text-glow/70">
                  Tickets for this event aren&apos;t available for online
                  purchase.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
