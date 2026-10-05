import { describe, it, expect, vi, beforeEach } from 'vitest';

const h = vi.hoisted(() => ({ add: vi.fn(), setSource: vi.fn() }));

vi.mock('@/lib/resend', () => ({
  addResendContact: h.add,
  setResendContactSource: h.setSource,
}));
vi.mock('@/lib/logtail', () => ({
  logtail: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

import { POST } from './route';

const req = (body: unknown) =>
  new Request('http://localhost/api/subscribe', {
    method: 'POST',
    body: JSON.stringify(body),
  }) as unknown as import('next/server').NextRequest;

beforeEach(() => {
  h.add.mockReset().mockResolvedValue({ id: 'contact_1' });
  h.setSource.mockReset().mockResolvedValue(undefined);
});

describe('POST /api/subscribe', () => {
  it('200s and adds the contact on a valid email', async () => {
    const res = await POST(req({ email: 'fan@example.com' }));
    expect(res.status).toBe(200);
    expect(h.add).toHaveBeenCalledWith({ email: 'fan@example.com' });
  });

  it('500s when the Resend contact create fails (no silent success)', async () => {
    h.add.mockRejectedValue(new Error('Resend contact create failed'));
    const res = await POST(req({ email: 'fan@example.com' }));
    expect(res.status).toBe(500);
    expect((await res.json()).success).toBeUndefined();
  });

  it('rejects an invalid email without calling Resend', async () => {
    const res = await POST(req({ email: 'not-an-email' }));
    expect(res.status).toBe(500);
    expect(h.add).not.toHaveBeenCalled();
  });

  it('tags the contact with the utm source when one is sent', async () => {
    const res = await POST(req({ email: 'fan@example.com', source: 'QR' }));
    expect(res.status).toBe(200);
    expect(h.setSource).toHaveBeenCalledWith('fan@example.com', 'qr');
  });

  it('tags signups with no source as coming from the website', async () => {
    await POST(req({ email: 'fan@example.com' }));
    expect(h.setSource).toHaveBeenCalledWith('fan@example.com', 'website');
  });

  it('rejects a source that is not a short slug', async () => {
    const res = await POST(
      req({ email: 'fan@example.com', source: '<script>' })
    );
    expect(res.status).toBe(500);
    expect(h.add).not.toHaveBeenCalled();
  });
});
