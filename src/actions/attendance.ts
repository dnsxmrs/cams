"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";

export async function getSubjectForSession(subjectId: string) {
  try {
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
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
      },
    });

    if (!subject) {
      return { success: false, error: "Subject not found.", data: null };
    }

    return { success: true, data: subject };
  } catch (error: unknown) {
    console.error("Error fetching subject for session:", error);
    return { success: false, error: "Failed to load subject details.", data: null };
  }
}

export async function getTodaySessionForSubject(subjectId: string) {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const sessionRecord = await prisma.attendanceSession.findFirst({
      where: {
        subjectId,
        sessionDate: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
      include: {
        records: true,
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
    const teacherId = authSession?.user?.id;
    const query = searchQuery?.trim();

    const sessions = await prisma.attendanceSession.findMany({
      where: {
        ...(teacherId ? { subject: { teacherId } } : {}),
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
      include: {
        subject: true,
        records: {
          include: {
            student: true,
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
    const sessionRecord = await prisma.attendanceSession.findUnique({
      where: { id: sessionId },
      include: {
        subject: true,
        records: {
          include: {
            student: true,
          },
          orderBy: [
            { student: { lastName: "asc" } },
            { student: { firstName: "asc" } },
          ],
        },
      },
    });

    if (!sessionRecord) {
      return { success: false, error: "Session log not found.", data: null };
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

    if (!records || records.length === 0) {
      return { success: false, error: "No student records provided to save." };
    }

    // Check if attendance session was already created today for this subject (Attendance strictly once per day)
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const existingTodaySession = await prisma.attendanceSession.findFirst({
      where: {
        subjectId,
        sessionDate: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
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
    const teacherId = authSession?.user?.id;

    // Fetch all subjects for this teacher with their sessions and records
    const subjects = await prisma.subject.findMany({
      where: teacherId ? { teacherId } : undefined,
      include: {
        enrollments: {
          include: {
            student: true,
          },
        },
        sessions: {
          include: {
            records: {
              include: {
                student: true,
              },
            },
          },
        },
      },
    });

    // Fetch all students
    const students = await prisma.student.findMany({
      include: {
        attendances: true,
        enrollments: {
          include: {
            subject: true,
          },
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
