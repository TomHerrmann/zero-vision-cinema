import { describe, it, expect } from 'vitest';
import { render } from '@react-email/render';
import WeeklyEmail, { weekRangeLabel, WEEKLY_INTRO } from './WeeklyEmail';
import { weeklySample } from './previews/sample-data';

describe('WeeklyEmail', () => {
  it('renders the header, range, intro, every event and the footer', async () => {
    const html = await render(<WeeklyEmail {...weeklySample} />, { pretty: true });

    expect(html).toContain('emailheader_zvc.png');
    expect(html).toContain('This week at ZVC');
    expect(html).toContain('Nov 8 – Nov 14');
    expect(html).toContain(WEEKLY_INTRO.replace("'", '&#x27;'));
    for (const ev of weeklySample.events) {
      expect(html).toContain(ev.calendarUrl);
    }
    expect(html).toContain('More Events');
    expect(html).toContain('Follow Us');
    expect(html).toContain('Unsubscribe');
    expect(html).toContain('418 Broadway');
  });

  it('gives only paid events a ticket button, and free events a FREE tag', async () => {
    const html = await render(<WeeklyEmail {...weeklySample} />);
    expect(html.match(/Get Tickets/g)).toHaveLength(1);
    expect(html).toContain('https://zerovisioncinema.com/events/42');
    expect(html.match(/>FREE</g)).toHaveLength(3);
    expect(html.match(/Add to Calendar/g)).toHaveLength(4);
  });

  it('prefers the Payload description and falls back to the plot', async () => {
    const html = await render(<WeeklyEmail {...weeklySample} />);
    expect(html).toContain('Bring a friend and a favorite tape.');
    expect(html).toContain('35mm midnight screening');
  });

  it('drops the latest-posts section when neither is passed', async () => {
    const html = await render(
      <WeeklyEmail {...weeklySample} video={null} post={null} />
    );
    expect(html).not.toContain('Latest Video');
    expect(html).not.toContain('Latest Post');
  });

  it('labels a week that crosses months', () => {
    expect(weekRangeLabel('2026-11-29T05:00:00.000Z', '2026-12-05T05:00:00.000Z')).toBe(
      'Nov 29 – Dec 5'
    );
  });
});
