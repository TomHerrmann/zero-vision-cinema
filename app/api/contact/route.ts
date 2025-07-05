import { NextResponse, NextRequest } from 'next/server';
import contactEmailSchema from '../../(frontend)/(schemas)/contactEmailSchema';
import { Resend } from 'resend';
import { emailAddress } from '@/app/contsants/constants';
import { logtail } from '@/lib/logtail';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = contactEmailSchema.parse(body);

    const response = await resend.emails.send({
      from: emailAddress,
      subject: `New Message From ${validatedData.name}`,
      to: emailAddress,
      text: `Message from ${validatedData.name} <${validatedData.email}> | ${validatedData.message}`,
    });

    if (response.error) {
      await logtail.error(`API /contact error: ${response.error.message}`, {
        method: 'POST',
        timestamp: new Date().toISOString(),
      });
      return NextResponse.json(
        { error: response.error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    await logtail.error(`API /contact email error: ${err}`, {
      method: 'POST',
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json(
      { error: 'Failed to send contact email' },
      { status: 500 }
    );
  }
}
