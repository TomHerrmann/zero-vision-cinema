import { NextResponse } from 'next/server';
import { getPayload } from 'payload';
import payloadConfig from '@payload-config';
import { Resend } from 'resend';
import { ZVC_EMAIL_ADDRESS } from '@/app/contsants/constants';
import TicketEmail from '@/emails/TicketEmail';
import { Location } from '@/payload-types';
import sharp from 'sharp';

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

    const imageUrl = `${process.env.VERCEL_BLOB_URL}${eventImage.filename}`;
    let emailImageSrc = imageUrl;
    let emailAttachments: Array<{ filename: string; content: Buffer; content_id: string }> = [];

    try {
      const fetchUrl = eventImage.sizes?.emailPoster?.url ?? imageUrl;
      const imageResponse = await fetch(fetchUrl);
      if (imageResponse.ok) {
        let imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
        if (!eventImage.sizes?.emailPoster?.url) {
          imageBuffer = await sharp(imageBuffer)
            .resize(200, 300, { fit: 'cover' })
            .jpeg({ quality: 75 })
            .toBuffer();
        }
        emailAttachments = [{ filename: 'event-poster.jpg', content: imageBuffer, content_id: 'event-poster' }];
        emailImageSrc = 'cid:event-poster';
      }
    } catch {
      // fall back to external URL
    }

    // Send test email with real event data
    const emailResult = await resend.emails.send({
      from: ZVC_EMAIL_ADDRESS,
      subject: `[TEST!!!] Your ZVC Ticket: ${event.name}`,
      to: testEmail,
      attachments: emailAttachments,
      react: (
        <TicketEmail
          eventName={event.name}
          eventImage={emailImageSrc}
          eventDate={event.datetime}
          eventLocation={(event.location as Location).name}
          quantity={1}
          eventDescription={event.description}
          eventAddress={(event.location as Location).address}
          totalAmount={25.0}
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
