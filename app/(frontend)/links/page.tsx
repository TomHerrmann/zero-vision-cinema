import {
  AHC_DISCORD_URL,
  AHC_INSTAGRAM_URL,
  ZVC_INSTAGRAM_URL,
  ZVC_NEWSLETTER_URL,
  ZVC_SITE_URL,
} from '@/app/contsants/constants';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getUpcomingEvents, isSoldOut } from '@/utils/getEvents';
import Link from 'next/link';

// Revalidate every 5 minutes (300 seconds)
export const revalidate = 300;

type LinkItem = {
  title: string;
  url: string;
};

const siteLink = {
  title: 'Official Site',
  url: `${ZVC_SITE_URL}`,
};

const socialLins: LinkItem[] = [
  {
    title: 'Vote for IN RED',
    url: 'https://www.nukhufoundation.org/nuveestarterfund',
  },
  {
    title: 'ZVC on Instagram',
    url: `${ZVC_INSTAGRAM_URL}`,
  },
  {
    title: 'AHC on Instagram',
    url: `${AHC_INSTAGRAM_URL}`,
  },
  {
    title: 'Our Newsletter',
    url: `${ZVC_NEWSLETTER_URL}`,
  },
  {
    title: 'Community Discord',
    url: `${AHC_DISCORD_URL}`,
  },
];

export default async function TreeLinkPage() {
  const events = await getUpcomingEvents();

  const eventLinks = events
    .filter((event) => isSoldOut(event) && event.paymentLink)
    .map((event) => ({
      title: event.name,
      url: event.paymentLink,
    })) as LinkItem[];

  return (
    <div className="relative min-h-screen bg-blackout flex flex-col items-center justify-center py-32 md:py-40 px-6 md:px-12">
      {/* Wear-and-tear texture stack */}
      <div
        className="absolute inset-0 pointer-events-none zvc-scanlines"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 pointer-events-none zvc-scratches"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 pointer-events-none zvc-grain"
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-2xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
        {/* Title */}
        <div className="flex flex-col items-center text-center space-y-6">
          <h1 className="zvc-heading zvc-stamp text-5xl sm:text-6xl md:text-7xl">
            ZVC Links
          </h1>
          <span className="zvc-rule" aria-hidden="true" />
        </div>

        {/* Links sticker sheet */}
        <Card className="w-full overflow-hidden">
          <CardContent className="p-6 sm:p-8 md:p-10 space-y-4">
            {[siteLink, ...eventLinks, ...socialLins].map((link, idx) => (
              <div
                key={`${link.title}-link`}
                className="animate-in fade-in slide-in-from-bottom-4 duration-500"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <Button asChild className="w-full h-16 text-lg md:text-2xl">
                  <Link
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={link.title}
                    className="flex items-center justify-center text-center w-full"
                  >
                    <span className="truncate px-2">{link.title}</span>
                  </Link>
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
