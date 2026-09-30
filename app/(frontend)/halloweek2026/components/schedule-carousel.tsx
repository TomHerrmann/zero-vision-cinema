'use client';

import { useEffect, useState } from 'react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { cn } from '@/utils/utils';

type Props = {
  /** Server-rendered event cards, one per slide. */
  slides: React.ReactNode[];
  /** Accessible name per slide, e.g. "Saturday, October 24 — Scary Streets". */
  labels: string[];
};

/** Arrow position: outside the track once there's gutter for it (2xl), else
 *  overlaid just inside the edge so it can never push past the viewport. */
const arrowBase =
  'absolute top-1/2 -translate-y-1/2 z-10 bg-blackout/80 backdrop-blur-sm';

/**
 * The Halloweek lineup as a looping carousel — two cards at a time, so each
 * is wide enough to lay its artwork beside the copy rather than above it, and
 * the neighbouring night stays visible while you read.
 *
 * The track runs wider than the page's other content on purpose. Every card
 * in a row is as tall as the tallest, and that height is set by the longest
 * blurb wrapping in the text column — so a roomier column means fewer lines,
 * shorter cards, and less slack in the ones with less to say.
 *
 * Phones get a plain vertical stack instead (see `page.tsx`): a card carrying
 * a full blurb runs taller than a phone screen, and reading that inside a
 * horizontal swipe means fighting two scroll axes at once.
 *
 * Arrows advance by a single event rather than a whole page, which keeps the
 * cards you were just reading on screen. The track doesn't loop: it starts on
 * the 24th and stops on the 31st, so the arrows disable at each end and the
 * week reads in order rather than wrapping round.
 */
export default function ScheduleCarousel({ slides, labels }: Props) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [snapCount, setSnapCount] = useState(0);
  // Mirrored into state rather than read during render, so the arrows settle
  // correctly once embla has measured (it reports no scrolling before that).
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  useEffect(() => {
    if (!api) return;

    const sync = () => {
      setCurrent(api.selectedScrollSnap());
      setSnapCount(api.scrollSnapList().length);
      setCanPrev(api.canScrollPrev());
      setCanNext(api.canScrollNext());
    };

    sync();
    api.on('select', sync);
    // Fires on mount once measured, and on every resize — so the dots follow
    // the breakpoint without a resize listener of our own.
    api.on('reInit', sync);

    return () => {
      api.off('select', sync);
      api.off('reInit', sync);
    };
  }, [api]);

  return (
    <div className="max-w-7xl mx-auto">
      <Carousel setApi={setApi} opts={{ align: 'start' }}>
        {/* `items-stretch` makes every card as tall as the tallest, so
            un-truncated blurbs of differing lengths still line up in a row. */}
        <CarouselContent className="items-stretch">
          {slides.map((slide, i) => (
            <CarouselItem
              key={i}
              aria-label={labels[i]}
              aria-roledescription="slide"
              className="basis-1/2"
            >
              {slide}
            </CarouselItem>
          ))}
        </CarouselContent>

        <Button
          variant="outline"
          size="icon"
          onClick={() => api?.scrollPrev()}
          disabled={!canPrev}
          aria-label="Previous event"
          className={cn(arrowBase, 'left-1 2xl:-left-14')}
        >
          <ArrowLeft />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => api?.scrollNext()}
          disabled={!canNext}
          aria-label="Next event"
          className={cn(arrowBase, 'right-1 2xl:-right-14')}
        >
          <ArrowRight />
        </Button>
      </Carousel>

      {/* Position indicator — one dot per scroll position. */}
      <ol className="flex items-center justify-center gap-2 mt-8">
        {Array.from({ length: snapCount }, (_, i) => (
          <li key={i}>
            <button
              type="button"
              onClick={() => api?.scrollTo(i)}
              aria-label={`Show events starting with ${labels[i]}`}
              aria-current={i === current ? 'true' : undefined}
              className={cn(
                'block w-3 h-3 border-2 transition-colors',
                i === current
                  ? 'bg-blue-light border-blue-light'
                  : 'bg-transparent border-glow/40 hover:border-blue-light',
              )}
            />
          </li>
        ))}
      </ol>
    </div>
  );
}
