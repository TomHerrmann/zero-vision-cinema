import { NextRequest, NextResponse } from 'next/server';

import subscribeSchema from '../../(frontend)/(schemas)/subscribeSchema';
import { logtail } from '@/lib/logtail';
import { addResendContact, setResendContactSource } from '@/lib/resend';

// Signups with no utm_source came straight from the website.
const DEFAULT_SOURCE = 'website';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = subscribeSchema.parse(body);
    const source = validatedData.source?.toLowerCase() || DEFAULT_SOURCE;

    await addResendContact({
      email: validatedData.email,
    });

    await setResendContactSource(validatedData.email, source);
    await logtail.info('Newsletter signup', {
      source,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    await logtail.error(`API /subscribe failed: ${err}`, {
      method: 'POST',
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 });
  }
}
