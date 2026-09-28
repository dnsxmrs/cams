"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { studentSchema, StudentInput } from "@/lib/validations";
import { revalidatePath } from "next/cache";

import { z } from "zod";

const idValidationSchema = z.string().min(1, "Student ID is required.");

function validationError(error: unknown, fallback: string) {
  if (error instanceof Error && error.name === "ZodError") {
    const issues = JSON.parse(error.message) as Array<{ message?: string }>;
    return issues.map((issue) => issue.message).filter(Boolean).join(" ") || fallback;
  }
  return fallback;
}

function databaseError(error: unknown, fallback: string) {
  if (error && typeof error === "object" && "code" in error) {
    const code = (error as { code?: string }).code;
    if (code === "P2025") return "The student no longer exists. Refresh the directory and try again.";
    if (code === "P2003") return "This student cannot be deleted because related records still exist.";
    if (code === "P2002") return "That student number is already in use.";
  }
  return fallback;
}

export async function getStudents(searchQuery?: string) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return { success: false, error: "Unauthorized access.", data: [] };
    }

    const query = typeof searchQuery === "string" ? searchQuery.trim() : undefined;

    const students = await prisma.student.findMany({
      where: query
        ? {
            OR: [
              { studentNumber: { contains: query, mode: "insensitive" } },
              { lastName: { contains: query, mode: "insensitive" } },
              { firstName: { contains: query, mode: "insensitive" } },
              { middleInitial: { contains: query, mode: "insensitive" } },
              { email: { contains: query, mode: "insensitive" } },
            ],
          }
        : undefined,
      select: {
        id: true,
        studentNumber: true,
        lastName: true,
        firstName: true,
        middleInitial: true,
        email: true,
        contactInfo: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { enrollments: true },
        },
      },
      orderBy: [
        { lastName: "asc" },
        { firstName: "asc" },
        { middleInitial: "asc" },
      ],
    });

    return { success: true, data: students };
  } catch (error: unknown) {
    console.error("Error fetching students:", error);
    return { success: false, error: "Failed to load students.", data: [] };
  }
}

export async function createStudent(input: StudentInput) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return { success: false, error: "You must be logged in to create a student." };
    }

    const parsed = studentSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message || "Invalid student details." };
    const validated = parsed.data;

    // Check for unique student number selecting only id
    const existing = await prisma.student.findFirst({
      where: { studentNumber: validated.studentNumber },
      select: { id: true },
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
        lastName: validated.lastName,
        firstName: validated.firstName,
        middleInitial: validated.middleInitial || null,
        email: validated.email || null,
        contactInfo: validated.contactInfo || null,
      },
    });

    revalidatePath("/students");
    return { success: true, data: student };
  } catch (error: unknown) {
    console.error("Error creating student:", error);
    return { success: false, error: databaseError(error, validationError(error, "Failed to create student.")) };
  }
}

export async function importStudents(inputs: StudentInput[]) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return { success: false, error: "You must be logged in to import students." };
    }

    if (!Array.isArray(inputs) || inputs.length === 0) {
      return { success: false, error: "The CSV file contains no student rows." };
    }

    const validStudents: StudentInput[] = [];
    const invalidRows: string[] = [];
    inputs.forEach((input, index) => {
      const parsed = studentSchema.safeParse(input);
      if (parsed.success) {
        validStudents.push(parsed.data);
      } else {
        invalidRows.push(`Row ${index + 2}: ${parsed.error.issues[0]?.message || "invalid student details"}`);
      }
    });

    const uniqueStudents = Array.from(
      new Map(validStudents.map((student) => [student.studentNumber.toLowerCase(), student])).values()
    );
    const duplicateRows = validStudents.length - uniqueStudents.length;
    if (uniqueStudents.length === 0) {
      return { success: false, error: invalidRows.slice(0, 3).join(" ") || "No valid student rows found." };
    }

    const result = await prisma.student.createMany({
      data: uniqueStudents.map((student) => ({
        studentNumber: student.studentNumber,
        lastName: student.lastName,
        firstName: student.firstName,
        middleInitial: student.middleInitial || null,
        email: student.email || null,
        contactInfo: student.contactInfo || null,
      })),
      skipDuplicates: true,
    });

    revalidatePath("/students");
    return {
      success: true,
      imported: result.count,
      skipped: uniqueStudents.length - result.count + duplicateRows,
      invalidRows: invalidRows.slice(0, 5),
    };
  } catch (error: unknown) {
    console.error("Error importing students:", error);
    return { success: false, error: databaseError(error, "Failed to import students.") };
  }
}

export async function updateStudent(id: string, input: StudentInput) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return { success: false, error: "You must be logged in to update a student." };
    }

    const parsedId = idValidationSchema.safeParse(id);
    if (!parsedId.success) return { success: false, error: parsedId.error.issues[0]?.message || "Student ID is required." };
    const studentId = parsedId.data;

    const parsed = studentSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message || "Invalid student details." };
    const validated = parsed.data;

    // Fetch existing student snapshot selecting only needed fields for diffs
    const currentStudent = await prisma.student.findFirst({
      where: { id: studentId },
      select: {
        id: true,
        studentNumber: true,
        lastName: true,
        firstName: true,
        middleInitial: true,
        email: true,
        contactInfo: true,
      },
    });

    if (!currentStudent) {
      return { success: false, error: "The student no longer exists." };
    }

    // Check if another active student uses this student number selecting only id
    const existing = await prisma.student.findFirst({
      where: {
        studentNumber: validated.studentNumber,
        NOT: { id: studentId },
      },
      select: { id: true },
    });

    if (existing) {
      return {
        success: false,
        error: `Another student already uses Student Number '${validated.studentNumber}'.`,
      };
    }

    // Calculate modified fields
    const changes: Record<string, { from: string | null; to: string | null }> = {};
    if (currentStudent.studentNumber !== validated.studentNumber) {
      changes.studentNumber = { from: currentStudent.studentNumber, to: validated.studentNumber };
    }
    if (currentStudent.lastName !== validated.lastName) {
      changes.lastName = { from: currentStudent.lastName, to: validated.lastName };
    }
    if (currentStudent.firstName !== validated.firstName) {
      changes.firstName = { from: currentStudent.firstName, to: validated.firstName };
    }
    if ((currentStudent.middleInitial || null) !== (validated.middleInitial || null)) {
      changes.middleInitial = { from: currentStudent.middleInitial, to: validated.middleInitial || null };
    }
    if ((currentStudent.email || null) !== (validated.email || null)) {
      changes.email = { from: currentStudent.email, to: validated.email || null };
    }
    if ((currentStudent.contactInfo || null) !== (validated.contactInfo || null)) {
      changes.contactInfo = { from: currentStudent.contactInfo, to: validated.contactInfo || null };
    }

    const student = await prisma.student.update({
      where: { id: studentId },
      data: {
        studentNumber: validated.studentNumber,
        lastName: validated.lastName,
        firstName: validated.firstName,
        middleInitial: validated.middleInitial || null,
        email: validated.email || null,
        contactInfo: validated.contactInfo || null,
      },
    });

    // Record audit log entry if fields were modified
    if (Object.keys(changes).length > 0) {
      try {
        await prisma.studentAuditLog.create({
          data: {
            studentId,
            updatedById: session.user.id,
            action: "UPDATE",
            changes,
          },
        });
      } catch (auditError) {
        console.error("Failed to create student audit log:", auditError);
      }
    }

    revalidatePath("/students");
    return { success: true, data: student };
  } catch (error: unknown) {
    console.error("Error updating student:", error);
    return { success: false, error: databaseError(error, "Failed to update student.") };
  }
}

export async function deleteStudent(id: string) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return { success: false, error: "You must be logged in to delete a student." };
    }

    const parsedId = idValidationSchema.safeParse(id);
    if (!parsedId.success) return { success: false, error: parsedId.error.issues[0]?.message || "Student ID is required." };
    const studentId = parsedId.data;

    const existing = await prisma.student.findFirst({
      where: { id: studentId },
      select: { id: true },
    });

    if (!existing) {
      return { success: false, error: "Student not found." };
    }

    const now = new Date();

    // Cascading soft delete in a transaction for Student, Enrollments, AttendanceRecords
    await prisma.$transaction([
      prisma.attendanceRecord.updateMany({
        where: { studentId },
        data: { deletedAt: now },
      }),
      prisma.enrollment.updateMany({
        where: { studentId },
        data: { deletedAt: now },
      }),
      prisma.student.update({
        where: { id: studentId },
        data: { deletedAt: now },
      }),
    ]);

    revalidatePath("/students");
    return { success: true };
  } catch (error: unknown) {
    console.error("Error deleting student:", error);
    return { success: false, error: databaseError(error, "Failed to delete student.") };
  }
}

export async function getStudentAttendanceHistory(studentId: string) {
  try {
    const authSession = await getSession();
    if (!authSession || !authSession.user) {
      return { success: false, error: "Unauthorized access.", data: null };
    }

    const parsedId = idValidationSchema.safeParse(studentId);
    if (!parsedId.success) return { success: false, error: parsedId.error.issues[0]?.message || "Invalid student ID.", data: null };
    const validStudentId = parsedId.data;

    const teacherId = authSession.user.id;

    const student = await prisma.student.findFirst({
      where: { id: validStudentId },
      select: {
        id: true,
        studentNumber: true,
        lastName: true,
        firstName: true,
        middleInitial: true,
        email: true,
        contactInfo: true,
        attendances: {
          where: {
            session: {
              subject: {
                teacherId,
              },
            },
          },
          select: {
            id: true,
            status: true,
            createdAt: true,
            session: {
              select: {
                id: true,
                title: true,
                sessionDate: true,
                subject: {
                  select: {
                    id: true,
                    code: true,
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: {
            session: {
              sessionDate: "desc",
            },
          },
        },
        enrollments: {
          where: {
            subject: {
              teacherId,
            },
          },
          select: {
            id: true,
            enrolledAt: true,
            subject: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!student) {
      return { success: false, error: "Student not found.", data: null };
    }

    return { success: true, data: student };
  } catch (error: unknown) {
    console.error("Error fetching student attendance history:", error);
    return { success: false, error: "Failed to load student attendance history.", data: null };
  }
}

export async function getStudentEditHistory(studentId: string) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return { success: false, error: "Unauthorized access.", data: [] };
    }

    const parsedId = idValidationSchema.safeParse(studentId);
    if (!parsedId.success) return { success: false, error: parsedId.error.issues[0]?.message || "Invalid student ID.", data: [] };

    const logs = await prisma.studentAuditLog.findMany({
      where: { studentId: parsedId.data },
      select: {
        id: true,
        studentId: true,
        action: true,
        changes: true,
        createdAt: true,
        updatedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return { success: true, data: logs };
  } catch (error: unknown) {
    console.error("Error fetching student edit history:", error);
    return { success: false, error: "Failed to load edit history.", data: [] };
  }
}

