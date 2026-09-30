import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@/lib/logtail', () => ({
  logtail: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));
vi.mock('@react-email/render', () => ({
  render: vi.fn().mockResolvedValue('<html>email</html>'),
}));
vi.mock('@/emails/CustomBroadcastEmail', () => ({ default: () => null }));

import { syncCustomBroadcast, cancelCustomBroadcast } from './customBroadcasts';

const NOW = new Date('2026-10-01T16:00:00.000Z');
const IN_AN_HOUR = '2026-10-01T17:00:00.000Z';

const fetchMock = vi.fn();
const find = vi.fn();
const req = { payload: { find } };

const ok = (body: unknown = {}) =>
  new Response(JSON.stringify(body), { status: 200 });
const status = (code: number, body = 'nope') =>
  new Response(body, { status: code });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const run = (data: any, originalDoc?: any) =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (syncCustomBroadcast as any)({ data, originalDoc, req });

const calls = () =>
  fetchMock.mock.calls.map(([url, init]) => ({
    url: url as string,
    method: init.method as string,
    body: init.body ? JSON.parse(init.body) : undefined,
  }));

beforeEach(() => {
  vi.useFakeTimers({ now: NOW, toFake: ['Date'] });
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockReset();
  find.mockReset().mockResolvedValue({ docs: [] });
  vi.stubEnv('BROADCAST_SENDING_ENABLED', 'true');
  vi.stubEnv('RESEND_FULL_API_KEY', 're_full');
  vi.stubEnv('RESEND_SEGMENT_ID', 'seg_1');
  vi.stubEnv('RESEND_TEST_SEGMENT_ID', 'seg_test');
  vi.stubEnv('VERCEL_BLOB_URL', 'https://blob.test/');
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('syncCustomBroadcast', () => {
  it('saving a draft touches Resend not at all', async () => {
    const out = await run({ subject: 'Hi', status: 'draft' });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(out.resendBroadcastId).toBeNull();
  });

  it('scheduling creates a scheduled broadcast to the whole segment, no topic', async () => {
    fetchMock.mockResolvedValueOnce(ok({ id: 'bc_new' }));

    const out = await run({
      subject: 'Big\nnews ',
      segment: 'main',
      status: 'scheduled',
      sendAt: IN_AN_HOUR,
    });

    const [create] = calls();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(create.url).toBe('https://api.resend.com/broadcasts');
    expect(create.body).toMatchObject({
      segment_id: 'seg_1',
      subject: 'Big news',
      send: true,
      scheduled_at: IN_AN_HOUR,
      html: '<html>email</html>',
    });
    expect(create.body).not.toHaveProperty('topic_id');
    expect(out.resendBroadcastId).toBe('bc_new');
  });

  it('refuses to schedule when sending is not enabled', async () => {
    vi.stubEnv('BROADCAST_SENDING_ENABLED', '');
    await expect(
      run({ subject: 'Hi', segment: 'main', status: 'scheduled', sendAt: IN_AN_HOUR })
    ).rejects.toThrow(/disabled in this environment/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('schedules to the test segment even with sending disabled, marked as a test', async () => {
    vi.stubEnv('BROADCAST_SENDING_ENABLED', '');
    fetchMock.mockResolvedValueOnce(ok({ id: 'bc_test' }));

    const out = await run({
      subject: 'Hi',
      segment: 'test',
      status: 'scheduled',
      sendAt: IN_AN_HOUR,
    });

    expect(calls()[0].body).toMatchObject({
      segment_id: 'seg_test',
      subject: '[TEST] Hi',
      name: '[custom test] Hi',
    });
    expect(out.resendBroadcastId).toBe('bc_test');
  });

  it('refuses to schedule without a segment, or when its env var is missing', async () => {
    await expect(
      run({ subject: 'Hi', status: 'scheduled', sendAt: IN_AN_HOUR })
    ).rejects.toThrow(/Choose which segment/);

    vi.stubEnv('RESEND_TEST_SEGMENT_ID', '');
    await expect(
      run({
        subject: 'Hi',
        segment: 'test',
        status: 'scheduled',
        sendAt: IN_AN_HOUR,
      })
    ).rejects.toThrow(/RESEND_TEST_SEGMENT_ID is not set/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('refuses a send time that is missing or too soon', async () => {
    await expect(run({ subject: 'Hi', segment: 'main', status: 'scheduled' })).rejects.toThrow(
      /Pick a send date/
    );
    await expect(
      run({
        subject: 'Hi',
        segment: 'main',
        status: 'scheduled',
        sendAt: '2026-10-01T16:05:00.000Z',
      })
    ).rejects.toThrow(/at least 10 minutes/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rescheduling creates the new broadcast, then cancels the old one', async () => {
    fetchMock
      .mockResolvedValueOnce(ok({ id: 'bc_new' }))
      .mockResolvedValueOnce(ok({ deleted: true }));

    const out = await run(
      { subject: 'Hi', segment: 'main', status: 'scheduled', sendAt: IN_AN_HOUR },
      { status: 'scheduled', sendAt: IN_AN_HOUR, resendBroadcastId: 'bc_old' }
    );

    expect(calls().map((c) => `${c.method} ${c.url}`)).toEqual([
      'POST https://api.resend.com/broadcasts',
      'DELETE https://api.resend.com/broadcasts/bc_old',
    ]);
    expect(out.resendBroadcastId).toBe('bc_new');
  });

  it('if the old broadcast cannot be cancelled, removes the new one and fails the save', async () => {
    fetchMock
      .mockResolvedValueOnce(ok({ id: 'bc_new' }))
      .mockResolvedValueOnce(status(500))
      .mockResolvedValueOnce(ok({ deleted: true }));

    await expect(
      run(
        { subject: 'Hi', segment: 'main', status: 'scheduled', sendAt: IN_AN_HOUR },
        { status: 'scheduled', sendAt: IN_AN_HOUR, resendBroadcastId: 'bc_old' }
      )
    ).rejects.toThrow(/nothing was changed/);

    expect(calls()[2]).toMatchObject({
      method: 'DELETE',
      url: 'https://api.resend.com/broadcasts/bc_new',
    });
  });

  it('fails the save when Resend rejects the broadcast', async () => {
    fetchMock.mockResolvedValueOnce(status(422, 'bad segment'));
    await expect(
      run({ subject: 'Hi', segment: 'main', status: 'scheduled', sendAt: IN_AN_HOUR })
    ).rejects.toThrow(/bad segment/);
  });

  it('moving back to draft cancels the scheduled broadcast (404 tolerated)', async () => {
    fetchMock.mockResolvedValueOnce(status(404));
    const out = await run(
      { subject: 'Hi', status: 'draft', sendAt: IN_AN_HOUR },
      { status: 'scheduled', sendAt: IN_AN_HOUR, resendBroadcastId: 'bc_old' }
    );
    expect(calls()[0]).toMatchObject({
      method: 'DELETE',
      url: 'https://api.resend.com/broadcasts/bc_old',
    });
    expect(out.resendBroadcastId).toBeNull();
  });

  it('locks an entry whose send is within 5 minutes or already past', async () => {
    for (const sendAt of [
      '2026-10-01T16:03:00.000Z',
      '2026-10-01T12:00:00.000Z',
    ]) {
      await expect(
        run(
          { subject: 'Edited', status: 'draft' },
          { status: 'scheduled', sendAt, resendBroadcastId: 'bc_old' }
        )
      ).rejects.toThrow(/already been sent/);
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('sends a test to one address from a draft, even with sending disabled, and does not store the address', async () => {
    vi.stubEnv('BROADCAST_SENDING_ENABLED', '');
    fetchMock.mockResolvedValueOnce(ok({ id: 'em_1' }));

    const out = await run({
      subject: 'Hi',
      status: 'draft',
      sendTestTo: 'me@example.com',
    });

    const [send] = calls();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(send.url).toBe('https://api.resend.com/emails');
    expect(send.body).toMatchObject({
      to: 'me@example.com',
      subject: '[TEST] Hi',
    });
    expect(out).not.toHaveProperty('sendTestTo');
  });

  it('resolves images to blob URLs in the entry order', async () => {
    const { render } = await import('@react-email/render');
    find.mockResolvedValue({
      docs: [
        { id: 1, filename: 'a b.png', alt: 'A', width: 10, height: 20 },
        { id: 2, filename: 'b.jpg', alt: 'B', width: 30, height: 40 },
      ],
    });
    fetchMock.mockResolvedValueOnce(ok({ id: 'em_1' }));

    await run({
      subject: 'Hi',
      status: 'draft',
      images: [2, { id: 1 }],
      sendTestTo: 'me@example.com',
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const element = vi.mocked(render).mock.calls.at(-1)![0] as any;
    expect(element.props.images).toEqual([
      { url: 'https://blob.test/b.jpg', alt: 'B', width: 30, height: 40 },
      { url: 'https://blob.test/a%20b.png', alt: 'A', width: 10, height: 20 },
    ]);
  });
});

describe('cancelCustomBroadcast', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const del = (doc: any) => (cancelCustomBroadcast as any)({ doc });

  it('cancels a still-pending broadcast when its entry is deleted', async () => {
    fetchMock.mockResolvedValueOnce(ok({ deleted: true }));
    await del({ resendBroadcastId: 'bc_1', sendAt: IN_AN_HOUR });
    expect(calls()[0]).toMatchObject({
      method: 'DELETE',
      url: 'https://api.resend.com/broadcasts/bc_1',
    });
  });

  it('leaves Resend alone for drafts and already-sent entries', async () => {
    await del({ sendAt: IN_AN_HOUR });
    await del({ resendBroadcastId: 'bc_1', sendAt: '2026-09-01T12:00:00.000Z' });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
