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
  History,
  UserCheck,
  X,
  CheckCircle2,
  Play,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export default function TeacherHome() {
  const { data: session } = authClient.useSession();
  const teacherName = session?.user?.name || "Prof. Alan Turing";

  // State management
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubjectsExpanded, setIsSubjectsExpanded] = useState(false);

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

  // Active or up-next hero subject
  const activeClass =
    todaySchedule.find((c) => c.status === "in-progress") ||
    todaySchedule.find((c) => c.status === "upcoming") ||
    todaySchedule[0];

  const filteredSubjects = mockSubjects.filter(
    (s) =>
      s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4 sm:space-y-5 max-w-5xl mx-auto px-2 sm:px-4 py-1 sm:py-3">
      {/* 3. QUICK ACTIONS BAR */}
      <div className="space-y-1.5">
        <h2 className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 px-0.5">Quick Actions</h2>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <Link
            href="/students"
            className="p-2.5 sm:p-3 bg-white border border-slate-200/80 rounded-xl sm:rounded-2xl shadow-2xs hover:border-blue-500 hover:shadow-xs transition-all flex items-center gap-2 text-left group"
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Users className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-900 leading-tight truncate">Student Directory</p>
              <p className="text-[10px] text-slate-500 truncate hidden xs:block sm:block">View & Manage</p>
            </div>
          </Link>

          <Link
            href="/subjects"
            className="p-2.5 sm:p-3 bg-white border border-slate-200/80 rounded-xl sm:rounded-2xl shadow-2xs hover:border-blue-500 hover:shadow-xs transition-all flex items-center gap-2 text-left group"
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <BookOpen className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-900 leading-tight truncate">Subjects</p>
              <p className="text-[10px] text-slate-500 truncate hidden xs:block sm:block">Manage Classes</p>
            </div>
          </Link>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="p-2.5 sm:p-3 bg-white border border-slate-200/80 rounded-xl sm:rounded-2xl shadow-2xs hover:border-blue-500 hover:shadow-xs transition-all flex items-center gap-2 text-left group"
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Plus className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-900 leading-tight truncate">New Subject</p>
              <p className="text-[10px] text-slate-500 truncate hidden xs:block sm:block">Add Class</p>
            </div>
          </button>
        </div>
      </div>

      {/* 4. STATS & ANALYTICS SUMMARY (Compact Responsive Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        <div className="bg-white border border-slate-200/80 rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 shadow-2xs hover:shadow-xs transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500">
              Subjects
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <BookOpen className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1.5 sm:mt-2">
            <div className="text-base sm:text-xl font-extrabold text-slate-900">4 Active</div>
            <p className="text-[10px] sm:text-xs text-slate-500 truncate">Course rosters</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 shadow-2xs hover:shadow-xs transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500">
              Enrolled
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1.5 sm:mt-2">
            <div className="text-base sm:text-xl font-extrabold text-slate-900">142 Total</div>
            <p className="text-[10px] sm:text-xs text-emerald-600 font-semibold truncate">Active directory</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 shadow-2xs hover:shadow-xs transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500">
              Avg Rate
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1.5 sm:mt-2">
            <div className="text-base sm:text-xl font-extrabold text-slate-900">94.8%</div>
            <p className="text-[10px] sm:text-xs text-purple-600 font-semibold truncate">↑ 2.4% vs last week</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 shadow-2xs hover:shadow-xs transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500">
              Sessions
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Calendar className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1.5 sm:mt-2">
            <div className="text-base sm:text-xl font-extrabold text-slate-900">28 Total</div>
            <p className="text-[10px] sm:text-xs text-slate-500 truncate font-medium">Logs recorded</p>
          </div>
        </div>
      </div>

      {/* 5. TODAY'S SCHEDULE TIMELINE */}
      <div className="bg-white border border-slate-200/80 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-2xs space-y-3 sm:space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">Today's Schedule</h2>
            <p className="text-[11px] sm:text-xs text-slate-500">Class timeline for roll call</p>
          </div>
          <span className="text-[10px] sm:text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
            4 Classes
          </span>
        </div>

        <div className="space-y-2.5 sm:space-y-3">
          {todaySchedule.map((item) => (
            <div
              key={item.id}
              className={`p-3 sm:p-3.5 rounded-xl sm:rounded-2xl border transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 ${
                item.status === "in-progress"
                  ? "bg-blue-50/50 border-blue-200 ring-1 ring-blue-500/20"
                  : item.status === "completed"
                  ? "bg-slate-50/70 border-slate-200/80 opacity-85"
                  : "bg-white border-slate-200/80 hover:border-blue-300"
              }`}
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <div className="mt-0.5 shrink-0">
                  {item.status === "in-progress" ? (
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                      <Play className="w-3.5 h-3.5 fill-white" />
                    </div>
                  ) : item.status === "completed" ? (
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    </div>
                  ) : (
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 space-y-0.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-extrabold text-[10px] sm:text-xs text-slate-900 bg-slate-200/80 px-1.5 py-0.2 rounded">
                      {item.code}
                    </span>
                    <span className="text-[11px] sm:text-xs text-slate-500 font-medium">{item.time}</span>
                    <span className="text-[11px] sm:text-xs text-slate-400">&bull; {item.room}</span>
                  </div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug truncate">
                    {item.name}
                  </h3>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-2 pt-1.5 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                {item.status === "completed" ? (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] sm:text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      {item.attendanceRate}
                    </span>
                    <Link
                      href={`/sessions/${item.id}`}
                      className="min-h-[32px] sm:min-h-[36px] px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1"
                    >
                      Review
                    </Link>
                  </div>
                ) : item.status === "in-progress" ? (
                  <Link
                    href={`/subjects/${item.code}/sessions/new`}
                    className="min-h-[36px] sm:min-h-[40px] px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg sm:rounded-xl shadow-xs transition-all flex items-center gap-1 active:scale-95"
                  >
                    <Zap className="w-3.5 h-3.5" /> Roll Call
                  </Link>
                ) : (
                  <Link
                    href={`/subjects/${item.code}/sessions/new`}
                    className="min-h-[36px] sm:min-h-[40px] px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg sm:rounded-xl transition-colors flex items-center gap-1"
                  >
                    Prepare
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 6. ALL SUBJECTS DIRECTORY */}
      <div className="bg-white border border-slate-200/80 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-2xs space-y-3 sm:space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center justify-between w-full sm:w-auto">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">Managed Subjects</h2>
              <p className="text-[11px] sm:text-xs text-slate-500">Course directory & rosters</p>
            </div>
            <button
              onClick={() => setIsSubjectsExpanded(!isSubjectsExpanded)}
              className="sm:hidden p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 flex items-center gap-1 text-xs font-bold"
            >
              {isSubjectsExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          <div className="relative w-full sm:w-56">
            <input
              type="text"
              placeholder="Search subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
          </div>
        </div>

        {/* Subject Grid - Responsive toggle on mobile */}
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 ${isSubjectsExpanded ? "block" : "hidden sm:grid"}`}>
          {filteredSubjects.map((subject) => (
            <div
              key={subject.id}
              className="group bg-slate-50/70 border border-slate-200/80 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 hover:bg-white hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-extrabold text-white bg-gradient-to-r ${subject.color}`}>
                    {subject.code}
                  </span>
                  <span className="text-[10px] sm:text-xs font-medium text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {subject.studentsCount} Enrolled
                  </span>
                </div>

                <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug">
                  {subject.name}
                </h3>

                <div className="flex items-center gap-3 text-[11px] sm:text-xs text-slate-500 pt-0.5">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span className="truncate">{subject.schedule}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <TrendingUp className="w-3 h-3 text-slate-400" />
                    <span>{subject.attendanceRate}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between gap-1.5">
                <Link
                  href={`/subjects/${subject.id}/enrollments`}
                  className="px-2.5 py-1 text-[11px] sm:text-xs font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors flex items-center gap-1"
                >
                  <UserCheck className="w-3 h-3" /> Roster
                </Link>

                <div className="flex items-center gap-1.5">
                  <Link
                    href={`/subjects/${subject.id}/history`}
                    className="px-2.5 py-1 text-[11px] sm:text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <History className="w-3 h-3" /> History
                  </Link>

                  <Link
                    href={`/subjects/${subject.id}/sessions/new`}
                    className="px-2.5 py-1 text-[11px] sm:text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs transition-all active:scale-95 flex items-center gap-1"
                  >
                    <Zap className="w-3 h-3" /> Roll Call
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 7. RECENT LOGS SECTION */}
      <div className="bg-white border border-slate-200/80 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-2xs space-y-3 sm:space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900">Recent Attendance Logs</h2>
            <p className="text-[11px] sm:text-xs text-slate-500">Summary of recent roll call sessions</p>
          </div>
          <Link
            href="/sessions"
            className="text-[11px] sm:text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
          >
            View All &rarr;
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">
                <th className="py-2 px-2.5">Subject</th>
                <th className="py-2 px-2.5">Date</th>
                <th className="py-2 px-2.5">Breakdown</th>
                <th className="py-2 px-2.5">Rate</th>
                <th className="py-2 px-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[11px] sm:text-xs">
              {mockRecentSessions.map((session) => (
                <tr key={session.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2.5 px-2.5 font-semibold text-slate-900">
                    <span className="font-bold text-blue-600">{session.subjectCode}</span>
                    <span className="hidden sm:inline text-slate-600"> - {session.subjectName}</span>
                  </td>
                  <td className="py-2.5 px-2.5 text-slate-600 font-medium whitespace-nowrap">{session.date}</td>
                  <td className="py-2.5 px-2.5 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-700 font-bold text-[10px]">
                        {session.present} P
                      </span>
                      <span className="px-1.5 py-0.2 rounded bg-red-100 text-red-700 font-bold text-[10px]">
                        {session.absent} A
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 px-2.5 font-bold text-slate-800">{session.rate}</td>
                  <td className="py-2.5 px-2.5 text-right">
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

      {/* CREATE NEW SUBJECT MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4">
          <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 max-w-sm sm:max-w-md w-full shadow-2xl border border-slate-200 space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="text-sm sm:text-base font-bold text-slate-900">Create New Subject</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            <div className="space-y-2.5">
              <div>
                <label className="block text-[10px] sm:text-xs font-bold uppercase text-slate-600 mb-1">
                  Subject Code
                </label>
                <input
                  type="text"
                  placeholder="e.g. CS101"
                  value={newSubjectCode}
                  onChange={(e) => setNewSubjectCode(e.target.value)}
                  className="w-full px-3 py-1.5 sm:py-2 border border-slate-300 rounded-lg sm:rounded-xl text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] sm:text-xs font-bold uppercase text-slate-600 mb-1">
                  Subject Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Intro to Programming"
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  className="w-full px-3 py-1.5 sm:py-2 border border-slate-300 rounded-lg sm:rounded-xl text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2.5 border-t border-slate-100">
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="min-h-[38px] px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  alert(`Created Subject: ${newSubjectCode} - ${newSubjectName}`);
                  setIsCreateModalOpen(false);
                }}
                className="min-h-[38px] px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-all flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Save Subject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

