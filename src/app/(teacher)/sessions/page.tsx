"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import {
  Calendar,
  Search,
  BookOpen,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  HelpCircle,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { getTeacherAttendanceSessions, AttendanceStatus } from "@/actions/attendance";

interface Student {
  id: string;
  studentNumber: string;
  fullName: string;
  email: string | null;
}

interface RecordItem {
  id: string;
  status: AttendanceStatus;
  student: Student;
}

interface SubjectItem {
  id: string;
  code: string;
  name: string;
}

interface SessionItem {
  id: string;
  subjectId: string;
  title: string | null;
  sessionDate: Date;
  createdAt: Date;
  subject: SubjectItem;
  records: RecordItem[];
}

export default function SessionsLogPage() {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchSessions = useCallback(async (query?: string) => {
    setIsLoading(true);
    const res = await getTeacherAttendanceSessions(query);
    if (res.success && res.data) {
      setSessions(res.data as SessionItem[]);
    } else {
      toast.error(res.error || "Failed to load session logs.");
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSessions(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search, fetchSessions]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-bold mb-2 border border-blue-200 dark:border-blue-800">
            <Calendar className="w-3.5 h-3.5" /> Historical Logs
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Attendance Sessions Log
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Review past roll call sessions, student attendance rates, and record details.
          </p>
        </div>

        <Link
          href="/subjects"
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer self-start md:self-auto"
        >
          <BookOpen className="w-4 h-4" /> Start New Roll Call
        </Link>
      </div>

      {/* Search & Stats Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search by session title, subject code or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-blue-600 text-slate-900 dark:text-white focus:outline-none transition-all"
          />
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-2.5" />
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-2">
          {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600 dark:text-blue-400" />}
          <span>
            Total Recorded Sessions: <span className="font-bold text-slate-900 dark:text-white">{sessions.length}</span>
          </span>
        </div>
      </div>

      {/* Sessions List Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        {isLoading && sessions.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600 dark:text-blue-400" />
            <p>Loading attendance session logs...</p>
          </div>
        ) : sessions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Subject</th>
                  <th className="py-3.5 px-4">Session Title & Date</th>
                  <th className="py-3.5 px-4">Breakdown</th>
                  <th className="py-3.5 px-4">Attendance Rate</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {sessions.map((sess) => {
                  const total = sess.records.length;
                  const presentCount = sess.records.filter(
                    (r) => r.status === "PRESENT" || r.status === "LATE"
                  ).length;
                  const rate = total > 0 ? Math.round((presentCount / total) * 100) : 0;

                  const counts = sess.records.reduce(
                    (acc, r) => {
                      acc[r.status] = (acc[r.status] || 0) + 1;
                      return acc;
                    },
                    { PRESENT: 0, ABSENT: 0, LATE: 0, EXCUSED: 0 } as Record<AttendanceStatus, number>
                  );

                  return (
                    <tr key={sess.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                      {/* Subject */}
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-md text-xs font-mono font-bold border bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                          {sess.subject.code}
                        </span>
                        <p className="text-[11px] font-medium text-slate-600 dark:text-slate-300 mt-1">
                          {sess.subject.name}
                        </p>
                      </td>

                      {/* Title & Date */}
                      <td className="py-3.5 px-4">
                        <h2 className="font-bold text-slate-900 dark:text-white">
                          {sess.title || "Roll Call Session"}
                        </h2>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {new Date(sess.sessionDate).toLocaleDateString(undefined, {
                            weekday: "short",
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </td>

                      {/* Breakdown Pills */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
                          <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800">
                            {counts.PRESENT} Present
                          </span>
                          <span className="px-2 py-0.5 rounded bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 font-bold border border-red-200 dark:border-red-800">
                            {counts.ABSENT} Absent
                          </span>
                          {counts.LATE > 0 && (
                            <span className="px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-bold border border-amber-200 dark:border-amber-800">
                              {counts.LATE} Late
                            </span>
                          )}
                          {counts.EXCUSED > 0 && (
                            <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800">
                              {counts.EXCUSED} Excused
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Rate */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border ${
                            rate >= 90
                              ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                              : rate >= 75
                              ? "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                              : "bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800"
                          }`}
                        >
                          <TrendingUp className="w-3.5 h-3.5" /> {rate}%
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/sessions/${sess.id}`}
                          className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition-all inline-flex items-center gap-1"
                        >
                          <span>Review</span>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
            <Calendar className="w-8 h-8 text-slate-300 dark:text-slate-600" />
            <p className="font-bold text-slate-700 dark:text-slate-200 text-sm">No session logs found</p>
            <p>
              {search
                ? `No sessions match "${search}".`
                : "You haven't recorded any roll call attendance sessions yet."}
            </p>
            {!search && (
              <Link
                href="/subjects"
                className="mt-3 px-4 py-2 text-xs font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors inline-flex items-center gap-1.5"
              >
                <BookOpen className="w-4 h-4" /> Go to Subjects & Take Attendance
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
