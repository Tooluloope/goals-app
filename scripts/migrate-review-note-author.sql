-- Migration script to backfill createdById for existing review notes
-- Sets the createdById to the project owner for existing reviews

UPDATE "ReviewNote" rn
SET "createdById" = p."ownerId"
FROM "Project" p
WHERE rn."projectId" = p.id
  AND rn."createdById" IS NULL
  AND p."ownerId" IS NOT NULL;

-- Verify the migration
SELECT
  COUNT(*) as total_reviews,
  COUNT("createdById") as with_author
FROM "ReviewNote";
