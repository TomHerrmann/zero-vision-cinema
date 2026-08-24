import {
  MigrateUpArgs,
  MigrateDownArgs,
  sql,
} from '@payloadcms/db-vercel-postgres';

/**
 * Adds the Discord half of the per-event broadcast state to events (and the
 * drafts table `_events_v`): send idempotency timestamps for the announcement
 * and reminder posts, kept separate from the email stamps in 20260801_120000 so
 * a Discord outage can't block or duplicate an email. See
 * app/api/tasks/send-discord-broadcast. Additive, nullable, idempotent.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "discord_announcement_sent_at" timestamp(3) with time zone;
    ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "discord_reminder_sent_at" timestamp(3) with time zone;

    ALTER TABLE "_events_v" ADD COLUMN IF NOT EXISTS "version_discord_announcement_sent_at" timestamp(3) with time zone;
    ALTER TABLE "_events_v" ADD COLUMN IF NOT EXISTS "version_discord_reminder_sent_at" timestamp(3) with time zone;
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "events" DROP COLUMN IF EXISTS "discord_announcement_sent_at";
    ALTER TABLE "events" DROP COLUMN IF EXISTS "discord_reminder_sent_at";
    ALTER TABLE "_events_v" DROP COLUMN IF EXISTS "version_discord_announcement_sent_at";
    ALTER TABLE "_events_v" DROP COLUMN IF EXISTS "version_discord_reminder_sent_at";
  `);
}
