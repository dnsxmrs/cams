"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

import { z } from "zod";

const idValidationSchema = z.string().min(1, "ID is required.");

export async function getSubjectEnrollments(subjectId: string) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return { success: false, error: "Unauthorized access.", data: null };
    }

    const parsedId = idValidationSchema.safeParse(subjectId);
    if (!parsedId.success) {
      return { success: false, error: parsedId.error.issues[0]?.message || "Invalid subject ID.", data: null };
    }

    const subject = await prisma.subject.findFirst({
      where: {
        id: parsedId.data,
        teacherId: session.user.id,
      },
      include: {
        enrollments: {
          include: {
            student: true,
          },
          orderBy: {
            student: {
              lastName: "asc",
            },
          },
        },
      },
    });

    if (!subject) {
      return { success: false, error: "Subject not found or unauthorized.", data: null };
    }

    return { success: true, data: subject };
  } catch (error: unknown) {
    console.error("Error fetching subject enrollments:", error);
    return { success: false, error: "Failed to load subject enrollments.", data: null };
  }
}

export async function getAvailableStudentsForSubject(subjectId: string, searchQuery?: string) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return { success: false, error: "Unauthorized access.", data: [] };
    }

    const parsedId = idValidationSchema.safeParse(subjectId);
    if (!parsedId.success) {
      return { success: false, error: parsedId.error.issues[0]?.message || "Invalid subject ID.", data: [] };
    }

    // Verify teacher owns the subject
    const subject = await prisma.subject.findFirst({
      where: { id: parsedId.data, teacherId: session.user.id },
    });

    if (!subject) {
      return { success: false, error: "Subject not found or unauthorized.", data: [] };
    }

    const query = typeof searchQuery === "string" ? searchQuery.trim() : undefined;

    // Fetch students NOT currently enrolled in this subject (active enrollments)
    const students = await prisma.student.findMany({
      where: {
        enrollments: {
          none: {
            subjectId: parsedId.data,
          },
        },
        ...(query
          ? {
              OR: [
                { studentNumber: { contains: query, mode: "insensitive" } },
                { lastName: { contains: query, mode: "insensitive" } },
                { firstName: { contains: query, mode: "insensitive" } },
                { middleInitial: { contains: query, mode: "insensitive" } },
                { email: { contains: query, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: [
        { lastName: "asc" },
        { firstName: "asc" },
      ],
    });

    return { success: true, data: students };
  } catch (error: unknown) {
    console.error("Error fetching available students:", error);
    return { success: false, error: "Failed to load available students.", data: [] };
  }
}

export async function enrollStudent(subjectId: string, studentId: string) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return { success: false, error: "You must be logged in to enroll students." };
    }

    const parsedSubjectId = idValidationSchema.safeParse(subjectId);
    if (!parsedSubjectId.success) return { success: false, error: "Invalid subject ID." };

    const parsedStudentId = idValidationSchema.safeParse(studentId);
    if (!parsedStudentId.success) return { success: false, error: "Invalid student ID." };

    // Ownership check: Verify teacher owns the subject
    const subject = await prisma.subject.findFirst({
      where: { id: parsedSubjectId.data, teacherId: session.user.id },
    });

    if (!subject) {
      return { success: false, error: "Subject not found or unauthorized." };
    }

    // Check duplicate enrollment constraint among active enrollments
    const existing = await prisma.enrollment.findFirst({
      where: {
        subjectId: parsedSubjectId.data,
        studentId: parsedStudentId.data,
      },
    });

    if (existing) {
      return { success: false, error: "Student is already enrolled in this subject." };
    }

    const enrollment = await prisma.enrollment.create({
      data: {
        subjectId: parsedSubjectId.data,
        studentId: parsedStudentId.data,
      },
      include: {
        student: true,
      },
    });

    revalidatePath(`/subjects/${parsedSubjectId.data}/enrollments`);
    revalidatePath(`/subjects`);
    revalidatePath(`/home`);
    revalidatePath(`/students`);

    return { success: true, data: enrollment };
  } catch (error: unknown) {
    console.error("Error enrolling student:", error);
    const msg = error instanceof Error ? error.message : "Failed to enroll student.";
    return { success: false, error: msg };
  }
}

export async function unenrollStudent(subjectId: string, studentId: string) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return { success: false, error: "You must be logged in to remove students." };
    }

    const parsedSubjectId = idValidationSchema.safeParse(subjectId);
    if (!parsedSubjectId.success) return { success: false, error: "Invalid subject ID." };

    const parsedStudentId = idValidationSchema.safeParse(studentId);
    if (!parsedStudentId.success) return { success: false, error: "Invalid student ID." };

    // Ownership check: Verify teacher owns the subject
    const subject = await prisma.subject.findFirst({
      where: { id: parsedSubjectId.data, teacherId: session.user.id },
    });

    if (!subject) {
      return { success: false, error: "Subject not found or unauthorized." };
    }

    // Soft delete enrollment by setting deletedAt
    await prisma.enrollment.updateMany({
      where: {
        subjectId: parsedSubjectId.data,
        studentId: parsedStudentId.data,
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
      },
    });

    revalidatePath(`/subjects/${parsedSubjectId.data}/enrollments`);
    revalidatePath(`/subjects`);
    revalidatePath(`/home`);
    revalidatePath(`/students`);

    return { success: true };
  } catch (error: unknown) {
    console.error("Error unenrolling student:", error);
    const msg = error instanceof Error ? error.message : "Failed to remove student from subject.";
    return { success: false, error: msg };
  }
}
