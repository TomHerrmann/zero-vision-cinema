import React from 'react';
import { Gutter } from '@payloadcms/ui';
import type { AdminViewServerProps } from 'payload';
import type { Article, CustomBroadcast, Event, Location, Media, Order } from '@/payload-types';
import { fetchMovieDataByImdbId } from '@/lib/omdb';
import { fetchBookDataByOpenLibraryId } from '@/lib/openlibrary';
import { eventClosesAt } from '@/utils/eventEnded';
import { CopyLinkButton } from './CopyLinkButton';
import { isPaidEventType } from '@/utils/eventTypes';
import {
  dateBlock,
  daysUntil,
  formatDay,
  formatTime,
  timeAgo,
  upcomingEmails,
} from './dashboardData';

const TYPE_LABEL: Record<Event['eventType'], string> = {
  zvc: 'ZVC',
  ahc: 'AHC',
  bookclub: 'Book club',
  rww: 'Rewind Wed',
  fri: 'Medusa Fri',
  brew: 'Brewscares',
  bingo: 'Bingo',
  brunch: 'Brunch',
};

const TYPE_LONG: Record<Event['eventType'], string> = {
  zvc: 'ZVC screening',
  ahc: 'Astoria Horror Club',
  bookclub: 'Book club',
  rww: 'Rewind Wednesdays',
  fri: 'Fridays at Medusa',
  brew: 'Brewscares',
  bingo: 'Bingo',
  brunch: 'Horror Brunch',
};

const venueOf = (event: Event): Location | null =>
  typeof event.location === 'object' ? (event.location as Location) : null;

const posterFor = async (event: Event): Promise<string | null> => {
  const image = event.image as Media | number | null | undefined;
  if (image && typeof image === 'object' && image.url) return image.url;
  try {
    if (event.eventType === 'bookclub' && event.openLibraryId) {
      return (await fetchBookDataByOpenLibraryId(event.openLibraryId))?.cover || null;
    }
    if (event.imdbId) {
      return (await fetchMovieDataByImdbId(event.imdbId))?.poster || null;
    }
  } catch {
    // A poster is decoration; never let a lookup take the dashboard down.
  }
  return null;
};

const whenLabel = (days: number) =>
  days <= 0 ? 'Tonight' : days === 1 ? 'Tomorrow' : `In ${days} days`;

const Icon = ({ d, className }: { d: string; className?: string }) => (
  <svg className={`zvc-ic ${className ?? ''}`} viewBox="0 0 24 24" aria-hidden="true">
    <path d={d} />
  </svg>
);

const ICONS = {
  film: 'M2 4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2ZM7 2v20M17 2v20M2 12h20M2 7h5M2 17h5M17 17h5M17 7h5',
  book: 'M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20',
  pen: 'M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z',
  send: 'm22 2-7 20-4-9-9-4ZM22 2 11 13',
  mail: 'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm18 3-10 6L2 7',
  plus: 'M12 5v14M5 12h14',
};

export async function AdminDashboard({ payload, user }: AdminViewServerProps) {
  const admin = payload.config.routes.admin;
  const url = (path: string) => `${admin}${path}`;
  const now = new Date();

  // An event stays "coming up" until it closes, an hour after it starts.
  const openCutoff = new Date(
    now.getTime() - (eventClosesAt(now).getTime() - now.getTime())
  ).toISOString();

  const [events, orders, drafts, broadcasts] = await Promise.all([
    payload.find({
      collection: 'events',
      where: { datetime: { greater_than_equal: openCutoff } },
      sort: 'datetime',
      limit: 8,
      depth: 1,
      draft: true,
      overrideAccess: false,
      user,
    }),
    payload.find({
      collection: 'orders',
      sort: '-createdAt',
      limit: 5,
      depth: 1,
      overrideAccess: false,
      user,
    }),
    payload.find({
      collection: 'articles',
      where: { _status: { equals: 'draft' } },
      sort: '-updatedAt',
      limit: 4,
      depth: 0,
      draft: true,
      overrideAccess: false,
      user,
    }),
    payload.find({
      collection: 'custom-broadcasts',
      sort: '-updatedAt',
      limit: 20,
      depth: 0,
      overrideAccess: false,
      user,
    }),
  ]);

  const upcoming = events.docs as Event[];
  const next = upcoming[0];
  const nextVenue = next ? venueOf(next) : null;
  const nextPoster = next ? await posterFor(next) : null;

  const eventEmails = upcomingEmails(upcoming, now).slice(0, 4);
  const pendingBroadcasts = (broadcasts.docs as CustomBroadcast[])
    .filter((b) => b.status === 'draft' || (b.scheduled && b.sendAt && new Date(b.sendAt) > now))
    .slice(0, 3);

  const hour = Number(
    new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour: 'numeric', hour12: false }).format(now)
  );
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <Gutter className="zvc-dash">
      <header className="zvc-dash__head">
        <div>
          <div className="zvc-dash__eyebrow">
            {greeting} · {formatDay(now)}
          </div>
          <h1 className="zvc-dash__title">Back office</h1>
        </div>
        <a className="btn btn--style-primary btn--size-medium zvc-btn" href={url('/collections/events/create')}>
          <Icon d={ICONS.plus} /> New event
        </a>
      </header>

      {next ? (
        <section className="zvc-card zvc-next" aria-label="Next event">
          <div className="zvc-next__poster">
            {nextPoster ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={nextPoster} alt="" />
            ) : (
              <span>No poster yet</span>
            )}
          </div>
          <div className="zvc-next__body">
            <div className="zvc-next__meta">
              <span className="zvc-kicker">Next up · {whenLabel(daysUntil(next.datetime, now))}</span>
              <span className={`zvc-tag zvc-tag--${next.eventType}`}>{TYPE_LONG[next.eventType]}</span>
              {next._status === 'draft' && <span className="zvc-tag zvc-tag--draft">Draft</span>}
            </div>
            <h2 className="zvc-next__name">{next.name}</h2>
            <div className="zvc-next__facts">
              <span>
                {formatDay(next.datetime)} · {formatTime(next.datetime)}
              </span>
              {nextVenue?.name && <span>{nextVenue.name}</span>}
              {isPaidEventType(next.eventType) && next.price ? <span>${next.price}</span> : <span>Free</span>}
            </div>
            {isPaidEventType(next.eventType) && nextVenue?.capacity ? (
              <div className="zvc-meter">
                <div className="zvc-meter__label">
                  <span>Tickets sold</span>
                  <span>
                    <strong>{next.ticketsSold ?? 0}</strong> of {nextVenue.capacity}
                  </span>
                </div>
                <div className="zvc-meter__track">
                  <div
                    className="zvc-meter__fill"
                    style={{
                      width: `${Math.min(100, Math.round(((next.ticketsSold ?? 0) / nextVenue.capacity) * 100))}%`,
                    }}
                  />
                </div>
              </div>
            ) : null}
            <div className="zvc-next__actions">
              <a className="btn btn--style-primary btn--size-medium zvc-btn" href={url(`/collections/events/${next.id}`)}>
                Edit event
              </a>
              {next.paymentLink && <CopyLinkButton value={next.paymentLink} label="Copy ticket link" />}
            </div>
          </div>
        </section>
      ) : (
        <section className="zvc-card zvc-empty">
          <h2>Nothing on the calendar</h2>
          <p>Add the next screening and it shows up here.</p>
        </section>
      )}

      <nav className="zvc-quick" aria-label="Quick actions">
        <a className="zvc-card zvc-quick__item" href={url('/collections/events/create')}>
          <Icon d={ICONS.film} />
          <span className="zvc-quick__title">New screening</span>
          <span className="zvc-quick__sub">Paste an IMDb ID and the rest fills in</span>
        </a>
        <a className="zvc-card zvc-quick__item" href={url('/collections/events/create')}>
          <Icon d={ICONS.book} />
          <span className="zvc-quick__title">New book club</span>
          <span className="zvc-quick__sub">Title and author, always free</span>
        </a>
        <a className="zvc-card zvc-quick__item" href={url('/collections/articles/create')}>
          <Icon d={ICONS.pen} />
          <span className="zvc-quick__title">Write a review</span>
          <span className="zvc-quick__sub">Or an editorial</span>
        </a>
        <a className="zvc-card zvc-quick__item" href={url('/collections/custom-broadcasts/create')}>
          <Icon d={ICONS.send} />
          <span className="zvc-quick__title">Email the list</span>
          <span className="zvc-quick__sub">One-off broadcast</span>
        </a>
      </nav>

      <div className="zvc-cols">
        <section className="zvc-card zvc-list" aria-labelledby="zvc-coming-up">
          <div className="zvc-list__head">
            <h2 id="zvc-coming-up">Coming up</h2>
            <a href={url('/collections/events')}>All events</a>
          </div>
          {upcoming.length === 0 && <p className="zvc-muted zvc-pad">No upcoming events.</p>}
          {upcoming.map((event) => {
            const { month, day } = dateBlock(event.datetime);
            const venue = venueOf(event);
            return (
              <a key={event.id} className="zvc-row" href={url(`/collections/events/${event.id}`)}>
                <span className="zvc-date">
                  <span className="zvc-date__m">{month}</span>
                  <span className="zvc-date__d">{day}</span>
                </span>
                <span className="zvc-row__main">
                  <span className="zvc-row__name">
                    {event.name}
                    {event._status === 'draft' && <em className="zvc-muted"> · draft</em>}
                  </span>
                  <span className="zvc-muted">
                    {[venue?.name, formatTime(event.datetime)].filter(Boolean).join(' · ')}
                  </span>
                </span>
                <span className={`zvc-tag zvc-tag--${event.eventType}`}>{TYPE_LABEL[event.eventType]}</span>
                <span className="zvc-row__end">
                  {isPaidEventType(event.eventType)
                    ? `${event.ticketsSold ?? 0}${venue?.capacity ? ` / ${venue.capacity}` : ''}`
                    : 'Free'}
                </span>
              </a>
            );
          })}
        </section>

        <div className="zvc-side">
          <section className="zvc-card zvc-panel" aria-labelledby="zvc-emails">
            <h2 id="zvc-emails">Emails going out</h2>
            {eventEmails.length === 0 && pendingBroadcasts.length === 0 && (
              <p className="zvc-muted">Nothing scheduled.</p>
            )}
            {eventEmails.map((email) => (
              <a
                key={`${email.eventId}-${email.kind}`}
                className="zvc-item"
                href={url(`/collections/events/${email.eventId}`)}
              >
                <Icon d={ICONS.mail} className="zvc-accent" />
                <span>
                  <span className="zvc-item__title">
                    {email.kind === 'reminder' ? 'Reminder' : 'Announcement'} · {email.eventName}
                  </span>
                  <span className="zvc-muted">{formatDay(email.sendsOn)}, 9 AM</span>
                </span>
              </a>
            ))}
            {pendingBroadcasts.map((b) => (
              <a key={b.id} className="zvc-item" href={url(`/collections/custom-broadcasts/${b.id}`)}>
                <Icon d={b.status === 'draft' ? ICONS.pen : ICONS.send} className="zvc-accent" />
                <span>
                  <span className="zvc-item__title">{b.subject}</span>
                  <span className="zvc-muted">
                    {b.status === 'draft'
                      ? 'Draft, not sent'
                      : `${formatDay(b.sendAt as string)}, ${formatTime(b.sendAt as string)}`}
                  </span>
                </span>
              </a>
            ))}
          </section>

          <section className="zvc-card zvc-panel" aria-labelledby="zvc-orders">
            <h2 id="zvc-orders">Latest orders</h2>
            {orders.docs.length === 0 && <p className="zvc-muted">No orders yet.</p>}
            {(orders.docs as Order[]).map((order) => {
              const item = order.item?.value;
              const name = item && typeof item === 'object' ? (item as { name?: string | null }).name : null;
              return (
                <a key={order.id} className="zvc-item zvc-item--split" href={url(`/collections/orders/${order.id}`)}>
                  <span>
                    {order.quantity ?? 1} × {name ?? 'Ticket'}
                  </span>
                  <span className="zvc-muted">{timeAgo(order.transactionDate ?? order.createdAt, now)}</span>
                </a>
              );
            })}
            <a href={url('/collections/orders')}>All orders</a>
          </section>

          <section className="zvc-card zvc-panel" aria-labelledby="zvc-desk">
            <h2 id="zvc-desk">On the desk</h2>
            {drafts.docs.length === 0 && <p className="zvc-muted">No drafts.</p>}
            {(drafts.docs as Article[]).map((article) => (
              <a key={article.id} className="zvc-item zvc-item--split" href={url(`/collections/articles/${article.id}`)}>
                <span>{article.title}</span>
                <span className="zvc-tag zvc-tag--draft">{article.category === 'review' ? 'Review' : 'Editorial'}</span>
              </a>
            ))}
          </section>
        </div>
      </div>
    </Gutter>
  );
}
