import { Mail } from 'lucide-react';
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
import SubscribeCalendar from '@/components/subscribe-calendar/subscribe-calendar';
import { cn } from '@/utils/utils';

const SUBSTACK_SUBSCRIBE_URL = new URL('subscribe', ZVC_SUBSTACK_URL).toString();

type Channel = {
  name: string;
  /**
   * One line on what goes out on this channel, in Tom and Mary's words.
   * Left empty until they write it; the card simply skips the line.
   */
  blurb: string;
  label: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
};

const CHANNELS: Channel[] = [
  {
    name: 'YouTube',
    blurb: '',
    label: 'Subscribe',
    url: ZVC_YOUTUBE_SUBSCRIBE_URL,
    icon: YouTubeIcon,
  },
  {
    name: 'Substack',
    blurb: '',
    label: 'Subscribe',
    url: SUBSTACK_SUBSCRIBE_URL,
    icon: SubstackIcon,
  },
  {
    name: 'Instagram',
    blurb: '',
    label: 'Follow',
    url: ZVC_INSTAGRAM_URL,
    icon: InstagramIcon,
  },
  {
    name: 'TikTok',
    blurb: '',
    label: 'Follow',
    url: ZVC_TIKTOK_URL,
    icon: TikTokIcon,
  },
  {
    name: 'Astoria Horror Club',
    blurb: '',
    label: 'Follow',
    url: AHC_INSTAGRAM_URL,
    icon: InstagramIcon,
  },
  {
    name: 'Discord',
    blurb: '',
    label: 'Join',
    url: AHC_DISCORD_URL,
    icon: DiscordIcon,
  },
];

function ChannelCard({ channel }: { channel: Channel }) {
  const { name, blurb, label, url, icon: Icon } = channel;

  return (
    <div className="zvc-card flex flex-col p-6 md:p-8">
      <h3 className="font-display uppercase text-glow text-2xl md:text-3xl leading-none mb-4">
        {name}
      </h3>
      {blurb && (
        <p className="zvc-body text-glow/70 text-base md:text-lg leading-relaxed mb-6">
          {blurb}
        </p>
      )}
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="zvc-btn justify-center mt-auto"
      >
        <Icon className="w-4 h-4" />
        {label}
      </a>
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

        <div className="flex justify-center mt-10">
          <SubscribeCalendar />
        </div>

        <div className="grid gap-6 md:gap-8 sm:grid-cols-2 lg:grid-cols-3 mt-16 md:mt-20">
          {CHANNELS.map((channel) => (
            <ChannelCard key={channel.name} channel={channel} />
          ))}
        </div>
      </div>
    </section>
  );
}
