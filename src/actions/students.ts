"use server";

import { prisma } from "@/lib/prisma";
import { studentSchema, StudentInput } from "@/lib/validations";
import { revalidatePath } from "next/cache";

export async function getStudents(searchQuery?: string) {
  try {
    const query = searchQuery?.trim();

    const students = await prisma.student.findMany({
      where: query
        ? {
            OR: [
              { studentNumber: { contains: query, mode: "insensitive" } },
              { fullName: { contains: query, mode: "insensitive" } },
              { email: { contains: query, mode: "insensitive" } },
            ],
          }
        : undefined,
      include: {
        _count: {
          select: { enrollments: true },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return { success: true, data: students };
  } catch (error: unknown) {
    console.error("Error fetching students:", error);
    return { success: false, error: "Failed to load students.", data: [] };
  }
}

export async function createStudent(input: StudentInput) {
  try {
    const validated = studentSchema.parse(input);

    // Check for unique student number
    const existing = await prisma.student.findUnique({
      where: { studentNumber: validated.studentNumber },
    });

    if (existing) {
      return {
        success: false,
        error: `A student with Student Number '${validated.studentNumber}' already exists.`,
      };
    }

    const student = await prisma.student.create({
      data: {
        studentNumber: validated.studentNumber,
        fullName: validated.fullName,
        email: validated.email || null,
        contactInfo: validated.contactInfo || null,
      },
    });

    revalidatePath("/students");
    return { success: true, data: student };
  } catch (error: unknown) {
    console.error("Error creating student:", error);
    const errorMsg = error instanceof Error ? error.message : "Failed to create student.";
    return { success: false, error: errorMsg };
  }
}

export async function importStudents(inputs: StudentInput[]) {
  try {
    const validated = inputs.map((input) => studentSchema.parse(input));
    const result = await prisma.student.createMany({
      data: validated.map((student) => ({
        studentNumber: student.studentNumber,
        fullName: student.fullName,
        email: student.email || null,
        contactInfo: student.contactInfo || null,
      })),
      skipDuplicates: true,
    });

    revalidatePath("/students");
    return {
      success: true,
      imported: result.count,
      skipped: validated.length - result.count,
    };
  } catch (error: unknown) {
    console.error("Error importing students:", error);
    const errorMsg = error instanceof Error ? error.message : "Failed to import students.";
    return { success: false, error: errorMsg };
  }
}

export async function updateStudent(id: string, input: StudentInput) {
  try {
    const validated = studentSchema.parse(input);

    // Check if another student uses this student number
    const existing = await prisma.student.findFirst({
      where: {
        studentNumber: validated.studentNumber,
        NOT: { id },
      },
    });

    if (existing) {
      return {
        success: false,
        error: `Another student already uses Student Number '${validated.studentNumber}'.`,
      };
    }

    const student = await prisma.student.update({
      where: { id },
      data: {
        studentNumber: validated.studentNumber,
        fullName: validated.fullName,
        email: validated.email || null,
        contactInfo: validated.contactInfo || null,
      },
    });

    revalidatePath("/students");
    return { success: true, data: student };
  } catch (error: unknown) {
    console.error("Error updating student:", error);
    const errorMsg = error instanceof Error ? error.message : "Failed to update student.";
    return { success: false, error: errorMsg };
  }
}

export async function deleteStudent(id: string) {
  try {
    await prisma.student.delete({
      where: { id },
    });

    revalidatePath("/students");
    return { success: true };
  } catch (error: unknown) {
    console.error("Error deleting student:", error);
    const msg = error instanceof Error ? error.message : "Failed to delete student.";
    return { success: false, error: msg };
  }
}
