-- Migration script to add workspaceId to AI tables
-- Run this script before running prisma db push

-- Step 1: Add workspaceId column as nullable to all AI tables
ALTER TABLE "AiSummary" ADD COLUMN IF NOT EXISTS "workspaceId" TEXT;
ALTER TABLE "AiConversation" ADD COLUMN IF NOT EXISTS "workspaceId" TEXT;
ALTER TABLE "AiInsight" ADD COLUMN IF NOT EXISTS "workspaceId" TEXT;
ALTER TABLE "AiDailyText" ADD COLUMN IF NOT EXISTS "workspaceId" TEXT;

-- Step 2: Update existing records to use the user's default workspace
-- For AiSummary
UPDATE "AiSummary" AS ai
SET "workspaceId" = COALESCE(
    u."defaultWorkspaceId",
    (SELECT w.id FROM "Workspace" w WHERE w."ownerId" = ai."userId" AND w.type = 'personal' LIMIT 1)
)
FROM "User" u
WHERE ai."userId" = u.id AND ai."workspaceId" IS NULL;

-- For AiConversation
UPDATE "AiConversation" AS ai
SET "workspaceId" = COALESCE(
    u."defaultWorkspaceId",
    (SELECT w.id FROM "Workspace" w WHERE w."ownerId" = ai."userId" AND w.type = 'personal' LIMIT 1)
)
FROM "User" u
WHERE ai."userId" = u.id AND ai."workspaceId" IS NULL;

-- For AiInsight
UPDATE "AiInsight" AS ai
SET "workspaceId" = COALESCE(
    u."defaultWorkspaceId",
    (SELECT w.id FROM "Workspace" w WHERE w."ownerId" = ai."userId" AND w.type = 'personal' LIMIT 1)
)
FROM "User" u
WHERE ai."userId" = u.id AND ai."workspaceId" IS NULL;

-- For AiDailyText
UPDATE "AiDailyText" AS ai
SET "workspaceId" = COALESCE(
    u."defaultWorkspaceId",
    (SELECT w.id FROM "Workspace" w WHERE w."ownerId" = ai."userId" AND w.type = 'personal' LIMIT 1)
)
FROM "User" u
WHERE ai."userId" = u.id AND ai."workspaceId" IS NULL;

-- Step 3: Make workspaceId NOT NULL
ALTER TABLE "AiSummary" ALTER COLUMN "workspaceId" SET NOT NULL;
ALTER TABLE "AiConversation" ALTER COLUMN "workspaceId" SET NOT NULL;
ALTER TABLE "AiInsight" ALTER COLUMN "workspaceId" SET NOT NULL;
ALTER TABLE "AiDailyText" ALTER COLUMN "workspaceId" SET NOT NULL;

-- Step 4: Drop old unique constraints and add new ones
-- AiSummary
ALTER TABLE "AiSummary" DROP CONSTRAINT IF EXISTS "AiSummary_userId_type_periodStart_key";
ALTER TABLE "AiSummary" ADD CONSTRAINT "AiSummary_userId_workspaceId_type_periodStart_key" UNIQUE ("userId", "workspaceId", "type", "periodStart");

-- AiDailyText
ALTER TABLE "AiDailyText" DROP CONSTRAINT IF EXISTS "AiDailyText_userId_date_key";
ALTER TABLE "AiDailyText" ADD CONSTRAINT "AiDailyText_userId_workspaceId_date_key" UNIQUE ("userId", "workspaceId", "date");

-- Step 5: Add indexes for workspaceId
CREATE INDEX IF NOT EXISTS "AiSummary_workspaceId_idx" ON "AiSummary"("workspaceId");
CREATE INDEX IF NOT EXISTS "AiConversation_workspaceId_idx" ON "AiConversation"("workspaceId");
CREATE INDEX IF NOT EXISTS "AiInsight_workspaceId_idx" ON "AiInsight"("workspaceId");
CREATE INDEX IF NOT EXISTS "AiDailyText_workspaceId_idx" ON "AiDailyText"("workspaceId");

-- Verify the migration
SELECT 'AiSummary' as table_name, COUNT(*) as total, COUNT("workspaceId") as with_workspace FROM "AiSummary"
UNION ALL
SELECT 'AiConversation', COUNT(*), COUNT("workspaceId") FROM "AiConversation"
UNION ALL
SELECT 'AiInsight', COUNT(*), COUNT("workspaceId") FROM "AiInsight"
UNION ALL
SELECT 'AiDailyText', COUNT(*), COUNT("workspaceId") FROM "AiDailyText";
