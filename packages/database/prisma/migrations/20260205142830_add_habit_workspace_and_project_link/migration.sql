-- DropIndex
DROP INDEX IF EXISTS "Habit_userId_isArchived_idx";

-- AlterTable: Add columns as nullable first
ALTER TABLE "Habit" ADD COLUMN IF NOT EXISTS "projectId" TEXT;
ALTER TABLE "Habit" ADD COLUMN IF NOT EXISTS "weight" INTEGER;
ALTER TABLE "Habit" ADD COLUMN IF NOT EXISTS "workspaceId" TEXT;

-- Backfill workspaceId for existing habits from user's personal workspace
UPDATE "Habit" h
SET "workspaceId" = (
  SELECT w.id FROM "Workspace" w
  WHERE w."ownerId" = h."userId" AND w."type" = 'personal'
  LIMIT 1
)
WHERE h."workspaceId" IS NULL;

-- Fallback: for any remaining habits without a workspace, use ANY workspace owned by the user
UPDATE "Habit" h
SET "workspaceId" = (
  SELECT w.id FROM "Workspace" w
  WHERE w."ownerId" = h."userId"
  LIMIT 1
)
WHERE h."workspaceId" IS NULL;

-- Make workspaceId NOT NULL after backfill (only if no NULLs remain)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "Habit" WHERE "workspaceId" IS NULL) THEN
    ALTER TABLE "Habit" ALTER COLUMN "workspaceId" SET NOT NULL;
  ELSE
    RAISE NOTICE 'WARNING: Some habits still have NULL workspaceId, skipping NOT NULL constraint';
  END IF;
END $$;

-- AlterTable (these are safe - adding with defaults)
ALTER TABLE "MonthlyReview" ADD COLUMN IF NOT EXISTS "submitted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "MonthlyReview" ADD COLUMN IF NOT EXISTS "submittedAt" TIMESTAMP(3);

ALTER TABLE "WeeklyReview" ADD COLUMN IF NOT EXISTS "submitted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "WeeklyReview" ADD COLUMN IF NOT EXISTS "submittedAt" TIMESTAMP(3);

-- CreateIndex (with IF NOT EXISTS for safety)
CREATE INDEX IF NOT EXISTS "Habit_workspaceId_idx" ON "Habit"("workspaceId");
CREATE INDEX IF NOT EXISTS "Habit_workspaceId_isArchived_idx" ON "Habit"("workspaceId", "isArchived");
CREATE INDEX IF NOT EXISTS "Habit_projectId_idx" ON "Habit"("projectId");

-- AddForeignKey (only if not exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Habit_workspaceId_fkey') THEN
    ALTER TABLE "Habit" ADD CONSTRAINT "Habit_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Habit_projectId_fkey') THEN
    ALTER TABLE "Habit" ADD CONSTRAINT "Habit_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
