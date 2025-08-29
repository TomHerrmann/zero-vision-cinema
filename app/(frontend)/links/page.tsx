import {
  AHC_DISCORD_URL,
  AHC_INSTAGRAM_URL,
  ZVC_INSTAGRAM_URL,
  ZVC_SITE_URL,
} from '@/app/contsants/constants';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getUpcomingEvents } from '@/utils/getEvents';
import { cn } from '@/utils/utils';
import { Rubik_Glitch } from 'next/font/google';
import Link from 'next/link';

type LinkItem = {
  title: string;
  url: string;
};

const rubikGlitchFont = Rubik_Glitch({
  weight: '400',
  subsets: ['latin'],
});

const siteLink = {
  title: 'Official Site',
  url: `${ZVC_SITE_URL}`,
};

const socialLins: LinkItem[] = [
  {
    title: 'ZVC on Instagram',
    url: `${ZVC_INSTAGRAM_URL}`,
  },
  {
    title: 'AHC on Instagram',
    url: `${AHC_INSTAGRAM_URL}`,
  },
  {
    title: 'Community Discord',
    url: `${AHC_DISCORD_URL}`,
  },
];

export default async function TreeLinkPage() {
  const events = await getUpcomingEvents();

  const eventLinks = events
    .map((event) => ({
      title: event.name,
      url: event.paymentLink ?? null,
    }))
    .filter((link) => link.url !== null) as LinkItem[];

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
      <h1
        className={cn(
          'text-4xl sm:text-5xl font-extrabold text-foreground tracking-tight text-center mb-10',
          rubikGlitchFont.className
        )}
      >
        ZVC LINKS
      </h1>

      <Card className="w-full max-w-sm sm:max-w-md lg:max-w-lg bg-stone-800 text-foreground shadow-2xl rounded-xl transition-all duration-300 hover:scale-[1.015] hover:shadow-stone-800/60">
        <CardContent className="p-6 sm:p-8 space-y-4">
          {[siteLink, ...eventLinks, ...socialLins].map((link) => (
            <Button
              asChild
              key={`${link.title}-link`}
              className="w-full py-3 h-auto text-sm sm:text-base md:text-lg font-semibold rounded-md border border-stone-500 bg-gradient-to-r from-sky-800 via-sky-100 to-stone-300 text-black shadow hover:from-sky-500 hover:to-stone-100 hover:shadow-md transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2"
            >
              <Link
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 truncate text-[clamp(0.95rem,2vw,1.25rem)] w-full"
              >
                {link.title}
              </Link>
            </Button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
