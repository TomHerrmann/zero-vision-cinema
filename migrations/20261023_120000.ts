import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres';

/**
 * Adds `film_format` (digital | vhs | 16mm) to events and their drafts table.
 * Existing rows default to 'digital', except Rewind Wednesdays, which is a VHS
 * night. Book Club rows are left at the default; the field is hidden for them
 * and never shown. Additive and idempotent (safe to re-run).
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_events_film_format" AS ENUM('digital', 'vhs', '16mm');
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum__events_v_version_film_format" AS ENUM('digital', 'vhs', '16mm');
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      ALTER TABLE "events" ADD COLUMN "film_format"
        "enum_events_film_format" DEFAULT 'digital';
      UPDATE "events" SET "film_format" = 'vhs' WHERE "event_type" = 'rww';
    EXCEPTION WHEN duplicate_column THEN null; END $$;

    DO $$ BEGIN
      ALTER TABLE "_events_v" ADD COLUMN "version_film_format"
        "enum__events_v_version_film_format" DEFAULT 'digital';
      UPDATE "_events_v" SET "version_film_format" = 'vhs'
        WHERE "version_event_type" = 'rww';
    EXCEPTION WHEN duplicate_column THEN null; END $$;
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "events" DROP COLUMN IF EXISTS "film_format";
    ALTER TABLE "_events_v" DROP COLUMN IF EXISTS "version_film_format";
    DROP TYPE IF EXISTS "public"."enum_events_film_format";
    DROP TYPE IF EXISTS "public"."enum__events_v_version_film_format";
  `);
}
