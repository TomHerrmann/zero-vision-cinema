import { ArrowUpRight, Mail } from 'lucide-react';
import {
  AHC_DISCORD_URL,
  AHC_INSTAGRAM_URL,
  ZVC_INSTAGRAM_URL,
  ZVC_SUBSTACK_URL,
  ZVC_TIKTOK_URL,
  ZVC_YOUTUBE_SUBSCRIBE_URL,
} from '@/app/contsants/constants';
import { NewsletterSignupForm } from '@/components/newsletter-signup/newsletter-signup-form';
import SubstackIcon from '@/components/ui/substack-icon';
import {
  DiscordIcon,
  InstagramIcon,
  TikTokIcon,
  YouTubeIcon,
} from '@/components/ui/social-icons';
import { cn } from '@/utils/utils';

const SUBSTACK_SUBSCRIBE_URL = new URL('subscribe', ZVC_SUBSTACK_URL).toString();

type ChannelLink = {
  label: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
};

type Channel = {
  name: string;
  /**
   * One line on what goes out on this channel, in Tom and Mary's words.
   * Left empty until they write it; the card simply skips the line.
   */
  blurb: string;
  links: ChannelLink[];
};

// Instagram and TikTok share one card: the same videos go to both, so they're
// offered as two doors to one feed rather than two things to follow.
const CHANNELS: Channel[] = [
  {
    name: 'YouTube',
    blurb: '',
    links: [
      {
        label: 'Subscribe',
        url: ZVC_YOUTUBE_SUBSCRIBE_URL,
        icon: YouTubeIcon,
      },
    ],
  },
  {
    name: 'Substack',
    blurb: '',
    links: [
      {
        label: 'Subscribe',
        url: SUBSTACK_SUBSCRIBE_URL,
        icon: SubstackIcon,
      },
    ],
  },
  {
    name: 'Instagram & TikTok',
    blurb: '',
    links: [
      { label: 'Instagram', url: ZVC_INSTAGRAM_URL, icon: InstagramIcon },
      { label: 'TikTok', url: ZVC_TIKTOK_URL, icon: TikTokIcon },
    ],
  },
];

const EXTRA_LINKS: ChannelLink[] = [
  {
    label: 'Astoria Horror Club on Instagram',
    url: AHC_INSTAGRAM_URL,
    icon: InstagramIcon,
  },
  { label: 'Join Our Discord', url: AHC_DISCORD_URL, icon: DiscordIcon },
];

function ChannelCard({ channel }: { channel: Channel }) {
  return (
    <div className="zvc-card flex flex-col p-6 md:p-8">
      <h3 className="font-display uppercase text-glow text-2xl md:text-3xl leading-none mb-4">
        {channel.name}
      </h3>
      {channel.blurb && (
        <p className="zvc-body text-glow/70 text-base md:text-lg leading-relaxed mb-6">
          {channel.blurb}
        </p>
      )}
      <div className="mt-auto flex flex-col gap-3">
        {channel.links.map(({ label, url, icon: Icon }) => (
          <a
            key={url}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="zvc-btn justify-center"
          >
            <Icon className="w-4 h-4" />
            {label}
          </a>
        ))}
      </div>
    </div>
  );
}

type Props = {
  /** h1 on the /join page, h2 when it's a section of the homepage. */
  as?: 'h1' | 'h2';
};

/**
 * Email signup plus every channel to follow, in one block. The homepage shows
 * it as a section and /join shows it as the whole page, so the two never drift.
 *
 * Keeps the `newsletter` anchor so older links to /#newsletter still land here.
 */
export default function JoinSection({ as = 'h2' }: Props) {
  const Heading = as;

  return (
    <section
      id="newsletter"
      className={cn(
        'relative pb-16 md:pb-20 overflow-hidden bg-blackout',
        as === 'h1' ? 'pt-32 md:pt-40' : 'pt-24 md:pt-32'
      )}
    >
      {/* Blue riso wash + texture */}
      <div
        className="absolute inset-0 bg-blue-light/10 pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 zvc-halftone pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 zvc-grain pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-5xl mx-auto px-6 md:px-12">
        <div className="flex flex-col items-center text-center mb-12">
          <span className="zvc-badge mb-8">
            <Mail className="w-4 h-4" aria-hidden="true" />
            Stay Updated
          </span>

          <Heading className="zvc-heading text-[2.75rem] md:text-[5rem] lg:text-[6rem] mb-6">
            Join Our Newsletter
          </Heading>

          <span className="zvc-rule mb-8" aria-hidden="true" />

          <p className="zvc-body text-xl md:text-2xl text-glow/80 max-w-2xl mx-auto leading-relaxed">
            Get updates on upcoming screenings, special events, and cult film
            recommendations delivered to your inbox.
          </p>
        </div>

        <NewsletterSignupForm />

        <div className="grid gap-6 md:gap-8 md:grid-cols-3 mt-16 md:mt-20">
          {CHANNELS.map((channel) => (
            <ChannelCard key={channel.name} channel={channel} />
          ))}
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-x-8 gap-y-4 mt-10">
          {EXTRA_LINKS.map(({ label, url, icon: Icon }) => (
            <a
              key={url}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-3 text-foreground/70 hover:text-blue-light transition-colors duration-200 text-lg"
            >
              <span className="zvc-icon-frame w-10 h-10 group-hover:bg-blue-light/20 transition-colors">
                <Icon className="w-5 h-5" />
              </span>
              {label}
              <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
