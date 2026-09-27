"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { subjectSchema, SubjectInput } from "@/lib/validations";
import { revalidatePath } from "next/cache";

export async function getTeacherSubjects(searchQuery?: string, isArchived: boolean = false) {
  try {
    const session = await getSession();
    
    // If authenticated, filter by logged-in teacher ID. Otherwise fallback to all subjects for dev preview.
    const teacherId = session?.user?.id;
    const query = searchQuery?.trim();

    const subjects = await prisma.subject.findMany({
      where: {
        isArchived,
        ...(teacherId ? { teacherId } : {}),
        ...(query
          ? {
              OR: [
                { code: { contains: query, mode: "insensitive" } },
                { name: { contains: query, mode: "insensitive" } },
                { description: { contains: query, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: {
        _count: {
          select: {
            enrollments: true,
            sessions: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return { success: true, data: subjects };
  } catch (error: unknown) {
    console.error("Error fetching subjects:", error);
    return { success: false, error: "Failed to load subjects.", data: [] };
  }
}

export async function createSubject(input: SubjectInput) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return { success: false, error: "You must be logged in as a teacher to create a subject." };
    }

    const validated = subjectSchema.parse(input);
    const formattedCode = validated.code.toUpperCase().trim();

    // Check unique constraint for [code, teacherId]
    const existing = await prisma.subject.findUnique({
      where: {
        code_teacherId: {
          code: formattedCode,
          teacherId: session.user.id,
        },
      },
    });

    if (existing) {
      return {
        success: false,
        error: `You already have a subject with code '${formattedCode}'.`,
      };
    }

    const subject = await prisma.subject.create({
      data: {
        code: formattedCode,
        name: validated.name.trim(),
        description: validated.description?.trim() || null,
        schedules: validated.schedules || null,
        color: validated.color || "blue",
        teacherId: session.user.id,
      },
    });

    revalidatePath("/subjects");
    revalidatePath("/home");
    return { success: true, data: subject };
  } catch (error: unknown) {
    console.error("Error creating subject:", error);
    const errorMsg =
      error instanceof Error ? error.message : "Failed to create subject.";
    return { success: false, error: errorMsg };
  }
}

export async function updateSubject(id: string, input: SubjectInput) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return { success: false, error: "You must be logged in to update a subject." };
    }

    const validated = subjectSchema.parse(input);
    const formattedCode = validated.code.toUpperCase().trim();

    // Verify ownership
    const existing = await prisma.subject.findFirst({
      where: { id, teacherId: session.user.id },
    });

    if (!existing) {
      return { success: false, error: "Subject not found or unauthorized." };
    }

    // Check code conflict if code changed
    if (existing.code !== formattedCode) {
      const codeConflict = await prisma.subject.findUnique({
        where: {
          code_teacherId: {
            code: formattedCode,
            teacherId: session.user.id,
          },
        },
      });

      if (codeConflict) {
        return {
          success: false,
          error: `You already have another subject with code '${formattedCode}'.`,
        };
      }
    }

    const updated = await prisma.subject.update({
      where: { id },
      data: {
        code: formattedCode,
        name: validated.name.trim(),
        description: validated.description?.trim() || null,
        schedules: validated.schedules || null,
        color: validated.color || "blue",
      },
    });

    revalidatePath("/subjects");
    revalidatePath("/home");
    return { success: true, data: updated };
  } catch (error: unknown) {
    console.error("Error updating subject:", error);
    const errorMsg =
      error instanceof Error ? error.message : "Failed to update subject.";
    return { success: false, error: errorMsg };
  }
}

export async function archiveSubject(id: string) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return { success: false, error: "You must be logged in to archive a subject." };
    }

    const existing = await prisma.subject.findFirst({
      where: { id, teacherId: session.user.id },
    });

    if (!existing) {
      return { success: false, error: "Subject not found or unauthorized." };
    }

    const updated = await prisma.subject.update({
      where: { id },
      data: { isArchived: true },
    });

    revalidatePath("/subjects");
    revalidatePath("/home");
    return { success: true, data: updated };
  } catch (error: unknown) {
    console.error("Error archiving subject:", error);
    const msg = error instanceof Error ? error.message : "Failed to archive subject.";
    return { success: false, error: msg };
  }
}

export async function unarchiveSubject(id: string) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return { success: false, error: "You must be logged in to unarchive a subject." };
    }

    const existing = await prisma.subject.findFirst({
      where: { id, teacherId: session.user.id },
    });

    if (!existing) {
      return { success: false, error: "Subject not found or unauthorized." };
    }

    const updated = await prisma.subject.update({
      where: { id },
      data: { isArchived: false },
    });

    revalidatePath("/subjects");
    revalidatePath("/home");
    return { success: true, data: updated };
  } catch (error: unknown) {
    console.error("Error unarchiving subject:", error);
    const msg = error instanceof Error ? error.message : "Failed to unarchive subject.";
    return { success: false, error: msg };
  }
}

export async function deleteSubject(id: string) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return { success: false, error: "You must be logged in to delete a subject." };
    }

    // Verify ownership
    const existing = await prisma.subject.findFirst({
      where: { id, teacherId: session.user.id },
    });

    if (!existing) {
      return { success: false, error: "Subject not found or unauthorized." };
    }

    await prisma.subject.delete({
      where: { id },
    });

    revalidatePath("/subjects");
    revalidatePath("/home");
    return { success: true };
  } catch (error: unknown) {
    console.error("Error deleting subject:", error);
    const msg = error instanceof Error ? error.message : "Failed to delete subject.";
    return { success: false, error: msg };
  }
}

export async function getSubjectAttendanceExportData(subjectId: string) {
  try {
    const session = await getSession();

    // Find subject matching ID (and teacherId if session exists)
    const subject = await prisma.subject.findFirst({
      where: {
        id: subjectId,
        ...(session?.user?.id ? { teacherId: session.user.id } : {}),
      },
      include: {
        enrollments: {
          include: {
            student: true,
          },
          orderBy: [
            { student: { lastName: "asc" } },
            { student: { firstName: "asc" } },
          ],
        },
        sessions: {
          include: {
            records: true,
          },
          orderBy: {
            sessionDate: "asc",
          },
        },
      },
    });

    if (!subject) {
      return { success: false, error: "Subject not found.", data: null };
    }

    return { success: true, data: subject };
  } catch (error: unknown) {
    console.error("Error fetching subject export data:", error);
    return { success: false, error: "Failed to export subject attendance.", data: null };
  }
}
