import type { MetadataRoute } from 'next';
import { ZVC_CANONICAL_URL } from '@/app/contsants/constants';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api/', '/refund'],
    },
    sitemap: `${ZVC_CANONICAL_URL}/sitemap.xml`,
  };
}
