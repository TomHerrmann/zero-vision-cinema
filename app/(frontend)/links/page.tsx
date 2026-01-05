import {
  AHC_DISCORD_URL,
  AHC_INSTAGRAM_URL,
  ZVC_INSTAGRAM_URL,
  ZVC_NEWSLETTER_URL,
  ZVC_SITE_URL,
} from '@/app/contsants/constants';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getUpcomingEvents } from '@/utils/getEvents';
import { cn } from '@/utils/utils';
import { Rubik_Glitch } from 'next/font/google';
import Link from 'next/link';

// Revalidate every 5 minutes (300 seconds)
export const revalidate = 300;

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
    .map((event) => ({
      title: event.name,
      url: event.paymentLink ?? null,
    }))
    .filter((link) => link.url !== null) as LinkItem[];

  return (
    <div className="relative min-h-screen bg-background flex flex-col items-center justify-center py-32 md:py-40 px-6 md:px-12">
      {/* Background decorative pattern */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at center, oklch(0.987 0.026 102.212) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
          opacity: 0.02,
        }}
      />

      {/* Distressed texture overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
        }}
      />

      {/* Scratches and grain overlay */}
      <div
        className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(90deg, transparent 0%, transparent 48%, rgba(255,255,255,0.03) 49%, rgba(255,255,255,0.03) 51%, transparent 52%, transparent 100%),
            linear-gradient(0deg, transparent 0%, transparent 48%, rgba(255,255,255,0.02) 49%, rgba(255,255,255,0.02) 51%, transparent 52%, transparent 100%)
          `,
          backgroundSize: '120px 120px, 80px 80px',
        }}
      />

      <div className="relative z-10 w-full max-w-2xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
        {/* Title with gradient effect */}
        <div className="text-center space-y-6">
          <h1
            className={cn(
              'text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight bg-gradient-to-b from-foreground via-foreground to-foreground/60 bg-clip-text text-transparent',
              rubikGlitchFont.className
            )}
          >
            ZVC LINKS
          </h1>
          {/* Gradient divider */}
          <div className="w-32 h-1 mx-auto bg-gradient-to-r from-transparent via-primary to-transparent" />
        </div>

        {/* Links card with decorative elements */}
        <Card className="group relative w-full bg-card/80 backdrop-blur-sm border-2 border-primary/20 shadow-xl hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/20 transition-all duration-300 rounded-xl overflow-hidden">
          {/* Corner accent decorations */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-primary/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-primary/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-primary/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          <CardContent className="p-6 sm:p-8 md:p-10 space-y-4">
            {[siteLink, ...eventLinks, ...socialLins].map((link, idx) => (
              <div
                key={`${link.title}-link`}
                className="animate-in fade-in slide-in-from-bottom-4 duration-500"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <Button
                  asChild
                  className="group/btn relative w-full h-16 py-4 px-6 text-sm sm:text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-[0_0_30px_rgba(255,255,255,0.15)] transition-all duration-300 rounded-xl overflow-hidden"
                >
                  <Link
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={link.title}
                    className="flex items-center justify-center text-center w-full"
                  >
                    {/* Shimmer effect on hover */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />
                    <span className="relative z-10 truncate px-2 text-lg md:text-2xl">
                      {link.title}
                    </span>
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
