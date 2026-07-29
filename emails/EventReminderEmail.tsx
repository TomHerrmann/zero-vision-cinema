import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import { ZVC_SITE_URL } from '@/app/contsants/constants';

const HEADER_IMAGE =
  'https://s7qtxjaxzhtgrxvy.public.blob.vercel-storage.com/email%20header.png';

export type ReminderKind = 'pre-event' | 'day-of';

interface Props {
  kind: ReminderKind;
  eventName: string;
  eventImage?: string;
  /** ISO datetime string of the event start. */
  eventDate: string;
  eventLocation: string;
  eventAddress?: string;
  /** Link to the event/ticket page. */
  eventUrl?: string;
}

const copy: Record<ReminderKind, { kicker: string; heading: (n: string) => string; blurb: string }> = {
  'pre-event': {
    kicker: 'One week to go',
    heading: (n) => `${n} is almost here`,
    blurb: "Your screening is a week out — here are the details so you're ready.",
  },
  'day-of': {
    kicker: 'Tonight',
    heading: (n) => `Tonight: ${n}`,
    blurb: "It's showtime. Here's everything you need to get to your seat.",
  },
};

function formatEventDate(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    timeZone: 'America/New_York',
    dateStyle: 'full',
    timeStyle: 'short',
  });
}

export default function EventReminderEmail({
  kind,
  eventName,
  eventImage,
  eventDate,
  eventLocation,
  eventAddress,
  eventUrl,
}: Props) {
  const c = copy[kind];
  return (
    <Html>
      <Head />
      <Preview>{c.heading(eventName)}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Img src={HEADER_IMAGE} width="100%" alt="Zero Vision Cinema" style={header} />
          <Section style={content}>
            <Text style={kicker}>{c.kicker}</Text>
            <Heading style={heading}>{c.heading(eventName)}</Heading>
            <Text style={blurb}>{c.blurb}</Text>

            {eventImage && (
              <Img src={eventImage} alt={eventName} style={poster} />
            )}

            <Section style={details}>
              <Text style={detailRow}>
                <span style={label}>When</span>
                {formatEventDate(eventDate)}
              </Text>
              <Text style={detailRow}>
                <span style={label}>Where</span>
                {eventLocation}
                {eventAddress ? ` — ${eventAddress}` : ''}
              </Text>
            </Section>

            <Link href={eventUrl ?? ZVC_SITE_URL} style={button}>
              View event details
            </Link>

            <Text style={footer}>
              See you at the movies. — Zero Vision Cinema
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main: React.CSSProperties = {
  backgroundColor: '#141414',
  fontFamily: 'Arial, Helvetica, sans-serif',
  margin: 0,
  padding: '24px 0',
};
const container: React.CSSProperties = {
  maxWidth: '600px',
  margin: '0 auto',
  backgroundColor: '#1F1F1F',
  border: '1px solid rgba(255,253,246,0.12)',
};
const header: React.CSSProperties = { display: 'block' };
const content: React.CSSProperties = { padding: '32px 28px' };
const kicker: React.CSSProperties = {
  color: '#4A8CC6',
  textTransform: 'uppercase',
  letterSpacing: '2px',
  fontSize: '12px',
  margin: '0 0 8px',
};
const heading: React.CSSProperties = {
  color: '#FFFDF6',
  fontSize: '28px',
  lineHeight: '1.2',
  margin: '0 0 12px',
};
const blurb: React.CSSProperties = {
  color: 'rgba(255,253,246,0.8)',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0 0 20px',
};
const poster: React.CSSProperties = {
  width: '100%',
  maxWidth: '260px',
  border: '2px solid rgba(255,253,246,0.15)',
  margin: '0 0 20px',
};
const details: React.CSSProperties = {
  borderTop: '1px solid rgba(255,253,246,0.12)',
  borderBottom: '1px solid rgba(255,253,246,0.12)',
  padding: '12px 0',
  margin: '0 0 24px',
};
const detailRow: React.CSSProperties = {
  color: 'rgba(255,253,246,0.9)',
  fontSize: '14px',
  margin: '8px 0',
};
const label: React.CSSProperties = {
  display: 'block',
  color: '#4A8CC6',
  textTransform: 'uppercase',
  fontSize: '11px',
  letterSpacing: '1px',
  marginBottom: '2px',
};
const button: React.CSSProperties = {
  display: 'inline-block',
  backgroundColor: '#4A8CC6',
  color: '#0f0f0f',
  fontWeight: 'bold',
  fontSize: '14px',
  textDecoration: 'none',
  padding: '12px 22px',
};
const footer: React.CSSProperties = {
  color: 'rgba(255,253,246,0.5)',
  fontSize: '12px',
  margin: '28px 0 0',
};
