import { NextRequest, NextResponse } from 'next/server';

import MailerLite from '@mailerlite/mailerlite-nodejs';
import subscribeSchema from '../../(frontend)/(schemas)/subscribeSchema';
import { logtail } from '@/lib/logtail';

const mailerlite = new MailerLite({
  api_key: process.env.MAILER_LITE_ACCESS_TOKEN!,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = subscribeSchema.parse(body);

    const response = await mailerlite.subscribers.createOrUpdate({
      email: validatedData.email,
      groups: [process.env.MAILERLITE_GROUP_ID!],
    });

    if (!response.data.data.id) {
      throw new Error('Subscription failed');
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    await logtail.error(`API /subscribe failed: ${err}`, {
      method: 'POST',
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 });
  }
}
