/**
 * Sample props for local email QA — shared by the `email dev` preview wrappers
 * in this folder and by `scripts/preview-emails.tsx` (send-to-inbox). This data
 * is dev-only and never used by a production send (the real senders pass live
 * order/event/Stripe data). Keep it realistic so previews reflect production.
 */
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';
import type { MovieData } from '@/lib/omdb';
import {
  EMAIL_HEADER_IMAGE_ZVC_URL,
  EMAIL_HEADER_IMAGE_BOOKCLUB_URL,
  ZVC_SITE_URL,
  AHC_SITE_URL,
} from '@/app/contsants/constants';

/** Minimal valid Lexical rich-text state wrapping a single paragraph. */
export function sampleRichText(text: string): SerializedEditorState {
  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      direction: 'ltr',
      children: [
        {
          type: 'paragraph',
          format: '',
          indent: 0,
          version: 1,
          direction: 'ltr',
          textFormat: 0,
          children: [
            {
              type: 'text',
              text,
              format: 0,
              style: '',
              mode: 'normal',
              detail: 0,
              version: 1,
            },
          ],
        },
      ],
    },
  } as unknown as SerializedEditorState;
}

const poster = (label: string) =>
  `https://placehold.co/300x450/1F1F1F/FFFDF6/png?text=${encodeURIComponent(label)}`;

export const sampleMovie: MovieData = {
  title: 'The Thing',
  year: '1982',
  rated: 'R',
  runtime: '109 min',
  genre: 'Horror, Mystery, Sci-Fi',
  director: 'John Carpenter',
  actors: 'Kurt Russell, Wilford Brimley, T.K. Carter',
  plot: 'A research team in Antarctica is hunted by a shape-shifting alien that assumes the appearance of its victims.',
  imdbRating: '8.2',
  poster: poster('The Thing'),
};

const EVENT_DATE = '2026-08-19T19:30:00-04:00';
const PURCHASE_DATE = '2026-07-30T14:12:00-04:00';
const REFUND_DATE = '2026-07-31T09:05:00-04:00';

/** TicketEmail — paid ZVC screening receipt. */
export const ticketSample = {
  eventName: 'The Thing (1982)',
  eventImage: sampleMovie.poster,
  eventDate: EVENT_DATE,
  eventLocation: 'The Astoria Vault',
  eventDescription: sampleRichText(
    'A 35mm midnight screening of John Carpenter’s paranoid masterpiece. Doors at 7, feature at 7:30. Beer and popcorn on us.'
  ),
  eventAddress: '34-21 31st Ave, Astoria, NY 11106',
  quantity: 2,
  customerName: 'Ripley Nostromo',
  totalAmount: 20,
  purchaseDate: PURCHASE_DATE,
  orderNumber: 1042,
  cardBrand: 'Visa',
  cardLast4: '4242',
  currency: 'usd',
  receiptUrl: 'https://pay.stripe.com/receipts/sample',
  refundUrl: `${ZVC_SITE_URL}/refund?order=1042&token=sample`,
  movie: sampleMovie,
};

/** RefundEmail — refund confirmation. */
export const refundSample = {
  eventName: 'The Thing (1982)',
  eventDate: EVENT_DATE,
  orderNumber: 1042,
  refundAmount: 20,
  currency: 'usd',
  cardBrand: 'Visa',
  cardLast4: '4242',
  refundDate: REFUND_DATE,
  receiptUrl: 'https://pay.stripe.com/receipts/sample',
};

/** BroadcastEmail — paid ZVC announcement (→ buy tickets). */
export const broadcastPaidSample = {
  kind: 'announcement' as const,
  paid: true,
  headerImage: EMAIL_HEADER_IMAGE_ZVC_URL,
  eventName: 'The Thing (1982)',
  eventImage: sampleMovie.poster,
  eventDate: EVENT_DATE,
  eventLocation: 'The Astoria Vault',
  eventAddress: '34-21 31st Ave, Astoria, NY 11106',
  eventDescription: sampleRichText(
    'A 35mm midnight screening of John Carpenter’s paranoid masterpiece. Limited seating — grab a ticket before it sells out.'
  ),
  movie: sampleMovie,
  book: null,
  eventUrl: `${ZVC_SITE_URL}/events/42`,
  unsubscribeUrl: `${ZVC_SITE_URL}/unsubscribe?sample`,
};

/** BroadcastEmail — free book-club reminder (→ attend; "About the Book"). */
export const broadcastBookClubSample = {
  kind: 'reminder' as const,
  paid: false,
  headerImage: EMAIL_HEADER_IMAGE_BOOKCLUB_URL,
  eventName: 'The Haunting of Hill House — Shirley Jackson',
  eventImage: poster('Hill House'),
  eventDate: EVENT_DATE,
  eventLocation: 'Sunswick 35/35',
  eventAddress: '35-02 35th St, Astoria, NY 11106',
  eventDescription: undefined,
  movie: null,
  book: {
    title: 'The Haunting of Hill House',
    author: 'Shirley Jackson',
    cover: poster('Hill House'),
    description:
      'Four seekers arrive at a notoriously unfriendly pile called Hill House, drawn by its long, troubled history.',
  },
  eventUrl: AHC_SITE_URL,
  unsubscribeUrl: `${ZVC_SITE_URL}/unsubscribe?sample`,
};
