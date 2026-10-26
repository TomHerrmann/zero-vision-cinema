import { describe, it, expect } from 'vitest';
import { calendarSubscribeLinks } from './calendarSubscribe';

describe('calendarSubscribeLinks', () => {
  const links = calendarSubscribeLinks('https://zerovisioncinema.com/calendar.ics');

  it('subscribes Apple Calendar with a webcal link', () => {
    expect(links.apple).toBe('webcal://zerovisioncinema.com/calendar.ics');
  });

  it('opens Google and Outlook add-by-URL pages with the feed', () => {
    expect(new URL(links.google).searchParams.get('cid')).toBe(
      'webcal://zerovisioncinema.com/calendar.ics'
    );
    const outlook = new URL(links.outlook);
    expect(outlook.searchParams.get('url')).toBe(
      'https://zerovisioncinema.com/calendar.ics'
    );
    expect(outlook.searchParams.get('name')).toBe('Zero Vision Cinema Events');
  });
});
