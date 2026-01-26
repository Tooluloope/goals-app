-- Migration: Convert areaId (single) to areaIds (array) for multi-area support
-- This migration allows projects to belong to multiple areas

-- Step 1: Add the new areaIds column as a text array with default empty array
ALTER TABLE "Project" ADD COLUMN "areaIds" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Step 2: Migrate existing areaId data to areaIds array
-- Each existing areaId becomes a single-element array
UPDATE "Project" SET "areaIds" = ARRAY["areaId"] WHERE "areaId" IS NOT NULL;

-- Step 3: Drop the old areaId index
DROP INDEX IF EXISTS "Project_areaId_idx";

-- Step 4: Drop the old areaId column
ALTER TABLE "Project" DROP COLUMN "areaId";
