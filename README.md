# Class Attendance Management System (CAMS)

A full-stack, mobile-responsive web application designed for teachers to manage subjects, maintain a global student directory, enroll students into classes, conduct attendance sessions in real time, and analyze attendance history and risk reports.

---

## 📋 Table of Contents

- [Application Overview](#-application-overview)
- [Key Features](#-key-features)
- [Technology Stack](#-technology-stack)
- [System Architecture](#-system-architecture)
- [Database Documentation & ERD](#-database-documentation--erd)
- [Installation Steps](#-installation-steps)
- [Database Setup](#-database-setup)
- [Project Structure](#-project-structure)
- [Design Decisions & Technical Rationale](#-design-decisions--technical-rationale)
- [Known Limitations](#-known-limitations)
- [Future Scalability Enhancements](#-future-scalability-enhancements)

---

## 🚀 Application Overview

**Class Attendance Management System (CAMS)** solves administrative inefficiencies by providing a centralized platform for educators. Built on Next.js 16 and PostgreSQL, CAMS isolates teacher data while enabling global student management, multi-subject enrollments, atomic batch attendance marking, and real-time attendance performance analytics.

### Core Goals
- **Data Isolation**: Ensures teachers only access and manage their own subjects and attendance records.
- **Global Directory**: Separates student identity from subject enrollment to prevent duplication.
- **Data Integrity**: Enforces strict database-level unique constraints to prevent duplicate enrollments or attendance records.
- **Historical Preservation**: Retains student attendance logs even if a student is later unenrolled from a subject.

---

## ✨ Key Features

1. **Teacher Authentication (`Req 1`)**
   - Secure account registration & login powered by **Better Auth** with cookie-based sessions.
   - Server-side route protection guards (`requireTeacherAuth`) preventing unauthorized page or API access.
   - Passwords hashed and stored securely (never plain-text).

2. **Global Student Directory (`Req 2`)**
   - Centralized student repository with fields for Student Number, Full Name, Email, and Contact Info.
   - Real-time backend search and pagination across all student attributes.
   - Full CRUD support with instant Zod schema validation.

3. **Subject Management (`Req 3`)**
   - Teachers can create, view, update, and delete their subjects.
   - Enforces unique subject codes per teacher (`@@unique([code, teacherId])`).
   - Dynamic subject cards displaying enrolled student counts and active session stats.

4. **Student Enrollment Module (`Req 4`)**
   - Enroll students into subjects from the global directory.
   - Interactive student roster view with single-click enrollment/unenrollment.
   - Database constraint (`@@unique([subjectId, studentId])`) prevents duplicate enrollments.

5. **Attendance Sessions (`Req 5`)**
   - Create date-stamped attendance sessions per subject with custom session titles.
   - Historical log viewer filtering sessions by subject and date.

6. **Attendance Recording / Roll Call (`Req 6`)**
   - Interactive roll-call interface displaying enrolled students.
   - Mark students as `PRESENT`, `ABSENT`, `LATE`, or `EXCUSED`.
   - Real-time summary counters and bulk "Mark All Present" toggle.
   - Atomic database batch insertion executing within a Prisma `$transaction`.

7. **Attendance History & Analytics Reports (`Req 7`)**
   - Overall school & subject-level attendance percentage calculations.
   - Interactive record viewer allowing teachers to modify historical session statuses.
   - Automated **At-Risk Student Detection** highlighting students below an 80% attendance threshold.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router & Server Actions) |
| **UI Library** | [React 19](https://react.dev/) |
| **Language** | [TypeScript 5](https://www.typescriptlang.org/) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) |
| **Authentication** | [Better Auth v1.7](https://www.better-auth.com/) (Prisma Adapter) |
| **Database ORM** | [Prisma ORM 7](https://www.prisma.io/) (`@prisma/adapter-pg`) |
| **Database** | PostgreSQL (Hosted on [Supabase](https://supabase.com/)) |
| **Validation** | [Zod v4](https://zod.dev/) |
| **UI Components & Icons** | [Lucide React](https://lucide.dev/), [React Hot Toast](https://react-hot-toast.com/) |

---

## 🏗️ System Architecture

CAMS follows a modern, full-stack Next.js architecture leveraging **Server Actions** for end-to-end type safety, avoiding unnecessary REST endpoint overhead while maintaining strict security boundaries.

```mermaid
graph TD
    Client["Mobile-First Frontend (Next.js 16 + React 19 + Tailwind CSS)"]
    API["Server Actions & Route Handlers (App Router)"]
    Auth["Better Auth (Cookie / Session Guard)"]
    DB["Prisma ORM 7 (@prisma/adapter-pg)"]
    PG[("Supabase PostgreSQL Database")]

    Client -->|Form Submissions / User Interactions| API
    Client -->|Session Verification| Auth
    API -->|Teacher Isolation & Auth Check| Auth
    API -->|Type-Safe Queries| DB
    DB -->|Connection Pooling| PG
```

### Data Isolation & Access Flow
1. **Request Inspection**: Every Server Action calls `requireTeacherAuth()` to extract the authenticated user session.
2. **Context Filtering**: Data queries explicitly filter records using `where: { teacherId: user.id }`.
3. **Database Execution**: Prisma communicates with PostgreSQL via pooled connections using standard transactional locks.

---

## 📊 Database Documentation & ERD

### Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    User ||--o{ Session : "has active"
    User ||--o{ Account : "authenticates via"
    User ||--o{ Subject : "owns & teaches"
    
    Student ||--o{ Enrollment : "enrolled in"
    Subject ||--o{ Enrollment : "contains roster"
    
    Subject ||--o{ AttendanceSession : "holds sessions"
    AttendanceSession ||--o{ AttendanceRecord : "contains entries"
    Student ||--o{ AttendanceRecord : "has records"

    User {
        string id PK
        string name
        string email UK
        boolean emailVerified
        string image
        datetime createdAt
        datetime updatedAt
    }

    Student {
        string id PK
        string studentNumber UK
        string fullName
        string email
        string contactInfo
        datetime createdAt
        datetime updatedAt
    }

    Subject {
        string id PK
        string code
        string name
        string description
        string teacherId FK
        datetime createdAt
        datetime updatedAt
    }

    Enrollment {
        string id PK
        string subjectId FK
        string studentId FK
        datetime enrolledAt
    }

    AttendanceSession {
        string id PK
        string subjectId FK
        datetime sessionDate
        string title
        datetime createdAt
    }

    AttendanceRecord {
        string id PK
        string sessionId FK
        string studentId FK
        enum status "PRESENT | ABSENT | LATE | EXCUSED"
        datetime updatedAt
    }
```

### Entity Relationships & Key Constraints

1. **User (Teacher) ↔ Subject (1 : N)**
   - A teacher owns multiple subjects.
   - Constraint: `@@unique([code, teacherId])` guarantees that a teacher cannot create two subjects with the identical code, while allowing different teachers to teach sections of the same subject code.

2. **Subject ↔ Student (M : N via Enrollment)**
   - Handled through the `Enrollment` join table.
   - Constraint: `@@unique([subjectId, studentId])` prevents a student from being enrolled twice in the same subject.

3. **Subject ↔ AttendanceSession (1 : N)**
   - A subject contains multiple attendance sessions recorded on specific dates.
   - Deleting a subject cascade-deletes all associated sessions.

4. **AttendanceSession ↔ AttendanceRecord (1 : N)**
   - Each session holds attendance entries for all enrolled students.
   - Constraint: `@@unique([sessionId, studentId])` enforces data integrity so a student cannot have duplicate attendance status entries within the same session.

---

## 💻 Installation Steps

### Prerequisites
- **Node.js**: v20.x or higher
- **npm**: v10.x or higher
- **PostgreSQL Database**: Accessible database URI (e.g., Supabase, Neon, or local PostgreSQL)

### 1. Clone & Install Dependencies
```bash
git clone <repository-url>
cd cams
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the project root directory (refer to `.env.example` if available):

```env
# Database connection string (Transaction Pooler for runtime)
DATABASE_URL="postgresql://postgres:password@aws-0-region.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Direct connection string (Session Mode for migrations)
DIRECT_URL="postgresql://postgres:password@aws-0-region.pooler.supabase.com:5432/postgres"

# Better Auth secret and base URL
BETTER_AUTH_SECRET="your-super-secret-key-32-chars-min"
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

NODE_ENV="development"
```

---

## 🗄️ Database Setup

### 1. Generate Prisma Client
Generate the type-safe Prisma client matching your local environment:
```bash
npx prisma generate
```

### 2. Push Schema to Database
Sync the Prisma schema directly to your PostgreSQL database:
```bash
npx prisma db push
```

### 3. Seed Database (Optional)
Populate the database with demo teachers, subjects, students, and attendance records:
```bash
npm run db:seed
```

### 4. Start Development Server
Launch the Next.js development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Structure

```text
cams/
├── docs/                      # Assessment & technical documentation
│   ├── cams.md                # System requirements & specifications
│   ├── completion_recap.md    # Feature audit & readiness recap
│   ├── docu.mermaid           # System architecture diagram
│   └── TRACKING.md            # Progress tracker
├── prisma/                    # Database models & migration scripts
│   ├── schema.prisma          # Database schema definitions
│   └── seed.ts                # Database seeding script
├── src/
│   ├── actions/               # Type-safe Server Actions (CRUD logic)
│   │   ├── attendance.ts      # Session & record server actions
│   │   ├── enrollments.ts     # Subject roster server actions
│   │   ├── students.ts        # Global directory server actions
│   │   └── subjects.ts        # Subject management server actions
│   ├── app/                   # Next.js App Router pages & layouts
│   │   ├── (teacher)/         # Protected teacher routes
│   │   │   ├── home/          # Main teacher dashboard
│   │   │   ├── reports/       # Attendance analytics & at-risk reports
│   │   │   ├── sessions/      # Attendance log & session viewer
│   │   │   ├── students/      # Global student directory
│   │   │   └── subjects/      # Subject management & rosters
│   │   ├── login/             # Teacher login page
│   │   └── signup/            # Teacher registration page
│   ├── components/            # Reusable UI components & navigation
│   └── lib/                   # Database client & Auth singletons
│       ├── auth.ts            # Better Auth server configuration
│       ├── auth-client.ts     # Better Auth client hooks
│       └── prisma.ts          # Global Prisma ORM client instance
└── package.json
```

---

## 🧠 Design Decisions & Technical Rationale

During the technical presentation, the following design choices address key architectural questions:

### 1. Global Student Directory vs. Subject-Bound Students
- **Question**: *Why separate students from subjects instead of storing students inside a subject table?*
- **Rationale**: Students exist independently in an academic institution. A single student enrolls in multiple subjects across terms. Storing student details directly inside a subject would cause severe data redundancy, inconsistency during updates (e.g. changing an email), and inability to track a student's overall cross-subject attendance performance.

### 2. Multi-Subject Enrollment Handling
- **Question**: *How does your design support a student enrolling in multiple subjects?*
- **Rationale**: We modeled a clean Many-to-Many relationship using an `Enrollment` join table. The `@@unique([subjectId, studentId])` constraint prevents duplicate enrollments while allowing flexibility for a student to join an unlimited number of subjects.

### 3. Historical Attendance Data Retention
- **Question**: *If a student drops a subject after attending several classes, should their previous attendance records be deleted?*
- **Rationale**: No. Attendance records serve as official academic logs. When a student is unenrolled, their `Enrollment` record is removed, but past `AttendanceRecord` entries remain intact in the database to maintain historical integrity and accurately reflect past classroom statistics.

### 4. Teacher Security & Data Isolation
- **Question**: *How does the system prevent a teacher from modifying another teacher's subject via API tampering?*
- **Rationale**: Server Actions do not trust incoming IDs from the client. Every action retrieves the authenticated user's session ID (`session.user.id`) server-side using `requireTeacherAuth()` and enforces strict `where: { teacherId: user.id }` checks. Manipulating request payloads results in an instant 404 or Unauthorized response.

### 5. Duplicate Attendance Marking Prevention
- **Question**: *How do you prevent marking the same student multiple times in one session?*
- **Rationale**: We enforced a database composite unique index `@@unique([sessionId, studentId])` on `AttendanceRecord`. Furthermore, batch session recording uses a Prisma `$transaction` to guarantee that all attendance entries are created atomically.

---

## ⚠️ Known Limitations

1. **Manual Attendance Entry**: Attendance is logged manually by teachers; automated self-service methods like student QR code scanning or RFID checks are currently non-functional mockups.
2. **Single Portal Role**: The application is optimized for Teacher accounts. Student or Administrator-specific dashboards are not included in the current scope.
3. **Export Formats**: Analytics and history summaries are rendered dynamically on the web UI; exporting report data to CSV/PDF files is not yet implemented.

---

## ⚡ Future Scalability Enhancements

If CAMS expands to thousands of teachers, tens of thousands of students, and millions of attendance records, the following improvements should be implemented:

1. **Database Indexing**:
   - Add explicit B-Tree indexes on `AttendanceRecord(studentId, status)` and `AttendanceSession(subjectId, sessionDate)` to accelerate reporting queries.
2. **Caching Layer (Redis)**:
   - Cache subject rosters and teacher dashboard summary statistics in Redis to eliminate DB round-trips on frequently accessed pages.
3. **Pagination & Infinite Scrolling**:
   - Implement cursor-based pagination on `/students`, `/subjects`, and `/sessions` pages to handle large datasets seamlessly.
4. **Asynchronous Background Processing**:
   - Offload large batch attendance insertions and report recalculations to a background queue (e.g. BullMQ / Redis worker) to prevent request blocking.

---

## 📄 License

This project was developed for technical assessment purposes. All rights reserved.
