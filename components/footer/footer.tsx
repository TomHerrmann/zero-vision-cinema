import { getMainMenu } from '@/menu.config';
import Link from 'next/link';
import {
  ADDRESS_LINE_1,
  ADDRESS_LINE_2,
  ZVC_EMAIL_ADDRESS,
  LLC_NAME,
  ZVC_INSTAGRAM_URL,
  ZVC_TIKTOK_URL,
  ZVC_SUBSTACK_URL,
  ZVC_YOUTUBE_URL,
  PARTIFUL_URL,
  AHC_DISCORD_URL,
} from '@/app/contsants/constants';
import { cn } from '@/utils/utils';
import { Mail, MapPin } from 'lucide-react';
import SubstackIcon from '@/components/ui/substack-icon';
import {
  DiscordIcon,
  InstagramIcon,
  TikTokIcon,
  YouTubeIcon,
} from '@/components/ui/social-icons';

const Footer = () => {
  const menu = getMainMenu();

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
              {Object.entries(menu).map(([key, href]) => (
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
                href={ZVC_YOUTUBE_URL}
                target="_blank"
                className={cn(
                  'group flex items-center gap-3 text-foreground/70',
                  'hover:text-blue-light transition-colors duration-200',
                  'justify-center md:justify-start'
                )}
              >
                <div className="zvc-icon-frame w-10 h-10 group-hover:bg-blue-light/20 transition-colors">
                  <YouTubeIcon className="w-5 h-5" />
                </div>
                <span className="text-lg">Subscribe on YouTube</span>
              </Link>

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
                  <TikTokIcon className="w-5 h-5" />
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
                  <InstagramIcon className="w-5 h-5" />
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
                  <DiscordIcon className="w-5 h-5" />
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

            {/* Legal */}
            <nav className="flex gap-6 text-base">
              <Link
                href="/press"
                className="hover:text-blue-light transition-colors duration-200"
              >
                Press
              </Link>
              <Link
                href="/privacy"
                className="hover:text-blue-light transition-colors duration-200"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="hover:text-blue-light transition-colors duration-200"
              >
                Terms of Service
              </Link>
            </nav>

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
