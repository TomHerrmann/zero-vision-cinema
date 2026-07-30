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
import { rescheduleEventBroadcasts } from '@/lib/broadcasts';
import { Location } from '@/payload-types';

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
      async ({ data, req }) => {
        if (!(Number(data.price) > 0)) return data;

        try {
          // Get the full image URL if an image is attached
          let imageUrl;
          if (data.image) {
            const mediaDoc = await req.payload.findByID({
              collection: 'media',
              id: data.image,
            });
            // Use the ZVC_SITE_URL constant for the full URL
            imageUrl = `${ZVC_SITE_URL}${mediaDoc.url}`;
          }

          // Get the full location document
          const locationDoc = (await req.payload.findByID({
            collection: 'locations' as CollectionSlug,
            id: data.location,
          })) as Location;

          if (!locationDoc) {
            throw new Error('Location not found or missing name');
          }

          const formattedDescription = formatEventDescription(
            data.datetime,
            data.description,
            { name: locationDoc.name as string }
          );

          // Check if we already have a Stripe payment link
          if (data.paymentLink) {
            const paymentLinkId = data.paymentLink.split('/').pop() || '';
            const paymentLink =
              await stripe.paymentLinks.retrieve(paymentLinkId);

            const lineItems = paymentLink.line_items?.data || [];
            if (lineItems.length === 0) {
              throw new Error('No line items found in payment link');
            }

            const lineItem = lineItems[0] as {
              price: { id: string };
              quantity: number;
            };
            const priceId = lineItem.price?.id;
            if (!priceId) {
              throw new Error('No price ID found in line item');
            }

            data.priceId = priceId;

            const price = await stripe.prices.retrieve(priceId);
            const productId =
              typeof price.product === 'string'
                ? price.product
                : price.product.id;
            if (!productId) {
              throw new Error('No product ID found in price');
            }

            await stripe.products.update(productId, {
              name: data.name,
              description: formattedDescription,
              images: imageUrl ? [imageUrl] : undefined,
            });

            if (Math.round(data.price * 100) !== price.unit_amount) {
              const newPrice = await stripe.prices.create({
                product: productId,
                currency: 'usd',
                unit_amount: Math.round(data.price * 100),
              });

              await stripe.paymentLinks.update(paymentLinkId, {
                customer_creation: 'always',
                line_items: [
                  {
                    price: newPrice.id,
                    quantity: 1,
                    adjustable_quantity: {
                      enabled: true,
                      minimum: 1,
                      maximum: Math.min(
                        5,
                        locationDoc.capacity - data.ticketsSold || 5
                      ),
                    },
                  } as any,
                ],
              });
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

            const paymentLink = await stripe.paymentLinks.create({
              customer_creation: 'always',
              line_items: [
                {
                  price: price.id,
                  quantity: 1,
                  adjustable_quantity: {
                    enabled: true,
                    minimum: 1,
                    maximum: Math.min(
                      5,
                      data.location.capacity - data.ticketsSold
                    ),
                  },
                },
              ],
            });

            data.productId = product.id;
            data.paymentLink = paymentLink.url;
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
        }
        return data;
      },
    ],
    afterChange: [
      async ({ doc, previousDoc, operation, req }) => {
        // Schedule/reschedule the announcement + reminder broadcasts (all event
        // types) when the event is published, its date moves, or it's
        // unpublished. `skipBroadcastReschedule` guards the internal message-id
        // write below from recursing.
        const dateChanged = previousDoc?.datetime !== doc.datetime;
        const statusChanged = previousDoc?._status !== doc._status;
        if (
          !req.context?.skipBroadcastReschedule &&
          (operation === 'create' || dateChanged || statusChanged)
        ) {
          try {
            await rescheduleEventBroadcasts(req.payload, doc);
          } catch (err) {
            await logtail.error(
              `Events afterChange: failed to (re)schedule broadcasts for event ${doc.id}: ${err}`
            );
          }
        }
        return doc;
      },
    ],
    afterDelete: [
      async ({ doc, req }) => {
        try {
          await rescheduleEventBroadcasts(req.payload, doc, {
            cancelOnly: true,
          });
        } catch (err) {
          await logtail.error(
            `Events afterDelete: failed to cancel broadcasts for event ${doc.id}: ${err}`
          );
        }
        return doc;
      },
    ],
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
      defaultValue: 10,
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
    // Announcement (−6d) + reminder (day-of) broadcast state. Message ids are the
    // scheduled QStash messages (for cancel/reschedule); *SentAt are the
    // idempotency guards. Managed by lib/broadcasts + the send-broadcast task.
    {
      name: 'announcementMessageId',
      type: 'text',
      required: false,
      admin: { readOnly: true, position: 'sidebar' },
    },
    {
      name: 'reminderMessageId',
      type: 'text',
      required: false,
      admin: { readOnly: true, position: 'sidebar' },
    },
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
