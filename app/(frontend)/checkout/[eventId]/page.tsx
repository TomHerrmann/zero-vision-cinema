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
    <div className="min-h-screen py-8 md:py-12 px-4 md:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8 md:mb-12">
          <h1 className="font-rubik-glitch text-2xl md:text-3xl lg:text-4xl leading-none mb-2 tracking-tight bg-gradient-to-b from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(255,255,255,0.08)]">
            CHECKOUT
          </h1>
          <p className="text-foreground/60 text-sm md:text-base">
            Complete your ticket purchase below
          </p>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 lg:gap-10">
          <div className="w-full">
            <EventDetails {...event} />
          </div>

          <div className="w-full">
            <CheckoutElement {...event} />
          </div>
        </div>
      </div>
    </div>
  );
}
