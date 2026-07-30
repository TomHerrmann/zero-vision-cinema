import { CreateContactOptions, Resend } from 'resend';

export const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Add (or update) a newsletter contact in the Resend audience segment, opted in
 * to every event-type topic (recipients can unsubscribe per topic later).
 * Throws on failure so callers decide how to handle it — the Resend SDK reports
 * API errors on the returned object rather than throwing, so we surface them.
 */
export async function addResendContact({
  email,
  firstName,
  lastName,
}: CreateContactOptions) {
  const { data, error } = await resend.contacts.create({
    email,
    firstName,
    lastName,
    unsubscribed: false,
    segments: [{ id: process.env.RESEND_SEGMENT_ID as string }],
    topics: [
      { id: process.env.RESEND_TOPIC_ID_ZVC as string, subscription: 'opt_in' },
      { id: process.env.RESEND_TOPIC_ID_AHC as string, subscription: 'opt_in' },
      {
        id: process.env.RESEND_TOPIC_ID_BOOK_CLUB as string,
        subscription: 'opt_in',
      },
    ],
  });

  if (error) {
    throw new Error(
      `Resend contact create failed: ${error.message ?? JSON.stringify(error)}`
    );
  }

  return data;
}
