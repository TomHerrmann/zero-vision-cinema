'use client';

import Image from 'next/image';
import { cn } from '@/utils/utils';
import { useEffect, useState } from 'react';

export default function Hero() {
  const [scrollY, setScrollY] = useState(0);
  const [allowMotion, setAllowMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setAllowMotion(!mq.matches);
    if (mq.matches) return;

    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section className="relative w-full h-[100svh] min-h-[600px] overflow-hidden bg-blackout">
      {/* Background image with parallax */}
      <div
        className="absolute inset-0 opacity-20"
        style={
          allowMotion
            ? { transform: `translateY(${scrollY * 0.4}px)` }
            : undefined
        }
      >
        <Image
          src="https://s7qtxjaxzhtgrxvy.public.blob.vercel-storage.com/zvc_blank_header.png"
          alt=""
          fill
          aria-hidden="true"
          className="object-cover scale-110"
          priority
        />
      </div>

      {/* Wear-and-tear texture stack */}
      <div
        className="absolute inset-0 zvc-scanlines pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 zvc-grain pointer-events-none"
        aria-hidden="true"
      />
      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(120% 100% at 50% 40%, transparent 40%, rgba(0,0,0,0.55) 100%)',
        }}
      />

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-full px-6 text-center pt-20 pb-32 md:pt-24 md:pb-32">
        {/* Wordmark logo */}
        <h1 className="sr-only">Zero Vision Cinema</h1>
        {/* First-party static SVG; plain img avoids the image optimizer's SVG block */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logos/zvc_logo_logotype_rgb_color_glow-transparent.svg"
          alt="Zero Vision Cinema"
          width={600}
          height={450}
          aria-hidden="true"
          // Height-based clamp so the wordmark shrinks on short viewports,
          // leaving room for the CTAs + scroll cue (avoids overlap).
          // Inline so it can't be affected by a stale/cached Tailwind CSS chunk.
          style={{ height: 'clamp(260px, 40vh, 440px)', width: 'auto' }}
          className={cn(
            'mb-10 zvc-flicker',
            'drop-shadow-[0_0_60px_rgba(255,255,255,0.08)]',
            'animate-in fade-in slide-in-from-bottom-8 duration-1000'
          )}
        />

        {/* Tagline */}
        <p
          className={cn(
            'font-utility uppercase tracking-[0.28em] text-md md:text-xl',
            'text-retro-blue mb-10',
            'animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500'
          )}
        >
          Niche Movies · Genre Films · Cult Classics
        </p>

        {/* CTA Buttons */}
        <div
          className={cn(
            'flex flex-col sm:flex-row gap-4 mb-20 md:mb-0',
            'animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-700'
          )}
        >
          <a href="#events" className="zvc-btn text-base md:text-lg py-4">
            View Upcoming Events
          </a>
          <a
            href="#about"
            className="zvc-btn-outline text-base md:text-lg py-4"
          >
            Learn More
          </a>
        </div>
      </div>

      {/* Scroll indicator */}
      <div
        className={cn(
          'hidden md:flex absolute bottom-8 md:bottom-12 left-1/2 -translate-x-1/2 z-20',
          'flex-col items-center gap-2',
          'text-retro-blue/60 animate-bounce'
        )}
        aria-hidden="true"
      >
        <span className="font-utility text-xs uppercase tracking-[0.3em]">
          Scroll
        </span>
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 14l-7 7m0 0l-7-7m7 7V3"
          />
        </svg>
      </div>

      {/* Bottom fade into next section */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-blackout to-transparent pointer-events-none" />
    </section>
  );
}
