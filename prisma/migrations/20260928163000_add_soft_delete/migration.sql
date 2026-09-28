-- AlterTable: Add deletedAt and missing timestamps with safe defaults
ALTER TABLE "AttendanceRecord" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "deletedAt" TIMESTAMP(3);

ALTER TABLE "AttendanceSession" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "deletedAt" TIMESTAMP(3);

ALTER TABLE "Enrollment" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "deletedAt" TIMESTAMP(3);

ALTER TABLE "Student" ADD COLUMN "deletedAt" TIMESTAMP(3);

ALTER TABLE "Subject" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- Replace standard unique indexes with Partial Unique Indexes (WHERE "deletedAt" IS NULL)
DROP INDEX IF EXISTS "Student_studentNumber_key";
CREATE UNIQUE INDEX "Student_studentNumber_active_key" ON "Student"("studentNumber") WHERE "deletedAt" IS NULL;

DROP INDEX IF EXISTS "Subject_code_teacherId_key";
CREATE UNIQUE INDEX "Subject_code_teacherId_active_key" ON "Subject"("code", "teacherId") WHERE "deletedAt" IS NULL;

DROP INDEX IF EXISTS "Enrollment_subjectId_studentId_key";
CREATE UNIQUE INDEX "Enrollment_subjectId_studentId_active_key" ON "Enrollment"("subjectId", "studentId") WHERE "deletedAt" IS NULL;

DROP INDEX IF EXISTS "AttendanceRecord_sessionId_studentId_key";
CREATE UNIQUE INDEX "AttendanceRecord_sessionId_studentId_active_key" ON "AttendanceRecord"("sessionId", "studentId") WHERE "deletedAt" IS NULL;
