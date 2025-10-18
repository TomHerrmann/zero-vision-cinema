import EventDetails from '@/components/event-details/event-details';
import CheckoutElement from './checkout-element';
import { getEventById } from '@/utils/getEvents';
import '../../globals.css';

interface CheckoutProps {
  params: {
    eventId: string;
  };
}

export default async function CheckoutPage({ params }: CheckoutProps) {
  await params;
  const event = await getEventById(params.eventId);
  return (
    <div>
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="w-full">
          <EventDetails {...event} />
        </div>

        <div className="w-full">
          <CheckoutElement {...event} />
        </div>
      </div>
    </div>
  );
}
