import {
  MigrateUpArgs,
  MigrateDownArgs,
  sql,
} from '@payloadcms/db-vercel-postgres';

/**
 * Adds the refund markers on orders: `refunded_at` and the refund-email
 * idempotency guard `refund_email_sent_at`. Additive, nullable, and idempotent
 * (safe to re-run), so it stays backward-compatible with deployed code.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "refunded_at" timestamp(3) with time zone;
    ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "refund_email_sent_at" timestamp(3) with time zone;
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "orders" DROP COLUMN IF EXISTS "refunded_at";
    ALTER TABLE "orders" DROP COLUMN IF EXISTS "refund_email_sent_at";
  `);
}
