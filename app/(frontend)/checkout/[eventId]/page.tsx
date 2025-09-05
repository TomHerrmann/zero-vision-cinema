import '@/app/(frontend)/globals.css';

import payloadConfig from '@/payload.config';
import { getPayload } from 'payload';
import CheckoutClient from './checkout-client';

type Props = {
  params: { eventId: string };
};

const payload = await getPayload({ config: payloadConfig });

export default async function CheckoutPage({ params }: Props) {
  const { eventId } = await params;

  const event = await payload.findByID({
    collection: 'events',
    id: eventId,
  });

  return <CheckoutClient event={event} />;
}
