import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Clock, Film, MapPin } from 'lucide-react';
import AddToCalendar from '@/components/add-to-calendar/add-to-calendar';
import {
  formatDayLong,
  formatTime,
  venueMapUrl,
  type HalloweekSlot,
} from '../halloweek.data';

type Props = { slot: HalloweekSlot };

function InfoRow({
  icon: Icon,
  label,
  value,
  href,
  hrefLabel,
}: {
  icon: typeof Clock;
  label: string;
  value: string;
  /** When set, the whole row becomes a link out to this URL. */
  href?: string | null;
  /** Accessible name for the link, since "The Ditty" alone won't say where it goes. */
  hrefLabel?: string;
}) {
  const body = (
    <>
      <div className="zvc-icon-frame w-8 h-8 flex-shrink-0 transition-colors group-hover/row:border-blue-light group-hover/row:bg-blue-light/20">
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex flex-col min-w-0">
        <span className="font-utility text-xs uppercase tracking-wide text-glow/50">
          {label}
        </span>
        <span className="text-base font-medium break-words">{value}</span>
      </div>
    </>
  );

  if (!href) {
    return <div className="flex items-center gap-3 text-glow/90">{body}</div>;
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={hrefLabel}
      className="group/row flex items-center gap-3 text-glow/90 hover:text-blue-light transition-colors"
    >
      {body}
    </a>
  );
}

/**
 * One event in the Halloweek lineup.
 *
 * The artwork frame is 4:5, matching the flyers exactly (1080×1350), so no
 * part of a designed poster is ever cropped. It sits above the copy in the
 * mobile stack, capped at 280px wide, and becomes a 240px column beside it
 * from `md` up.
 *
 * That column is vertically centred rather than stretched. Cards in a
 * carousel row all take the height of the tallest, and a 4:5 image is shorter
 * than that — stretching it to fill would crop a third of the poster's width,
 * so the leftover space is split above and below instead.
 *
 * Nothing here is truncated. In the desktop carousel the flex row stretches
 * every card to the height of the tallest one, so full blurbs of differing
 * lengths still produce a uniform row, and `mt-auto` on the time/venue block
 * pins the footer to the bottom of whatever height that turns out to be. In
 * the mobile stack each card takes its natural height instead.
 *
 * There is no ticketing here by design: no checkout link, no price, no
 * sold-out state. The one action is Add to Calendar (two hours per event). The card carries its own date, since the carousel replaced
 * the per-day headings that used to group these.
 */
export default function SlotCard({ slot }: Props) {
  return (
    <Card className="group flex flex-col md:flex-row md:h-full overflow-hidden gap-0 py-0">
      {/* Poster */}
      <div className="relative w-full max-w-[280px] mx-auto aspect-[4/5] overflow-hidden bg-blackout/60 md:mx-0 md:w-[240px] md:min-w-[240px] md:max-w-none md:self-center">
        {slot.image ? (
          <Image
            src={slot.image}
            alt={slot.title}
            fill
            className="object-cover object-center group-hover:brightness-90"
            sizes="(max-width: 768px) 280px, 240px"
            loading="lazy"
          />
        ) : (
          // Placeholder until artwork lands — keeps the card's shape stable.
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-glow/20">
            <Film className="w-10 h-10" />
            <span className="font-utility uppercase text-xs tracking-[0.2em]">
              Artwork TBA
            </span>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex flex-col flex-1 p-5 md:p-6">
        <span className="zvc-kicker block text-xs mb-2">
          {formatDayLong(slot.datetime)}
          {slot.kicker && (
            <span className="text-retro-blue"> · {slot.kicker}</span>
          )}
        </span>

        <h3 className="zvc-heading text-2xl md:text-3xl mb-2">{slot.title}</h3>

        {slot.meta && (
          <p className="zvc-body text-sm text-retro-blue/80 mb-3">
            {slot.meta}
          </p>
        )}

        <p className="zvc-body text-base leading-relaxed mb-5">
          {slot.description}
        </p>

        <div className="flex flex-col gap-3 mt-auto">
          <InfoRow
            icon={Clock}
            label="Time"
            value={formatTime(slot.datetime)}
          />
          <InfoRow
            icon={MapPin}
            label="Where"
            value={slot.venueName}
            href={venueMapUrl(slot.venueName)}
            hrefLabel={`${slot.venueName} — open in Google Maps`}
          />
        </div>

        {slot.tags && slot.tags.length > 0 && (
          <ul className="flex flex-wrap gap-2 mt-4">
            {slot.tags.map((tag) => (
              <li
                key={tag}
                className="font-utility uppercase text-[0.65rem] tracking-[0.2em] text-retro-blue border border-blue-light/25 px-2 py-1"
              >
                {tag}
              </li>
            ))}
          </ul>
        )}

        <AddToCalendar
          calendarUrl={`/api/halloweek/${slot.id}/calendar`}
          className="mt-5"
          buttonClassName="w-full md:w-auto"
        />
      </div>
    </Card>
  );
}
