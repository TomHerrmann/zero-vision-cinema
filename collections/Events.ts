import { CollectionConfig, CollectionSlug } from 'payload';
import { formatEventDescription } from '../utils/formatDate';
import { ZVC_SITE_URL } from '../app/contsants/constants';
import { logtail } from '@/lib/logtail';
import { stripe } from '@/lib/stripe';
import { fetchMovieDataByImdbId } from '@/lib/omdb';
import {
  searchBookByTitleAuthor,
  fetchBookDataByOpenLibraryId,
} from '@/lib/openlibrary';
import { plotToLexical, richTextIsBlank } from '@/utils/omdbFill';
import { Location } from '@/payload-types';

/** Relationship / upload fields come back as an id or a populated doc. */
const relationId = (value: unknown): string | number | undefined => {
  if (value == null) return undefined;
  if (typeof value === 'object') {
    return (value as { id?: string | number }).id;
  }
  return value as string | number;
};

/**
 * Seats a single checkout may buy: what's left in the room, capped at 5, and
 * never below 1 — Stripe rejects an `adjustable_quantity.maximum` under the
 * minimum, which would otherwise make a sold-out event impossible to save.
 */
const seatsPerOrder = (location: Location, ticketsSold: unknown): number => {
  const remaining = Number(location.capacity) - Number(ticketsSold ?? 0);
  if (!Number.isFinite(remaining)) return 5;
  return Math.max(1, Math.min(5, remaining));
};

/** The one place a payment link is built, so create and replace stay identical. */
const createPaymentLink = (priceId: string, maxPerOrder: number) =>
  stripe.paymentLinks.create({
    customer_creation: 'always',
    line_items: [
      {
        price: priceId,
        quantity: 1,
        adjustable_quantity: {
          enabled: true,
          minimum: 1,
          maximum: maxPerOrder,
        },
      },
    ],
  });

/**
 * The `plink_…` id of an event's payment link.
 *
 * `paymentLink` stores the customer-facing URL, whose last path segment is a
 * short code — *not* the payment link's id, so it cannot be passed to the API.
 * Events created before `paymentLinkId` existed have only the URL, so fall back
 * to finding the link by URL and record the id for next time.
 */
const resolvePaymentLinkId = async (data: {
  paymentLink?: string | null;
  paymentLinkId?: string | null;
}): Promise<string> => {
  if (data.paymentLinkId?.startsWith('plink_')) return data.paymentLinkId;

  for await (const link of stripe.paymentLinks.list({ limit: 100 })) {
    if (link.url === data.paymentLink) {
      data.paymentLinkId = link.id;
      return link.id;
    }
  }

  throw new Error(`No Stripe payment link found for ${data.paymentLink}`);
};

export const Events: CollectionConfig = {
  slug: 'events',
  admin: {
    useAsTitle: 'name',
  },
  versions: {
    drafts: true,
  },
  hooks: {
    // Runs before field validation (so it can satisfy `required: name`) and
    // before the Stripe `beforeChange` hook below (which reads the final name).
    beforeValidate: [
      async ({ data }) => {
        if (!data) return data;

        // AHC and Book Club events are always free.
        if (data.eventType === 'ahc' || data.eventType === 'bookclub') {
          data.price = 0;
        }

        const needsName = !data.name;
        const needsDescription = richTextIsBlank(data.description);

        if (data.eventType === 'bookclub') {
          // Resolve the Open Library work id (if not already set by the admin
          // field's on-blur lookup), then fill name / description from the book.
          if (!data.openLibraryId && data.bookTitle && data.bookAuthor) {
            const match = await searchBookByTitleAuthor(
              data.bookTitle,
              data.bookAuthor
            );
            if (match) data.openLibraryId = match.workId;
          }
          if (needsName && data.bookTitle) {
            data.name = data.bookAuthor
              ? `${data.bookTitle} — ${data.bookAuthor}`
              : data.bookTitle;
          }
          if (needsDescription && data.openLibraryId) {
            const book = await fetchBookDataByOpenLibraryId(data.openLibraryId);
            if (book?.description)
              data.description = plotToLexical(book.description);
          }
          return data;
        }

        // Movie types (zvc/ahc): fill name/description from OMDB when blank. The
        // admin IMDb field also fills name live on blur, but a richText editor
        // ignores programmatic values, so description is filled here on save.
        // (AHC hides its description field, so only fill it for zvc.)
        const needsMovieDescription =
          data.eventType !== 'ahc' && needsDescription;
        if ((needsName || needsMovieDescription) && data.imdbId) {
          const movie = await fetchMovieDataByImdbId(data.imdbId);
          if (movie) {
            if (needsName && movie.title) {
              data.name = movie.year
                ? `${movie.title} (${movie.year})`
                : movie.title;
            }
            if (needsMovieDescription && movie.plot) {
              data.description = plotToLexical(movie.plot);
            }
          }
        }

        return data;
      },
    ],
    beforeChange: [
      async ({ context, data, req }) => {
        if (!(Number(data.price) > 0)) return data;

        // Seat-count writes (`ticketsSold`) come from the Stripe webhook, which
        // sets this flag. Nothing Stripe mirrors changes on those writes, so
        // re-syncing only adds a way for fulfillment to fail: an event whose
        // payment link no longer exists in Stripe makes the throw below abort
        // the webhook mid-fulfillment, stranding the buyer's ticket email.
        if (context?.skipStripeSync) return data;

        try {
          // Relationship / upload fields arrive as an id from the admin UI but
          // as a populated doc from some API writes — accept either.
          const imageId = relationId(data.image);
          const locationId = relationId(data.location);

          // Get the full image URL if an image is attached
          let imageUrl;
          if (imageId) {
            const mediaDoc = await req.payload.findByID({
              collection: 'media',
              id: imageId,
            });
            // Use the ZVC_SITE_URL constant for the full URL
            imageUrl = `${ZVC_SITE_URL}${mediaDoc.url}`;
          }

          // Get the full location document
          if (locationId == null) {
            throw new Error('Location not found or missing name');
          }
          const locationDoc = (await req.payload.findByID({
            collection: 'locations' as CollectionSlug,
            id: locationId,
          })) as Location;

          if (!locationDoc) {
            throw new Error('Location not found or missing name');
          }

          const formattedDescription = formatEventDescription(
            data.datetime,
            data.description,
            { name: locationDoc.name as string }
          );

          const maxPerOrder = seatsPerOrder(locationDoc, data.ticketsSold);

          // Check if we already have a Stripe payment link
          if (data.paymentLink) {
            // The stored product/price ids are the cheap path. Only fall back to
            // reading them off the payment link (which costs a lookup of the
            // link's id, see resolvePaymentLinkId) when one is missing.
            let productId = data.productId as string | undefined;
            let priceId = data.priceId as string | undefined;

            if (!productId || !priceId) {
              const paymentLinkId = await resolvePaymentLinkId(data);
              // `line_items` is an expandable field: without `expand` Stripe
              // omits it entirely, so never read it off a bare retrieve.
              const paymentLink = await stripe.paymentLinks.retrieve(
                paymentLinkId,
                { expand: ['line_items'] }
              );

              const lineItem = paymentLink.line_items?.data?.[0];
              if (!lineItem) {
                throw new Error('No line items found in payment link');
              }
              priceId = lineItem.price?.id;
              if (!priceId) {
                throw new Error('No price ID found in line item');
              }

              const linkPrice = await stripe.prices.retrieve(priceId);
              productId =
                typeof linkPrice.product === 'string'
                  ? linkPrice.product
                  : linkPrice.product.id;
              if (!productId) {
                throw new Error('No product ID found in price');
              }
              data.productId = productId;
            }

            data.priceId = priceId;

            await stripe.products.update(productId, {
              name: data.name,
              description: formattedDescription,
              images: imageUrl ? [imageUrl] : undefined,
            });

            const price = await stripe.prices.retrieve(priceId);

            if (Math.round(data.price * 100) !== price.unit_amount) {
              // A payment link's price cannot be changed: Stripe's update only
              // accepts `quantity` / `adjustable_quantity` on an existing line
              // item and rejects a new `price` outright ("You may only specify
              // one of these parameters: id, price"). So a price change means a
              // replacement link, and the event's URL changes with it.
              const previousLink = {
                paymentLink: data.paymentLink as string,
                paymentLinkId: data.paymentLinkId as string | null,
              };

              const newPrice = await stripe.prices.create({
                product: productId,
                currency: 'usd',
                unit_amount: Math.round(data.price * 100),
              });

              // Create before deactivating: if this throws, the event keeps a
              // link that still sells, just at the old price.
              const newLink = await createPaymentLink(newPrice.id, maxPerOrder);

              data.paymentLink = newLink.url;
              data.paymentLinkId = newLink.id;
              data.priceId = newPrice.id;

              // The old URL is already out in announcement emails, so retire it
              // rather than leave it selling the old amount. Best-effort: the
              // event is correct either way, and failing the save here would
              // leave the admin with no way to change a price at all.
              try {
                const oldLinkId = await resolvePaymentLinkId(previousLink);
                await stripe.paymentLinks.update(oldLinkId, { active: false });
              } catch (deactivateErr) {
                await logtail.error(
                  `Could not deactivate the superseded Stripe payment link ${previousLink.paymentLink}: ${deactivateErr}`,
                  { method: 'POST', timestamp: new Date().toISOString() }
                );
              }
            }
          } else {
            // Create new Stripe product, price and payment link
            const product = await stripe.products.create({
              name: data.name,
              description: formattedDescription,
              images: imageUrl ? [imageUrl] : undefined,
            });

            const price = await stripe.prices.create({
              product: product.id,
              currency: 'usd',
              unit_amount: Math.round(data.price * 100),
            });

            const paymentLink = await createPaymentLink(price.id, maxPerOrder);

            data.productId = product.id;
            data.paymentLink = paymentLink.url;
            data.paymentLinkId = paymentLink.id;
            data.priceId = price.id;
          }
        } catch (err) {
          await logtail.error(
            `Event creation error handling Stripe payment link: ${err}`,
            {
              method: 'POST',
              timestamp: new Date().toISOString(),
            }
          );
          // A paid event with no Stripe priceId/productId is unpurchasable on
          // the site, so fail the save loudly rather than silently persisting a
          // broken event. The admin sees the error and can retry.
          throw new Error(
            `Could not set up Stripe checkout for this event: ${
              err instanceof Error ? err.message : String(err)
            }`
          );
        }
        return data;
      },
    ],
    // No broadcast hooks: the daily send-due-broadcasts task queries by date
    // each morning, so moving an event's date, unpublishing it, or deleting it
    // needs no reconciliation here — the next run simply sees current data.
  },
  fields: [
    {
      name: 'eventType',
      type: 'select',
      required: true,
      defaultValue: 'zvc',
      options: [
        { label: 'Zero Vision Cinema', value: 'zvc' },
        { label: 'Astoria Horror Club', value: 'ahc' },
        { label: 'Astoria Horror Book Club', value: 'bookclub' },
      ],
      admin: {
        description:
          'ZVC = paid screening (full fields). AHC = free movie event. Book Club = free event driven by a book title + author.',
      },
    },
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: {
        description:
          'Optional — leave blank to auto-fill from the movie ("Title (Year)") or book ("Title — Author").',
      },
    },
    {
      name: 'imdbId',
      type: 'text',
      label: 'IMDb ID',
      admin: {
        condition: (data) => data.eventType !== 'bookclub',
        description:
          'Found on the IMDb movie URL — e.g. tt0082418. On blur the name auto-fills; description fills on save; the poster shows from OMDB (not stored). All editable.',
        components: {
          Field: '/collections/components/ImdbLookupField#ImdbLookupField',
        },
      },
    },
    {
      name: 'bookTitle',
      type: 'text',
      label: 'Book Title',
      admin: {
        condition: (data) => data.eventType === 'bookclub',
        description:
          'When both title and author are filled, the book is looked up on Open Library as you leave the field.',
        components: {
          Field: '/collections/components/BookLookupField#BookLookupField',
        },
      },
    },
    {
      name: 'bookAuthor',
      type: 'text',
      label: 'Book Author',
      admin: {
        condition: (data) => data.eventType === 'bookclub',
        components: {
          Field: '/collections/components/BookLookupField#BookLookupField',
        },
      },
    },
    {
      name: 'openLibraryId',
      type: 'text',
      label: 'Open Library ID',
      admin: {
        readOnly: true,
        condition: (data) =>
          data.eventType === 'bookclub' && Boolean(data.openLibraryId),
        description:
          'Set automatically from the book lookup — used to fetch the cover and summary.',
      },
    },
    {
      name: 'description',
      type: 'richText',
      admin: {
        condition: (data) => data.eventType !== 'ahc',
        description:
          'Optional. If left blank and an IMDb ID is set, the OMDB summary is used.',
      },
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      admin: {
        condition: (data) => data.eventType === 'zvc',
        description:
          'Optional. If left blank and an IMDb ID is set, the OMDB poster is used.',
      },
    },
    {
      name: 'price',
      type: 'number',
      required: true,
      defaultValue: 13,
      admin: {
        // Only ZVC events are paid — AHC / Book Club are forced to 0 on save.
        condition: (data) => data.eventType === 'zvc',
      },
    },
    {
      name: 'location',
      type: 'relationship',
      relationTo: 'locations' as CollectionSlug,
      required: true,
    },
    {
      name: 'datetime',
      type: 'date',
      required: true,
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'paymentLink',
      type: 'text',
      label: 'Stripe Payment Link',
      required: false,
      unique: true,
      admin: {
        readOnly: true,
        condition: (data) => Boolean(data.paymentLink),
        description:
          'This link is automatically generated when the event is published',
      },
    },
    {
      name: 'paymentLinkId',
      type: 'text',
      label: 'Stripe Payment Link ID',
      required: false,
      unique: true,
      admin: {
        readOnly: true,
        condition: (data) => Boolean(data.paymentLinkId),
        description:
          'The `plink_…` id behind the link above — the URL alone cannot be used with the Stripe API',
      },
    },
    {
      name: 'productId',
      type: 'text',
      label: 'Stripe Product ID',
      required: false,
      unique: true,
      admin: {
        readOnly: true,
        condition: (data) => Boolean(data.paymentLink),
        description:
          'This id is automatically generated when the event is published',
      },
    },
    {
      name: 'priceId',
      type: 'text',
      label: 'Stripe Price ID',
      required: false,
      unique: true,
      admin: {
        readOnly: true,
        condition: (data) => Boolean(data.paymentLink),
        description:
          'This id is automatically generated when the event is published',
      },
    },
    {
      name: 'ticketsSold',
      type: 'number',
      defaultValue: 0,
      admin: { readOnly: true },
    },
    // Announcement (−6d) + reminder (day-of) broadcast state. The daily
    // send-due-broadcasts task decides what's due by date each morning, so these
    // stamps are the only thing preventing a repeat send — nothing else tracks
    // whether an event's broadcast already went out.
    {
      name: 'announcementSentAt',
      type: 'date',
      required: false,
      admin: { readOnly: true, position: 'sidebar' },
    },
    {
      name: 'reminderSentAt',
      type: 'date',
      required: false,
      admin: { readOnly: true, position: 'sidebar' },
    },
  ],
};
