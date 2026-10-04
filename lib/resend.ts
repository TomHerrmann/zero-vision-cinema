import { CreateContactOptions, Resend } from 'resend';
import { logtail } from './logtail';

export const resend = new Resend(process.env.RESEND_FULL_API_KEY);

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
  console.log(`Adding Resend contact: ${email}, ${firstName}, ${lastName}`);
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

  console.log(`Resend contact create response: ${JSON.stringify(data)}`);

  if (error) {
    logtail.error(
      `Resend contact create failed: ${error.message ?? JSON.stringify(error)}`,
      {
        email,
        firstName,
        lastName,
        timestamp: new Date().toISOString(),
      }
    );
    throw new Error(
      `Resend contact create failed: ${error.message ?? JSON.stringify(error)}`
    );
  }

  return data;
}

/** Contact property recording where a newsletter signup came from (e.g. "qr"). */
export const SIGNUP_SOURCE_PROPERTY = 'signup_source';

/**
 * Tag an existing contact with where they signed up. Best effort: the property
 * has to exist in Resend (Audience → Properties) first, and a missing property
 * must never fail the signup itself, so errors are logged, not thrown.
 */
export async function setResendContactSource(email: string, source: string) {
  try {
    const { error } = await resend.contacts.update({
      email,
      properties: { [SIGNUP_SOURCE_PROPERTY]: source },
    });
    if (error) throw new Error(error.message ?? JSON.stringify(error));
  } catch (err) {
    await logtail.warn(`Resend signup source tag failed: ${err}`, {
      email,
      source,
      timestamp: new Date().toISOString(),
    });
  }
}
