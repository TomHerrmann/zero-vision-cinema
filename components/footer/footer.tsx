import { mainMenu } from '@/menu.config';
import Link from 'next/link';
import {
  ADDRESS_LINE_1,
  ADDRESS_LINE_2,
  ZVC_EMAIL_ADDRESS,
  LLC_NAME,
  ZVC_INSTAGRAM_URL,
  ZVC_TIKTOK_URL,
  ZVC_SUBSTACK_URL,
  PARTIFUL_URL,
  AHC_DISCORD_URL,
} from '@/app/contsants/constants';
import { cn } from '@/utils/utils';
import { Mail, MapPin } from 'lucide-react';
import SubstackIcon from '@/components/ui/substack-icon';

const Footer = () => {
  return (
    <footer className="relative bg-blackout border-t-2 border-blue-light/20 overflow-hidden">
      {/* Texture */}
      <div
        className="absolute inset-0 zvc-grain pointer-events-none"
        aria-hidden="true"
      />
      {/* Top ragged rule */}
      <div
        className="absolute top-0 left-0 right-0 h-1.5"
        aria-hidden="true"
        style={{
          backgroundImage:
            'repeating-linear-gradient(90deg, var(--color-blue-light) 0 14px, transparent 14px 24px)',
          opacity: 0.5,
        }}
      />

      <div className="relative z-10 max-w-[1600px] mx-auto px-6 md:px-12 py-16 md:py-24">
        {/* Main footer content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-16 mb-16">
          {/* Site Map */}
          <div className="text-center md:text-left">
            <h5
              className={cn(
                'font-display uppercase text-2xl md:text-3xl mb-6',
                'text-foreground'
              )}
            >
              Site Map
            </h5>
            <nav className="flex flex-col gap-3">
              {Object.entries(mainMenu).map(([key, href]) => (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'text-foreground/70 hover:text-blue-light',
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
            <h5
              className={cn(
                'font-display uppercase text-2xl md:text-3xl mb-6',
                'text-foreground'
              )}
            >
              Contact
            </h5>
            <div className="space-y-4">
              <Link
                href={ZVC_TIKTOK_URL}
                target="_blank"
                className={cn(
                  'group flex items-center gap-3 text-foreground/70',
                  'hover:text-blue-light transition-colors duration-200',
                  'justify-center md:justify-start'
                )}
              >
                <div className="zvc-icon-frame w-10 h-10 group-hover:bg-blue-light/20 transition-colors">
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                  </svg>
                </div>
                <span className="text-lg">Follow Us on TikTok</span>
              </Link>

              <Link
                href={ZVC_INSTAGRAM_URL}
                target="_blank"
                className={cn(
                  'group flex items-center gap-3 text-foreground/70',
                  'hover:text-blue-light transition-colors duration-200',
                  'justify-center md:justify-start'
                )}
              >
                <div className="zvc-icon-frame w-10 h-10 group-hover:bg-blue-light/20 transition-colors">
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </div>
                <span className="text-lg">Follow Us on Instagram</span>
              </Link>

              <Link
                href={ZVC_SUBSTACK_URL}
                target="_blank"
                className={cn(
                  'group flex items-center gap-3 text-foreground/70',
                  'hover:text-blue-light transition-colors duration-200',
                  'justify-center md:justify-start'
                )}
              >
                <div className="zvc-icon-frame w-10 h-10 group-hover:bg-blue-light/20 transition-colors">
                  <SubstackIcon className="w-5 h-5" />
                </div>
                <span className="text-lg">Subscribe to Our Substack</span>
              </Link>

              <Link
                href={PARTIFUL_URL}
                target="_blank"
                className={cn(
                  'group flex items-center gap-3 text-foreground/70',
                  'hover:text-blue-light transition-colors duration-200',
                  'justify-center md:justify-start'
                )}
              >
                <div className="zvc-icon-frame w-10 h-10 group-hover:bg-blue-light/20 transition-colors">
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M10.55 0.02C10.07 0.08 8.65 0.18 7.75 0.39C6.84 0.59 5.85 0.91 5.11 1.25C4.37 1.59 3.75 2.05 3.31 2.4C2.88 2.75 2.7 3.05 2.5 3.35C2.3 3.65 2.2 3.87 2.13 4.2C2.05 4.53 1.98 4.95 2.05 5.35C2.12 5.74 2.25 6.17 2.55 6.57C2.86 6.97 3.18 7.27 3.87 7.73C4.55 8.18 6.1 8.91 6.68 9.3C7.26 9.7 7.2 9.84 7.35 10.09C7.51 10.35 7.6 10.56 7.63 10.81C7.67 11.06 7.64 11.36 7.57 11.6C7.5 11.84 7.43 11.99 7.21 12.25C6.99 12.52 6.71 12.85 6.24 13.2C5.76 13.54 4.93 13.94 4.37 14.33C3.81 14.71 3.26 15.13 2.86 15.5C2.46 15.88 2.22 16.15 1.98 16.56C1.74 16.98 1.51 17.44 1.41 18C1.31 18.57 1.28 19.31 1.4 19.94C1.52 20.58 1.8 21.29 2.12 21.81C2.44 22.34 2.83 22.76 3.3 23.11C3.77 23.46 4.42 23.75 4.95 23.9C5.47 24.05 6 24.02 6.45 23.99C6.9 23.95 7.23 23.86 7.65 23.68C8.07 23.5 8.57 23.23 8.97 22.9C9.37 22.56 9.81 22.03 10.07 21.67C10.34 21.31 10.42 21.11 10.56 20.73C10.69 20.36 10.82 19.86 10.86 19.44C10.9 19.02 10.91 18.77 10.79 18.22C10.66 17.67 10.2 16.6 10.11 16.13C10.01 15.67 10.14 15.61 10.23 15.41C10.31 15.22 10.45 15.04 10.62 14.95C10.8 14.85 10.84 14.76 11.27 14.82C11.7 14.87 12.6 15.2 13.21 15.28C13.82 15.36 14.37 15.34 14.94 15.28C15.5 15.22 16.1 15.07 16.59 14.93C17.08 14.78 17.35 14.71 17.89 14.43C18.42 14.16 19.28 13.68 19.83 13.28C20.37 12.88 20.79 12.43 21.15 12.03C21.5 11.64 21.71 11.32 21.94 10.88C22.16 10.45 22.38 9.99 22.5 9.45C22.63 8.91 22.7 8.24 22.68 7.65C22.66 7.06 22.57 6.5 22.36 5.92C22.15 5.35 21.85 4.75 21.43 4.2C21.01 3.64 20.45 3.08 19.83 2.6C19.2 2.12 18.4 1.66 17.67 1.32C16.94 0.98 16.21 0.73 15.44 0.53C14.67 0.32 13.87 0.18 13.07 0.09C12.27 0.01 11.04 0.03 10.62 0.02C10.2 0 11.03 -0.05 10.55 0.02ZM7.17 3.98C7.5 3.97 8.44 3.91 9.11 3.95C9.79 4 10.65 4.15 11.2 4.25C11.75 4.35 11.86 4.31 12.44 4.56C13.01 4.8 14.13 5.38 14.65 5.72C15.17 6.05 15.3 6.21 15.58 6.54C15.87 6.88 16.19 7.37 16.36 7.72C16.54 8.07 16.59 8.27 16.63 8.66C16.68 9.04 16.68 9.64 16.63 10.02C16.58 10.41 16.51 10.62 16.35 10.96C16.2 11.29 15.95 11.73 15.71 12.03C15.47 12.34 15.22 12.58 14.94 12.81C14.65 13.03 14.41 13.21 14 13.37C13.6 13.53 13.27 13.7 12.49 13.77C11.71 13.85 10.11 13.71 9.33 13.82C8.55 13.94 8.17 14.25 7.82 14.47C7.47 14.69 7.4 14.86 7.23 15.13C7.06 15.39 7 15.27 6.81 16.06C6.62 16.85 6.28 19.15 6.09 19.87C5.9 20.59 5.91 20.27 5.66 20.38C5.41 20.5 4.92 20.6 4.58 20.57C4.25 20.54 3.92 20.41 3.65 20.19C3.38 19.98 3.1 19.66 2.96 19.3C2.82 18.93 2.77 18.42 2.82 18C2.86 17.58 3.07 17.13 3.25 16.78C3.44 16.43 3.62 16.22 3.92 15.92C4.21 15.61 4.06 15.64 5.02 14.95C5.97 14.25 8.75 12.42 9.64 11.75C10.54 11.07 10.2 11.16 10.36 10.88C10.52 10.61 10.62 10.39 10.63 10.09C10.64 9.8 10.56 9.38 10.41 9.11C10.25 8.84 10.03 8.68 9.69 8.49C9.35 8.31 9.15 8.2 8.38 8.01C7.61 7.82 5.76 7.51 5.09 7.35C4.42 7.18 4.58 7.16 4.37 7.02C4.16 6.87 3.94 6.72 3.83 6.5C3.71 6.28 3.61 5.98 3.68 5.71C3.75 5.43 3.92 5.09 4.22 4.84C4.53 4.59 5.04 4.35 5.52 4.21C6 4.08 6.83 4.06 7.1 4.02C7.38 3.98 6.83 3.99 7.17 3.98Z"
                    />
                  </svg>
                </div>
                <span className="text-lg">Follow Us on Partiful</span>
              </Link>

              <Link
                href={AHC_DISCORD_URL}
                target="_blank"
                className={cn(
                  'group flex items-center gap-3 text-foreground/70',
                  'hover:text-blue-light transition-colors duration-200',
                  'justify-center md:justify-start'
                )}
              >
                <div className="zvc-icon-frame w-10 h-10 group-hover:bg-blue-light/20 transition-colors">
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419-.0189 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
                  </svg>
                </div>
                <span className="text-lg">Join Our Discord</span>
              </Link>

              <Link
                href={`mailto:${ZVC_EMAIL_ADDRESS}`}
                target="_blank"
                className={cn(
                  'group flex items-center gap-3 text-foreground/70',
                  'hover:text-blue-light transition-colors duration-200',
                  'justify-center md:justify-start'
                )}
              >
                <div className="zvc-icon-frame w-10 h-10 group-hover:bg-blue-light/20 transition-colors">
                  {/* Slightly smaller than the w-5 social glyphs: the lucide
                      envelope fills its viewBox edge-to-edge, so w-4 gives it
                      side padding matching the compact filled social icons. */}
                  <Mail className="w-4 h-4" />
                </div>
                <span className="text-lg">{ZVC_EMAIL_ADDRESS}</span>
              </Link>
            </div>
          </div>

          {/* Address */}
          <div className="text-center md:text-left">
            <h5
              className={cn(
                'font-display uppercase text-2xl md:text-3xl mb-6',
                'text-foreground'
              )}
            >
              Address
            </h5>
            <div className="flex items-start gap-3 text-foreground/70 justify-center md:justify-start">
              <div className="zvc-icon-frame w-10 h-10 flex-shrink-0 mt-1">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <address className="not-italic text-lg leading-relaxed text-left">
                <strong className="text-foreground block mb-1">
                  {LLC_NAME}
                </strong>
                <p>{ADDRESS_LINE_1}</p>
                <p>{ADDRESS_LINE_2}</p>
              </address>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t-2 border-blue-light/15">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-foreground/60">
            {/* Logo/Brand */}
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logos/zvc_logo_logomark_rgb_color.svg"
                alt="Zero Vision Cinema logo"
                className="w-10 h-10 object-contain"
              />
              <span className="font-display uppercase text-xl text-foreground/80">
                Zero Vision Cinema
              </span>
            </div>

            {/* Copyright */}
            <p className="text-base">
              &copy; {new Date().getFullYear()} {LLC_NAME}. All rights reserved.
            </p>

            {/* Made with love */}
            <p className="font-utility uppercase tracking-widest text-base text-foreground/40">
              Bringing cult cinema to NYC
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
