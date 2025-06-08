import { NextResponse, NextRequest } from 'next/server';
import contactEmailSchema from '../../(schemas)/contactEmailSchema';
import { Resend } from 'resend';
import { emailAddress } from '@/app/contsants/constants';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = contactEmailSchema.parse(body);

    const response = await resend.emails.send({
      from: emailAddress,
      subject: `New Message From ${validatedData.name}`,
      to: emailAddress,
      text: `Message from ${validatedData.message} <${validatedData.email} | ${validatedData.message}`,
    });

    if (response.error) {
      console.error(response.error);
      return NextResponse.json(
        { error: response.error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('Email error:', error);
    return NextResponse.json(
      { error: 'Failed to send contact email' },
      { status: 500 }
    );
  }
}
