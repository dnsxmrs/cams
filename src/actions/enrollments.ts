"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getSubjectEnrollments(subjectId: string) {
  try {
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
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
      return { success: false, error: "Subject not found.", data: null };
    }

    return { success: true, data: subject };
  } catch (error: unknown) {
    console.error("Error fetching subject enrollments:", error);
    return { success: false, error: "Failed to load subject enrollments.", data: null };
  }
}

export async function getAvailableStudentsForSubject(subjectId: string, searchQuery?: string) {
  try {
    const query = searchQuery?.trim();

    // Fetch students NOT currently enrolled in this subject
    const students = await prisma.student.findMany({
      where: {
        enrollments: {
          none: {
            subjectId: subjectId,
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

    // Check duplicate enrollment constraint
    const existing = await prisma.enrollment.findUnique({
      where: {
        subjectId_studentId: {
          subjectId,
          studentId,
        },
      },
    });

    if (existing) {
      return { success: false, error: "Student is already enrolled in this subject." };
    }

    const enrollment = await prisma.enrollment.create({
      data: {
        subjectId,
        studentId,
      },
      include: {
        student: true,
      },
    });

    revalidatePath(`/subjects/${subjectId}/enrollments`);
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

    await prisma.enrollment.delete({
      where: {
        subjectId_studentId: {
          subjectId,
          studentId,
        },
      },
    });

    revalidatePath(`/subjects/${subjectId}/enrollments`);
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
