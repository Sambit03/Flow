-- Migration: workflow lifecycle columns
-- Adds status (draft | published | paused), version counter, and publishedAt
-- to support a proper draft → published ⇄ paused state machine.

ALTER TABLE "workflows"
  ADD COLUMN "status" text NOT NULL DEFAULT 'draft',
  ADD COLUMN "version" integer NOT NULL DEFAULT 0,
  ADD COLUMN "published_at" timestamp with time zone;

-- Back-fill: active workflows were effectively "published" before this migration
UPDATE "workflows"
  SET "status" = 'published', "version" = 1, "published_at" = "updated_at"
  WHERE "is_active" = true AND "deleted_at" IS NULL;
