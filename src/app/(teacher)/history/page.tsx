"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import {
  Calendar,
  Search,
  BookOpen,
  Loader2,
  X,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { getTeacherAttendanceSessions, AttendanceStatus } from "@/actions/attendance";
import Pagination from "@/app/components/Pagination";

interface Student {
  id: string;
  studentNumber: string;
  lastName: string;
  firstName: string;
  middleInitial: string | null;
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
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchSessions = useCallback(async () => {
    setIsLoading(true);
    const res = await getTeacherAttendanceSessions();
    if (res.success && res.data) {
      setSessions(res.data as SessionItem[]);
      setCurrentPage(1);
    } else {
      toast.error(res.error || "Failed to load session logs.");
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const subjects = useMemo(() => {
    const map = new Map<string, SubjectItem>();
    sessions.forEach((s) => {
      if (s.subject && !map.has(s.subject.id)) {
        map.set(s.subject.id, s.subject);
      }
    });
    return Array.from(map.values()).sort((a, b) => a.code.localeCompare(b.code));
  }, [sessions]);

  const filteredSessions = useMemo(() => {
    const query = search.trim().toLowerCase();
    return sessions.filter((session) => {
      const matchesSubject = selectedSubjectId === "ALL" || session.subjectId === selectedSubjectId;
      const matchesQuery =
        !query ||
        [session.title || "", session.subject.code, session.subject.name].some((value) =>
          value.toLowerCase().includes(query)
        );
      return matchesSubject && matchesQuery;
    });
  }, [search, selectedSubjectId, sessions]);

  return (
    <div className="space-y-6 pb-16">
      {/* Standalone Search Bar & Subject Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="Search by session title, subject code or name..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-10 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all shadow-2xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
          />
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          {search && (
            <button
              onClick={() => {
                setSearch("");
                setCurrentPage(1);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded-full cursor-pointer"
              aria-label="Clear history search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Subject Filter Dropdown */}
        <select
          value={selectedSubjectId}
          onChange={(e) => {
            setSelectedSubjectId(e.target.value);
            setCurrentPage(1);
          }}
          className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-2xs cursor-pointer"
        >
          <option value="ALL">All Subjects ({subjects.length})</option>
          {subjects.map((sub) => (
            <option key={sub.id} value={sub.id}>
              {sub.code} - {sub.name}
            </option>
          ))}
        </select>
      </div>

      {/* Sessions List Table / Mobile Cards */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        {isLoading && sessions.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600 dark:text-blue-400" />
            <p>Loading attendance session logs...</p>
          </div>
        ) : filteredSessions.length > 0 ? (
          <div>
            {/* Desktop Table View (md:block) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-4">Subject</th>
                    <th className="py-3.5 px-4">Session Title & Date</th>
                    <th className="py-3.5 px-3 text-center text-emerald-700 dark:text-emerald-400">Present</th>
                    <th className="py-3.5 px-3 text-center text-red-700 dark:text-red-400">Absent</th>
                    <th className="py-3.5 px-3 text-center text-amber-700 dark:text-amber-400">Late</th>
                    <th className="py-3.5 px-3 text-center text-blue-700 dark:text-blue-400">Excused</th>
                    <th className="py-3.5 px-4 text-center">Attendance Rate</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {filteredSessions.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((sess) => {
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

                        {/* Status Counts Columns */}
                        <td className="py-3.5 px-3 text-center font-bold text-emerald-700 dark:text-emerald-400">
                          {counts.PRESENT}
                        </td>
                        <td className="py-3.5 px-3 text-center font-bold text-red-700 dark:text-red-400">
                          {counts.ABSENT}
                        </td>
                        <td className="py-3.5 px-3 text-center font-bold text-amber-700 dark:text-amber-400">
                          {counts.LATE}
                        </td>
                        <td className="py-3.5 px-3 text-center font-bold text-blue-700 dark:text-blue-400">
                          {counts.EXCUSED}
                        </td>

                        {/* Rate */}
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1 text-xs font-bold ${
                              rate >= 90
                                ? "text-emerald-700 dark:text-emerald-300"
                                : rate >= 75
                                ? "text-amber-700 dark:text-amber-300"
                                : "text-red-700 dark:text-red-300"
                            }`}
                          >
                            {rate}%
                          </span>
                        </td>

                        {/* Action */}
                        <td className="py-3.5 px-4 text-right">
                          <Link
                            href={`/history/${sess.id}`}
                            className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 font-bold text-xs transition-colors"
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

            {/* Mobile Cards View (md:hidden) */}
            <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {filteredSessions.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((sess) => {
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
                  <div key={sess.id} className="p-4 space-y-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    {/* Top row: Subject Code & Attendance Rate */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-bold border bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 shrink-0">
                          {sess.subject.code}
                        </span>
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 truncate">
                          {sess.subject.name}
                        </span>
                      </div>

                      <span
                        className={`shrink-0 px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${
                          rate >= 90
                            ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                            : rate >= 75
                            ? "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                            : "bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800"
                        }`}
                      >
                        {rate}% Rate
                      </span>
                    </div>

                    {/* Title & Session Date */}
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-snug">
                        {sess.title || "Roll Call Session"}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>
                          {new Date(sess.sessionDate).toLocaleDateString(undefined, {
                            weekday: "short",
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </p>
                    </div>

                    {/* Status Pill Counts Grid */}
                    <div className="grid grid-cols-4 gap-1.5 pt-1 text-center">
                      <div className="p-1.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40">
                        <span className="block text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">Present</span>
                        <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-300">{counts.PRESENT}</span>
                      </div>
                      <div className="p-1.5 rounded-xl bg-red-50/70 dark:bg-red-950/30 border border-red-100 dark:border-red-900/40">
                        <span className="block text-[10px] uppercase font-bold text-red-600 dark:text-red-400">Absent</span>
                        <span className="text-xs font-extrabold text-red-700 dark:text-red-300">{counts.ABSENT}</span>
                      </div>
                      <div className="p-1.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40">
                        <span className="block text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400">Late</span>
                        <span className="text-xs font-extrabold text-amber-700 dark:text-amber-300">{counts.LATE}</span>
                      </div>
                      <div className="p-1.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40">
                        <span className="block text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400">Excused</span>
                        <span className="text-xs font-extrabold text-blue-700 dark:text-blue-300">{counts.EXCUSED}</span>
                      </div>
                    </div>

                    {/* Action button */}
                    <div className="pt-2 flex items-center justify-end border-t border-slate-100 dark:border-slate-800/60">
                      <Link
                        href={`/history/${sess.id}`}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100/80 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/60 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1.5"
                      >
                        <span>Review Details</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>

            <Pagination
              page={currentPage}
              pageSize={pageSize}
              totalItems={filteredSessions.length}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(1);
              }}
            />
          </div>
        ) : (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
            <Calendar className="w-8 h-8 text-slate-300 dark:text-slate-600" />
            <p className="font-bold text-slate-700 dark:text-slate-200 text-sm">No session logs found</p>
            <p>
              {search || selectedSubjectId !== "ALL"
                ? "No sessions match your filter criteria."
                : "You haven't recorded any roll call attendance sessions yet."}
            </p>
            {!search && selectedSubjectId === "ALL" && (
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
