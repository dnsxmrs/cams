import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { auth } from "../src/lib/auth";

const connectionString = process.env.DATABASE_URL;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

// =========================================================
// Helpers
// =========================================================

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[randomInt(0, arr.length - 1)];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = randomInt(0, i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function weightedStatus(): "PRESENT" | "ABSENT" | "LATE" | "EXCUSED" {
  const r = Math.random();
  if (r < 0.72) return "PRESENT";
  if (r < 0.84) return "LATE";
  if (r < 0.94) return "ABSENT";
  return "EXCUSED";
}

function pastWeekdays(weeks: number): Date[] {
  const days: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const totalDaysBack = weeks * 7;

  for (let i = 0; i < totalDaysBack; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dow = d.getDay(); // 0 = Sun, 6 = Sat
    if (dow !== 0 && dow !== 6) {
      days.push(d);
    }
  }

  return days.sort((a, b) => a.getTime() - b.getTime());
}

// =========================================================
// Name pools & Templates
// =========================================================

const FIRST_NAMES = [
  "Alice", "Bob", "Charlie", "Diana", "Ethan", "Fiona", "George", "Hannah",
  "Ian", "Julia", "Kevin", "Laura", "Miguel", "Nadia", "Oscar", "Paula",
  "Quentin", "Rachel", "Samuel", "Tina", "Umar", "Vera", "Wendell", "Ximena",
  "Yusuf", "Zoe", "Andres", "Beatriz", "Carlos", "Denise", "Elijah", "Farah",
  "Gabriel", "Hazel", "Isaac", "Jasmine", "Kyle", "Liana", "Marco", "Nina",
];

const LAST_NAMES = [
  "Santos", "Reyes", "Cruz", "Bautista", "Garcia", "Torres", "Flores",
  "Ramos", "Mendoza", "Castillo", "Villanueva", "Del Rosario", "Aquino",
  "Navarro", "Pascual", "Domingo", "Gonzales", "Fernandez", "Rivera",
  "Salazar", "Ocampo", "Lim", "Tan", "Chua", "Sy", "Uy", "Lopez", "Diaz",
];

const SUBJECT_TEMPLATES = [
  { code: "CS101", name: "Introduction to Computer Science", description: "Fundamental concepts of programming and computation." },
  { code: "CS102", name: "Discrete Mathematics", description: "Logic, set theory, combinatorics, and graph theory for CS." },
  { code: "CS201", name: "Data Structures & Algorithms", description: "Arrays, linked lists, trees, graphs, sorting, and search." },
  { code: "CS202", name: "Object-Oriented Programming", description: "OOP principles, design patterns, and Java/C++ fundamentals." },
  { code: "CS301", name: "Database Systems", description: "Relational modeling, SQL queries, index optimization, and ORMs." },
  { code: "CS302", name: "Web Application Development", description: "Full-stack development with modern JS frameworks." },
  { code: "CS401", name: "Software Engineering I", description: "SDLC, requirements engineering, and agile methodologies. (Archived)" },
  { code: "CS402", name: "Computer Networks", description: "OSI model, TCP/IP, routing, and network security basics. (Archived)" },
];

const COLORS = ["blue", "green", "purple", "orange", "red", "teal", "pink", "yellow"];

const SCHEDULE_SLOTS = [
  [{ day: "MON", startTime: "08:00", endTime: "10:00" }, { day: "WED", startTime: "08:00", endTime: "10:00" }],
  [{ day: "TUE", startTime: "10:00", endTime: "12:00" }, { day: "THU", startTime: "10:00", endTime: "12:00" }],
  [{ day: "MON", startTime: "13:00", endTime: "15:00" }, { day: "FRI", startTime: "13:00", endTime: "15:00" }],
  [{ day: "WED", startTime: "15:00", endTime: "17:00" }],
  [{ day: "TUE", startTime: "08:00", endTime: "10:00" }, { day: "THU", startTime: "08:00", endTime: "10:00" }],
];

// =========================================================
// Main Seeder
// =========================================================

async function main() {
  console.log("🌱 Starting CAMS database seeding...");

  // ---------------------------------------------------------
  // 1. Teacher account
  // ---------------------------------------------------------
  const teacherEmail = "teacher@school.edu";
  const teacherPassword = "password123";
  const teacherName = "Prof. Alan Turing";

  let teacher = await prisma.user.findUnique({ where: { email: teacherEmail } });

  if (!teacher) {
    console.log(`Creating teacher account for ${teacherEmail}...`);
    await auth.api.signUpEmail({
      body: { email: teacherEmail, password: teacherPassword, name: teacherName },
    });
    teacher = await prisma.user.findUnique({ where: { email: teacherEmail } });
  }

  if (!teacher) throw new Error("Failed to create teacher user");

  await prisma.user.update({
    where: { id: teacher.id },
    data: {
      name: teacherName,
      emailVerified: true,
      twoFactorEnabled: false,
    },
  });
  console.log(`✅ Teacher account ready: ${teacher.email} (Password: ${teacherPassword})`);

  const MIDDLE_INITIALS = ["A", "B", "C", "D", "E", "M", "R", "S", "T", "V"];

  // ---------------------------------------------------------
  // 2. Global student directory (25 active students)
  // ---------------------------------------------------------
  const STUDENT_COUNT = 25;
  console.log(`Creating ${STUDENT_COUNT} students in global directory...`);

  const usedNames = new Set<string>();
  const studentSeeds: { studentNumber: string; lastName: string; firstName: string; middleInitial?: string; email: string; contactInfo: string }[] = [];
  let n = 1;
  while (studentSeeds.length < STUDENT_COUNT) {
    const firstName = pick(FIRST_NAMES);
    const lastName = pick(LAST_NAMES);
    const middleInitial = n % 3 === 0 ? pick(MIDDLE_INITIALS) : undefined;
    const nameKey = `${lastName}-${firstName}-${middleInitial || ""}`;
    if (usedNames.has(nameKey)) continue;
    usedNames.add(nameKey);

    const num = String(n).padStart(3, "0");
    studentSeeds.push({
      studentNumber: `STU-2026-${num}`,
      lastName,
      firstName,
      middleInitial,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${n}@student.edu`,
      contactInfo: `+63 9${randomInt(100000000, 999999999)}`,
    });
    n++;
  }

  const createdStudents = [];
  for (const s of studentSeeds) {
    const existing = await prisma.student.findFirst({
      where: { studentNumber: s.studentNumber },
    });
    const student = existing
      ? await prisma.student.update({
          where: { id: existing.id },
          data: {
            lastName: s.lastName,
            firstName: s.firstName,
            middleInitial: s.middleInitial || null,
            email: s.email,
            contactInfo: s.contactInfo,
            deletedAt: null, // ensure active
          },
        })
      : await prisma.student.create({
          data: {
            studentNumber: s.studentNumber,
            lastName: s.lastName,
            firstName: s.firstName,
            middleInitial: s.middleInitial || null,
            email: s.email,
            contactInfo: s.contactInfo,
            deletedAt: null,
          },
        });
    createdStudents.push(student);
  }
  console.log(`✅ Seeded ${createdStudents.length} students.`);

  // ---------------------------------------------------------
  // 3. Subjects — 6 active + 2 archived
  // ---------------------------------------------------------
  console.log("Creating subjects...");

  const activeTemplates = SUBJECT_TEMPLATES.slice(0, 6);
  const archivedTemplates = SUBJECT_TEMPLATES.slice(6, 8);

  const createdSubjects: Record<string, Awaited<ReturnType<typeof prisma.subject.create>>> = {};

  for (let i = 0; i < activeTemplates.length; i++) {
    const tpl = activeTemplates[i];
    const existing = await prisma.subject.findFirst({
      where: { code: tpl.code, teacherId: teacher.id },
    });
    const subject = existing
      ? await prisma.subject.update({
          where: { id: existing.id },
          data: {
            name: tpl.name,
            description: tpl.description,
            color: COLORS[i % COLORS.length],
            schedules: JSON.stringify(SCHEDULE_SLOTS[i % SCHEDULE_SLOTS.length]),
            isArchived: false,
            deletedAt: null,
          },
        })
      : await prisma.subject.create({
          data: {
            code: tpl.code,
            name: tpl.name,
            description: tpl.description,
            color: COLORS[i % COLORS.length],
            schedules: JSON.stringify(SCHEDULE_SLOTS[i % SCHEDULE_SLOTS.length]),
            isArchived: false,
            teacherId: teacher.id,
            deletedAt: null,
          },
        });
    createdSubjects[tpl.code] = subject;
  }

  for (let i = 0; i < archivedTemplates.length; i++) {
    const tpl = archivedTemplates[i];
    const existing = await prisma.subject.findFirst({
      where: { code: tpl.code, teacherId: teacher.id },
    });
    const subject = existing
      ? await prisma.subject.update({
          where: { id: existing.id },
          data: {
            name: tpl.name,
            description: tpl.description,
            color: COLORS[(i + 6) % COLORS.length],
            schedules: JSON.stringify(SCHEDULE_SLOTS[(i + 6) % SCHEDULE_SLOTS.length]),
            isArchived: true,
            deletedAt: null,
          },
        })
      : await prisma.subject.create({
          data: {
            code: tpl.code,
            name: tpl.name,
            description: tpl.description,
            color: COLORS[(i + 6) % COLORS.length],
            schedules: JSON.stringify(SCHEDULE_SLOTS[(i + 6) % SCHEDULE_SLOTS.length]),
            isArchived: true,
            teacherId: teacher.id,
            deletedAt: null,
          },
        });
    createdSubjects[tpl.code] = subject;
  }
  console.log(`✅ Seeded ${activeTemplates.length} active + ${archivedTemplates.length} archived subjects.`);

  // ---------------------------------------------------------
  // 4. Enrollments
  // ---------------------------------------------------------
  console.log("Enrolling students into subjects...");

  const enrollmentPlan: { code: string; min: number; max: number }[] = [
    { code: "CS101", min: 14, max: 20 },
    { code: "CS102", min: 14, max: 20 },
    { code: "CS201", min: 14, max: 20 },
    { code: "CS202", min: 5, max: 10 },
    { code: "CS301", min: 5, max: 10 },
    { code: "CS302", min: 5, max: 10 },
    { code: "CS401", min: 8, max: 12 },
    { code: "CS402", min: 8, max: 12 },
  ];

  const enrollmentsBySubject: Record<string, typeof createdStudents> = {};

  for (const plan of enrollmentPlan) {
    const subject = createdSubjects[plan.code];
    const count = randomInt(plan.min, plan.max);
    const roster = shuffle(createdStudents).slice(0, count);
    enrollmentsBySubject[plan.code] = roster;

    for (const student of roster) {
      const existing = await prisma.enrollment.findFirst({
        where: { subjectId: subject.id, studentId: student.id },
      });
      if (existing) {
        await prisma.enrollment.update({
          where: { id: existing.id },
          data: { deletedAt: null },
        });
      } else {
        await prisma.enrollment.create({
          data: { subjectId: subject.id, studentId: student.id, deletedAt: null },
        });
      }
    }
    console.log(`   - ${plan.code}: ${roster.length} students enrolled`);
  }
  console.log("✅ Enrollments seeded.");

  // ---------------------------------------------------------
  // 5. Attendance sessions + records
  // ---------------------------------------------------------
  console.log("Creating attendance sessions & records...");

  const attendanceSubjectCodes = ["CS101", "CS201", "CS401"];
  const weekdays = pastWeekdays(2); // Mon-Fri only, last 2 weeks

  let totalSessions = 0;
  let totalRecords = 0;

  for (const code of attendanceSubjectCodes) {
    const subject = createdSubjects[code];
    const roster = enrollmentsBySubject[code];

    for (const day of weekdays) {
      const existingSession = await prisma.attendanceSession.findFirst({
        where: {
          subjectId: subject.id,
          sessionDate: day,
        },
      });

      const session = existingSession
        ? await prisma.attendanceSession.update({
            where: { id: existingSession.id },
            data: {
              title: `${code} - Class Session (${day.toISOString().slice(0, 10)})`,
              deletedAt: null,
            },
          })
        : await prisma.attendanceSession.create({
            data: {
              subjectId: subject.id,
              sessionDate: day,
              title: `${code} - Class Session (${day.toISOString().slice(0, 10)})`,
              deletedAt: null,
            },
          });
      totalSessions++;

      const records = roster.map((student) => ({
        sessionId: session.id,
        studentId: student.id,
        status: weightedStatus(),
        deletedAt: null,
      }));

      await prisma.attendanceRecord.createMany({
        data: records,
        skipDuplicates: true,
      });
      totalRecords += records.length;
    }
    console.log(`   - ${code}: ${weekdays.length} sessions created`);
  }

  console.log(`✅ Seeded ${totalSessions} attendance sessions and ${totalRecords} attendance records.`);

  // ---------------------------------------------------------
  // 6. Sample Student Audit Logs
  // ---------------------------------------------------------
  console.log("Creating sample student audit logs...");
  const sampleStudent = createdStudents[0];
  if (sampleStudent) {
    const existingLog = await prisma.studentAuditLog.findFirst({
      where: { studentId: sampleStudent.id, updatedById: teacher.id },
    });
    if (!existingLog) {
      await prisma.studentAuditLog.create({
        data: {
          studentId: sampleStudent.id,
          updatedById: teacher.id,
          action: "UPDATE",
          changes: {
            contactInfo: {
              from: "+63 9000000000",
              to: sampleStudent.contactInfo,
            },
          },
        },
      });
      console.log("✅ Sample student audit log created.");
    }
  }

  console.log("\n🎉 Seeding finished successfully!");
  console.log("\n🔑 TEACHER CREDENTIALS:");
  console.log(`   Email:    ${teacherEmail}`);
  console.log(`   Password: ${teacherPassword}`);
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });