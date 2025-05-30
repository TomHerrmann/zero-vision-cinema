import type { NextConfig } from 'next';

const nextConfig = {
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

export default nextConfig;
