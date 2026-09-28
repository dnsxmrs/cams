-- Add missing createdAt column to Enrollment
ALTER TABLE "Enrollment" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Drop old standard unique indexes if present
DROP INDEX IF EXISTS "Student_studentNumber_key";
DROP INDEX IF EXISTS "Subject_code_teacherId_key";
DROP INDEX IF EXISTS "Enrollment_subjectId_studentId_key";
DROP INDEX IF EXISTS "AttendanceRecord_sessionId_studentId_key";

-- Re-create active partial unique indexes (WHERE "deletedAt" IS NULL) so soft-deleted rows do not block creation
DROP INDEX IF EXISTS "Student_studentNumber_active_key";
CREATE UNIQUE INDEX "Student_studentNumber_active_key" ON "Student"("studentNumber") WHERE "deletedAt" IS NULL;

DROP INDEX IF EXISTS "Subject_code_teacherId_active_key";
CREATE UNIQUE INDEX "Subject_code_teacherId_active_key" ON "Subject"("code", "teacherId") WHERE "deletedAt" IS NULL;

DROP INDEX IF EXISTS "Enrollment_subjectId_studentId_active_key";
CREATE UNIQUE INDEX "Enrollment_subjectId_studentId_active_key" ON "Enrollment"("subjectId", "studentId") WHERE "deletedAt" IS NULL;

DROP INDEX IF EXISTS "AttendanceRecord_sessionId_studentId_active_key";
CREATE UNIQUE INDEX "AttendanceRecord_sessionId_studentId_active_key" ON "AttendanceRecord"("sessionId", "studentId") WHERE "deletedAt" IS NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "Student_studentNumber_idx" ON "Student"("studentNumber");
CREATE INDEX IF NOT EXISTS "Subject_code_teacherId_idx" ON "Subject"("code", "teacherId");
CREATE INDEX IF NOT EXISTS "Enrollment_subjectId_studentId_idx" ON "Enrollment"("subjectId", "studentId");
CREATE INDEX IF NOT EXISTS "AttendanceSession_subjectId_idx" ON "AttendanceSession"("subjectId");
CREATE INDEX IF NOT EXISTS "AttendanceRecord_sessionId_studentId_idx" ON "AttendanceRecord"("sessionId", "studentId");
