import type { Metadata } from 'next';
import { Geist, Crimson_Text } from 'next/font/google';
import localFont from 'next/font/local';
import './globals.css';
import { Analytics } from '@vercel/analytics/next';
import { ZVC_SITE_URL } from '../contsants/constants';
import { cn } from '@/utils/utils';
import Nav from '@/components/nav/nav';
import Footer from '@/components/footer/footer';
import { ThemeProvider } from '@/components/theme/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { SpeedInsights } from '@vercel/speed-insights/next';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

// Body copy — Crimson Text (brand spec; fallback Times New Roman)
const crimsonText = Crimson_Text({
  weight: ['400', '600'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  variable: '--font-crimson',
});

// Headline / display — Bootzy Condensed (brand spec; fallback Arial Bold)
const bootzyCondensed = localFont({
  src: '../fonts/bootzy_condensed_tm-webfont.woff2',
  variable: '--font-bootzy-condensed',
  display: 'swap',
  fallback: ['Arial', 'sans-serif'],
});

// Utility / labels — Bootzy (brand spec; fallback Arial Bold, used ALL CAPS)
const bootzy = localFont({
  src: '../fonts/bootzy_tm-webfont.woff2',
  variable: '--font-bootzy',
  display: 'swap',
  fallback: ['Arial', 'sans-serif'],
});

// Rounded display accent — Acid
const acid = localFont({
  src: '../fonts/acid_tm-webfont.woff2',
  variable: '--font-acid',
  display: 'swap',
  fallback: ['Arial', 'sans-serif'],
});

export const metadata: Metadata = {
  title: 'Zero Vision Cinema',
  description:
    'A pop-up movie theater, screening niche movies, genre films, and cult favorites around NYC.',
  metadataBase: new URL(ZVC_SITE_URL),
  alternates: {
    canonical: '/',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body
        className={cn(
          'min-h-screen font-sans antialiased',
          geistSans.variable,
          crimsonText.variable,
          bootzyCondensed.variable,
          bootzy.variable,
          acid.variable
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <header className="relative">
            <Nav />
          </header>
          {children}
          <Footer />
          <Toaster richColors />
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
