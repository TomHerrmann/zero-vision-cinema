/**
 * Reduce a QStash failure-callback payload to fields that are safe to log.
 *
 * QStash posts the original message body back to the failure callback
 * (`sourceBody`, base64) along with our task's last response (`body`). The
 * ticket-email message carries the buyer's email, so logging the raw payload
 * would put customer PII in our logs. Only message metadata and the ID fields
 * of the original body (orderId, rewardId, requestId, eventId, …) are kept;
 * customer data stays in Stripe and Resend.
 */
const SAFE_FIELDS = [
  'status',
  'retried',
  'maxRetries',
  'dlqId',
  'sourceMessageId',
  'url',
  'method',
] as const;

// Keys from the original message body that identify a record without
// identifying a person.
const isIdKey = (key: string) => /(^id$|Id$)/.test(key) || key === 'kind';

export type QstashFailureSummary = Record<string, unknown> & {
  source?: Record<string, unknown>;
};

export function summarizeQstashFailure(failure: unknown): QstashFailureSummary {
  if (!failure || typeof failure !== 'object') return {};
  const raw = failure as Record<string, unknown>;
  const summary: QstashFailureSummary = {};

  for (const field of SAFE_FIELDS) {
    if (raw[field] !== undefined) summary[field] = raw[field];
  }

  if (typeof raw.sourceBody === 'string') {
    try {
      const decoded = JSON.parse(
        Buffer.from(raw.sourceBody, 'base64').toString('utf8')
      );
      if (decoded && typeof decoded === 'object' && !Array.isArray(decoded)) {
        const ids: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(decoded)) {
          if (
            isIdKey(key) &&
            (typeof value === 'string' || typeof value === 'number')
          ) {
            ids[key] = value;
          }
        }
        summary.source = ids;
      }
    } catch {
      // Not JSON: keep nothing from it.
    }
  }

  return summary;
}
