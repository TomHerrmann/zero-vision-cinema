// storage-adapter-import-placeholder
import { vercelPostgresAdapter } from '@payloadcms/db-vercel-postgres';
import { payloadCloudPlugin } from '@payloadcms/payload-cloud';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import path from 'path';
import { buildConfig } from 'payload';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import { resendAdapter } from '@payloadcms/email-resend';
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob';
import { stripePlugin } from '@payloadcms/plugin-stripe';

import { Users } from './collections/Users';
import { Media } from './collections/Media';
import { Events } from './collections/Events';
import { Locations } from './collections/Locations';
import { Orders } from './collections/Orders';
import { Merch } from './collections/Merch';
import { Authors } from './collections/Authors';
import { Articles } from './collections/Articles';
import { CustomBroadcasts } from './collections/CustomBroadcasts';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    // The ZVC theme in app/(payload)/custom.scss is built for dark only.
    theme: 'dark',
    meta: {
      titleSuffix: ' · ZVC Admin',
      icons: [
        {
          rel: 'icon',
          type: 'image/svg+xml',
          url: '/logos/zvc_logo_logomark_rgb_color.svg',
        },
      ],
    },
    components: {
      graphics: {
        Logo: '/components/admin/AdminLogo#AdminLogo',
        Icon: '/components/admin/AdminIcon#AdminIcon',
      },
      beforeNavLinks: ['/components/admin/AdminNavBrand#AdminNavBrand'],
      views: {
        dashboard: {
          Component: '/components/admin/AdminDashboard#AdminDashboard',
        },
      },
    },
  },
  // Order sets the admin sidebar: groups appear in the order their first
  // collection does here.
  collections: [
    Events,
    Locations,
    Orders,
    Articles,
    Authors,
    CustomBroadcasts,
    Merch,
    Media,
    Users,
  ],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: vercelPostgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
  }),
  sharp,
  email: resendAdapter({
    defaultFromAddress: 'boo@astoriahorrorclub.com',
    defaultFromName: 'Astoria Horror Club',
    apiKey: process.env.RESEND_API_KEY || '',
  }),
  plugins: [
    payloadCloudPlugin(),
    payloadCloudPlugin(),
    vercelBlobStorage({
      enabled: true,
      collections: { media: true },
      token: process.env.BLOB_READ_WRITE_TOKEN || '',
    }),
    stripePlugin({
      stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
    }),
  ],
});
