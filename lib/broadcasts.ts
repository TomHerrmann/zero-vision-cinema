export type BroadcastKind = 'announcement' | 'reminder';

/** Resend Topic id for an event type, so recipients can unsubscribe per type. */
export function topicIdForEventType(
  eventType?: string | null
): string | undefined {
  switch (eventType) {
    case 'zvc':
      return process.env.RESEND_TOPIC_ID_ZVC;
    case 'ahc':
      return process.env.RESEND_TOPIC_ID_AHC;
    case 'bookclub':
      return process.env.RESEND_TOPIC_ID_BOOK_CLUB;
    default:
      return undefined;
  }
}
