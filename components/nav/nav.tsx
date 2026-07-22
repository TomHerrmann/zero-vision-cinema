'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/utils/utils';
import Link from 'next/link';
import { MobileNav } from './mobile-nav';
import { mainMenu } from '@/menu.config';

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 175) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={cn(
        'fixed w-full z-50 top-0 transition-all duration-300',
        scrolled
          ? 'bg-background/95 backdrop-blur-md border-b border-primary/10 shadow-lg'
          : 'bg-transparent'
      )}
    >
      <div className="max-w-[1600px] mx-auto py-4 px-6 md:px-8 flex justify-between items-center">
        {scrolled ? (
          <Link
            className="hover:opacity-80 transition-opacity flex gap-3 items-center group"
            href="/"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logos/zvc_logo_logomark_rgb_color.svg"
              alt="Zero Vision Cinema logo"
              className="w-10 h-10 object-contain group-hover:scale-105 transition-transform"
            />
            <h2 className="font-display text-[1.5rem] md:text-[2rem] text-foreground">
              Zero Vision Cinema
            </h2>
          </Link>
        ) : (
          <div />
        )}
        <div className="flex items-center gap-2">
          <div className="mx-2 hidden md:flex items-center gap-1">
            {Object.entries(mainMenu).map(([key, href]) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'px-4 py-2 text-lg font-medium capitalize',
                  'text-foreground/90 hover:text-primary',
                  'transition-all duration-200',
                  'relative group',
                  scrolled ? '' : 'drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]'
                )}
              >
                {key}
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300" />
              </Link>
            ))}
          </div>
          <MobileNav />
        </div>
      </div>
    </nav>
  );
}
