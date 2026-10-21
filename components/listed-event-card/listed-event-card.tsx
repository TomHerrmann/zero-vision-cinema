import Link from 'next/link';
import EventCard from '@/components/event-card/event-card';
import SlotCard from '@/app/(frontend)/halloweek2026/components/slot-card';
import { HALLOWEEK } from '@/app/(frontend)/halloweek2026/halloweek.data';
import { EVENT_TYPE_NAMES } from '@/utils/eventTypes';
import { isSoldOut } from '@/utils/isSoldOut';
import type { ListedEvent } from '@/utils/eventsListing';

type Props = {
  item: ListedEvent;
  /** `horz` for the /events list, `vert` for the home page grid. */
  orientation: 'horz' | 'vert';
};

/**
 * One entry in an event listing: its series name above the card, so a book
 * club night reads differently from a screening. Payload events render as an
 * EventCard; Halloweek slots as the Halloweek page's own SlotCard, with the
 * label linking back to that page.
 *
 * Render it inside a flex column: the card sits in a `flex-1` box so that,
 * in a grid row, cards still stretch to the tallest one below their labels.
 */
export default function ListedEventCard({ item, orientation }: Props) {
  if (item.kind === 'event') {
    return (
      <>
        <span className="zvc-kicker block text-xs">
          {EVENT_TYPE_NAMES[item.event.eventType]}
        </span>
        <div className="flex-1">
          <EventCard
            {...item.event}
            orientation={orientation}
            isSoldOut={isSoldOut(item.event)}
          />
        </div>
      </>
    );
  }

  return (
    <>
      <Link
        href="/halloweek2026"
        className="zvc-kicker block text-xs hover:text-glow transition-colors"
      >
        {HALLOWEEK.name} {HALLOWEEK.year}
      </Link>
      <div className="flex-1">
        <SlotCard
          slot={item.slot}
          layout={orientation === 'horz' ? 'list' : 'grid'}
        />
      </div>
    </>
  );
}
