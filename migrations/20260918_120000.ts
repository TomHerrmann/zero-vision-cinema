import {
  MigrateUpArgs,
  MigrateDownArgs,
  sql,
} from '@payloadcms/db-vercel-postgres';

/**
 * Loyalty rewards + the Settings global.
 *
 * - `rewards`: single-use free-ticket codes, keyed to a Stripe customer id (no
 *   PII). See lib/loyalty.
 * - `orders.earned_reward_id` (the reward a paid order counted toward) and
 *   `orders.redeemed_reward_id` (the reward that paid for a free order).
 *   `receipt_url` becomes nullable: free orders have no Stripe charge.
 * - `settings`: admin-editable site settings. Seeded with the default ticket
 *   price so new events pre-fill it; staff change it in the admin from then on.
 *
 * Additive and idempotent (safe to re-run), so it's backward-compatible with the
 * currently-deployed code.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "rewards" (
      "id" serial PRIMARY KEY NOT NULL,
      "code" varchar NOT NULL,
      "customer_id" varchar NOT NULL,
      "issued_at" timestamp(3) with time zone NOT NULL,
      "expires_at" timestamp(3) with time zone NOT NULL,
      "redeemed_at" timestamp(3) with time zone,
      "redeemed_order_id" integer,
      "voided_at" timestamp(3) with time zone,
      "void_reason" varchar,
      "reward_email_sent_at" timestamp(3) with time zone,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS "rewards_code_idx" ON "rewards" USING btree ("code");
    CREATE INDEX IF NOT EXISTS "rewards_customer_id_idx" ON "rewards" USING btree ("customer_id");
    CREATE INDEX IF NOT EXISTS "rewards_redeemed_order_idx" ON "rewards" USING btree ("redeemed_order_id");
    CREATE INDEX IF NOT EXISTS "rewards_updated_at_idx" ON "rewards" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "rewards_created_at_idx" ON "rewards" USING btree ("created_at");

    ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "earned_reward_id" integer;
    ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "redeemed_reward_id" integer;
    ALTER TABLE "orders" ALTER COLUMN "receipt_url" DROP NOT NULL;
    CREATE INDEX IF NOT EXISTS "orders_customer_id_idx" ON "orders" USING btree ("customer_id");
    CREATE INDEX IF NOT EXISTS "orders_earned_reward_idx" ON "orders" USING btree ("earned_reward_id");
    CREATE INDEX IF NOT EXISTS "orders_redeemed_reward_idx" ON "orders" USING btree ("redeemed_reward_id");

    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "rewards_id" integer;
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_rewards_id_idx" ON "payload_locked_documents_rels" USING btree ("rewards_id");

    CREATE TABLE IF NOT EXISTS "settings" (
      "id" serial PRIMARY KEY NOT NULL,
      "default_ticket_price" numeric NOT NULL,
      "updated_at" timestamp(3) with time zone,
      "created_at" timestamp(3) with time zone
    );
    INSERT INTO "settings" ("default_ticket_price", "updated_at", "created_at")
      SELECT 13, now(), now()
      WHERE NOT EXISTS (SELECT 1 FROM "settings");

    DO $$ BEGIN
      ALTER TABLE "rewards" ADD CONSTRAINT "rewards_redeemed_order_id_orders_id_fk" FOREIGN KEY ("redeemed_order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN
      ALTER TABLE "orders" ADD CONSTRAINT "orders_earned_reward_id_rewards_id_fk" FOREIGN KEY ("earned_reward_id") REFERENCES "public"."rewards"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN
      ALTER TABLE "orders" ADD CONSTRAINT "orders_redeemed_reward_id_rewards_id_fk" FOREIGN KEY ("redeemed_reward_id") REFERENCES "public"."rewards"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_rewards_fk" FOREIGN KEY ("rewards_id") REFERENCES "public"."rewards"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_rewards_fk";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_rewards_id_idx";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "rewards_id";

    ALTER TABLE "orders" DROP CONSTRAINT IF EXISTS "orders_earned_reward_id_rewards_id_fk";
    ALTER TABLE "orders" DROP CONSTRAINT IF EXISTS "orders_redeemed_reward_id_rewards_id_fk";
    DROP INDEX IF EXISTS "orders_customer_id_idx";
    DROP INDEX IF EXISTS "orders_earned_reward_idx";
    DROP INDEX IF EXISTS "orders_redeemed_reward_idx";
    ALTER TABLE "orders" DROP COLUMN IF EXISTS "earned_reward_id";
    ALTER TABLE "orders" DROP COLUMN IF EXISTS "redeemed_reward_id";
    -- receipt_url stays nullable: free orders may exist with no receipt.

    DROP TABLE IF EXISTS "rewards" CASCADE;
    DROP TABLE IF EXISTS "settings" CASCADE;
  `);
}
