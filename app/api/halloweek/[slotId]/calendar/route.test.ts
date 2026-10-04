import { describe, it, expect } from 'vitest';
import { GET } from './route';

const call = (slotId: string, query = '') =>
  GET(
    new Request(`http://localhost/api/halloweek/${slotId}/calendar${query}`),
    { params: Promise.resolve({ slotId }) }
  );

describe('GET /api/halloweek/[slotId]/calendar', () => {
  it('serves a two hour .ics for a lineup slot', async () => {
    const res = await call('scary-streets');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/calendar');
    const ics = await res.text();
    // Sat Oct 24 2026, 7:00–9:00pm EDT.
    expect(ics).toContain('DTSTART:20261024T230000Z');
    expect(ics).toContain('DTEND:20261025T010000Z');
    expect(ics).toContain('UID:event-halloweek2026-scary-streets@');
    expect(ics).toContain('33-07 Ditmars Blvd');
  });

  it('redirects to Google Calendar with ?format=google', async () => {
    const res = await call('scary-streets', '?format=google');
    expect(res.status).toBe(302);
    const google = new URL(res.headers.get('location')!);
    expect(google.searchParams.get('dates')).toBe(
      '20261024T230000Z/20261025T010000Z'
    );
  });

  it('404s an unknown slot', async () => {
    expect((await call('nope')).status).toBe(404);
  });
});
