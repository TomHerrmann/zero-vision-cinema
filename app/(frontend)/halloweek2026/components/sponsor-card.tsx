import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ImageIcon, Tag } from 'lucide-react';
import { cn } from '@/utils/utils';
import CopyCodeButton from './copy-code-button';
import type { HalloweekSponsor } from '../halloweek.data';

type Props = { sponsor: HalloweekSponsor };

/**
 * A Halloweek sponsor: who they are, plus any offer for the ZVC community.
 * Sponsors run their own ticketing, so an `offer.url` leaves the site — the
 * only outbound ticket link on an otherwise free, unticketed page.
 */
export default function SponsorCard({ sponsor }: Props) {
  const { offer } = sponsor;

  return (
    <article className="flex flex-col md:flex-row gap-6 md:gap-10 p-6 md:p-10 border-2 border-glow/15 bg-card">
      {/* Logo / key art in a 4:5 frame, matching the event cards. Sponsor art
          doesn't share one ratio — a square wordmark, a 4:5 poster, a 2:1
          production still — so `contain` is the default: each is shown whole
          and letterboxed on the dark panel rather than cropped. Set
          `imageFit: 'cover'` where the asset is already 4:5. */}
      <div className="relative w-full max-w-[280px] mx-auto aspect-[4/5] overflow-hidden bg-blackout/60 border border-glow/10 md:mx-0 md:w-[240px] md:min-w-[240px] md:max-w-none md:self-center">
        {sponsor.image ? (
          <Image
            src={sponsor.image}
            alt={sponsor.name}
            fill
            className={cn(
              'p-2',
              sponsor.imageFit === 'cover'
                ? 'object-cover p-0'
                : 'object-contain',
            )}
            sizes="(max-width: 768px) 280px, 240px"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-glow/20">
            <ImageIcon className="w-10 h-10" />
            <span className="font-utility uppercase text-xs tracking-[0.2em]">
              Image TBA
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-5 flex-1 min-w-0">
        <h3 className="zvc-heading text-3xl md:text-4xl">{sponsor.name}</h3>
        <span className="zvc-rule" aria-hidden="true" />

        <div className="flex flex-col gap-4">
          {sponsor.blurb.map((paragraph, i) => (
            <p
              key={i}
              className="zvc-body text-base md:text-lg leading-relaxed"
            >
              {paragraph}
            </p>
          ))}
        </div>

        {sponsor.extra && (
          <div className="border-l-2 border-blue-light/40 pl-5">
            <h4 className="font-utility uppercase text-sm tracking-[0.2em] text-blue-light mb-2">
              {sponsor.extra.heading}
            </h4>
            <p className="zvc-body text-base leading-relaxed">
              {sponsor.extra.body}
            </p>
          </div>
        )}

        {offer && (
          <div className="mt-auto flex flex-col gap-4 p-5 bg-blue-light/10 border border-blue-light/25">
            <div className="flex items-start gap-3">
              <Tag
                className="w-5 h-5 shrink-0 mt-0.5 text-blue-light"
                aria-hidden="true"
              />
              <p className="zvc-body text-base md:text-lg leading-relaxed">
                {offer.text}
              </p>
            </div>

            {offer.code && (
              <p className="flex flex-wrap items-center gap-3">
                <span className="font-utility uppercase text-xs tracking-[0.2em] text-glow/60">
                  Promo code
                </span>
                <CopyCodeButton code={offer.code} />
              </p>
            )}

            {offer.url && (
              <Button asChild variant="outline" className="self-start">
                <Link
                  href={offer.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {offer.ctaLabel ?? 'Learn more'}
                </Link>
              </Button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
