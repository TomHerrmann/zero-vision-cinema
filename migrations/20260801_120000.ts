import {
  MigrateUpArgs,
  MigrateDownArgs,
  sql,
} from '@payloadcms/db-vercel-postgres';

/**
 * Adds the per-event announcement/reminder broadcast state to events (and the
 * drafts table `_events_v`): the scheduled QStash message ids (for cancel/
 * reschedule) and the send idempotency timestamps. See lib/broadcasts and
 * app/api/tasks/send-broadcast. Additive, nullable, idempotent (safe to re-run).
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "announcement_message_id" varchar;
    ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "reminder_message_id" varchar;
    ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "announcement_sent_at" timestamp(3) with time zone;
    ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "reminder_sent_at" timestamp(3) with time zone;

    ALTER TABLE "_events_v" ADD COLUMN IF NOT EXISTS "version_announcement_message_id" varchar;
    ALTER TABLE "_events_v" ADD COLUMN IF NOT EXISTS "version_reminder_message_id" varchar;
    ALTER TABLE "_events_v" ADD COLUMN IF NOT EXISTS "version_announcement_sent_at" timestamp(3) with time zone;
    ALTER TABLE "_events_v" ADD COLUMN IF NOT EXISTS "version_reminder_sent_at" timestamp(3) with time zone;
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "events" DROP COLUMN IF EXISTS "announcement_message_id";
    ALTER TABLE "events" DROP COLUMN IF EXISTS "reminder_message_id";
    ALTER TABLE "events" DROP COLUMN IF EXISTS "announcement_sent_at";
    ALTER TABLE "events" DROP COLUMN IF EXISTS "reminder_sent_at";
    ALTER TABLE "_events_v" DROP COLUMN IF EXISTS "version_announcement_message_id";
    ALTER TABLE "_events_v" DROP COLUMN IF EXISTS "version_reminder_message_id";
    ALTER TABLE "_events_v" DROP COLUMN IF EXISTS "version_announcement_sent_at";
    ALTER TABLE "_events_v" DROP COLUMN IF EXISTS "version_reminder_sent_at";
  `);
}
