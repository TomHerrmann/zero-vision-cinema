import { NextRequest, NextResponse } from 'next/server';

import subscribeSchema from '../../(frontend)/(schemas)/subscribeSchema';
import { logtail } from '@/lib/logtail';
import { subscribeEmail } from '@/lib/mailerlite';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = subscribeSchema.parse(body);

    await subscribeEmail(validatedData.email);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    await logtail.error(`API /subscribe failed: ${err}`, {
      method: 'POST',
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 });
  }
}
