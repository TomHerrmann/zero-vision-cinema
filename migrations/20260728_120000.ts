import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres';

/**
 * Adds the `bookclub` (Astoria Horror Book Club) event type: a new enum value on
 * both the events and _events_v enums, plus `book_title`, `book_author`, and
 * `open_library_id` columns on both tables. Additive and idempotent.
 *
 * `ALTER TYPE ... ADD VALUE` runs fine inside the migration transaction on
 * Postgres 12+ (Neon is PG15) because the new value isn't used in the same
 * transaction.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TYPE "enum_events_event_type" ADD VALUE IF NOT EXISTS 'bookclub';
    ALTER TYPE "enum__events_v_version_event_type" ADD VALUE IF NOT EXISTS 'bookclub';

    ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "book_title" varchar;
    ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "book_author" varchar;
    ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "open_library_id" varchar;

    ALTER TABLE "_events_v" ADD COLUMN IF NOT EXISTS "version_book_title" varchar;
    ALTER TABLE "_events_v" ADD COLUMN IF NOT EXISTS "version_book_author" varchar;
    ALTER TABLE "_events_v" ADD COLUMN IF NOT EXISTS "version_open_library_id" varchar;
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Note: Postgres can't drop a single enum value, so `bookclub` remains on the
  // type. Only the columns are reverted.
  await db.execute(sql`
    ALTER TABLE "events" DROP COLUMN IF EXISTS "book_title";
    ALTER TABLE "events" DROP COLUMN IF EXISTS "book_author";
    ALTER TABLE "events" DROP COLUMN IF EXISTS "open_library_id";
    ALTER TABLE "_events_v" DROP COLUMN IF EXISTS "version_book_title";
    ALTER TABLE "_events_v" DROP COLUMN IF EXISTS "version_book_author";
    ALTER TABLE "_events_v" DROP COLUMN IF EXISTS "version_open_library_id";
  `);
}
