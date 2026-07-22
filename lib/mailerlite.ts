import MailerLite from '@mailerlite/mailerlite-nodejs';

const mailerlite = new MailerLite({
  api_key: process.env.MAILER_LITE_ACCESS_TOKEN!,
});

/**
 * Subscribe (or update) an email on the ZVC newsletter group.
 * Shared by /api/subscribe and the Stripe webhook's checkout opt-in.
 */
export async function subscribeEmail(email: string) {
  const response = await mailerlite.subscribers.createOrUpdate({
    email,
    groups: [process.env.MAILERLITE_GROUP_ID!],
  });

  if (!response.data.data.id) {
    throw new Error('Subscription failed');
  }

  return response.data.data;
}
