/**
 * Sample props for local email QA — shared by the `email dev` preview wrappers
 * in this folder and by `scripts/preview-emails.tsx` (send-to-inbox). This data
 * is dev-only and never used by a production send (the real senders pass live
 * order/event/Stripe data).
 *
 * The film/book content (plot, poster, rating, cover, synopsis) is REAL data
 * captured from OMDB / Open Library in `fixtures.generated.ts` — regenerate it
 * with `npm run email:fixtures`. The order/event scaffolding (dates, venue,
 * customer) is made-up but realistic.
 */
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';
import {
  EMAIL_HEADER_IMAGE_ZVC_URL,
  EMAIL_HEADER_IMAGE_AHC_URL,
  EMAIL_HEADER_IMAGE_BOOKCLUB_URL,
  ZVC_SITE_URL,
  AHC_SITE_URL,
} from '@/app/contsants/constants';
import { zvcMovie, ahcMovie, bookInfo } from './fixtures.generated';

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

const zvcTitle = `${zvcMovie.title} (${zvcMovie.year})`;
const ahcTitle = `${ahcMovie.title} (${ahcMovie.year})`;
const bookTitle = [bookInfo.title, bookInfo.author].filter(Boolean).join(' — ');

const EVENT_DATE = '2026-08-19T19:30:00-04:00';
const PURCHASE_DATE = '2026-07-30T14:12:00-04:00';
const REFUND_DATE = '2026-07-31T09:05:00-04:00';

/** TicketEmail — paid ZVC screening receipt. */
export const ticketSample = {
  eventName: zvcTitle,
  eventImage: zvcMovie.poster,
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
  movie: zvcMovie,
};

/** RefundEmail — refund confirmation. */
export const refundSample = {
  eventName: zvcTitle,
  eventDate: EVENT_DATE,
  orderNumber: 1042,
  refundAmount: 20,
  currency: 'usd',
  cardBrand: 'Visa',
  cardLast4: '4242',
  refundDate: REFUND_DATE,
  receiptUrl: 'https://pay.stripe.com/receipts/sample',
};

/** BroadcastEmail — paid ZVC announcement (→ "Get Tickets" / About the Film). */
export const broadcastPaidSample = {
  kind: 'announcement' as const,
  eventType: 'zvc' as const,
  paid: true,
  headerImage: EMAIL_HEADER_IMAGE_ZVC_URL,
  eventName: zvcTitle,
  eventImage: zvcMovie.poster,
  eventDate: EVENT_DATE,
  eventLocation: 'The Astoria Vault',
  eventAddress: '34-21 31st Ave, Astoria, NY 11106',
  eventDescription: sampleRichText(
    'A 35mm midnight screening of John Carpenter’s paranoid masterpiece. Limited seating — grab a ticket before it sells out.'
  ),
  movie: zvcMovie,
  book: null,
  eventUrl: `${ZVC_SITE_URL}/events/42`,
};

/** BroadcastEmail — free ZVC screening announcement ($0, no CTA / About the Film). */
export const broadcastZvcFreeSample = {
  kind: 'announcement' as const,
  eventType: 'zvc' as const,
  paid: false,
  headerImage: EMAIL_HEADER_IMAGE_ZVC_URL,
  eventName: zvcTitle,
  eventImage: zvcMovie.poster,
  eventDate: EVENT_DATE,
  eventLocation: 'The Astoria Vault',
  eventAddress: '34-21 31st Ave, Astoria, NY 11106',
  eventDescription: sampleRichText(
    'A special free Zero Vision Cinema screening — open to all, no ticket required. Doors at 7, feature at 7:30.'
  ),
  movie: zvcMovie,
  book: null,
  eventUrl: `${ZVC_SITE_URL}/events/42`,
};

/** BroadcastEmail — free Astoria Horror Club reminder (no CTA / About the Film). */
export const broadcastAhcSample = {
  kind: 'reminder' as const,
  eventType: 'ahc' as const,
  paid: false,
  headerImage: EMAIL_HEADER_IMAGE_AHC_URL,
  eventName: ahcTitle,
  eventImage: ahcMovie.poster,
  eventDate: EVENT_DATE,
  eventLocation: 'Q.E.D. Astoria',
  eventAddress: '27-16 23rd Ave, Astoria, NY 11105',
  eventDescription: sampleRichText(
    'Free monthly horror night with the Astoria Horror Club. No ticket needed — just come hang and watch something scary with us.'
  ),
  movie: ahcMovie,
  book: null,
  eventUrl: AHC_SITE_URL,
};

/** BroadcastEmail — free book-club reminder (no CTA / About the Book). */
export const broadcastBookClubSample = {
  kind: 'reminder' as const,
  eventType: 'bookclub' as const,
  paid: false,
  headerImage: EMAIL_HEADER_IMAGE_BOOKCLUB_URL,
  eventName: bookTitle,
  eventImage: bookInfo.cover,
  eventDate: EVENT_DATE,
  eventLocation: 'Sunswick 35/35',
  eventAddress: '35-02 35th St, Astoria, NY 11106',
  eventDescription: undefined,
  movie: null,
  book: bookInfo,
  eventUrl: AHC_SITE_URL,
};
