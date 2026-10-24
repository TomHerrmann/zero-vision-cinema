import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres';

/**
 * @payloadcms/storage-vercel-blob 3.91 (via plugin-cloud-storage) adds a hidden
 * `_objectKey` text field to every upload collection it manages. Without the
 * column, every media read fails with `column "_objectkey" does not exist`.
 *
 * Additive and idempotent (safe to re-run), so it's backward-compatible with the
 * currently-deployed code.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "_objectkey" varchar;
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "media" DROP COLUMN IF EXISTS "_objectkey";
  `);
}
