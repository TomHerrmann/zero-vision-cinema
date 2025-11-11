import { mainMenu } from '@/menu.config';
import Link from 'next/link';
import {
  ADDRESS_LINE_1,
  ADDRESS_LINE_2,
  ZVC_EMAIL_ADDRESS,
  LLC_NAME,
} from '@/app/contsants/constants';
import { cn } from '@/utils/utils';
import { Mail, MapPin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="relative bg-gradient-to-b from-background to-card border-t border-primary/10">
      {/* Top decorative line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      <div className="max-w-[1600px] mx-auto px-6 md:px-12 py-16 md:py-24">
        {/* Main footer content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-16 mb-16">
          {/* Site Map */}
          <div className="text-center md:text-left">
            <h5 className={cn(
              'font-rubik-glitch text-2xl md:text-3xl mb-6',
              'text-foreground'
            )}>
              Site Map
            </h5>
            <nav className="flex flex-col gap-3">
              {Object.entries(mainMenu).map(([key, href]) => (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'text-foreground/70 hover:text-primary',
                    'transition-colors duration-200',
                    'text-lg hover:translate-x-1 inline-block',
                    'transition-transform'
                  )}
                >
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </Link>
              ))}
            </nav>
          </div>

          {/* Contact */}
          <div className="text-center md:text-left">
            <h5 className={cn(
              'font-rubik-glitch text-2xl md:text-3xl mb-6',
              'text-foreground'
            )}>
              Contact
            </h5>
            <div className="space-y-4">
              <Link
                href="https://www.instagram.com/zerovisioncinema/"
                target="_blank"
                className={cn(
                  'group flex items-center gap-3 text-foreground/70',
                  'hover:text-primary transition-colors duration-200',
                  'justify-center md:justify-start'
                )}
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </div>
                <span className="text-lg">Follow Us on Instagram</span>
              </Link>

              <Link
                href={`mailto:${ZVC_EMAIL_ADDRESS}`}
                target="_blank"
                className={cn(
                  'group flex items-center gap-3 text-foreground/70',
                  'hover:text-primary transition-colors duration-200',
                  'justify-center md:justify-start'
                )}
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Mail className="w-5 h-5" />
                </div>
                <span className="text-lg">{ZVC_EMAIL_ADDRESS}</span>
              </Link>
            </div>
          </div>

          {/* Address */}
          <div className="text-center md:text-left">
            <h5 className={cn(
              'font-rubik-glitch text-2xl md:text-3xl mb-6',
              'text-foreground'
            )}>
              Address
            </h5>
            <div className="flex items-start gap-3 text-foreground/70 justify-center md:justify-start">
              <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 mt-1">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <address className="not-italic text-lg leading-relaxed text-left">
                <strong className="text-foreground block mb-1">{LLC_NAME}</strong>
                <p>{ADDRESS_LINE_1}</p>
                <p>{ADDRESS_LINE_2}</p>
              </address>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-primary/10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-foreground/60">
            {/* Logo/Brand */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 border-2 border-primary/30 flex items-center justify-center">
                <span className="font-rubik-glitch text-primary text-xl">ZVC</span>
              </div>
              <span className="font-rubik-glitch text-xl text-foreground/80">
                Zero Vision Cinema
              </span>
            </div>

            {/* Copyright */}
            <p className="text-base">
              &copy; {new Date().getFullYear()} {LLC_NAME}. All rights reserved.
            </p>

            {/* Made with love */}
            <p className="text-sm text-foreground/40">
              Bringing cult cinema to NYC
            </p>
          </div>
        </div>
      </div>

      {/* Bottom gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
    </footer>
  );
};

export default Footer;
