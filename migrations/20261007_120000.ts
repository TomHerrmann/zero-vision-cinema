import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres';

/**
 * Adds the Rewind Wednesdays (`rww`), Fridays at Medusa (`fri`), Brewscares
 * (`brew`), Bingo (`bingo`) and Horror Brunch (`brunch`) event types: new values on both the events and
 * _events_v enums. No new columns — they reuse the existing event fields.
 * Additive and idempotent, like the `bookclub` migration (20260728_120000).
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TYPE "enum_events_event_type" ADD VALUE IF NOT EXISTS 'rww';
    ALTER TYPE "enum_events_event_type" ADD VALUE IF NOT EXISTS 'fri';
    ALTER TYPE "enum_events_event_type" ADD VALUE IF NOT EXISTS 'brew';
    ALTER TYPE "enum_events_event_type" ADD VALUE IF NOT EXISTS 'bingo';
    ALTER TYPE "enum_events_event_type" ADD VALUE IF NOT EXISTS 'brunch';

    ALTER TYPE "enum__events_v_version_event_type" ADD VALUE IF NOT EXISTS 'rww';
    ALTER TYPE "enum__events_v_version_event_type" ADD VALUE IF NOT EXISTS 'fri';
    ALTER TYPE "enum__events_v_version_event_type" ADD VALUE IF NOT EXISTS 'brew';
    ALTER TYPE "enum__events_v_version_event_type" ADD VALUE IF NOT EXISTS 'bingo';
    ALTER TYPE "enum__events_v_version_event_type" ADD VALUE IF NOT EXISTS 'brunch';
  `);
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  // Postgres can't drop a single enum value, so the new types stay on the
  // enums. Nothing else was added.
}
