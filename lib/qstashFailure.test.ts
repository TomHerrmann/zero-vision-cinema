import { describe, it, expect } from 'vitest';
import { summarizeQstashFailure } from './qstashFailure';

const b64 = (v: unknown) => Buffer.from(JSON.stringify(v)).toString('base64');

describe('summarizeQstashFailure', () => {
  it('keeps message metadata and ID fields, drops the buyer email', () => {
    const summary = summarizeQstashFailure({
      status: 500,
      retried: 3,
      maxRetries: 3,
      dlqId: 'dlq_1',
      sourceMessageId: 'msg_1',
      url: 'https://example.com/api/tasks/send-ticket-email',
      sourceBody: b64({ orderId: 42, email: 'buyer@example.com' }),
      body: b64({ error: 'failed for buyer@example.com' }),
      sourceHeader: { Authorization: ['x'] },
    });

    expect(summary).toEqual({
      status: 500,
      retried: 3,
      maxRetries: 3,
      dlqId: 'dlq_1',
      sourceMessageId: 'msg_1',
      url: 'https://example.com/api/tasks/send-ticket-email',
      source: { orderId: 42 },
    });
    expect(JSON.stringify(summary)).not.toContain('buyer@example.com');
  });

  it('keeps broadcast identifiers', () => {
    expect(
      summarizeQstashFailure({ sourceBody: b64({ eventId: 7, kind: 'reminder' }) })
        .source
    ).toEqual({ eventId: 7, kind: 'reminder' });
  });

  it('tolerates junk payloads', () => {
    expect(summarizeQstashFailure(null)).toEqual({});
    expect(summarizeQstashFailure({ sourceBody: 'not base64 json' })).toEqual({});
  });
});
