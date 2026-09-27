"use client";

import { useState, useEffect, useCallback, use, useMemo } from "react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  HelpCircle,
  Loader2,
  Search,
  BookOpen,
} from "lucide-react";
import {
  getSessionById,
  AttendanceStatus,
} from "@/actions/attendance";
import Pagination from "@/app/components/Pagination";

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

interface SessionDetail {
  id: string;
  title: string | null;
  sessionDate: Date;
  subject: SubjectItem;
  records: RecordItem[];
}

export default function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: sessionId } = use(params);

  const [sessionRecord, setSessionRecord] = useState<SessionDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const loadSession = useCallback(async () => {
    const res = await getSessionById(sessionId);
    if (res.success && res.data) {
      setSessionRecord(res.data as SessionDetail);
    } else {
      toast.error(res.error || "Failed to load session details.");
    }
  }, [sessionId]);

  useEffect(() => {
    let ignore = false;
    async function init() {
      setIsLoading(true);
      await loadSession();
      if (!ignore) {
        setIsLoading(false);
      }
    }
    init();
    return () => {
      ignore = true;
    };
  }, [loadSession]);

  const filteredRecords = sessionRecord?.records.filter(
    (r) =>
      r.student.fullName.toLowerCase().includes(search.toLowerCase()) ||
      r.student.studentNumber.toLowerCase().includes(search.toLowerCase()) ||
      (r.student.email && r.student.email.toLowerCase().includes(search.toLowerCase()))
  );
  const sortedRecords = useMemo(
    () => [...(filteredRecords || [])].sort((a, b) => a.student.fullName.localeCompare(b.student.fullName)),
    [filteredRecords]
  );
  const visibleRecords = sortedRecords.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const counts = sessionRecord?.records.reduce(
    (acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    },
    { PRESENT: 0, ABSENT: 0, LATE: 0, EXCUSED: 0 } as Record<AttendanceStatus, number>
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Back Link */}
      <Link
        href="/history"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Session Logs
      </Link>

      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              {sessionRecord?.subject.code || "CS101"}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              {sessionRecord?.sessionDate
                ? new Date(sessionRecord.sessionDate).toLocaleDateString(undefined, {
                    weekday: "short",
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : ""}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            {sessionRecord?.title || "Roll Call Session"}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {sessionRecord?.subject.name} &bull; Read-only attendance record.
          </p>
        </div>
      </div>

      {/* Record Cards List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-3 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="relative w-full lg:w-72">
            <input
              type="text"
              placeholder="Search student in this session..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-blue-600 text-slate-900 dark:text-white focus:outline-none transition-all"
            />
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-2.5" />
          </div>

          {counts && (
            <div className="flex items-center gap-3 flex-wrap text-xs lg:ml-auto">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                {counts.PRESENT} Present
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 font-bold border border-red-200 dark:border-red-800 flex items-center gap-1">
                <XCircle className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                {counts.ABSENT} Absent
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-bold border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                {counts.LATE} Late
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800 flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                {counts.EXCUSED} Excused
              </span>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600 dark:text-blue-400" />
            <p>Loading session records...</p>
          </div>
        ) : sortedRecords.length > 0 ? (
          <div className="space-y-2">
          {visibleRecords.map((r) => {
            const st = r.student;
            const statusStyle =
              r.status === "PRESENT"
                ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                : r.status === "ABSENT"
                ? "bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800"
                : r.status === "LATE"
                ? "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                : "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800";

            return (
              <div
                key={r.id}
                className="p-3 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold flex items-center justify-center text-xs shrink-0 border border-slate-200 dark:border-slate-700">
                    {st.fullName.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        {st.fullName}
                      </h3>
                      <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400">
                        {st.studentNumber}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Read-only Status */}
                <div className={`px-3 py-1.5 rounded-lg border text-xs font-bold capitalize ${statusStyle}`}>
                  {r.status.toLowerCase()}
                </div>
              </div>
            );
          })}
          </div>
        ) : (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-xs">
            <BookOpen className="w-6 h-6 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="font-bold text-slate-700 dark:text-slate-200">No records found</p>
          </div>
        )}
        <Pagination
          page={currentPage}
          pageSize={pageSize}
          totalItems={sortedRecords.length}
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCurrentPage(1);
          }}
        />
      </div>
    </div>
  );
}
