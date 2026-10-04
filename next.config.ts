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
        // Short link for the QR code shown before and after screenings. Points
        // at the newsletter signup; the utm tags let Vercel Analytics count
        // visits that came from a QR scan. Not permanent, so the target can
        // change later without reprinting the QR.
        source: '/join',
        destination: '/?utm_source=qr&utm_medium=event#newsletter',
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
