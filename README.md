# Class Attendance Management System (CAMS)

A full-stack, mobile-responsive web application designed for teachers to manage subjects, maintain a global student directory, enroll students into classes, conduct attendance sessions in real time, analyze attendance history and risk reports, and manage historical data safely via transparent soft deletes.

---

## 📋 Table of Contents

- [Application Overview](#-application-overview)
- [Key Features](#-key-features)
- [Technology Stack](#-technology-stack)
- [System Architecture](#-system-architecture)
- [Database Documentation & ERD](#-database-documentation--erd)
- [Soft Delete Architecture](#-soft-delete-architecture)
- [Installation Steps](#-installation-steps)
- [Database Setup](#-database-setup)
- [Project Structure](#-project-structure)
- [Design Decisions & Technical Rationale](#-design-decisions--technical-rationale)
- [Known Limitations](#-known-limitations)
- [Future Scalability Enhancements](#-future-scalability-enhancements)

---

## 🚀 Application Overview

**Class Attendance Management System (CAMS)** solves administrative inefficiencies by providing a centralized platform for educators. Built on Next.js 16 and PostgreSQL, CAMS isolates teacher data while enabling global student management, multi-subject enrollments, atomic batch attendance marking, real-time attendance performance analytics, transparent soft deletes, and optimized database queries.

### Core Goals

- **Data Isolation**: Ensures teachers only access and manage their own subjects, students, enrollments, and attendance records.
- **Global Directory**: Separates student identity from subject enrollment to prevent duplication.
- **Data Integrity & Active Constraints**: Enforces PostgreSQL partial unique indexes (`WHERE "deletedAt" IS NULL`) so active records maintain strict uniqueness while allowing soft-deleted records to be safely re-created.
- **Historical Preservation & Soft Delete**: Replaces physical database hard deletes with soft deletes (`deletedAt` timestamps) across core models (`Student`, `Subject`, `Enrollment`, `AttendanceSession`, `AttendanceRecord`), preventing loss of academic history.
- **Query Optimization**: Employs explicit column projections (`select`) across Server Actions to avoid over-fetching data.

---

## ✨ Key Features

1. **Teacher Authentication (`Req 1`)**
   - Secure account registration & login powered by **Better Auth** with cookie-based sessions.
   - Server-side route protection guards (`requireTeacherAuth`) preventing unauthorized page or API access.
   - Passwords hashed and stored securely (never plain-text).

2. **Global Student Directory (`Req 2`)**
   - Centralized student repository with fields for Student Number, Full Name, Email, and Contact Info.
   - Real-time backend search and pagination across all student attributes.
   - Full CRUD support with instant Zod schema validation and audit logging (`StudentAuditLog`).
   - Soft-deleting a student cascade soft-deletes their enrollments and attendance records in a single database transaction.

3. **Subject Management (`Req 3`)**
   - Teachers can create, view, update, archive, and soft-delete their subjects.
   - Enforces unique subject codes per teacher for active subjects (`CREATE UNIQUE INDEX WHERE "deletedAt" IS NULL`).
   - Dynamic subject cards displaying enrolled student counts and active session stats.
   - Soft-deleting a subject cascade soft-deletes its enrollments, sessions, and attendance records in a database transaction.
   - `isArchived` state is kept separate from `deletedAt`.

4. **Student Enrollment Module (`Req 4`)**
   - Enroll students into subjects from the global directory.
   - Interactive student roster view with single-click enrollment/unenrollment.
   - Active partial unique constraint (`(subjectId, studentId) WHERE "deletedAt" IS NULL`) prevents duplicate active enrollments while allowing re-enrollment after unenrollment.

5. **Attendance Sessions (`Req 5`)**
   - Create date-stamped attendance sessions per subject with custom session titles (strictly once per subject per day).
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
   - Client-side UTF-8 CSV report export.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router & Server Actions) |
| **UI Library** | [React 19](https://react.dev/) |
| **Language** | [TypeScript 5](https://www.typescriptlang.org/) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) |
| **Authentication** | [Better Auth v1.7](https://www.better-auth.com/) (Prisma Adapter) |
| **Database ORM** | [Prisma ORM 7](https://www.prisma.io/) (`@prisma/adapter-pg` & Client Extensions) |
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
    Ext["Prisma Client Extension ($extends)"]
    DB["Prisma ORM 7 (@prisma/adapter-pg)"]
    PG[("Supabase PostgreSQL Database")]

    Client -->|Form Submissions / User Interactions| API
    Client -->|Session Verification| Auth
    API -->|Teacher Isolation & Zod Validation| Auth
    API -->|Type-Safe Queries| Ext
    Ext -->|Auto Soft-Delete & Relation Filters| DB
    DB -->|Connection Pooling| PG
```

### Data Isolation & Access Flow

1. **Request Inspection**: Every Server Action validates user session via `getSession()` and verifies input schemas via Zod.
2. **Context Filtering**: Data queries explicitly filter records using `where: { teacherId: user.id }`.
3. **Prisma Client Extension**: Automatically injects `{ deletedAt: null }` filters across top-level queries and nested relation `include`/`select` blocks, and converts `.delete()` calls into soft delete updates (`deletedAt = now()`).
4. **Database Execution**: Prisma communicates with PostgreSQL via pooled connections using standard transactional locks and partial unique indexes.

---

## 📊 Database Documentation & ERD

### Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    User ||--o{ Session : "has active"
    User ||--o{ Account : "authenticates via"
    User ||--o{ TwoFactor : "has 2FA settings"
    User ||--o{ Subject : "owns & teaches"
    User ||--o{ StudentAuditLog : "performs audit"
    
    Student ||--o{ Enrollment : "enrolled in"
    Student ||--o{ AttendanceRecord : "has records"
    Student ||--o{ StudentAuditLog : "has audit history"
    Subject ||--o{ Enrollment : "contains roster"
    Subject ||--o{ AttendanceSession : "holds sessions"
    AttendanceSession ||--o{ AttendanceRecord : "contains entries"

    User {
        string id PK
        string name
        string email UK
        boolean emailVerified
        string image
        boolean twoFactorEnabled
        datetime createdAt
        datetime updatedAt
    }

    Student {
        string id PK
        string studentNumber
        string lastName
        string firstName
        string middleInitial
        string email
        string contactInfo
        datetime createdAt
        datetime updatedAt
        datetime deletedAt
    }

    Subject {
        string id PK
        string code
        string name
        string description
        string schedules "JSON string"
        string color
        boolean isArchived
        string teacherId FK
        datetime createdAt
        datetime updatedAt
        datetime deletedAt
    }

    Enrollment {
        string id PK
        string subjectId FK
        string studentId FK
        datetime enrolledAt
        datetime createdAt
        datetime updatedAt
        datetime deletedAt
    }

    AttendanceSession {
        string id PK
        string subjectId FK
        datetime sessionDate
        string title
        datetime createdAt
        datetime updatedAt
        datetime deletedAt
    }

    AttendanceRecord {
        string id PK
        string sessionId FK
        string studentId FK
        enum status "PRESENT | ABSENT | LATE | EXCUSED"
        datetime createdAt
        datetime updatedAt
        datetime deletedAt
    }

    StudentAuditLog {
        string id PK
        string studentId FK
        string updatedById FK
        string action
        json changes
        datetime createdAt
    }
```

### Entity Relationships & Key Constraints

1. **User (Teacher) ↔ Subject (1 : N)**
   - A teacher owns multiple subjects.
   - Constraint: Partial unique index `Subject(code, teacherId) WHERE "deletedAt" IS NULL` guarantees a teacher cannot have duplicate active subjects with the same code, while allowing soft-deleted codes to be reused.

2. **Subject ↔ Student (M : N via Enrollment)**
   - Handled through the `Enrollment` join table.
   - Constraint: Partial unique index `Enrollment(subjectId, studentId) WHERE "deletedAt" IS NULL` prevents duplicate active enrollments.

3. **Subject ↔ AttendanceSession (1 : N)**
   - A subject contains multiple attendance sessions recorded on specific dates.
   - Soft-deleting a subject cascade-soft-deletes all associated sessions, enrollments, and records in a transaction.

4. **AttendanceSession ↔ AttendanceRecord (1 : N)**
   - Each session holds attendance entries for all enrolled students.
   - Constraint: Partial unique index `AttendanceRecord(sessionId, studentId) WHERE "deletedAt" IS NULL` enforces data integrity so an active student cannot have duplicate attendance status entries within the same session.

---

## 🛡️ Soft Delete Architecture

Soft deletion is enforced uniformly across the application according to strict rules:

### 1. Model Coverage
- **Soft-Deletable Models**: `Student`, `Subject`, `Enrollment`, `AttendanceSession`, `AttendanceRecord`.
- **Hard-Delete / Append-Only Models**: `User`, `Session`, `Account`, `Verification`, `TwoFactor`, `StudentAuditLog`.

### 2. Transparent Prisma Client Extension (`src/lib/prisma.ts`)
- **Query Interception**: Intercepts `findMany`, `findFirst`, `findUnique`, `count`, `aggregate`, `groupBy` to automatically set `deletedAt: null`.
- **Nested Relation Filtering**: Recursively traverses `include` and `select` trees for relations (`enrollments`, `sessions`, `records`, `student`, `subject`) and injects `{ where: { deletedAt: null } }`.
- **Mutation Interception**: Intercepts `.delete()` and `.deleteMany()` on soft-deletable models and executes `.update()` / `.updateMany()` setting `deletedAt: new Date()`.

### 3. Partial Unique Indexes
PostgreSQL partial unique indexes allow soft-deleted records to coexist without blocking new record creation:
```sql
CREATE UNIQUE INDEX "Student_studentNumber_active_key" ON "Student"("studentNumber") WHERE "deletedAt" IS NULL;
CREATE UNIQUE INDEX "Subject_code_teacherId_active_key" ON "Subject"("code", "teacherId") WHERE "deletedAt" IS NULL;
CREATE UNIQUE INDEX "Enrollment_subjectId_studentId_active_key" ON "Enrollment"("subjectId", "studentId") WHERE "deletedAt" IS NULL;
CREATE UNIQUE INDEX "AttendanceRecord_sessionId_studentId_active_key" ON "AttendanceRecord"("sessionId", "studentId") WHERE "deletedAt" IS NULL;
```

---

## 💻 Installation Steps

### Prerequisites

- **Node.js**: v20.x or higher
- **npm**: v10.x or higher
- **PostgreSQL Database**: Accessible database URI (e.g., Supabase, Neon, or local PostgreSQL)

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/dnsxmrs/cams.git
cd cams
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the project root directory:

```env
DATABASE_URL="postgresql://postgres:password@aws-0-region.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:password@aws-0-region.pooler.supabase.com:5432/postgres"

BETTER_AUTH_SECRET="your-super-secret-key-32-chars-min"
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

NODE_ENV="development"

SMTP_HOST="smtp.gmail.com"
SMTP_PORT=465
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="Class Attendance Management System <your-email@gmail.com>"
```

---

## 🗄️ Database Setup

### 1. Generate Prisma Client

Generate the type-safe Prisma client matching your local environment:

```bash
npx prisma generate
```

### 2. Run Database Migrations

Apply migration scripts to sync your database schema:

```bash
npx prisma migrate dev
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
├── docs/                      # Technical documentation & assessments
├── prisma/                    # Database models & migration scripts
│   ├── migrations/            # SQL migration history
│   ├── schema.prisma          # Database schema definitions
│   └── seed.ts                # Database seeding script
├── src/
│   ├── actions/               # Type-safe Server Actions (CRUD & validation)
│   │   ├── attendance.ts      # Session & record server actions
│   │   ├── auth.ts            # Auth & user status server actions
│   │   ├── enrollments.ts     # Roster management server actions
│   │   ├── students.ts        # Global directory server actions
│   │   └── subjects.ts        # Subject management server actions
│   ├── app/                   # Next.js App Router pages & layouts
│   │   ├── (teacher)/         # Protected teacher dashboard routes
│   │   ├── login/             # Teacher login page
│   │   └── signup/            # Teacher registration page
│   ├── components/            # Reusable UI components & navigation
│   └── lib/                   # Singletons, auth & validations
│       ├── auth.ts            # Better Auth server configuration
│       ├── auth-client.ts     # Better Auth client hooks
│       ├── exportAttendance.ts# UTF-8 CSV exporter
│       ├── prisma.ts          # Extended Prisma client (Soft Delete)
│       └── validations/       # Zod validation schemas
└── package.json
```

---

## 🧠 Design Decisions & Technical Rationale

### 1. Transparent Soft Delete via Prisma Extensions
- **Rationale**: Relying on manual `deletedAt: null` filters in every query is prone to developer error. Extending the Prisma client in `src/lib/prisma.ts` guarantees that every query, count, and nested relation automatically filters out soft-deleted records across the entire application.

### 2. Active Partial Unique Indexes
- **Rationale**: Standard SQL `UNIQUE` constraints block inserting new active records with the same code or student number if a soft-deleted record exists. Creating partial unique indexes `WHERE "deletedAt" IS NULL` allows active uniqueness without causing conflicts with soft-deleted rows.

### 3. Backend Query Optimization & Explicit Selection
- **Rationale**: Fetching all columns and unneeded relations wastes bandwidth and database connection memory. Server Actions utilize explicit `select` trees to fetch only necessary fields, significantly boosting API response performance.

### 4. Cascading Soft Delete Transactions
- **Rationale**: Soft deleting a `Subject` or `Student` soft-deletes dependent records (`Enrollment`, `AttendanceSession`, `AttendanceRecord`) within a single `prisma.$transaction`, ensuring database consistency.

---

## ⚠️ Known Limitations

1. **Manual Attendance Roll Call**: Attendance is logged manually by teachers; hardware self-service check-in (e.g., QR scanning) is not currently implemented.
2. **Single Portal Role Scope**: The application is optimized specifically for Teacher accounts.
3. **PDF Document Compilation**: Reports are downloadable as UTF-8 CSV files; native PDF binary compilation is not yet integrated.

---

## ⚡ Future Scalability Enhancements

1. **Redis Caching**: Cache subject rosters and teacher stats to minimize DB round-trips.
2. **Background Queues**: Offload email sending and heavy analytics calculations to a background worker queue (e.g., BullMQ).
3. **Geofenced Check-in**: Implement dynamic QR codes for student self-check-in with geofencing validation.

---

## 📄 License

This project was developed for technical assessment purposes. All rights reserved.
