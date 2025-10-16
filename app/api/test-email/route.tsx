import { NextResponse } from 'next/server';
import { getPayload } from 'payload';
import payloadConfig from '@payload-config';
import { Resend } from 'resend';
import { ZVC_EMAIL_ADDRESS } from '@/app/contsants/constants';
import TicketEmail from '@/emails/TicketEmail';
import { Location } from '@/payload-types';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { eventId, testEmail } = await req.json();

    if (!eventId || !testEmail) {
      return NextResponse.json(
        { error: 'eventId and testEmail are required' },
        { status: 400 }
      );
    }

    const payload = await getPayload({ config: payloadConfig });

    // Fetch the event data
    const event = await payload.findByID({
      collection: 'events',
      id: eventId,
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Get the event image
    const eventImage =
      typeof event.image === 'object'
        ? event.image
        : await payload.findByID({
            collection: 'media',
            id: event.image,
          });

    if (!eventImage?.url) {
      return NextResponse.json(
        { error: 'Event image not found' },
        { status: 404 }
      );
    }

    // Send test email with real event data
    const emailResult = await resend.emails.send({
      from: ZVC_EMAIL_ADDRESS,
      subject: `[TEST!!!] Your ZVC Ticket: ${event.name}`,
      to: testEmail,
      react: (
        <TicketEmail
          eventName={event.name}
          eventImage={`${process.env.VERCEL_BLOB_URL}${eventImage.filename}`}
          eventDate={event.datetime}
          eventLocation={(event.location as Location).name}
          quantity={1} // Test quantity
          eventDescription={event.description}
          eventAddress={(event.location as Location).address}
          totalAmount={25.0} // Test amount
          purchaseDate={new Date().toISOString()}
        />
      ),
    });

    return NextResponse.json({
      success: true,
      emailId: emailResult.data?.id,
      eventName: event.name,
    });
  } catch (error) {
    console.error('Test email failed:', error);
    return NextResponse.json(
      { error: 'Failed to send test email', details: error },
      { status: 500 }
    );
  }
}

// GET endpoint to list available events for testing
export async function GET() {
  try {
    const payload = await getPayload({ config: payloadConfig });

    const events = await payload.find({
      collection: 'events',
      limit: 10,
      select: {
        id: true,
        name: true,
        datetime: true,
      },
    });

    return NextResponse.json({
      events: events.docs.map((event) => ({
        id: event.id,
        name: event.name,
        datetime: event.datetime,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}
