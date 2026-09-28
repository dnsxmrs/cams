"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

import { z } from "zod";
import { recordAttendanceSchema } from "@/lib/validations";

export type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";

const idValidationSchema = z.string().min(1, "ID is required.");

export async function getSubjectForSession(subjectId: string) {
  try {
    const authSession = await getSession();
    if (!authSession || !authSession.user) {
      return { success: false, error: "Unauthorized access.", data: null };
    }

    const parsedId = idValidationSchema.safeParse(subjectId);
    if (!parsedId.success) {
      return { success: false, error: parsedId.error.issues[0]?.message || "Invalid subject ID.", data: null };
    }

    const subject = await prisma.subject.findFirst({
      where: {
        id: parsedId.data,
        teacherId: authSession.user.id,
        deletedAt: null,
      },
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        schedules: true,
        color: true,
        isArchived: true,
        enrollments: {
          where: {
            deletedAt: null,
            student: {
              deletedAt: null,
            },
          },
          select: {
            id: true,
            subjectId: true,
            studentId: true,
            enrolledAt: true,
            student: {
              select: {
                id: true,
                studentNumber: true,
                lastName: true,
                firstName: true,
                middleInitial: true,
                email: true,
                contactInfo: true,
              },
            },
          },
          orderBy: [
            { student: { lastName: "asc" } },
            { student: { firstName: "asc" } },
          ],
        },
      },
    });

    if (!subject) {
      return { success: false, error: "Subject not found or unauthorized.", data: null };
    }

    return { success: true, data: subject };
  } catch (error: unknown) {
    console.error("Error fetching subject for session:", error);
    return { success: false, error: "Failed to load subject details.", data: null };
  }
}

export async function getTodaySessionForSubject(subjectId: string) {
  try {
    const authSession = await getSession();
    if (!authSession || !authSession.user) {
      return { success: false, error: "Unauthorized access.", data: null };
    }

    const parsedId = idValidationSchema.safeParse(subjectId);
    if (!parsedId.success) {
      return { success: false, error: parsedId.error.issues[0]?.message || "Invalid subject ID.", data: null };
    }

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const sessionRecord = await prisma.attendanceSession.findFirst({
      where: {
        subjectId: parsedId.data,
        deletedAt: null,
        subject: {
          teacherId: authSession.user.id,
          deletedAt: null,
        },
        sessionDate: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
      select: {
        id: true,
        subjectId: true,
        sessionDate: true,
        title: true,
        records: {
          where: {
            deletedAt: null,
            student: { deletedAt: null },
          },
          select: {
            id: true,
            sessionId: true,
            studentId: true,
            status: true,
          },
        },
      },
    });

    return { success: true, data: sessionRecord };
  } catch (error: unknown) {
    console.error("Error checking today session:", error);
    return { success: false, data: null };
  }
}

export async function getTeacherAttendanceSessions(searchQuery?: string) {
  try {
    const authSession = await getSession();
    if (!authSession || !authSession.user) {
      return { success: false, error: "Unauthorized access.", data: [] };
    }

    const teacherId = authSession.user.id;
    const query = typeof searchQuery === "string" ? searchQuery.trim() : undefined;

    const sessions = await prisma.attendanceSession.findMany({
      where: {
        deletedAt: null,
        subject: { teacherId, deletedAt: null },
        ...(query
          ? {
              OR: [
                { title: { contains: query, mode: "insensitive" } },
                { subject: { code: { contains: query, mode: "insensitive" } } },
                { subject: { name: { contains: query, mode: "insensitive" } } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        subjectId: true,
        title: true,
        sessionDate: true,
        createdAt: true,
        subject: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        records: {
          where: {
            deletedAt: null,
            student: { deletedAt: null },
          },
          select: {
            id: true,
            status: true,
            student: {
              select: {
                id: true,
                studentNumber: true,
                lastName: true,
                firstName: true,
                middleInitial: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        sessionDate: "desc",
      },
    });

    return { success: true, data: sessions };
  } catch (error: unknown) {
    console.error("Error fetching attendance sessions:", error);
    return { success: false, error: "Failed to load attendance sessions.", data: [] };
  }
}

export async function getSessionById(sessionId: string) {
  try {
    const authSession = await getSession();
    if (!authSession || !authSession.user) {
      return { success: false, error: "Unauthorized access.", data: null };
    }

    const parsedId = idValidationSchema.safeParse(sessionId);
    if (!parsedId.success) {
      return { success: false, error: parsedId.error.issues[0]?.message || "Invalid session ID.", data: null };
    }

    const sessionRecord = await prisma.attendanceSession.findFirst({
      where: {
        id: parsedId.data,
        deletedAt: null,
        subject: {
          teacherId: authSession.user.id,
          deletedAt: null,
        },
      },
      select: {
        id: true,
        subjectId: true,
        title: true,
        sessionDate: true,
        createdAt: true,
        subject: {
          select: {
            id: true,
            code: true,
            name: true,
            description: true,
            color: true,
          },
        },
        records: {
          where: {
            deletedAt: null,
            student: { deletedAt: null },
          },
          select: {
            id: true,
            sessionId: true,
            studentId: true,
            status: true,
            createdAt: true,
            student: {
              select: {
                id: true,
                studentNumber: true,
                lastName: true,
                firstName: true,
                middleInitial: true,
                email: true,
                contactInfo: true,
              },
            },
          },
          orderBy: [
            { student: { lastName: "asc" } },
            { student: { firstName: "asc" } },
          ],
        },
      },
    });

    if (!sessionRecord) {
      return { success: false, error: "Session log not found or unauthorized.", data: null };
    }

    return { success: true, data: sessionRecord };
  } catch (error: unknown) {
    console.error("Error fetching session by ID:", error);
    return { success: false, error: "Failed to load session details.", data: null };
  }
}

export async function createAttendanceSessionAndRecords(
  subjectId: string,
  title: string | undefined,
  records: Array<{ studentId: string; status: AttendanceStatus }>
) {
  try {
    const authSession = await getSession();
    if (!authSession || !authSession.user) {
      return { success: false, error: "You must be logged in to record attendance." };
    }

    // Validate payload with Zod
    const parsedPayload = recordAttendanceSchema.safeParse({
      sessionId: subjectId,
      records,
    });

    if (!parsedPayload.success) {
      const msg = parsedPayload.error.issues[0]?.message || "Invalid attendance record payload.";
      return { success: false, error: msg };
    }

    // Verify teacher owns the subject
    const subject = await prisma.subject.findFirst({
      where: {
        id: subjectId,
        teacherId: authSession.user.id,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!subject) {
      return { success: false, error: "Subject not found or unauthorized." };
    }

    // Check if attendance session was already created today for this subject
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const existingTodaySession = await prisma.attendanceSession.findFirst({
      where: {
        subjectId,
        deletedAt: null,
        sessionDate: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
      select: { id: true },
    });

    if (existingTodaySession) {
      return {
        success: false,
        error: "Attendance for this subject has already been taken today. You can only record attendance once per day.",
      };
    }

    // 1. Create the AttendanceSession
    const sessionRecord = await prisma.attendanceSession.create({
      data: {
        subjectId,
        title: title?.trim() || `Session - ${new Date().toLocaleDateString()}`,
        sessionDate: new Date(),
      },
    });

    // 2. Batch insert AttendanceRecord items in a transaction
    await prisma.$transaction(
      records.map((rec) =>
        prisma.attendanceRecord.create({
          data: {
            sessionId: sessionRecord.id,
            studentId: rec.studentId,
            status: rec.status,
          },
        })
      )
    );

    revalidatePath(`/subjects/${subjectId}/attendance`);
    revalidatePath(`/subjects`);
    revalidatePath(`/history`);
    revalidatePath(`/home`);
    revalidatePath(`/reports`);

    return { success: true, data: sessionRecord };
  } catch (error: unknown) {
    console.error("Error creating attendance session:", error);
    const msg = error instanceof Error ? error.message : "Failed to submit attendance session.";
    return { success: false, error: msg };
  }
}

export async function getAttendanceReports() {
  try {
    const authSession = await getSession();
    if (!authSession || !authSession.user) {
      return { success: false, error: "Unauthorized access.", data: null };
    }
    const teacherId = authSession.user.id;

    // Fetch subjects for this teacher selecting only needed fields for reports
    const subjects = await prisma.subject.findMany({
      where: { teacherId, deletedAt: null },
      select: {
        id: true,
        code: true,
        name: true,
        enrollments: {
          where: {
            deletedAt: null,
            student: { deletedAt: null },
          },
          select: { id: true },
        },
        sessions: {
          where: {
            deletedAt: null,
          },
          select: {
            records: {
              where: {
                deletedAt: null,
                student: { deletedAt: null },
              },
              select: { status: true },
            },
          },
        },
      },
    });

    // Fetch students enrolled in this teacher's subjects selecting only needed fields
    const students = await prisma.student.findMany({
      where: {
        deletedAt: null,
        enrollments: {
          some: {
            deletedAt: null,
            subject: {
              teacherId,
              deletedAt: null,
            },
          },
        },
      },
      select: {
        id: true,
        studentNumber: true,
        lastName: true,
        firstName: true,
        middleInitial: true,
        email: true,
        attendances: {
          where: {
            deletedAt: null,
            session: {
              deletedAt: null,
              subject: {
                teacherId,
                deletedAt: null,
              },
            },
          },
          select: { status: true },
        },
      },
      orderBy: [
        { lastName: "asc" },
        { firstName: "asc" },
        { middleInitial: "asc" },
      ],
    });

    return { success: true, data: { subjects, students } };
  } catch (error: unknown) {
    console.error("Error generating attendance reports:", error);
    return { success: false, error: "Failed to generate attendance reports.", data: null };
  }
}
