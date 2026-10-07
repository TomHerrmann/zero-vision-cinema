import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres';

/**
 * A default venue per event type on the Settings global, so the admin event
 * form pre-fills the venue when a type is picked.
 *
 * Seeded from the venues Tom named (matched by name, first match wins, and only
 * where a default isn't already set): ZVC → SingleCut, AHC → The Ditty, and
 * every other type → Medusa. A venue that doesn't exist yet just leaves that
 * default empty; set it in Settings. Additive and idempotent.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "default_venue_zvc_id" integer;
    CREATE INDEX IF NOT EXISTS "settings_default_venue_zvc_idx" ON "settings" USING btree ("default_venue_zvc_id");
    DO $$ BEGIN
      ALTER TABLE "settings" ADD CONSTRAINT "settings_default_venue_zvc_id_locations_id_fk" FOREIGN KEY ("default_venue_zvc_id") REFERENCES "public"."locations"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "default_venue_ahc_id" integer;
    CREATE INDEX IF NOT EXISTS "settings_default_venue_ahc_idx" ON "settings" USING btree ("default_venue_ahc_id");
    DO $$ BEGIN
      ALTER TABLE "settings" ADD CONSTRAINT "settings_default_venue_ahc_id_locations_id_fk" FOREIGN KEY ("default_venue_ahc_id") REFERENCES "public"."locations"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "default_venue_bookclub_id" integer;
    CREATE INDEX IF NOT EXISTS "settings_default_venue_bookclub_idx" ON "settings" USING btree ("default_venue_bookclub_id");
    DO $$ BEGIN
      ALTER TABLE "settings" ADD CONSTRAINT "settings_default_venue_bookclub_id_locations_id_fk" FOREIGN KEY ("default_venue_bookclub_id") REFERENCES "public"."locations"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "default_venue_rww_id" integer;
    CREATE INDEX IF NOT EXISTS "settings_default_venue_rww_idx" ON "settings" USING btree ("default_venue_rww_id");
    DO $$ BEGIN
      ALTER TABLE "settings" ADD CONSTRAINT "settings_default_venue_rww_id_locations_id_fk" FOREIGN KEY ("default_venue_rww_id") REFERENCES "public"."locations"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "default_venue_fri_id" integer;
    CREATE INDEX IF NOT EXISTS "settings_default_venue_fri_idx" ON "settings" USING btree ("default_venue_fri_id");
    DO $$ BEGIN
      ALTER TABLE "settings" ADD CONSTRAINT "settings_default_venue_fri_id_locations_id_fk" FOREIGN KEY ("default_venue_fri_id") REFERENCES "public"."locations"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "default_venue_brew_id" integer;
    CREATE INDEX IF NOT EXISTS "settings_default_venue_brew_idx" ON "settings" USING btree ("default_venue_brew_id");
    DO $$ BEGIN
      ALTER TABLE "settings" ADD CONSTRAINT "settings_default_venue_brew_id_locations_id_fk" FOREIGN KEY ("default_venue_brew_id") REFERENCES "public"."locations"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "default_venue_bingo_id" integer;
    CREATE INDEX IF NOT EXISTS "settings_default_venue_bingo_idx" ON "settings" USING btree ("default_venue_bingo_id");
    DO $$ BEGIN
      ALTER TABLE "settings" ADD CONSTRAINT "settings_default_venue_bingo_id_locations_id_fk" FOREIGN KEY ("default_venue_bingo_id") REFERENCES "public"."locations"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "default_venue_brunch_id" integer;
    CREATE INDEX IF NOT EXISTS "settings_default_venue_brunch_idx" ON "settings" USING btree ("default_venue_brunch_id");
    DO $$ BEGIN
      ALTER TABLE "settings" ADD CONSTRAINT "settings_default_venue_brunch_id_locations_id_fk" FOREIGN KEY ("default_venue_brunch_id") REFERENCES "public"."locations"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    UPDATE "settings" SET
      "default_venue_zvc_id" = COALESCE("default_venue_zvc_id", (SELECT "id" FROM "locations" WHERE "name" ILIKE ANY (ARRAY['%singlecut%', '%single cut%']) ORDER BY "id" LIMIT 1)),
      "default_venue_ahc_id" = COALESCE("default_venue_ahc_id", (SELECT "id" FROM "locations" WHERE "name" ILIKE ANY (ARRAY['%ditty%']) ORDER BY "id" LIMIT 1)),
      "default_venue_bookclub_id" = COALESCE("default_venue_bookclub_id", (SELECT "id" FROM "locations" WHERE "name" ILIKE ANY (ARRAY['%medusa%']) ORDER BY "id" LIMIT 1)),
      "default_venue_rww_id" = COALESCE("default_venue_rww_id", (SELECT "id" FROM "locations" WHERE "name" ILIKE ANY (ARRAY['%medusa%']) ORDER BY "id" LIMIT 1)),
      "default_venue_fri_id" = COALESCE("default_venue_fri_id", (SELECT "id" FROM "locations" WHERE "name" ILIKE ANY (ARRAY['%medusa%']) ORDER BY "id" LIMIT 1)),
      "default_venue_brew_id" = COALESCE("default_venue_brew_id", (SELECT "id" FROM "locations" WHERE "name" ILIKE ANY (ARRAY['%medusa%']) ORDER BY "id" LIMIT 1)),
      "default_venue_bingo_id" = COALESCE("default_venue_bingo_id", (SELECT "id" FROM "locations" WHERE "name" ILIKE ANY (ARRAY['%medusa%']) ORDER BY "id" LIMIT 1)),
      "default_venue_brunch_id" = COALESCE("default_venue_brunch_id", (SELECT "id" FROM "locations" WHERE "name" ILIKE ANY (ARRAY['%medusa%']) ORDER BY "id" LIMIT 1));
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "settings" DROP CONSTRAINT IF EXISTS "settings_default_venue_zvc_id_locations_id_fk";
    DROP INDEX IF EXISTS "settings_default_venue_zvc_idx";
    ALTER TABLE "settings" DROP COLUMN IF EXISTS "default_venue_zvc_id";
    ALTER TABLE "settings" DROP CONSTRAINT IF EXISTS "settings_default_venue_ahc_id_locations_id_fk";
    DROP INDEX IF EXISTS "settings_default_venue_ahc_idx";
    ALTER TABLE "settings" DROP COLUMN IF EXISTS "default_venue_ahc_id";
    ALTER TABLE "settings" DROP CONSTRAINT IF EXISTS "settings_default_venue_bookclub_id_locations_id_fk";
    DROP INDEX IF EXISTS "settings_default_venue_bookclub_idx";
    ALTER TABLE "settings" DROP COLUMN IF EXISTS "default_venue_bookclub_id";
    ALTER TABLE "settings" DROP CONSTRAINT IF EXISTS "settings_default_venue_rww_id_locations_id_fk";
    DROP INDEX IF EXISTS "settings_default_venue_rww_idx";
    ALTER TABLE "settings" DROP COLUMN IF EXISTS "default_venue_rww_id";
    ALTER TABLE "settings" DROP CONSTRAINT IF EXISTS "settings_default_venue_fri_id_locations_id_fk";
    DROP INDEX IF EXISTS "settings_default_venue_fri_idx";
    ALTER TABLE "settings" DROP COLUMN IF EXISTS "default_venue_fri_id";
    ALTER TABLE "settings" DROP CONSTRAINT IF EXISTS "settings_default_venue_brew_id_locations_id_fk";
    DROP INDEX IF EXISTS "settings_default_venue_brew_idx";
    ALTER TABLE "settings" DROP COLUMN IF EXISTS "default_venue_brew_id";
    ALTER TABLE "settings" DROP CONSTRAINT IF EXISTS "settings_default_venue_bingo_id_locations_id_fk";
    DROP INDEX IF EXISTS "settings_default_venue_bingo_idx";
    ALTER TABLE "settings" DROP COLUMN IF EXISTS "default_venue_bingo_id";
    ALTER TABLE "settings" DROP CONSTRAINT IF EXISTS "settings_default_venue_brunch_id_locations_id_fk";
    DROP INDEX IF EXISTS "settings_default_venue_brunch_idx";
    ALTER TABLE "settings" DROP COLUMN IF EXISTS "default_venue_brunch_id";
  `);
}
