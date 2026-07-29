import {
  MigrateUpArgs,
  MigrateDownArgs,
  sql,
} from '@payloadcms/db-vercel-postgres';

/**
 * Adds the missing `capacity` column to locations.
 * This is additive and idempotent, so it can be safely applied to existing
 * deployments where the schema is out-of-sync with the collection config.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "locations"
      ADD COLUMN IF NOT EXISTS "capacity" numeric NOT NULL DEFAULT 0;
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "locations" DROP COLUMN IF EXISTS "capacity";
  `);
}
