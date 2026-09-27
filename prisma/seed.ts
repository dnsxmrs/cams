import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { auth } from "../src/lib/auth";

const connectionString = process.env.DATABASE_URL;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Starting CAMS database seeding...");

  // 1. Seed Teacher Account
  const teacherEmail = "teacher@school.edu";
  const teacherPassword = "password123";
  const teacherName = "Prof. Alan Turing";

  let teacher = await prisma.user.findUnique({
    where: { email: teacherEmail },
  });

  if (!teacher) {
    console.log(`Creating teacher account for ${teacherEmail}...`);
    await auth.api.signUpEmail({
      body: {
        email: teacherEmail,
        password: teacherPassword,
        name: teacherName,
      },
    });

    teacher = await prisma.user.findUnique({
      where: { email: teacherEmail },
    });
  }

  if (teacher) {
    // Ensure emailVerified is true
    await prisma.user.update({
      where: { id: teacher.id },
      data: { emailVerified: true },
    });
    console.log(`✅ Teacher account ready: ${teacher.email} (Password: ${teacherPassword})`);
  } else {
    throw new Error("Failed to create teacher user");
  }

  // 2. Seed Global Student Directory
  console.log("Creating students in global directory...");
  const sampleStudents = [
    {
      studentNumber: "STU-2026-001",
      fullName: "Alice Johnson",
      email: "alice.johnson@student.edu",
      contactInfo: "+1 555-0101",
    },
    {
      studentNumber: "STU-2026-002",
      fullName: "Bob Smith",
      email: "bob.smith@student.edu",
      contactInfo: "+1 555-0102",
    },
    {
      studentNumber: "STU-2026-003",
      fullName: "Charlie Davis",
      email: "charlie.davis@student.edu",
      contactInfo: "+1 555-0103",
    },
    {
      studentNumber: "STU-2026-004",
      fullName: "Diana Prince",
      email: "diana.prince@student.edu",
      contactInfo: "+1 555-0104",
    },
    {
      studentNumber: "STU-2026-005",
      fullName: "Ethan Hunt",
      email: "ethan.hunt@student.edu",
      contactInfo: "+1 555-0105",
    },
  ];

  const createdStudents = [];
  for (const s of sampleStudents) {
    const student = await prisma.student.upsert({
      where: { studentNumber: s.studentNumber },
      update: {
        fullName: s.fullName,
        email: s.email,
        contactInfo: s.contactInfo,
      },
      create: s,
    });
    createdStudents.push(student);
  }
  console.log(`✅ Seeded ${createdStudents.length} students.`);

  // 3. Seed Subjects for Teacher
  console.log("Creating subjects...");
  const sampleSubjects = [
    {
      code: "CS101",
      name: "Introduction to Computer Science",
      description: "Fundamental concepts of programming and computation.",
    },
    {
      code: "CS201",
      name: "Data Structures & Algorithms",
      description: "Arrays, linked lists, trees, graphs, sorting, and search.",
    },
    {
      code: "CS301",
      name: "Database Systems",
      description: "Relational modeling, SQL queries, index optimization, and ORMs.",
    },
  ];

  const createdSubjects = [];
  for (const subj of sampleSubjects) {
    const subject = await prisma.subject.upsert({
      where: {
        code_teacherId: {
          code: subj.code,
          teacherId: teacher.id,
        },
      },
      update: {
        name: subj.name,
        description: subj.description,
      },
      create: {
        code: subj.code,
        name: subj.name,
        description: subj.description,
        teacherId: teacher.id,
      },
    });
    createdSubjects.push(subject);
  }
  console.log(`✅ Seeded ${createdSubjects.length} subjects for ${teacher.name}.`);

  // 4. Enroll Students into Subjects
  console.log("Enrolling students into subjects...");
  const cs101 = createdSubjects.find((s) => s.code === "CS101")!;
  const cs201 = createdSubjects.find((s) => s.code === "CS201")!;
  const cs301 = createdSubjects.find((s) => s.code === "CS301")!;

  // Enroll CS101: Alice, Bob, Charlie
  for (const student of createdStudents.slice(0, 3)) {
    await prisma.enrollment.upsert({
      where: {
        subjectId_studentId: {
          subjectId: cs101.id,
          studentId: student.id,
        },
      },
      update: {},
      create: {
        subjectId: cs101.id,
        studentId: student.id,
      },
    });
  }

  // Enroll CS201: Alice, Diana, Ethan
  for (const student of [createdStudents[0], createdStudents[3], createdStudents[4]]) {
    await prisma.enrollment.upsert({
      where: {
        subjectId_studentId: {
          subjectId: cs201.id,
          studentId: student.id,
        },
      },
      update: {},
      create: {
        subjectId: cs201.id,
        studentId: student.id,
      },
    });
  }

  // Enroll CS301: Bob, Charlie, Diana
  for (const student of [createdStudents[1], createdStudents[2], createdStudents[3]]) {
    await prisma.enrollment.upsert({
      where: {
        subjectId_studentId: {
          subjectId: cs301.id,
          studentId: student.id,
        },
      },
      update: {},
      create: {
        subjectId: cs301.id,
        studentId: student.id,
      },
    });
  }
  console.log("✅ Student enrollments seeded.");

  // 5. Seed Attendance Session & Records for CS101
  console.log("Creating attendance session & records...");
  const session = await prisma.attendanceSession.create({
    data: {
      subjectId: cs101.id,
      title: "Lecture 1 - Course Orientation",
      sessionDate: new Date(),
    },
  });

  await prisma.attendanceRecord.createMany({
    data: [
      { sessionId: session.id, studentId: createdStudents[0].id, status: "PRESENT" },
      { sessionId: session.id, studentId: createdStudents[1].id, status: "ABSENT" },
      { sessionId: session.id, studentId: createdStudents[2].id, status: "LATE" },
    ],
    skipDuplicates: true,
  });

  console.log("✅ Attendance session & records seeded.");
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
