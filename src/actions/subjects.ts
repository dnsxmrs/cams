"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { subjectSchema, SubjectInput } from "@/lib/validations";
import { revalidatePath } from "next/cache";

import { z } from "zod";

const idValidationSchema = z.string().min(1, "Subject ID is required.");

export async function getTeacherSubjects(searchQuery?: string, isArchived: boolean = false) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return { success: false, error: "Unauthorized access.", data: [] };
    }
    
    const teacherId = session.user.id;
    const query = typeof searchQuery === "string" ? searchQuery.trim() : undefined;

    const subjects = await prisma.subject.findMany({
      where: {
        isArchived: Boolean(isArchived),
        teacherId,
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
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        schedules: true,
        color: true,
        isArchived: true,
        teacherId: true,
        createdAt: true,
        updatedAt: true,
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

    const parsed = subjectSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || "Invalid subject details." };
    }
    const validated = parsed.data;
    const formattedCode = validated.code.toUpperCase().trim();

    // Check unique constraint for [code, teacherId] among active subjects selecting only id
    const existing = await prisma.subject.findFirst({
      where: {
        code: formattedCode,
        teacherId: session.user.id,
      },
      select: { id: true },
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

    const parsedId = idValidationSchema.safeParse(id);
    if (!parsedId.success) {
      return { success: false, error: parsedId.error.issues[0]?.message || "Invalid subject ID." };
    }

    const parsed = subjectSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || "Invalid subject details." };
    }
    const validated = parsed.data;
    const formattedCode = validated.code.toUpperCase().trim();

    // Verify ownership selecting only needed fields
    const existing = await prisma.subject.findFirst({
      where: { id: parsedId.data, teacherId: session.user.id },
      select: { id: true, code: true },
    });

    if (!existing) {
      return { success: false, error: "Subject not found or unauthorized." };
    }

    // Check code conflict if code changed selecting only id
    if (existing.code !== formattedCode) {
      const codeConflict = await prisma.subject.findFirst({
        where: {
          code: formattedCode,
          teacherId: session.user.id,
          NOT: { id: parsedId.data },
        },
        select: { id: true },
      });

      if (codeConflict) {
        return {
          success: false,
          error: `You already have another subject with code '${formattedCode}'.`,
        };
      }
    }

    const updated = await prisma.subject.update({
      where: { id: parsedId.data },
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

    const parsedId = idValidationSchema.safeParse(id);
    if (!parsedId.success) {
      return { success: false, error: parsedId.error.issues[0]?.message || "Invalid subject ID." };
    }

    const existing = await prisma.subject.findFirst({
      where: { id: parsedId.data, teacherId: session.user.id },
      select: { id: true },
    });

    if (!existing) {
      return { success: false, error: "Subject not found or unauthorized." };
    }

    const updated = await prisma.subject.update({
      where: { id: parsedId.data },
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

    const parsedId = idValidationSchema.safeParse(id);
    if (!parsedId.success) {
      return { success: false, error: parsedId.error.issues[0]?.message || "Invalid subject ID." };
    }

    const existing = await prisma.subject.findFirst({
      where: { id: parsedId.data, teacherId: session.user.id },
      select: { id: true },
    });

    if (!existing) {
      return { success: false, error: "Subject not found or unauthorized." };
    }

    const updated = await prisma.subject.update({
      where: { id: parsedId.data },
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

    const parsedId = idValidationSchema.safeParse(id);
    if (!parsedId.success) {
      return { success: false, error: parsedId.error.issues[0]?.message || "Invalid subject ID." };
    }
    const subjectId = parsedId.data;

    // Verify ownership selecting only id
    const existing = await prisma.subject.findFirst({
      where: { id: subjectId, teacherId: session.user.id },
      select: { id: true },
    });

    if (!existing) {
      return { success: false, error: "Subject not found or unauthorized." };
    }

    const now = new Date();

    // Transaction to soft delete subject and all nested enrollments, sessions, records
    await prisma.$transaction([
      prisma.attendanceRecord.updateMany({
        where: { session: { subjectId } },
        data: { deletedAt: now },
      }),
      prisma.attendanceSession.updateMany({
        where: { subjectId },
        data: { deletedAt: now },
      }),
      prisma.enrollment.updateMany({
        where: { subjectId },
        data: { deletedAt: now },
      }),
      prisma.subject.update({
        where: { id: subjectId },
        data: { deletedAt: now },
      }),
    ]);

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
      select: {
        id: true,
        code: true,
        name: true,
        enrollments: {
          select: {
            student: {
              select: {
                id: true,
                studentNumber: true,
                firstName: true,
                lastName: true,
                middleInitial: true,
                email: true,
              },
            },
          },
          orderBy: [
            { student: { lastName: "asc" } },
            { student: { firstName: "asc" } },
          ],
        },
        sessions: {
          select: {
            id: true,
            title: true,
            sessionDate: true,
            records: {
              select: {
                studentId: true,
                status: true,
              },
            },
          },
          orderBy: {
            sessionDate: "asc",
          },
        },
      },
    });

    if (!subject) {
      return { success: false, error: "Subject not found or unauthorized.", data: null };
    }

    return { success: true, data: subject };
  } catch (error: unknown) {
    console.error("Error fetching subject export data:", error);
    return { success: false, error: "Failed to export subject attendance.", data: null };
  }
}
