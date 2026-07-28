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
    ],
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
