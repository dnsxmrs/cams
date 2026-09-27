"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import {
  ArrowLeft,
  Calendar,
  TrendingUp,
  Loader2,
  BookOpen,
  ArrowRight,
} from "lucide-react";
import { getTeacherAttendanceSessions, AttendanceStatus } from "@/actions/attendance";

interface Student {
  id: string;
  studentNumber: string;
  fullName: string;
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
  subject: SubjectItem;
  records: RecordItem[];
}

export default function SubjectHistoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: subjectId } = use(params);

  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    async function loadData() {
      setIsLoading(true);
      const res = await getTeacherAttendanceSessions();
      if (ignore) return;
      if (res.success && res.data) {
        const allSessions = res.data as SessionItem[];
        const filtered = allSessions.filter((s) => s.subjectId === subjectId);
        setSessions(filtered);
      } else {
        toast.error(res.error || "Failed to load subject history.");
      }
      setIsLoading(false);
    }
    loadData();
    return () => {
      ignore = true;
    };
  }, [subjectId]);

  const subjectInfo = sessions[0]?.subject;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Back Link */}
      <Link
        href="/subjects"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Subjects
      </Link>

      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              {subjectInfo?.code || "Subject"}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              {sessions.length} Recorded Sessions
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Attendance History &bull; {subjectInfo?.name || "Subject History"}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Historical attendance session log for this specific subject.
          </p>
        </div>
      </div>

      {/* Sessions List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600 dark:text-blue-400" />
            <p>Loading subject history...</p>
          </div>
        ) : sessions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[650px]">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Session Title</th>
                  <th className="py-3.5 px-4">Date Recorded</th>
                  <th className="py-3.5 px-4">Attendance Breakdown</th>
                  <th className="py-3.5 px-4">Rate</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {sessions.map((sess) => {
                  const total = sess.records.length;
                  const presentCount = sess.records.filter(
                    (r) => r.status === "PRESENT" || r.status === "LATE"
                  ).length;
                  const rate = total > 0 ? Math.round((presentCount / total) * 100) : 0;

                  return (
                    <tr key={sess.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                        {sess.title || "Roll Call Session"}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                        {new Date(sess.sessionDate).toLocaleDateString(undefined, {
                          weekday: "short",
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                        {presentCount} / {total} Attended
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                        <span className="inline-flex items-center gap-1">
                          <TrendingUp className="w-3.5 h-3.5 text-blue-600" /> {rate}%
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/sessions/${sess.id}`}
                          className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition-all inline-flex items-center gap-1"
                        >
                          Review <ArrowRight className="w-3.5 h-3.5" />
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
            <BookOpen className="w-8 h-8 text-slate-300 dark:text-slate-600" />
            <p className="font-bold text-slate-700 dark:text-slate-200">No attendance history found</p>
            <p>No roll call sessions have been recorded for this subject yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
