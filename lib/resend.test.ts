import { describe, it, expect, vi, beforeEach } from 'vitest';

const h = vi.hoisted(() => ({
  create: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}));

vi.mock('resend', () => ({
  Resend: class {
    contacts = { create: h.create, update: vi.fn() };
  },
}));
vi.mock('./logtail', () => ({
  logtail: { warn: h.warn, error: h.error, info: vi.fn() },
}));

import { addResendContact } from './resend';

const email = 'fan@example.com';

beforeEach(() => {
  vi.clearAllMocks();
  process.env.RESEND_SEGMENT_ID = 'seg_1';
  process.env.RESEND_TOPIC_ID_WEEKLY = 'topic_weekly';
});

describe('addResendContact', () => {
  it('opts the contact in to the weekly topic only', async () => {
    h.create.mockResolvedValue({ data: { id: 'c1' }, error: null });

    await addResendContact({ email });

    expect(h.create).toHaveBeenCalledTimes(1);
    expect(h.create.mock.calls[0][0].topics).toEqual([
      { id: 'topic_weekly', subscription: 'opt_in' },
    ]);
  });

  it('still creates the contact when Resend rejects the topic', async () => {
    h.create
      .mockResolvedValueOnce({
        data: null,
        error: { message: 'One or more topics do not exist' },
      })
      .mockResolvedValueOnce({ data: { id: 'c1' }, error: null });

    await expect(addResendContact({ email })).resolves.toEqual({ id: 'c1' });

    expect(h.create).toHaveBeenCalledTimes(2);
    expect(h.create.mock.calls[1][0].topics).toBeUndefined();
    expect(h.warn).toHaveBeenCalled();
  });

  it('throws when the contact itself cannot be created', async () => {
    h.create.mockResolvedValue({ data: null, error: { message: 'bad key' } });

    await expect(addResendContact({ email })).rejects.toThrow('bad key');
  });

  it('never puts the email in logs', async () => {
    h.create.mockResolvedValue({ data: null, error: { message: 'bad key' } });

    await addResendContact({ email }).catch(() => {});

    const logged = JSON.stringify([...h.warn.mock.calls, ...h.error.mock.calls]);
    expect(logged).not.toContain(email);
  });
});
