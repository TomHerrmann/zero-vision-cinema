import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres';

/**
 * Checkout moved from Stripe Checkout Sessions to PaymentIntents. Adds
 * `payment_intent_id` to orders (unique; how new orders are keyed and
 * de-duplicated) and makes the legacy `checkout_session_id` nullable (historical
 * orders keep their session id, new orders won't have one). Additive and
 * expand-only, so it is safe on existing rows and backward-compatible with the
 * currently-deployed code. Idempotent (safe to re-run).
 *
 * Hand-written to match the repo's existing migration style; a generated
 * migration isn't safe here because `20260722_150000` has no schema snapshot.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "payment_intent_id" varchar;
    ALTER TABLE "orders" ALTER COLUMN "checkout_session_id" DROP NOT NULL;
    CREATE UNIQUE INDEX IF NOT EXISTS "orders_payment_intent_id_idx" ON "orders" USING btree ("payment_intent_id");
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "orders_payment_intent_id_idx";
    ALTER TABLE "orders" DROP COLUMN IF EXISTS "payment_intent_id";
  `);
}
