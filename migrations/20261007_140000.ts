import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres';

/**
 * Adds the Horror Brunch (`brunch`) event type to both event-type enums. Its
 * own migration because 20261007_120000 had already run on preview databases
 * when the type was added. Additive and idempotent.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TYPE "enum_events_event_type" ADD VALUE IF NOT EXISTS 'brunch';
    ALTER TYPE "enum__events_v_version_event_type" ADD VALUE IF NOT EXISTS 'brunch';
  `);
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  // Postgres can't drop a single enum value, so `brunch` stays on the enums.
}
