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
    ],
  },
};

export default withPayload(nextConfig);
