'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Button } from '../ui/button';
import { MobileNav } from './mobile-nav';
import { mainMenu } from '@/menu.config';
import { Rubik_Glitch } from 'next/font/google';

const rubikGlitchFont = Rubik_Glitch({
  weight: '400',
  subsets: ['latin'],
});

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
        scrolled ? 'bg-background' : 'bg-transparent'
      )}
    >
      <div className="mx-auto py-4 px-6 sm:px-8 flex justify-between items-center">
        {scrolled ? (
          <Link
            className="hover:opacity-75 transition-all flex gap-4 items-center"
            href="/"
          >
            <h2
              className={`${rubikGlitchFont.className} text-[1.5rem] md:text-[2rem]`}
            >
              Zero Vision Cinema
            </h2>
          </Link>
        ) : (
          <div />
        )}
        <div className="flex items-center gap-2">
          <div className="mx-2 hidden md:flex">
            {Object.entries(mainMenu).map(([key, href]) => (
              <Link
                key={href}
                href={href}
                className="text-[1.7rem] hover:underline pr-4"
              >
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </Link>
            ))}
          </div>
          <MobileNav />
        </div>
      </div>
    </nav>
  );
}
