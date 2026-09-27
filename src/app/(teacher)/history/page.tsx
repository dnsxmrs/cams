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

      {/* Sessions List Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        {isLoading && sessions.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600 dark:text-blue-400" />
            <p>Loading attendance session logs...</p>
          </div>
        ) : filteredSessions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
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
                          {/* <TrendingUp className="w-3.5 h-3.5" />  */}
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
