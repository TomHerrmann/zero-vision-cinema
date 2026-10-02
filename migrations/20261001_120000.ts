import {
  MigrateUpArgs,
  MigrateDownArgs,
  sql,
} from '@payloadcms/db-vercel-postgres';

/**
 * Creates the `custom-broadcasts` collection (hand-written email broadcasts):
 *
 *  - `custom_broadcasts`       the entry itself
 *  - `custom_broadcasts_rels`  its ordered `images` uploads (hasMany → media)
 *  - `payload_locked_documents_rels.custom_broadcasts_id`, which Payload needs
 *    for every collection — without it the admin fails opening any document.
 *
 * Purely additive: nothing the currently deployed code reads is touched, so the
 * previous build keeps working against the migrated database and a code
 * rollback needs no `down()`.
 *
 * Idempotent (safe over a database where dev-push already made these), and
 * `down()` drops everything again.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_custom_broadcasts_status" AS ENUM('draft', 'scheduled');
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum_custom_broadcasts_segment" AS ENUM('main', 'test');
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    CREATE TABLE IF NOT EXISTS "custom_broadcasts" (
      "id" serial PRIMARY KEY NOT NULL,
      "subject" varchar NOT NULL,
      "heading" varchar,
      "body" jsonb NOT NULL,
      "cta_enabled" boolean DEFAULT false,
      "cta_label" varchar,
      "cta_url" varchar,
      "segment" "enum_custom_broadcasts_segment" NOT NULL,
      "status" "enum_custom_broadcasts_status" DEFAULT 'draft' NOT NULL,
      "send_at" timestamp(3) with time zone,
      "resend_broadcast_id" varchar,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "custom_broadcasts_rels" (
      "id" serial PRIMARY KEY NOT NULL,
      "order" integer,
      "parent_id" integer NOT NULL,
      "path" varchar NOT NULL,
      "media_id" integer
    );

    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "custom_broadcasts_id" integer;

    DO $$ BEGIN
      ALTER TABLE "custom_broadcasts_rels" ADD CONSTRAINT "custom_broadcasts_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."custom_broadcasts"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      ALTER TABLE "custom_broadcasts_rels" ADD CONSTRAINT "custom_broadcasts_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_custom_broadcasts_fk" FOREIGN KEY ("custom_broadcasts_id") REFERENCES "public"."custom_broadcasts"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    CREATE INDEX IF NOT EXISTS "custom_broadcasts_updated_at_idx" ON "custom_broadcasts" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "custom_broadcasts_created_at_idx" ON "custom_broadcasts" USING btree ("created_at");
    CREATE INDEX IF NOT EXISTS "custom_broadcasts_rels_order_idx" ON "custom_broadcasts_rels" USING btree ("order");
    CREATE INDEX IF NOT EXISTS "custom_broadcasts_rels_parent_idx" ON "custom_broadcasts_rels" USING btree ("parent_id");
    CREATE INDEX IF NOT EXISTS "custom_broadcasts_rels_path_idx" ON "custom_broadcasts_rels" USING btree ("path");
    CREATE INDEX IF NOT EXISTS "custom_broadcasts_rels_media_id_idx" ON "custom_broadcasts_rels" USING btree ("media_id");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_custom_broadcasts_id_idx" ON "payload_locked_documents_rels" USING btree ("custom_broadcasts_id");
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_custom_broadcasts_fk";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_custom_broadcasts_id_idx";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "custom_broadcasts_id";

    DROP TABLE IF EXISTS "custom_broadcasts_rels" CASCADE;
    DROP TABLE IF EXISTS "custom_broadcasts" CASCADE;
    DROP TYPE IF EXISTS "public"."enum_custom_broadcasts_status";
    DROP TYPE IF EXISTS "public"."enum_custom_broadcasts_segment";
  `);
}
