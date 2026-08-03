import { describe, it, expect } from 'vitest';
import { render } from '@react-email/render';
import TicketEmail from './TicketEmail';
import RefundEmail from './RefundEmail';
import BroadcastEmail from './BroadcastEmail';

// These render the templates to their final HTML and assert the compliance
// fields are present — the same fields Stripe's own receipt would carry, so we
// can turn the default Stripe receipt off.

// A rich-text description like a real event has — exercises the RichText block
// that previously produced invalid nested <p> and broke the preview.
const description = {
  root: {
    type: 'root',
    format: '',
    indent: 0,
    version: 1,
    direction: 'ltr' as const,
    children: [
      {
        type: 'paragraph',
        format: '',
        indent: 0,
        version: 1,
        direction: 'ltr' as const,
        children: [
          { type: 'text', text: 'A cult classic on the big screen.', version: 1 },
        ],
      },
    ],
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;

describe('TicketEmail as a receipt', () => {
  it('renders all required receipt fields (and pretty-prints without invalid nesting)', async () => {
    const html = await render(
      <TicketEmail
        eventName="The Thing"
        eventDate="2026-08-15T23:00:00.000Z"
        eventLocation="SingleCut"
        eventAddress="19-33 37th St"
        eventDescription={description}
        quantity={1}
        totalAmount={10}
        purchaseDate="2026-08-01T12:00:00.000Z"
        orderNumber={1234}
        cardBrand="Visa"
        cardLast4="4242"
        currency="USD"
        receiptUrl="https://stripe.test/receipt/abc"
        refundUrl="https://zerovisioncinema.com/refund?order=1234&token=sig"
        movie={{
          title: 'The Thing',
          year: '1982',
          rated: 'R',
          runtime: '109 min',
          genre: 'Horror, Sci-Fi',
          director: 'John Carpenter',
          actors: 'Kurt Russell',
          plot: 'A research team in Antarctica is hunted by a shape-shifting alien.',
          imdbRating: '8.2',
          poster: '',
        }}
      />,
      { pretty: true }
    );

    // The RichText description renders inside a <div>, not a <p>.
    expect(html).toContain('A cult classic on the big screen.');
    // OMDB film details render (director, year, rating, genre).
    expect(html).toContain('About the Film'.toUpperCase());
    expect(html).toContain('John Carpenter');
    expect(html).toContain('1982');
    expect(html).toContain('8.2');
    expect(html).toContain('Horror, Sci-Fi');

    // Transaction details: total, currency, order #
    expect(html).toContain('$10.00 USD');
    expect(html).toContain('1234');
    // Card identity
    expect(html).toContain('Visa ending in 4242');
    // Corporate details (legal name matching the bank descriptor) + address
    expect(html).toContain('Zero Vision Cinema LLC');
    expect(html).toContain('418 Broadway Ste N');
    expect(html).toContain('info@zerovisioncinema.com');
    // Policies + links
    expect(html).toContain('Terms of Service');
    expect(html).toContain('/terms');
    // Refund button + Stripe receipt link
    expect(html).toContain('/refund?order=1234&amp;token=sig');
    expect(html).toContain('https://stripe.test/receipt/abc');
  });

  it('falls back to the OMDB plot when the event has no description', async () => {
    const empty = { root: { type: 'root', children: [], direction: null, format: '', indent: 0, version: 1 } } as any; // eslint-disable-line @typescript-eslint/no-explicit-any
    const html = await render(
      <TicketEmail
        eventName="The Thing"
        eventDate="2026-08-15T23:00:00.000Z"
        eventLocation="SingleCut"
        eventAddress="19-33 37th St"
        eventDescription={empty}
        quantity={1}
        totalAmount={10}
        purchaseDate="2026-08-01T12:00:00.000Z"
        movie={{
          title: 'The Thing',
          year: '1982',
          rated: 'R',
          runtime: '109 min',
          genre: 'Horror',
          director: 'John Carpenter',
          actors: 'Kurt Russell',
          plot: 'A shape-shifting alien hunts an Antarctic research team.',
          imdbRating: '8.2',
          poster: '',
        }}
      />,
      { pretty: true }
    );
    expect(html).toContain('shape-shifting'); // OMDB plot rendered as the fallback
    expect(html).toContain('John Carpenter');
  });
});

describe('RefundEmail', () => {
  it('renders required fields to the same standard', async () => {
    const html = await render(
      <RefundEmail
        eventName="The Thing"
        eventDate="2026-08-15T23:00:00.000Z"
        orderNumber={1234}
        refundAmount={10}
        currency="USD"
        cardBrand="Visa"
        cardLast4="4242"
        refundDate="2026-08-02T15:00:00.000Z"
        receiptUrl="https://stripe.test/receipt/abc"
      />
    );

    expect(html).toContain('$10.00 USD');
    expect(html).toContain('Visa ending in 4242');
    expect(html).toContain('Zero Vision Cinema LLC');
    expect(html).toContain('Terms of Service');
    expect(html).toContain('https://stripe.test/receipt/abc');
    expect(html).toContain('invalidated');
  });
});

const filmMovie = {
  title: 'The Thing',
  year: '1982',
  rated: 'R',
  runtime: '109 min',
  genre: 'Horror',
  director: 'John Carpenter',
  actors: 'Kurt Russell',
  plot: 'shape-shifting alien',
  imdbRating: '8.2',
  poster: '',
};

describe('BroadcastEmail', () => {
  it('paid ZVC → buy-tickets CTA, with film details + unsubscribe', async () => {
    const html = await render(
      <BroadcastEmail
        kind="announcement"
        eventType="zvc"
        paid
        headerImage="https://cdn.test/header.png"
        eventName="The Thing"
        eventDate="2026-08-15T23:00:00.000Z"
        eventLocation="SingleCut"
        eventUrl="https://zerovisioncinema.com/events/1"
        movie={filmMovie}
      />,
      { pretty: true }
    );
    expect(html).toContain('Get Tickets');
    expect(html).toContain('John Carpenter'); // film details
    expect(html).toContain('shape-shifting'); // plot
    expect(html).toContain('Unsubscribe');
    expect(html).toContain('RESEND_UNSUBSCRIBE_URL');
    expect(html).not.toContain('RSVP');
  });

  it('free ZVC ($0) → no CTA at all, still shows film details', async () => {
    const html = await render(
      <BroadcastEmail
        kind="announcement"
        eventType="zvc"
        paid={false}
        headerImage="https://cdn.test/header.png"
        eventName="The Thing"
        eventDate="2026-08-15T23:00:00.000Z"
        eventLocation="SingleCut"
        eventUrl="https://zerovisioncinema.com/events/1"
        movie={filmMovie}
      />,
      { pretty: true }
    );
    expect(html).not.toContain('Get Tickets');
    expect(html).not.toContain('RSVP');
    expect(html).toContain('free'); // free-screening blurb
    expect(html).toContain('John Carpenter'); // film details still shown
  });

  it('free AHC → no CTA, no buy language, no film details when movie is null', async () => {
    const html = await render(
      <BroadcastEmail
        kind="reminder"
        eventType="ahc"
        paid={false}
        headerImage="https://cdn.test/header.png"
        eventName="Astoria Horror Club"
        eventDate="2026-08-15T23:00:00.000Z"
        eventLocation="The Back Room"
        eventUrl="https://zerovisioncinema.com/astoriahorrorclub"
        movie={null}
      />,
      { pretty: true }
    );
    expect(html).not.toContain('Get Tickets');
    expect(html).not.toContain('RSVP');
    // null movie → the preview default (Terminator 2) must NOT leak in.
    expect(html).not.toContain('James Cameron');
    expect(html).not.toContain('About the Film');
  });

  it('book club → "About the Book" with Open Library details, not film, no CTA', async () => {
    const html = await render(
      <BroadcastEmail
        kind="announcement"
        eventType="bookclub"
        paid={false}
        headerImage="https://cdn.test/header.png"
        eventName="The Shining — Book Club"
        eventDate="2026-08-15T23:00:00.000Z"
        eventLocation="The Back Room"
        eventUrl="https://zerovisioncinema.com/astoriahorrorclub"
        movie={null}
        book={{
          title: 'The Shining',
          author: 'Stephen King',
          cover: 'https://covers.test/shining.jpg',
          description: 'A haunted-hotel caretaker slowly loses his mind.',
        }}
      />,
      { pretty: true }
    );
    expect(html).toContain('About the Book');
    expect(html).toContain('Stephen King');
    expect(html).toContain('haunted-hotel');
    expect(html).not.toContain('About the Film');
    expect(html).not.toContain('Get Tickets');
  });
});
