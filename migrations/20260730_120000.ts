import {
  MigrateUpArgs,
  MigrateDownArgs,
  sql,
} from '@payloadcms/db-vercel-postgres';

/**
 * Adds `ticket_email_sent_at` to orders. Set by the ticket-email background task
 * (see app/api/tasks/send-ticket-email) once the email is accepted by Resend;
 * used as the delivery-idempotency guard against QStash's at-least-once redelivery.
 * Additive, nullable, and idempotent (safe to re-run), so it is backward-
 * compatible with the currently-deployed code.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "orders"
      ADD COLUMN IF NOT EXISTS "ticket_email_sent_at" timestamp(3) with time zone;
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "orders" DROP COLUMN IF EXISTS "ticket_email_sent_at";
  `);
}
