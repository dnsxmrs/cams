"use client";

import { useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import {
  Plus,
  Users,
  BookOpen,
  TrendingUp,
  Calendar,
  Clock,
  Search,
  Zap,
  Sparkles,
  History,
  UserCheck,
  X,
  QrCode,
  CheckCircle2,
  AlertCircle,
  Play,
  FileText,
  ChevronDown,
  ChevronUp,
  Camera,
  MapPin,
  ArrowRight,
  Filter,
} from "lucide-react";

export default function TeacherHome() {
  const { data: session } = authClient.useSession();
  const teacherName = session?.user?.name || "Prof. Alan Turing";

  // State management
  const [searchQuery, setSearchQuery] = useState("");
  const [attendanceMode, setAttendanceMode] = useState<"roster" | "qr" | "scanner">("roster");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isExcuseModalOpen, setIsExcuseModalOpen] = useState(false);
  const [isSubjectsExpanded, setIsSubjectsExpanded] = useState(false);
  
  // Quick excuse modal form state
  const [excuseStudentId, setExcuseStudentId] = useState("");
  const [excuseReason, setExcuseReason] = useState("");
  const [excuseSubject, setExcuseSubject] = useState("CS101");

  // Create subject modal form state
  const [newSubjectCode, setNewSubjectCode] = useState("");
  const [newSubjectName, setNewSubjectName] = useState("");

  // Schedule & Class Data
  const todaySchedule = [
    {
      id: "class-1",
      code: "CS101",
      name: "Introduction to Computer Science",
      room: "Lab 304",
      time: "9:00 AM - 10:30 AM",
      studentsCount: 38,
      status: "in-progress" as const,
      color: "from-blue-600 to-indigo-600",
      badgeColor: "bg-blue-600",
    },
    {
      id: "class-2",
      code: "MATH202",
      name: "Calculus II & Differential Equations",
      room: "Lecture Hall B",
      time: "11:00 AM - 12:30 PM",
      studentsCount: 42,
      status: "upcoming" as const,
      color: "from-emerald-600 to-teal-600",
      badgeColor: "bg-emerald-600",
    },
    {
      id: "class-3",
      code: "PHYS101",
      name: "General Physics I with Lab",
      room: "Physics Lab 1",
      time: "2:00 PM - 3:30 PM",
      studentsCount: 32,
      status: "upcoming" as const,
      color: "from-amber-600 to-orange-600",
      badgeColor: "bg-amber-600",
    },
    {
      id: "class-4",
      code: "DS301",
      name: "Data Structures & Algorithms",
      room: "Room 201",
      time: "8:00 AM - 9:00 AM",
      studentsCount: 30,
      status: "completed" as const,
      attendanceRate: "96.6%",
      present: 29,
      absent: 1,
      color: "from-purple-600 to-pink-600",
      badgeColor: "bg-purple-600",
    },
  ];

  const mockSubjects = [
    {
      id: "subj-1",
      code: "CS101",
      name: "Introduction to Computer Science",
      studentsCount: 38,
      schedule: "Mon & Wed • 9:00 AM",
      lastSession: "2026-09-24",
      attendanceRate: "96.5%",
      color: "from-blue-600 to-indigo-600",
    },
    {
      id: "subj-2",
      code: "MATH202",
      name: "Calculus II & Differential Equations",
      studentsCount: 42,
      schedule: "Tue & Thu • 10:30 AM",
      lastSession: "2026-09-25",
      attendanceRate: "91.2%",
      color: "from-emerald-600 to-teal-600",
    },
    {
      id: "subj-3",
      code: "PHYS101",
      name: "General Physics I with Lab",
      studentsCount: 32,
      schedule: "Friday • 1:00 PM",
      lastSession: "2026-09-26",
      attendanceRate: "94.0%",
      color: "from-amber-600 to-orange-600",
    },
    {
      id: "subj-4",
      code: "DS301",
      name: "Data Structures & Algorithms",
      studentsCount: 30,
      schedule: "Mon & Wed • 2:00 PM",
      lastSession: "2026-09-24",
      attendanceRate: "97.8%",
      color: "from-purple-600 to-pink-600",
    },
  ];

  const mockRecentSessions = [
    {
      id: "sess-1",
      subjectCode: "PHYS101",
      subjectName: "General Physics I with Lab",
      date: "Today, 1:00 PM",
      present: 30,
      absent: 2,
      late: 0,
      excused: 0,
      rate: "93.7%",
      status: "Completed",
    },
    {
      id: "sess-2",
      subjectCode: "MATH202",
      subjectName: "Calculus II & Differential Equations",
      date: "Yesterday, 10:30 AM",
      present: 38,
      absent: 3,
      late: 1,
      excused: 0,
      rate: "90.5%",
      status: "Completed",
    },
    {
      id: "sess-3",
      subjectCode: "CS101",
      subjectName: "Introduction to Computer Science",
      date: "Sep 24, 9:00 AM",
      present: 37,
      absent: 1,
      late: 0,
      excused: 0,
      rate: "97.3%",
      status: "Completed",
    },
  ];

  // Pick active class or first upcoming class as the Hero subject
  const activeClass = todaySchedule.find((c) => c.status === "in-progress") || todaySchedule.find((c) => c.status === "upcoming") || todaySchedule[0];

  const filteredSubjects = mockSubjects.filter(
    (s) =>
      s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* 1. OPERATIONAL ALERT BANNER */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-700 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-xs sm:text-sm font-bold text-amber-900 leading-tight">
              1 Unsubmitted Session from Yesterday
            </p>
            <p className="text-xs text-amber-700">MATH202 session requires finalizing student attendance logs.</p>
          </div>
        </div>
        <Link
          href="/sessions/sess-2"
          className="shrink-0 min-h-[44px] px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
        >
          Review <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* 2. TOP PRIORITY HERO CARD: ACTIVE / UP NEXT CLASSROOM WORKFLOW */}
      <div className="relative overflow-hidden bg-slate-900 rounded-3xl p-5 sm:p-7 text-white shadow-xl border border-slate-800">
        <div className="absolute right-0 top-0 -mt-16 -mr-16 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 space-y-5">
          {/* Status Header Badge */}
          <div className="flex items-center justify-between gap-2">
            {activeClass.status === "in-progress" ? (
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                CLASS IN SESSION NOW
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-500/30">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                UP NEXT TODAY
              </span>
            )}
            <span className="text-xs font-medium text-slate-400">
              {teacherName.split(" ")[1] || teacherName}
            </span>
          </div>

          {/* Class Info */}
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className={`px-2.5 py-0.5 rounded-lg text-xs font-black tracking-wider text-white ${activeClass.badgeColor}`}>
                {activeClass.code}
              </span>
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-blue-400" />
                {activeClass.room}
              </span>
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                {activeClass.time}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug">
              {activeClass.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              {activeClass.studentsCount} Enrolled Students &bull; Roster ready for roll call
            </p>
          </div>

          {/* Mode Selector Fast Toggles */}
          <div className="bg-slate-800/80 p-1.5 rounded-2xl border border-slate-700/60 flex items-center gap-1">
            <button
              onClick={() => setAttendanceMode("roster")}
              className={`flex-1 min-h-[44px] py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                attendanceMode === "roster"
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-slate-400 hover:text-white hover:bg-slate-700/50"
              }`}
            >
              <UserCheck className="w-4 h-4" /> Manual Roster
            </button>
            <button
              onClick={() => {
                setAttendanceMode("qr");
                setIsQRModalOpen(true);
              }}
              className={`flex-1 min-h-[44px] py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                attendanceMode === "qr"
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-slate-400 hover:text-white hover:bg-slate-700/50"
              }`}
            >
              <QrCode className="w-4 h-4" /> Display QR
            </button>
            <button
              onClick={() => setAttendanceMode("scanner")}
              className={`flex-1 min-h-[44px] py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                attendanceMode === "scanner"
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-slate-400 hover:text-white hover:bg-slate-700/50"
              }`}
            >
              <Camera className="w-4 h-4" /> Kiosk Scan
            </button>
          </div>

          {/* Primary Call-To-Action Button */}
          <Link
            href={`/subjects/${activeClass.code}/sessions/new`}
            className="w-full min-h-[50px] py-3.5 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-blue-600/30 transition-all active:scale-[0.99] flex items-center justify-center gap-2 group"
          >
            <Zap className="w-5 h-5 text-amber-300 group-hover:scale-110 transition-transform" />
            <span>START ROLL CALL NOW</span>
            <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>

      {/* 3. QUICK ACTIONS BAR (Thumb-friendly mobile chips) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Quick Classroom Actions</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => setIsQRModalOpen(true)}
            className="min-h-[48px] p-3 bg-white border border-slate-200/90 rounded-2xl shadow-xs hover:border-blue-500 hover:shadow-md transition-all flex items-center gap-2.5 text-left group"
          >
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 leading-tight">Show QR</p>
              <p className="text-[10px] text-slate-500">Student Self Check-in</p>
            </div>
          </button>

          <button
            onClick={() => setIsExcuseModalOpen(true)}
            className="min-h-[48px] p-3 bg-white border border-slate-200/90 rounded-2xl shadow-xs hover:border-blue-500 hover:shadow-md transition-all flex items-center gap-2.5 text-left group"
          >
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 leading-tight">Excuse Slip</p>
              <p className="text-[10px] text-slate-500">Log Tardy / Absent Note</p>
            </div>
          </button>

          <Link
            href="/students"
            className="min-h-[48px] p-3 bg-white border border-slate-200/90 rounded-2xl shadow-xs hover:border-blue-500 hover:shadow-md transition-all flex items-center gap-2.5 text-left group"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 leading-tight">Students</p>
              <p className="text-[10px] text-slate-500">Global Directory</p>
            </div>
          </Link>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="min-h-[48px] p-3 bg-white border border-slate-200/90 rounded-2xl shadow-xs hover:border-blue-500 hover:shadow-md transition-all flex items-center gap-2.5 text-left group"
          >
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 leading-tight">New Subject</p>
              <p className="text-[10px] text-slate-500">Add Course Roster</p>
            </div>
          </button>
        </div>
      </div>

      {/* 4. TODAY'S SCHEDULE TIMELINE */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Today's Schedule</h2>
            <p className="text-xs text-slate-500">Chronological class timeline for roll call</p>
          </div>
          <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
            4 Classes
          </span>
        </div>

        <div className="space-y-3">
          {todaySchedule.map((item) => {
            return (
              <div
                key={item.id}
                className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  item.status === "in-progress"
                    ? "bg-blue-50/50 border-blue-200 ring-2 ring-blue-500/20 shadow-sm"
                    : item.status === "completed"
                    ? "bg-slate-50/70 border-slate-200/80 opacity-80"
                    : "bg-white border-slate-200/90 hover:border-blue-300 shadow-xs"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {item.status === "in-progress" ? (
                      <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/30">
                        <Play className="w-4 h-4 fill-white" />
                      </div>
                    ) : item.status === "completed" ? (
                      <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      </div>
                    ) : (
                      <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                        <Clock className="w-4 h-4 text-slate-500" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-xs text-slate-900 bg-slate-200/80 px-2 py-0.5 rounded-md">
                        {item.code}
                      </span>
                      <span className="text-xs text-slate-500 font-semibold">{item.time}</span>
                      <span className="text-xs text-slate-400">&bull; {item.room}</span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 leading-tight">
                      {item.name}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  {item.status === "completed" ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                        {item.attendanceRate} Attendance
                      </span>
                      <Link
                        href={`/sessions/${item.id}`}
                        className="min-h-[38px] px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-1"
                      >
                        Review
                      </Link>
                    </div>
                  ) : item.status === "in-progress" ? (
                    <Link
                      href={`/subjects/${item.code}/sessions/new`}
                      className="min-h-[44px] px-4 py-2 text-xs font-extrabold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition-all flex items-center gap-1.5 active:scale-95"
                    >
                      <Zap className="w-4 h-4" /> Take Attendance
                    </Link>
                  ) : (
                    <Link
                      href={`/subjects/${item.code}/sessions/new`}
                      className="min-h-[44px] px-4 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5"
                    >
                      Prepare Roll Call
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. STATS & ANALYTICS CARDS (Desktop/Tablet Viewports Only - Hidden on Mobile) */}
      <div className="hidden lg:grid grid-cols-4 gap-5">
        {/* Card 1 */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Active Subjects
            </span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">4 Subjects</div>
            <p className="text-xs text-slate-500 mt-1">Managed under your teacher profile</p>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Enrolled Students
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">142 Enrolled</div>
            <p className="text-xs text-emerald-600 font-medium mt-1">Global student directory attached</p>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Avg Attendance Rate
            </span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">94.8%</div>
            <p className="text-xs text-purple-600 font-medium mt-1">↑ 2.4% vs last week</p>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Recorded Sessions
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">28 Sessions</div>
            <p className="text-xs text-slate-500 mt-1">Total attendance logs recorded</p>
          </div>
        </div>
      </div>

      {/* 6. ALL SUBJECTS DIRECTORY (Collapsible / Separated Section) */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center justify-between w-full sm:w-auto">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">All Managed Subjects</h2>
              <p className="text-xs text-slate-500">Course directory & student enrollment management</p>
            </div>
            <button
              onClick={() => setIsSubjectsExpanded(!isSubjectsExpanded)}
              className="sm:hidden p-2 text-slate-500 hover:text-slate-900 rounded-xl hover:bg-slate-100 flex items-center gap-1 text-xs font-bold"
            >
              {isSubjectsExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search code or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>
        </div>

        {/* Subject Grid - Always visible on desktop, toggleable on mobile */}
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${isSubjectsExpanded ? "block" : "hidden sm:grid"}`}>
          {filteredSubjects.map((subject) => (
            <div
              key={subject.id}
              className="group bg-slate-50/60 border border-slate-200/90 rounded-2xl p-5 hover:bg-white hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className={`px-2.5 py-0.5 rounded-lg text-xs font-extrabold text-white bg-gradient-to-r ${subject.color} shadow-xs`}>
                    {subject.code}
                  </span>
                  <span className="text-xs font-semibold text-slate-500 bg-white px-2.5 py-1 rounded-md border border-slate-200">
                    {subject.studentsCount} Students
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  {subject.name}
                </h3>

                <div className="flex items-center gap-4 text-xs text-slate-500 pt-0.5">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{subject.schedule}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
                    <span>{subject.attendanceRate} Avg</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between gap-2">
                <Link
                  href={`/subjects/${subject.id}/enrollments`}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors flex items-center gap-1"
                >
                  <UserCheck className="w-3.5 h-3.5" /> Roster
                </Link>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/subjects/${subject.id}/history`}
                    className="px-3 py-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <History className="w-3.5 h-3.5" /> History
                  </Link>

                  <Link
                    href={`/subjects/${subject.id}/sessions/new`}
                    className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-all active:scale-95 flex items-center gap-1"
                  >
                    <Zap className="w-3.5 h-3.5" /> Roll Call
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 7. RECENT LOGS SECTION */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Recent Attendance Logs</h2>
            <p className="text-xs text-slate-500">Summary of recent roll call sessions recorded</p>
          </div>
          <Link
            href="/sessions"
            className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
          >
            View All →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                <th className="py-2.5 px-3">Subject</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Breakdown</th>
                <th className="py-2.5 px-3">Rate</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {mockRecentSessions.map((session) => (
                <tr key={session.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-3 font-semibold text-slate-900">
                    <span className="font-bold text-blue-600">{session.subjectCode}</span>
                    <span className="hidden sm:inline"> - {session.subjectName}</span>
                  </td>
                  <td className="py-3 px-3 text-slate-600 font-medium">{session.date}</td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 font-bold text-[11px]">
                        {session.present} P
                      </span>
                      <span className="px-2 py-0.5 rounded bg-red-100 text-red-700 font-bold text-[11px]">
                        {session.absent} A
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-3 font-bold text-slate-800">{session.rate}</td>
                  <td className="py-3 px-3 text-right">
                    <Link
                      href={`/sessions/${session.id}`}
                      className="text-xs font-bold text-blue-600 hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: QR CODE DISPLAY MODAL */}
      {isQRModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-page-entry">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 text-center space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="text-left">
                <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-wider">
                  Live Self Check-in
                </span>
                <h3 className="text-base font-bold text-slate-900">Class QR Code</h3>
              </div>
              <button
                onClick={() => setIsQRModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="bg-slate-900 text-white p-6 rounded-2xl flex flex-col items-center justify-center space-y-3 shadow-inner">
                <div className="w-48 h-48 bg-white p-3 rounded-xl shadow-md flex items-center justify-center">
                  {/* SVG Mock QR Code */}
                  <svg viewBox="0 0 100 100" className="w-full h-full text-slate-900 fill-current">
                    <rect x="10" y="10" width="30" height="30" rx="4" />
                    <rect x="60" y="10" width="30" height="30" rx="4" />
                    <rect x="10" y="60" width="30" height="30" rx="4" />
                    <rect x="18" y="18" width="14" height="14" fill="white" />
                    <rect x="68" y="18" width="14" height="14" fill="white" />
                    <rect x="18" y="68" width="14" height="14" fill="white" />
                    <rect x="22" y="22" width="6" height="6" />
                    <rect x="72" y="22" width="6" height="6" />
                    <rect x="22" y="72" width="6" height="6" />
                    <rect x="50" y="50" width="12" height="12" />
                    <rect x="65" y="65" width="20" height="8" />
                    <rect x="50" y="70" width="10" height="15" />
                  </svg>
                </div>
                <div className="text-center space-y-0.5">
                  <p className="text-xs font-bold tracking-widest text-blue-400 uppercase">CODE: CS101-2026</p>
                  <p className="text-[11px] text-slate-400">Scan using student portal camera</p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-800 font-medium">
                ⏱️ Session QR expires in <span className="font-extrabold text-blue-900">09:45 mins</span>
              </div>
            </div>

            <button
              onClick={() => setIsQRModalOpen(false)}
              className="w-full min-h-[44px] py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all"
            >
              Close QR Window
            </button>
          </div>
        </div>
      )}

      {/* MODAL 2: EXCUSE SLIP QUICK MODAL */}
      {isExcuseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-page-entry">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Log Student Excuse / Tardy</h3>
                <p className="text-xs text-slate-500">Record an official absence or late slip note</p>
              </div>
              <button
                onClick={() => setIsExcuseModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-xl hover:bg-slate-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Select Subject</label>
                <select
                  value={excuseSubject}
                  onChange={(e) => setExcuseSubject(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-600"
                >
                  <option value="CS101">CS101 - Introduction to Computer Science</option>
                  <option value="MATH202">MATH202 - Calculus II</option>
                  <option value="PHYS101">PHYS101 - General Physics I</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Student ID / Name</label>
                <input
                  type="text"
                  placeholder="e.g. STU-2026-001 or Alice Johnson"
                  value={excuseStudentId}
                  onChange={(e) => setExcuseStudentId(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Reason / Note</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Medical excuse letter submitted / Authorized school activity"
                  value={excuseReason}
                  onChange={(e) => setExcuseReason(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setIsExcuseModalOpen(false)}
                className="min-h-[44px] px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  alert(`Excuse logged for ${excuseStudentId || "Student"}`);
                  setIsExcuseModalOpen(false);
                }}
                className="min-h-[44px] px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-md transition-all flex items-center gap-1.5"
              >
                <FileText className="w-4 h-4" /> Save Excuse Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: CREATE NEW SUBJECT MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-page-entry">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Create New Subject</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Subject Code
                </label>
                <input
                  type="text"
                  placeholder="e.g. CS101"
                  value={newSubjectCode}
                  onChange={(e) => setNewSubjectCode(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Subject Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Introduction to Programming"
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="min-h-[44px] px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  alert(`Created Subject: ${newSubjectCode} - ${newSubjectName}`);
                  setIsCreateModalOpen(false);
                }}
                className="min-h-[44px] px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition-all flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Save Subject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
