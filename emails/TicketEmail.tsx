import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface Props {
  eventName: string;
  eventImage: string;
  eventDate: string;
  eventLocation: string;
  quantity: number;
}

export default function TicketEmail({
  eventName,
  quantity = 1,
  eventDate = new Date().toLocaleString(),
  eventLocation = 'SingleCut Beersmiths',
}: Props) {
  const date = new Date(eventDate);
  const plural = quantity > 1 ? 's' : '';

  return (
    <Html>
      <Head />
      <Body style={main}>
        <Preview>
          Your {eventName} Ticket{plural}
        </Preview>
        <Container align="center" style={container}>
          <Section style={coverSection}>
            <Section style={imageSection}>
              <Img
                src={
                  'https://s7qtxjaxzhtgrxvy.public.blob.vercel-storage.com/zvc_email_header.png'
                }
                width={'100%'}
                alt="Zero Vision Cinema Logo"
              />
            </Section>
            <Section style={upperSection}>
              <Heading style={h1}>
                Your {eventName} Ticket{plural}
              </Heading>
              <Text style={directionsText}>
                Please show this ticket at the door to gain entry to the event.
              </Text>
              <Section align="center" style={ticketSection}>
                <Text style={dateText}>
                  {date.toLocaleString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    weekday: 'short',
                    timeZone: 'America/New_York',
                  })}
                </Text>
                <Img
                  src={
                    'https://s7qtxjaxzhtgrxvy.public.blob.vercel-storage.com/28dayslater_poster'
                  }
                  width="250"
                  height="375"
                  alt="Event Poster"
                />
                <Text style={quantityText}>Admits {quantity}</Text>
              </Section>
              <Section>
                <Hr />
                <Text style={detailsText}>
                  <strong>Location: </strong>
                  {eventLocation}
                  {' | '}
                  <strong>Doors: </strong>
                  {date.toLocaleTimeString('en-US', {
                    timeStyle: 'short',
                    timeZone: 'America/New_York',
                  })}
                </Text>
              </Section>
            </Section>
          </Section>
          <Text style={footerText}>
            <strong>Cancellation Policy:</strong> Zero Vision Cinema will
            provide a refund if you cancel at least 48 hours before the
            scheduled event time. Cancellations made less than 48 hours in
            advance are not eligible for a refund.
          </Text>
          <Section style={lowerSection}>
            <Text
              style={{
                textAlign: 'center',
                fontSize: 12,
                color: 'rgb(0,0,0, 0.7)',
              }}
            >
              © 2025 | Zero Vision Cinema LLC, 418 Broadway Ste N Albany NY
              12207
            </Text>
            <Text
              style={{
                textAlign: 'center',
                fontSize: 12,
                color: 'rgb(0,0,0, 0.7)',
              }}
            >
              <Link href="mailto:info@zerovisioncinema.com" style={link}>
                Email Us
              </Link>
              {' | '}
              <Link href="https://www.zerovisioncinema.com" style={link}>
                Visit Our Site
              </Link>
              {' | '}
              <Link
                href="https://dashboard.mailerlite.com/forms/1563255/156426258501076293/share"
                style={link}
              >
                Join Our Mailing List
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: '#ffffff',
  color: '#212121',
};

const container = {
  padding: '15px',
  backgroundColor: '#e4e4e7',
  maxWidth: '600px',
};

const h1 = {
  color: '#333333',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  fontSize: '24px',
  fontWeight: 'bold',
  marginBottom: '15px',
  marginTop: '5px',
};

const link = {
  color: '#333333',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  fontSize: '14px',
  textDecoration: 'underline',
};

const text = {
  color: '#333333',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  fontSize: '14px',
  marginTop: '24px',
  marginBottom: '24px',
};

const imageSection = {
  textAlign: 'center' as const,
};

const coverSection = { backgroundColor: '#ffffff' };

const upperSection = {
  paddingTop: '15px',
  paddingRight: '25px',
  paddingBottom: '15px',
  paddingLeft: '25px',
};

const lowerSection = {
  paddingRight: '35px',
  paddingLeft: '35px',
};

const footerText = {
  ...text,
  fontSize: '12px',
  paddingRight: '20px',
  paddingLeft: '20px',
};

const ticketSection = {
  backgroundColor: '#e4e4e7',
  paddingTop: '5px',
  paddingRight: '50px',
  paddingBottom: '5px',
  paddingLeft: '50px',
  marginTop: '18px',
  marginBottom: '18px',
  maxWidth: '350px',
  width: '60%',
  borderRadius: '8px',
  textAlign: 'center' as const,
};

const directionsText = { ...text, marginTop: '0px', marginBottom: '0px' };

const quantityText = {
  ...text,
  fontSize: '42px',
  fontWeight: 'bold',
  paddingTop: '10px',
  paddingBottom: '10px',
  textAlign: 'center' as const,
};

const dateText = {
  ...text,
  fontSize: '24px',
  marginTop: '12px',
  marginBottom: '8px',
  textAlign: 'center' as const,
};

const detailsText = {
  ...text,
  fontSize: '16px',
  marginTop: '20px',
  textAlign: 'center' as const,
};
