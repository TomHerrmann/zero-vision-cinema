import { addressLine1, addressLine2 } from '@/app/contsants/constants';
import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Column,
  Row,
  Text,
  Img,
  Link,
} from '@react-email/components';

interface EmailTemplateProps {
  movieTitle: string;
  moviePosterUrl: string;
  eventDate: string;
  eventTime: string;
  location: string;
  price: string;
  ticketUrl: string;
}

const locationIcon =
  'https://s7qtxjaxzhtgrxvy.public.blob.vercel-storage.com/map-pinned-lHuRQcNgMPipnhBhM4yK1isd2xGdv9.png';

const dateIcon =
  'https://s7qtxjaxzhtgrxvy.public.blob.vercel-storage.com/calendar-clock-rCLPiQ1MsmjMCie6AVxlEZX3DvjJKk.png';

const priceIcon =
  'https://s7qtxjaxzhtgrxvy.public.blob.vercel-storage.com/circle-dollar-sign-XMLvNzlvDXigcBpmX14wdtw775rcVH.png';

export const MovieEvent = ({
  movieTitle = 'Friday the 13th',
  moviePosterUrl = 'https://s7qtxjaxzhtgrxvy.public.blob.vercel-storage.com/fridaythe13th_poster',
  eventDate = 'Friday, October 13, 2023',
  eventTime = '7:30 PM',
  location = 'Zero Vision Cinema, 123 Film Alley, Brooklyn, NY',
  price = '$10',
  ticketUrl = 'https://zerovisioncinema.com/tickets',
}: EmailTemplateProps) => {
  return (
    <Html lang="en" dir="ltr">
      <Head>
        <title>Zero Vision Cinema - {movieTitle}</title>
        <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="x-apple-disable-message-reformatting" />
      </Head>

      <Preview>Tickets Available: {movieTitle} at Zero Vision Cinema</Preview>

      <Body
        style={{
          backgroundColor: '#29678f',
          fontFamily: 'Arial, sans-serif',
          margin: '0',
          padding: '0',
        }}
      >
        <Img
          src="https://s7qtxjaxzhtgrxvy.public.blob.vercel-storage.com/emailheader-q8z8Wh5QXZgyLDhxjreQ5KyCNH71db.png"
          alt="Zero Vision Cinema"
          style={{
            display: 'block',
            margin: '0 auto 12px',
            width: '90%',
            paddingTop: '16px',
            paddingBottom: '16px',
          }}
        />

        <Container
          style={{
            width: '85%',
            margin: '0 auto',
            backgroundColor: '#44403c',
            padding: '20px',
          }}
        >
          <Section>
            <Container align="center">
              <Text
                style={{
                  textAlign: 'center',
                  color: '#fefce8', // text-yellow-50
                  fontSize: '36px',
                  fontWeight: 'bold',
                  margin: 0,
                  fontFamily: '"Krona One", Arial, sans-serif',
                }}
              >
                {movieTitle}
              </Text>
              <Img
                src={moviePosterUrl}
                alt={movieTitle}
                style={{
                  width: '90%',
                  display: 'block',
                  borderRadius: '8px',
                  border: '0.5px solid white',
                  margin: '12px auto',
                }}
              />
            </Container>
          </Section>

          <Section style={{ backgroundColor: '#221E1F', padding: '20px' }}>
            <Text
              style={{
                fontSize: '24px',
                textAlign: 'center',
                color: '#fefce8',
                fontFamily: '"Rubik Glitch", Arial, sans-serif',
                margin: 0,
              }}
            >
              {movieTitle}
            </Text>
          </Section>

          <Section style={{ backgroundColor: '#f5f5f4', padding: '20px' }}>
            <Text
              style={{
                fontSize: '24px',
                fontWeight: 'bold',
                fontFamily: '"Krona One", Arial, sans-serif',
                marginBottom: '16px',
              }}
            >
              GET YOUR <strong>TICKETS</strong>
            </Text>

            <Section
              style={{ borderLeft: '4px solid #0369a1', paddingLeft: '10px' }}
            >
              <Row style={{ marginBottom: '8px' }}>
                <Column width="24">
                  <Img
                    src={dateIcon}
                    width="16"
                    height="16"
                    alt="Calendar"
                    style={{ display: 'block' }}
                  />
                </Column>
                <Column>
                  <Text style={{ margin: 0 }}>
                    {eventDate} | {eventTime}
                  </Text>
                </Column>
              </Row>
              <Row style={{ marginBottom: '8px' }}>
                <Column width="24">
                  <Img
                    src={locationIcon}
                    width="16"
                    height="16"
                    alt="Location"
                    style={{ display: 'block' }}
                  />
                </Column>
                <Column>
                  <Text style={{ margin: 0 }}>{location}</Text>
                </Column>
              </Row>
              <Row style={{ marginBottom: '8px' }}>
                <Column width="24">
                  <Img
                    src={priceIcon}
                    width="16"
                    height="16"
                    alt="Price"
                    style={{ display: 'block' }}
                  />
                </Column>
                <Column>
                  <Text style={{ margin: 0 }}>{price}</Text>
                </Column>
              </Row>
            </Section>

            <Section style={{ textAlign: 'center', margin: '20px 0' }}>
              <Link
                href={ticketUrl}
                style={{
                  backgroundColor: '#0284c7',
                  color: '#fefce8',
                  padding: '12px 24px',
                  textDecoration: 'none',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  display: 'inline-block',
                }}
              >
                BUY TICKETS
              </Link>
            </Section>

            <Text
              style={{
                textAlign: 'center',
                fontSize: '16px',
                fontStyle: 'italic',
              }}
            >
              Limited seating available
            </Text>
          </Section>
        </Container>

        <Section style={{ textAlign: 'center', padding: '20px' }}>
          <Row style={{ justifyContent: 'center', marginBottom: '8px' }}>
            <Column align="center">
              <Link
                href="https://www.instagram.com/zerovisioncinema/"
                target="_blank"
                style={{ display: 'inline-block', textDecoration: 'none' }}
              >
                <Row style={{ display: 'inline-flex', alignItems: 'center' }}>
                  <Column width="24">
                    <Img
                      height={24}
                      width={24}
                      alt="Instagram"
                      src="https://s7qtxjaxzhtgrxvy.public.blob.vercel-storage.com/Instagram_Glyph_Gradient-cytRhDzf7XqHFRst9K38AotJg5pZ4i-acvkd6WqNAueeDECSqXGXbojnbEaCP.svg"
                      style={{ display: 'block' }}
                    />
                  </Column>
                  <Column>
                    <Text
                      style={{
                        margin: '0 0 0 8px',
                        fontSize: '14px',
                        lineHeight: '24px',
                        display: 'inline-block',
                        color: '#fefce8',
                      }}
                    >
                      Follow Us On Instagram
                    </Text>
                  </Column>
                </Row>
              </Link>
            </Column>
          </Row>

          <Text style={{ color: '#fefce8', fontSize: '12px', margin: '8px 0' }}>
            Zero Vision Cinema LLC
          </Text>
          <Text style={{ color: '#fefce8', fontSize: '12px', margin: '0' }}>
            {addressLine1}
          </Text>
          <Text style={{ color: '#fefce8', fontSize: '12px', margin: '0' }}>
            {addressLine2}
          </Text>
          <Text
            style={{ color: '#fefce8', fontSize: '12px', marginTop: '20px' }}
          >
            <Link
              href="https://zerovisioncinema.com/unsubscribe"
              style={{ color: '#fefce8', textDecoration: 'underline' }}
            >
              Unsubscribe
            </Link>
          </Text>
        </Section>
      </Body>
    </Html>
  );
};

export default MovieEvent;
