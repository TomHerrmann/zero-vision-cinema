import { withPayload } from '@payloadcms/next/withPayload';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 's7qtxjaxzhtgrxvy.public.blob.vercel-storage.com',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'fzuxxxhgqwm9izz9.public.blob.vercel-storage.com',
        pathname: '**',
      },
      {
        // OMDB poster fallback images
        protocol: 'https',
        hostname: 'm.media-amazon.com',
        pathname: '**',
      },
      {
        // Open Library book covers (Book Club events)
        protocol: 'https',
        hostname: 'covers.openlibrary.org',
        pathname: '**',
      },
      {
        // Substack post cover images (homepage Substack section)
        protocol: 'https',
        hostname: 'substackcdn.com',
        pathname: '**',
      },
    ],
  },
  async redirects() {
    return [
      {
        // The QR code shown before and after screenings points at a bare
        // /join. Tag those visits so Vercel Analytics and the signup's Resend
        // source count them as QR scans. Links that already carry a
        // utm_source (/join?utm_source=ig) go straight through.
        source: '/join',
        missing: [{ type: 'query', key: 'utm_source' }],
        destination: '/join?utm_source=qr&utm_medium=event',
        permanent: false,
      },
    ];
  },
  async rewrites() {
    const seerrHost = process.env.SEERR_HOME_HOST;
    if (!seerrHost) return { beforeFiles: [] };

    return {
      beforeFiles: [
        {
          source: '/:path*',
          has: [{ type: 'host', value: 'requests.zerovisioncinema.com' }],
          destination: `http://${seerrHost}:5055/:path*`,
        },
      ],
    };
  },
};

export default withPayload(nextConfig);
