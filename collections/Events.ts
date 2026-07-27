import { CollectionConfig, CollectionSlug } from 'payload';
import { formatEventDescription } from '../utils/formatDate';
import { ZVC_SITE_URL } from '../app/contsants/constants';
import { logtail } from '@/lib/logtail';
import { stripe } from '@/lib/stripe';
import { fetchMovieDataByImdbId } from '@/lib/omdb';
import { plotToLexical, richTextIsBlank } from '@/utils/omdbFill';

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

        // Astoria Horror Club events are always free.
        if (data.eventType === 'ahc') {
          data.price = 0;
          data.ticketLimit = null;
        }

        // Fill name/description from OMDB when left blank. (The admin IMDb field
        // also fills name + image live on blur, but a richText editor ignores
        // programmatic values, so description is filled here on save.)
        const needsName = !data.name;
        const needsDescription =
          data.eventType !== 'ahc' && richTextIsBlank(data.description);
        if ((needsName || needsDescription) && data.imdbId) {
          const movie = await fetchMovieDataByImdbId(data.imdbId);
          if (movie) {
            if (needsName && movie.title) {
              data.name = movie.year
                ? `${movie.title} (${movie.year})`
                : movie.title;
            }
            if (needsDescription && movie.plot) {
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
          const locationDoc = await req.payload.findByID({
            collection: 'locations' as CollectionSlug,
            id: data.location,
          });

          if (
            !locationDoc ||
            typeof locationDoc !== 'object' ||
            !('name' in locationDoc)
          ) {
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
                      maximum: Math.min(5, data.ticketLimit || 5),
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
                    maximum: Math.min(5, data.ticketLimit || 5),
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
      ],
      admin: {
        description:
          'ZVC = paid screening (full fields). AHC = free Astoria Horror Club event (name/price/media/description not required).',
      },
    },
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: {
        description:
          'Optional when an IMDb ID is set — leave blank to auto-fill "Title (Year)".',
      },
    },
    {
      name: 'imdbId',
      type: 'text',
      label: 'IMDb ID',
      admin: {
        description:
          'Found on the IMDb movie URL — e.g. tt0082418. On blur the name auto-fills; description fills on save; the poster shows from OMDB (not stored). All editable.',
        components: {
          Field: '/collections/components/ImdbLookupField#ImdbLookupField',
        },
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
        condition: (data) => data.eventType !== 'ahc',
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
        // AHC events are always free — price is forced to 0 on save.
        condition: (data) => data.eventType !== 'ahc',
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
      name: 'ticketLimit',
      type: 'number',
      label: 'Number of Tickets Available',
      admin: {
        condition: (data) => Boolean(data.price),
        description:
          'Maximum number of tickets that can be sold for this event',
      },
      validate: (
        value: number | null | undefined,
        { data }: { data: { price?: number } }
      ) => {
        if (data.price && (value === null || value === undefined)) {
          return 'Ticket limit is required for paid events';
        }
        return true;
      },
    },
    {
      name: 'ticketsSold',
      type: 'number',
      defaultValue: 0,
      admin: { readOnly: true },
    },
  ],
};
