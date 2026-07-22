'use client';

import Image from 'next/image';
import { cn } from '@/utils/utils';
import { useEffect, useState } from 'react';

export default function Hero() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section className="relative w-full h-[100svh] min-h-[600px] overflow-hidden">
      {/* Animated gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background/95 to-accent-color/30 animate-gradient-shift" />

      {/* Background image with parallax */}
      <div
        className="absolute inset-0 opacity-20"
        style={{ transform: `translateY(${scrollY * 0.5}px)` }}
      >
        <Image
          src="https://s7qtxjaxzhtgrxvy.public.blob.vercel-storage.com/zvc_blank_header.png"
          alt="Hero Image"
          fill
          className="object-cover scale-110"
          priority
        />
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(to right, oklch(0.987 0.026 102.212) 1px, transparent 1px),
                             linear-gradient(to bottom, oklch(0.987 0.026 102.212) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-full px-6 text-center pt-20 pb-32 md:pt-0 md:pb-0">
        {/* Glowing accent line */}
        <div className="w-24 h-1 bg-gradient-to-r from-transparent via-primary to-transparent mb-8 animate-pulse" />

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
          // Sized inline so it can't be affected by a stale/cached Tailwind CSS chunk
          style={{ height: 'clamp(450px, 50vw, 440px)', width: 'auto' }}
          className={cn(
            'mb-12',
            'drop-shadow-[0_0_60px_rgba(255,255,255,0.1)]',
            'animate-in fade-in slide-in-from-bottom-10 duration-1000'
          )}
        />

        {/* Tagline */}
        <p
          className={cn(
            'text-lg md:text-xl lg:text-2xl max-w-3xl mx-auto',
            'text-foreground/70 font-light tracking-wide mb-12',
            'animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-500'
          )}
        >
          Niche Movies, Genre Films, and Cult Classics
        </p>

        {/* CTA Buttons */}
        <div
          className={cn(
            'flex flex-col sm:flex-row gap-4 mb-20 md:mb-0',
            'animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-700'
          )}
        >
          <a
            href="#events"
            className={cn(
              'group relative px-8 py-4 text-lg font-medium',
              'bg-primary text-primary-foreground',
              'hover:bg-primary/90 transition-all duration-300',
              'border border-primary/20',
              'overflow-hidden'
            )}
          >
            <span className="relative z-10">View Upcoming Events</span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          </a>

          <a
            href="#about"
            className={cn(
              'group px-8 py-4 text-lg font-medium',
              'border-2 border-primary/30 text-foreground',
              'hover:border-primary hover:bg-primary/10',
              'transition-all duration-300',
              'backdrop-blur-sm'
            )}
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
          'text-foreground/40 animate-bounce'
        )}
      >
        <span className="text-xs uppercase tracking-widest">Scroll</span>
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

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}
