import {
  MigrateUpArgs,
  MigrateDownArgs,
  sql,
} from '@payloadcms/db-vercel-postgres';

/**
 * Adds the fields backing per-attendee event reminders (see
 * app/api/tasks/send-event-reminder): per-reminder idempotency timestamps, the
 * scheduled QStash message ids (for cancellation), and a refund marker. Buyer
 * email is intentionally NOT stored — it's resolved from Stripe by customer id
 * at send time. All additive, nullable, and idempotent (safe to re-run), so it
 * stays backward-compatible with the currently-deployed code.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "pre_event_email_sent_at" timestamp(3) with time zone;
    ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "day_of_email_sent_at" timestamp(3) with time zone;
    ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "pre_event_message_id" varchar;
    ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "day_of_message_id" varchar;
    ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "refunded_at" timestamp(3) with time zone;
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "orders" DROP COLUMN IF EXISTS "pre_event_email_sent_at";
    ALTER TABLE "orders" DROP COLUMN IF EXISTS "day_of_email_sent_at";
    ALTER TABLE "orders" DROP COLUMN IF EXISTS "pre_event_message_id";
    ALTER TABLE "orders" DROP COLUMN IF EXISTS "day_of_message_id";
    ALTER TABLE "orders" DROP COLUMN IF EXISTS "refunded_at";
  `);
}
