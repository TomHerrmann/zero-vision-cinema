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
  Tailwind,
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
      <Tailwind>
        <Head>
          <title>Zero Vision Cinema - {movieTitle}</title>
          <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          />
          <meta name="x-apple-disable-message-reformatting" />
        </Head>

        <Preview>Tickets Available: {movieTitle} at Zero Vision Cinema</Preview>

        <Body className="bg-sky-800 w-full font-sans mx-auto">
          <Img
            src="https://s7qtxjaxzhtgrxvy.public.blob.vercel-storage.com/emailheader-q8z8Wh5QXZgyLDhxjreQ5KyCNH71db.png"
            alt="Zero Vision Cinema"
            className="w-[90%] m-auto py-2"
            style={{ display: 'block', margin: '0 auto 12px', width: '95%' }}
          />
          <Container
            className="w-[85%] mx-auto bg-stone-700 p-5"
            style={{ backgroundColor: '#44403c', padding: '20px' }}
          >
            <Section>
              <Container align="center">
                <Text className="text-center text-yellow-50 text-6xl mt-0 font-[Krona One]">
                  {movieTitle}
                </Text>
                <Img
                  src={moviePosterUrl}
                  alt={movieTitle}
                  className="w-[90%] mx-auto"
                  style={{
                    width: '90%',
                    display: 'block',
                    borderRadius: '8px',
                    border: 'white solid .5px',
                    marginBottom: 12,
                  }}
                />
              </Container>
            </Section>

            <Section
              className="p-5"
              style={{ backgroundColor: '#221E1F', padding: '20px' }}
            >
              <Text className="text-2xl text-yellow-50 font-[Rubik-Glitch] text-center">
                {movieTitle}
              </Text>
            </Section>

            <Section
              className="p-5 bg-stone-100"
              style={{ backgroundColor: '#f5f5f4', padding: '20px' }}
            >
              <Text className="text-2xl font-[Krona One]">
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

              <Section
                className="text-center my-5"
                style={{ textAlign: 'center', margin: '20px 0' }}
              >
                <Link
                  href={ticketUrl}
                  className="text-yellow-50 no-underline font-bold inline-block"
                  style={{
                    backgroundColor: '#0284c7',
                    padding: '12px 24px',
                    textDecoration: 'none',
                    borderRadius: '8px',
                    display: 'inline-block',
                  }}
                >
                  BUY TICKETS
                </Link>
              </Section>

              <Text className="text-center text-lg italic">
                Limited seating available
              </Text>
            </Section>
          </Container>

          <Section className="text-center py-5">
            <Section className="text-center my-2">
              <Row style={{ marginBlock: '8px', justifyContent: 'center' }}>
                <Column align="center">
                  <Link
                    href="https://www.instagram.com/zerovisioncinema/"
                    target="_blank"
                    style={{
                      display: 'inline-block',
                    }}
                  >
                    <Row
                      style={{ display: 'inline-flex', alignItems: 'center' }}
                    >
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
                          className="text-yellow-50"
                          style={{
                            margin: '0 0 0 8px',
                            fontSize: '14px',
                            lineHeight: '24px',
                            display: 'inline-block',
                          }}
                        >
                          Follow Us On Instagram
                        </Text>
                      </Column>
                    </Row>
                  </Link>
                </Column>
              </Row>
            </Section>

            <Text className="text-yellow-50 text-xs">
              Zero Vision Cinema LLC
            </Text>
            <Text className="text-yellow-50 text-xs my-0">{addressLine1}</Text>
            <Text className="text-yellow-50 text-xs my-0">{addressLine2}</Text>
            <Text className="text-yellow-50 text-xs mt-5">
              <Link
                href="https://zerovisioncinema.com/unsubscribe"
                className="text-yellow-50"
              >
                Unsubscribe
              </Link>
            </Text>
          </Section>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default MovieEvent;
