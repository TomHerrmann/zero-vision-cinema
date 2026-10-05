import {
  MigrateUpArgs,
  MigrateDownArgs,
  sql,
} from '@payloadcms/db-vercel-postgres';

/**
 * Adds `payment_link_id` — the Stripe `plink_…` id of an event's payment link.
 *
 * `payment_link` stores the customer-facing URL, whose last path segment is a
 * short code rather than the link's id, so it could never be passed to the
 * Stripe API. Existing rows stay null; the Events `beforeChange` hook backfills
 * each one the first time it needs the id (see `resolvePaymentLinkId`).
 *
 * Idempotent, and `down()` drops the columns again.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "payment_link_id" varchar;
    CREATE UNIQUE INDEX IF NOT EXISTS "events_payment_link_id_idx" ON "events" USING btree ("payment_link_id");

    ALTER TABLE "_events_v" ADD COLUMN IF NOT EXISTS "version_payment_link_id" varchar;
    CREATE INDEX IF NOT EXISTS "_events_v_version_version_payment_link_id_idx" ON "_events_v" USING btree ("version_payment_link_id");
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "events_payment_link_id_idx";
    ALTER TABLE "events" DROP COLUMN IF EXISTS "payment_link_id";

    DROP INDEX IF EXISTS "_events_v_version_version_payment_link_id_idx";
    ALTER TABLE "_events_v" DROP COLUMN IF EXISTS "version_payment_link_id";
  `);
}
