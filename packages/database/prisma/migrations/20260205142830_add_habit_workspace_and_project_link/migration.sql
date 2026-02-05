/*
  Warnings:

  - Added the required column `workspaceId` to the `Habit` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Habit_userId_isArchived_idx";

-- AlterTable
ALTER TABLE "Habit" ADD COLUMN     "projectId" TEXT,
ADD COLUMN     "weight" INTEGER,
ADD COLUMN     "workspaceId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "MonthlyReview" ADD COLUMN     "submitted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "submittedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "WeeklyReview" ADD COLUMN     "submitted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "submittedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Habit_workspaceId_idx" ON "Habit"("workspaceId");

-- CreateIndex
CREATE INDEX "Habit_workspaceId_isArchived_idx" ON "Habit"("workspaceId", "isArchived");

-- CreateIndex
CREATE INDEX "Habit_projectId_idx" ON "Habit"("projectId");

-- AddForeignKey
ALTER TABLE "Habit" ADD CONSTRAINT "Habit_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Habit" ADD CONSTRAINT "Habit_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
