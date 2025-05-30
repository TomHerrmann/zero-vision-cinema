// app/api/events/route.ts
import Stripe from 'stripe';
import { NextRequest } from 'next/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const _f13 = {
  title: 'Friday the 13th 45th Anniversary Screening',
  description:
    'Zero Vision Cinema presents a 45th anniversary screening of the slasher classic "Friday the 13th". The film started a trend of copycat summer camp horror movies, and maybe it was a copycat itself.',
  paymentLink: 'https://buy.stripe.com/3cI14n4NefCbdmBgVSfIs01',
  imageSrc: '@/public/_DELETE_f13.svg',
  datetime: new Date(2025, 5, 13, 21, 30, 0),
  location: 'Grove 34',
};

const _28dl = {
  title: '28 Days Later Screening',
  description:
    'Zero Vision Cinema presents one of the definitive horror films of the last 25 years. “28 Days Later” explores the darker side of human nature in a post apocalyptic world. See how Director Danny Boyle (Trainspotting, Slumdog Millionaire) and writer Alex Garland (Ex Machina, Annihilation) redefined zombie films before seeing the duo return for the upcoming “28 Years Later”.',
  paymentLink: 'https://buy.stripe.com/5kQdR9gvWfCb5U96hefIs00',
  imageSrc: '@/public/_DELETE_28dl.svg',
  datetime: new Date(2025, 5, 4, 19, 0, 0),
  location: 'Single Cut',
};

export async function GET(req: NextRequest) {
  try {
    const events = [_28dl, _f13];

    return Response.json(events);
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
