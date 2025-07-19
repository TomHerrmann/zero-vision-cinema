import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import { Analytics } from '@vercel/analytics/next';
import { domain } from '../contsants/constants';
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

export const metadata: Metadata = {
  title: 'Zero Vision Cinema',
  description: 'An pop-up microcinema screening niche films around NYC.',
  metadataBase: new URL(domain),
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
        className={cn('min-h-screen font-sans antialiased', geistSans.variable)}
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
