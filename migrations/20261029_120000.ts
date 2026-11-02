import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres';

/**
 * payload 3.91 adds a hidden `resetPasswordRequestedAt` date field to auth
 * collections (used to rate-limit forgot-password requests). Without the
 * column, every users read fails with `column users.reset_password_requested_at
 * does not exist`, so admin login returns "Server error".
 *
 * Additive and idempotent (safe to re-run), so it's backward-compatible with the
 * currently-deployed code.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "reset_password_requested_at" timestamp(3) with time zone;
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "users" DROP COLUMN IF EXISTS "reset_password_requested_at";
  `);
}
