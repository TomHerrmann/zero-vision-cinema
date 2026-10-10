import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres';

/**
 * Refund requests (collections/RefundRequests): refunds wait for an admin to
 * approve or decline. Keyed to the order and its Stripe customer id (no PII).
 *
 * Additive and idempotent (safe to re-run), so it's backward-compatible with the
 * currently-deployed code.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_refund_requests_status" AS ENUM('pending', 'approved', 'declined');
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN
      CREATE TYPE "public"."enum_refund_requests_source" AS ENUM('buyer', 'admin');
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    CREATE TABLE IF NOT EXISTS "refund_requests" (
      "id" serial PRIMARY KEY NOT NULL,
      "order_id" integer NOT NULL,
      "customer_id" varchar NOT NULL,
      "status" "enum_refund_requests_status" DEFAULT 'pending' NOT NULL,
      "source" "enum_refund_requests_source" NOT NULL,
      "requested_at" timestamp(3) with time zone NOT NULL,
      "decided_at" timestamp(3) with time zone,
      "decided_by_id" integer,
      "stripe_refund_id" varchar,
      "voided_reward_codes" varchar,
      "notified_at" timestamp(3) with time zone,
      "decline_email_sent_at" timestamp(3) with time zone,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
    CREATE INDEX IF NOT EXISTS "refund_requests_order_idx" ON "refund_requests" USING btree ("order_id");
    CREATE INDEX IF NOT EXISTS "refund_requests_customer_id_idx" ON "refund_requests" USING btree ("customer_id");
    CREATE INDEX IF NOT EXISTS "refund_requests_status_idx" ON "refund_requests" USING btree ("status");
    CREATE INDEX IF NOT EXISTS "refund_requests_decided_by_idx" ON "refund_requests" USING btree ("decided_by_id");
    CREATE INDEX IF NOT EXISTS "refund_requests_updated_at_idx" ON "refund_requests" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "refund_requests_created_at_idx" ON "refund_requests" USING btree ("created_at");

    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "refund_requests_id" integer;
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_refund_requests_id_idx" ON "payload_locked_documents_rels" USING btree ("refund_requests_id");

    DO $$ BEGIN
      ALTER TABLE "refund_requests" ADD CONSTRAINT "refund_requests_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN
      ALTER TABLE "refund_requests" ADD CONSTRAINT "refund_requests_decided_by_id_users_id_fk" FOREIGN KEY ("decided_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_refund_requests_fk" FOREIGN KEY ("refund_requests_id") REFERENCES "public"."refund_requests"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_refund_requests_fk";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_refund_requests_id_idx";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "refund_requests_id";
    DROP TABLE IF EXISTS "refund_requests" CASCADE;
    DROP TYPE IF EXISTS "public"."enum_refund_requests_status";
    DROP TYPE IF EXISTS "public"."enum_refund_requests_source";
  `);
}
