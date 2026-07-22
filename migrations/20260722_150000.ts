import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres';

/**
 * Adds `imdbId` to events and makes `image`/`description` optional. Ticket pages
 * route by event id, and movie data is fetched from OMDB at render time (cached
 * 30 days) — there is no Movies table and no slug. Columns are nullable and
 * additive (expand-only), so this is safe on existing rows and backward-
 * compatible with the currently-deployed code. Idempotent (safe to re-run).
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "imdb_id" varchar;
    ALTER TABLE "events" ALTER COLUMN "image_id" DROP NOT NULL;
    ALTER TABLE "events" ALTER COLUMN "description" DROP NOT NULL;

    ALTER TABLE "_events_v" ADD COLUMN IF NOT EXISTS "version_imdb_id" varchar;
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "events" DROP COLUMN IF EXISTS "imdb_id";
    ALTER TABLE "_events_v" DROP COLUMN IF EXISTS "version_imdb_id";
  `);
}
