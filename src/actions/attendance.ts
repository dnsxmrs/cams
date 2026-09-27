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
          orderBy: {
            student: {
              fullName: "asc",
            },
          },
        },
      },
    });

    if (!subject) {
      return { success: false, error: "Subject not found.", data: null };
    }

    return { success: true, data: subject };
  } catch (error: any) {
    console.error("Error fetching subject for session:", error);
    return { success: false, error: "Failed to load subject details.", data: null };
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
  } catch (error: any) {
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
          orderBy: {
            student: {
              fullName: "asc",
            },
          },
        },
      },
    });

    if (!sessionRecord) {
      return { success: false, error: "Session log not found.", data: null };
    }

    return { success: true, data: sessionRecord };
  } catch (error: any) {
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
    revalidatePath(`/sessions`);
    revalidatePath(`/home`);
    revalidatePath(`/reports`);

    return { success: true, data: sessionRecord };
  } catch (error: any) {
    console.error("Error creating attendance session:", error);
    return { success: false, error: error.message || "Failed to submit attendance session." };
  }
}

export async function updateAttendanceRecordStatus(
  recordId: string,
  newStatus: AttendanceStatus,
  sessionId: string
) {
  try {
    const authSession = await getSession();
    if (!authSession || !authSession.user) {
      return { success: false, error: "Unauthorized." };
    }

    const updated = await prisma.attendanceRecord.update({
      where: { id: recordId },
      data: { status: newStatus },
      include: { student: true },
    });

    revalidatePath(`/sessions/${sessionId}`);
    revalidatePath(`/sessions`);
    revalidatePath(`/reports`);
    revalidatePath(`/home`);

    return { success: true, data: updated };
  } catch (error: any) {
    console.error("Error updating attendance record status:", error);
    return { success: false, error: error.message || "Failed to update status." };
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
    });

    return { success: true, data: { subjects, students } };
  } catch (error: any) {
    console.error("Error generating attendance reports:", error);
    return { success: false, error: "Failed to generate attendance reports.", data: null };
  }
}
