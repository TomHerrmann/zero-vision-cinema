import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres';

/**
 * Adds `event_type` (zvc | ahc) to events. Mirrors Payload's select-as-enum
 * pattern used for `_status`, on both the `events` table and the `_events_v`
 * drafts table. Existing rows default to 'zvc' (all current events are ZVC).
 * Additive and idempotent (safe to re-run).
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_events_event_type" AS ENUM('zvc', 'ahc');
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum__events_v_version_event_type" AS ENUM('zvc', 'ahc');
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "event_type"
      "enum_events_event_type" DEFAULT 'zvc';

    ALTER TABLE "_events_v" ADD COLUMN IF NOT EXISTS "version_event_type"
      "enum__events_v_version_event_type" DEFAULT 'zvc';
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "events" DROP COLUMN IF EXISTS "event_type";
    ALTER TABLE "_events_v" DROP COLUMN IF EXISTS "version_event_type";
    DROP TYPE IF EXISTS "public"."enum_events_event_type";
    DROP TYPE IF EXISTS "public"."enum__events_v_version_event_type";
  `);
}
