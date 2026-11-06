import { CreateContactOptions, Resend } from 'resend';
import { logtail } from './logtail';

export const resend = new Resend(process.env.RESEND_FULL_API_KEY);

/**
 * Add (or update) a newsletter contact in the Resend audience segment, opted in
 * to the weekly "This week at ZVC" topic (RESEND_TOPIC_ID_WEEKLY), which is the
 * only newsletter email now sent.
 *
 * Topic assignment is best-effort: if Resend rejects the topic (for example a
 * stale topic ID in the env), the contact is created without it rather than
 * losing the signup. Throws only if the contact itself can't be created.
 *
 * Never log the email or name here: customer data lives in Resend, not logs.
 */
export async function addResendContact({
  email,
  firstName,
  lastName,
}: CreateContactOptions) {
  const base = {
    email,
    firstName,
    lastName,
    unsubscribed: false,
    segments: [{ id: process.env.RESEND_SEGMENT_ID as string }],
  };
  const weeklyTopicId = process.env.RESEND_TOPIC_ID_WEEKLY;

  let { data, error } = await resend.contacts.create(
    weeklyTopicId
      ? {
          ...base,
          topics: [{ id: weeklyTopicId, subscription: 'opt_in' as const }],
        }
      : base
  );

  if (error && weeklyTopicId) {
    await logtail.warn(
      `Resend contact create with weekly topic failed (${error.message ?? 'unknown error'}); retrying without topics. Check RESEND_TOPIC_ID_WEEKLY.`,
      { timestamp: new Date().toISOString() }
    );
    ({ data, error } = await resend.contacts.create(base));
  }

  if (error) {
    await logtail.error(
      `Resend contact create failed: ${error.message ?? JSON.stringify(error)}`,
      { timestamp: new Date().toISOString() }
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
      source,
      timestamp: new Date().toISOString(),
    });
  }
}
