import { CreateContactOptions, Resend } from 'resend';

export const resend = new Resend(process.env.RESEND_API_KEY);

export async function addResendContact({
  email,
  firstName,
  lastName,
}: CreateContactOptions) {
  try {
    const data = await resend.contacts.create({
      email,
      firstName,
      lastName,
      unsubscribed: false,
      segments: [{ id: process.env.RESEND_SEGMENT_ID as string }],
      topics: [
        {
          id: process.env.RESEND_TOPIC_ID_ZVC as string,
          subscription: 'opt_in',
        },
        {
          id: process.env.RESEND_TOPIC_ID_AHC as string,
          subscription: 'opt_in',
        },
        {
          id: process.env.RESEND_TOPIC_ID_BOOK_CLUB as string,
          subscription: 'opt_in',
        },
      ],
    });

    return { success: true, data };
  } catch (error) {
    console.error('Failed to add subscriber:', error);
    return { success: false, error: (error as Error).message };
  }
}
