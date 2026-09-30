import { describe, it, expect } from 'vitest';
import { render } from '@react-email/render';
import CustomBroadcastEmail, {
  emailImageWidth,
  CONTENT_WIDTH,
} from './CustomBroadcastEmail';
import { customBroadcastSample } from './previews/sample-data';

describe('emailImageWidth', () => {
  it('fills the column for a wide image, without exceeding it', () => {
    expect(emailImageWidth(2400, 800)).toBe(CONTENT_WIDTH);
    expect(emailImageWidth(1000, 1000)).toBe(CONTENT_WIDTH);
  });

  it('holds a portrait image narrower', () => {
    expect(emailImageWidth(2000, 3000)).toBe(360);
  });

  it('never scales a small image up', () => {
    expect(emailImageWidth(120, 120)).toBe(120);
    expect(emailImageWidth(200, 600)).toBe(200);
  });

  it('falls back to the full column when dimensions are unknown', () => {
    expect(emailImageWidth(null, null)).toBe(CONTENT_WIDTH);
    expect(emailImageWidth(undefined, 400)).toBe(CONTENT_WIDTH);
  });
});

describe('CustomBroadcastEmail', () => {
  it('renders heading, sized images, styled body links, CTA and unsubscribe', async () => {
    const html = await render(
      <CustomBroadcastEmail {...customBroadcastSample} />,
      { pretty: true }
    );

    expect(html).toContain('Seven nights. Seven screenings.');
    expect(html).toContain('emailheader_zvc.png');

    // One width per image shape: wide → column, portrait → its own 300, small → 120.
    expect(html).toContain('width="544"');
    expect(html).toContain('width="300"');
    expect(html).toContain('width="120"');
    expect(html).toContain('max-width:120px');
    // Nothing fixes a height, so nothing can be cropped or stretched.
    expect(html).not.toMatch(/<img[^>]*\sheight="/);
    expect(html).toContain('height:auto');

    // Body link keeps its href and gets an inline colour.
    expect(html).toMatch(
      /<a[^>]*href="https:\/\/zerovisioncinema\.com\/events"[^>]*color:#4A8CC6/
    );
    expect(html).toContain('See the whole lineup');
    expect(html).toContain('<li');

    expect(html).toContain('See the lineup'); // CTA
    expect(html).toContain('Unsubscribe');
    expect(html).toContain('RESEND_UNSUBSCRIBE_URL');
  });

  it('renders no button without a CTA, and falls back to the subject as headline', async () => {
    const html = await render(
      <CustomBroadcastEmail
        subject="Just a note"
        body={customBroadcastSample.body}
        cta={null}
      />
    );
    expect(html).not.toContain('See the lineup');
    expect(html).toMatch(/<h1[^>]*>Just a note<\/h1>/);
  });
});
