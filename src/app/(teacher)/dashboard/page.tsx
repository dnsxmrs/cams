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
} from "lucide-react";

export default function TeacherDashboard() {
  const { data: session } = authClient.useSession();
  const teacherName = session?.user?.name || "Prof. Alan Turing";

  // Mock data for UI presentation prior to backend hookup
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSubjectCode, setNewSubjectCode] = useState("");
  const [newSubjectName, setNewSubjectName] = useState("");

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

  const filteredSubjects = mockSubjects.filter(
    (s) =>
      s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* 1. HERO & WELCOME HEADER */}
      {/* <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute right-0 top-0 -mt-12 -mr-12 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-400/20 backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              Teacher Workspace Active
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {teacherName}
            </h1>
            <p className="text-sm text-slate-300 max-w-xl leading-relaxed">
              Manage your subjects, enroll students from the global directory, and track real-time attendance across all your classes.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-lg shadow-blue-600/30 transition-all duration-200 active:scale-95 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Create Subject
            </button>
            <Link
              href="/students"
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-semibold rounded-xl backdrop-blur-md border border-white/15 transition-all duration-200 active:scale-95 flex items-center gap-2"
            >
              <Users className="w-4 h-4" /> Student Directory
            </Link>
          </div>
        </div>
      </div> */}

      {/* 2. STATS & ANALYTICS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
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

      {/* 3. MY SUBJECTS GRID HEADER & SEARCH */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Your Subjects</h2>
            <p className="text-xs text-slate-500">Select a subject to conduct attendance sessions or manage enrollments</p>
          </div>

          <div className="relative w-full sm:w-72">
            <input
              type="text"
              placeholder="Search subject code or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all shadow-xs"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>
        </div>

        {/* SUBJECT CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredSubjects.map((subject) => (
            <div
              key={subject.id}
              className="group bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`px-3 py-1 rounded-lg text-xs font-extrabold text-white bg-gradient-to-r ${subject.color} shadow-xs`}>
                    {subject.code}
                  </span>
                  <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
                    {subject.studentsCount} Enrolled Students
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  {subject.name}
                </h3>

                <div className="flex items-center gap-4 text-xs text-slate-500 pt-1">
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

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <Link
                  href={`/subjects/${subject.id}/enrollments`}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <UserCheck className="w-3.5 h-3.5" /> Enrollments
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
                    className="px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all active:scale-95 flex items-center gap-1.5"
                  >
                    <Zap className="w-3.5 h-3.5" /> Take Attendance
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. RECENT ATTENDANCE SESSIONS TABLE */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Recent Attendance Logs</h2>
            <p className="text-xs text-slate-500">Summary of recent roll call sessions recorded</p>
          </div>
          <Link
            href="/sessions"
            className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
          >
            View All Sessions →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Breakdown</th>
                <th className="py-3 px-4">Rate</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {mockRecentSessions.map((session) => (
                <tr key={session.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-slate-900">
                    <span className="font-bold text-blue-600">{session.subjectCode}</span> - {session.subjectName}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 font-medium">{session.date}</td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 font-bold">
                        {session.present} P
                      </span>
                      <span className="px-2 py-0.5 rounded bg-red-100 text-red-700 font-bold">
                        {session.absent} A
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-800">{session.rate}</td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      {session.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Link
                      href={`/sessions/${session.id}`}
                      className="text-xs font-bold text-slate-600 hover:text-blue-600 underline"
                    >
                      View Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. CREATE SUBJECT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-page-entry">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Create New Subject</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
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
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  alert(`Created Subject: ${newSubjectCode} - ${newSubjectName}`);
                  setIsModalOpen(false);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition-all flex items-center gap-1.5"
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
