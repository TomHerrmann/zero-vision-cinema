import {
  MigrateUpArgs,
  MigrateDownArgs,
  sql,
} from "@payloadcms/db-vercel-postgres";

/**
 * Custom broadcasts can now send immediately:
 *
 *  - `status` 'scheduled' becomes 'send' (Draft / Send)
 *  - new `scheduled` checkbox — on, the entry waits for `send_at`; off, it
 *    sends on save. Every entry that was already 'scheduled' had a `send_at`,
 *    so it is backfilled as scheduled.
 *
 * Idempotent (safe over a database where dev-push already made these), and
 * `down()` reverses both.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      IF EXISTS (
        SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
        WHERE t.typname = 'enum_custom_broadcasts_status' AND e.enumlabel = 'scheduled'
      ) THEN
        ALTER TYPE "public"."enum_custom_broadcasts_status" RENAME VALUE 'scheduled' TO 'send';
      END IF;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "custom_broadcasts" ADD COLUMN "scheduled" boolean DEFAULT false;
      UPDATE "custom_broadcasts" SET "scheduled" = true WHERE "status" = 'send';
    EXCEPTION WHEN duplicate_column THEN null; END $$;
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "custom_broadcasts" DROP COLUMN IF EXISTS "scheduled";

    DO $$ BEGIN
      IF EXISTS (
        SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
        WHERE t.typname = 'enum_custom_broadcasts_status' AND e.enumlabel = 'send'
      ) THEN
        ALTER TYPE "public"."enum_custom_broadcasts_status" RENAME VALUE 'send' TO 'scheduled';
      END IF;
    END $$;
  `);
}
