import { z } from "zod";

// Auth Schemas
export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const signUpSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// Student Schemas
export const studentSchema = z.object({
  studentNumber: z.string().trim().min(1, "Student number is required").max(50, "Student number is too long"),
  lastName: z.string().trim().min(1, "Last name is required").max(60, "Last name is too long"),
  firstName: z.string().trim().min(1, "First name is required").max(60, "First name is too long"),
  middleInitial: z.string().trim().max(10, "Middle initial is too long").optional().or(z.literal("")),
  email: z.string().trim().email("Invalid email address").max(254, "Email address is too long").optional().or(z.literal("")),
  contactInfo: z.string().trim().max(50, "Contact information is too long").optional(),
});

// Subject Schemas
export const subjectScheduleItemSchema = z.object({
  day: z.enum(["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]),
  startTime: z.string(),
  endTime: z.string(),
});

export const subjectSchema = z.object({
  code: z.string().min(1, "Subject code is required"),
  name: z.string().min(2, "Subject name is required"),
  description: z.string().optional(),
  schedules: z.string().optional(),
  color: z.string().optional(),
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
