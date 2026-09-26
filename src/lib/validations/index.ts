import { z } from "zod";

// Auth Schemas
export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const signUpSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Student Schemas
export const studentSchema = z.object({
  studentNumber: z.string().min(1, "Student number is required"),
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  contactInfo: z.string().optional(),
});

// Subject Schemas
export const subjectSchema = z.object({
  code: z.string().min(1, "Subject code is required"),
  name: z.string().min(2, "Subject name is required"),
  description: z.string().optional(),
});

// Session Schemas
export const sessionSchema = z.object({
  subjectId: z.string().uuid("Invalid subject ID"),
  title: z.string().optional(),
  sessionDate: z.string().or(z.date()).optional(),
});

// Attendance Record Schemas
export const attendanceStatusEnum = z.enum(["PRESENT", "ABSENT", "LATE", "EXCUSED"]);

export const recordAttendanceSchema = z.object({
  sessionId: z.string().uuid(),
  records: z.array(
    z.object({
      studentId: z.string().uuid(),
      status: attendanceStatusEnum,
    })
  ),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type StudentInput = z.infer<typeof studentSchema>;
export type SubjectInput = z.infer<typeof subjectSchema>;
export type SessionInput = z.infer<typeof sessionSchema>;
export type RecordAttendanceInput = z.infer<typeof recordAttendanceSchema>;
