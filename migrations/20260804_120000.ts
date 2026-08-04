import {
  MigrateUpArgs,
  MigrateDownArgs,
  sql,
} from '@payloadcms/db-vercel-postgres';

/**
 * Drops the per-event scheduled QStash message ids added in 20260801_120000.
 *
 * Broadcasts are no longer scheduled one delayed message per event at creation
 * time — QStash rejects delays past 7 days, so an announcement 6 days ahead of
 * an event could never be scheduled for an event created further out. A single
 * daily schedule now queries which events are due each morning (see
 * app/api/tasks/send-due-broadcasts), so there is no message to cancel or
 * reschedule and nothing to store.
 *
 * The `*_sent_at` columns stay: they are now the only guard against a repeat
 * send. Idempotent, and `down()` restores the columns (their values are gone,
 * but they only ever held ids of messages that no longer exist).
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "events" DROP COLUMN IF EXISTS "announcement_message_id";
    ALTER TABLE "events" DROP COLUMN IF EXISTS "reminder_message_id";

    ALTER TABLE "_events_v" DROP COLUMN IF EXISTS "version_announcement_message_id";
    ALTER TABLE "_events_v" DROP COLUMN IF EXISTS "version_reminder_message_id";
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "announcement_message_id" varchar;
    ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "reminder_message_id" varchar;

    ALTER TABLE "_events_v" ADD COLUMN IF NOT EXISTS "version_announcement_message_id" varchar;
    ALTER TABLE "_events_v" ADD COLUMN IF NOT EXISTS "version_reminder_message_id" varchar;
  `);
}
