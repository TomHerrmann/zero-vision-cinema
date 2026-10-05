import { describe, it, expect, vi, beforeEach } from 'vitest';

const h = vi.hoisted(() => ({
  productsUpdate: vi.fn(),
  productsCreate: vi.fn(),
  pricesRetrieve: vi.fn(),
  pricesCreate: vi.fn(),
  linksRetrieve: vi.fn(),
  linksUpdate: vi.fn(),
  linksCreate: vi.fn(),
  linksList: vi.fn(),
  findByID: vi.fn(),
  logError: vi.fn(),
}));

vi.mock('@/lib/stripe', () => ({
  stripe: {
    products: { update: h.productsUpdate, create: h.productsCreate },
    prices: { retrieve: h.pricesRetrieve, create: h.pricesCreate },
    paymentLinks: {
      retrieve: h.linksRetrieve,
      update: h.linksUpdate,
      create: h.linksCreate,
      list: h.linksList,
    },
  },
}));
vi.mock('@/lib/logtail', () => ({ logtail: { error: h.logError } }));
vi.mock('@/lib/omdb', () => ({ fetchMovieDataByImdbId: vi.fn() }));
vi.mock('@/lib/openlibrary', () => ({
  searchBookByTitleAuthor: vi.fn(),
  fetchBookDataByOpenLibraryId: vi.fn(),
}));

import { Events } from './Events';

const beforeChange = (Events.hooks!.beforeChange as any[])[0];

const LOCATION = { id: 3, name: 'The Bunker', capacity: 40 };

/** A saved, already-published paid event as the admin UI submits it. */
const savedEvent = (overrides: Record<string, unknown> = {}) => ({
  eventType: 'zvc',
  name: 'The Thing (1982)',
  price: 10,
  location: 3,
  datetime: '2026-10-31T23:30:00.000Z',
  paymentLink: 'https://buy.stripe.com/dRm4gz0wYcpZbet0WUfIs0N',
  productId: 'prod_A',
  priceId: 'price_A',
  ticketsSold: 4,
  ...overrides,
});

const run = (
  data: Record<string, unknown>,
  context: Record<string, unknown> = {}
) =>
  beforeChange({
    context,
    data,
    req: { payload: { findByID: h.findByID } },
  });

/** Stripe never returns `line_items` unless the caller expands it. */
const linkWithLineItems = (id: string, priceId: string) => ({
  id,
  url: 'https://buy.stripe.com/dRm4gz0wYcpZbet0WUfIs0N',
  line_items: { data: [{ price: { id: priceId }, quantity: 1 }] },
});

beforeEach(() => {
  vi.clearAllMocks();
  h.findByID.mockResolvedValue(LOCATION);
  h.pricesRetrieve.mockResolvedValue({
    id: 'price_A',
    unit_amount: 1000,
    product: 'prod_A',
  });
  h.linksList.mockReturnValue([
    linkWithLineItems('plink_ABC', 'price_A'),
  ] as any);
  h.linksRetrieve.mockResolvedValue(linkWithLineItems('plink_ABC', 'price_A'));
  h.pricesCreate.mockResolvedValue({ id: 'price_B', unit_amount: 1500 });
  h.productsCreate.mockResolvedValue({ id: 'prod_NEW' });
  h.linksCreate.mockResolvedValue({
    id: 'plink_NEW',
    url: 'https://buy.stripe.com/newlink',
  });
});

describe('Events beforeChange Stripe sync', () => {
  it('saves an edit that leaves the price alone without touching the payment link', async () => {
    const data = await run(
      savedEvent({ datetime: '2026-11-01T23:30:00.000Z' })
    );

    expect(h.productsUpdate).toHaveBeenCalledWith('prod_A', expect.anything());
    expect(h.pricesCreate).not.toHaveBeenCalled();
    expect(h.linksUpdate).not.toHaveBeenCalled();
    expect(data.priceId).toBe('price_A');
  });

  it('replaces the payment link when the price changes', async () => {
    const data = await run(savedEvent({ price: 15 }));

    expect(h.pricesCreate).toHaveBeenCalledWith({
      product: 'prod_A',
      currency: 'usd',
      unit_amount: 1500,
    });
    // Stripe rejects a new `price` on paymentLinks.update, so the link is
    // rebuilt rather than edited.
    expect(h.linksCreate).toHaveBeenCalled();
    expect(data.paymentLink).toBe('https://buy.stripe.com/newlink');
    expect(data.paymentLinkId).toBe('plink_NEW');
    expect(data.priceId).toBe('price_B');
  });

  it('retires the superseded link by its plink id, not the slug in its URL', async () => {
    await run(savedEvent({ price: 15 }));

    expect(h.linksUpdate).toHaveBeenCalledWith('plink_ABC', { active: false });
    const [linkId] = h.linksUpdate.mock.calls[0];
    expect(linkId).not.toContain('dRm4gz');
  });

  it('creates the replacement before retiring the old link', async () => {
    await run(savedEvent({ price: 15 }));

    expect(h.linksCreate.mock.invocationCallOrder[0]).toBeLessThan(
      h.linksUpdate.mock.invocationCallOrder[0]
    );
  });

  it('still saves when the superseded link cannot be retired', async () => {
    h.linksList.mockReturnValue([] as any);

    const data = await run(savedEvent({ price: 15 }));

    expect(data.paymentLink).toBe('https://buy.stripe.com/newlink');
    expect(data.priceId).toBe('price_B');
    expect(h.logError).toHaveBeenCalled();
  });

  it('reuses a stored paymentLinkId instead of listing every link', async () => {
    await run(savedEvent({ price: 15, paymentLinkId: 'plink_STORED' }));

    expect(h.linksList).not.toHaveBeenCalled();
    expect(h.linksUpdate).toHaveBeenCalledWith('plink_STORED', {
      active: false,
    });
  });

  it('expands line_items when it has to read ids off the link', async () => {
    await run(savedEvent({ productId: null, priceId: null }));

    expect(h.linksRetrieve).toHaveBeenCalledWith('plink_ABC', {
      expand: ['line_items'],
    });
  });

  it('caps seats per order at the seats actually left, never below 1', async () => {
    await run(savedEvent({ price: 15, ticketsSold: 40 }));

    const [params] = h.linksCreate.mock.calls[0];
    expect(params.line_items[0].adjustable_quantity.maximum).toBe(1);
  });

  it('stores the new link id when creating an event', async () => {
    const data = await run(
      savedEvent({ paymentLink: null, productId: null, priceId: null })
    );

    expect(data.paymentLinkId).toBe('plink_NEW');
    expect(data.paymentLink).toBe('https://buy.stripe.com/newlink');
    expect(data.priceId).toBe('price_B');
  });

  it('skips the sync entirely for free events and webhook seat writes', async () => {
    await run(savedEvent({ price: 0 }));
    await run(savedEvent(), { skipStripeSync: true });

    expect(h.productsUpdate).not.toHaveBeenCalled();
    expect(h.linksList).not.toHaveBeenCalled();
  });
});
