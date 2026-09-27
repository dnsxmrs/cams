"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  HelpCircle,
  Search,
  Zap,
  Loader2,
  Calendar,
  BookOpen,
  UserCheck,
  AlertTriangle,
  History,
  ShieldCheck,
  FileSpreadsheet,
  Download,
} from "lucide-react";
import {
  getSubjectForSession,
  getTodaySessionForSubject,
  createAttendanceSessionAndRecords,
} from "@/actions/attendance";
import { formatSchedulesDisplay, getColorTheme } from "@/app/(teacher)/subjects/page";
import { exportSubjectAttendanceCSV } from "@/lib/exportAttendance";

type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";

interface Student {
  id: string;
  studentNumber: string;
  fullName: string;
  email: string | null;
  contactInfo: string | null;
}

interface EnrollmentItem {
  id: string;
  student: Student;
}

interface SubjectDetail {
  id: string;
  code: string;
  name: string;
  description: string | null;
  schedules: string | null;
  color: string | null;
  enrollments: EnrollmentItem[];
}

interface TodaySessionInfo {
  id: string;
  title: string | null;
  records: Array<{ id: string }>;
}

export default function TakeAttendancePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: subjectId } = use(params);
  const router = useRouter();

  const [subject, setSubject] = useState<SubjectDetail | null>(null);
  const [todaySession, setTodaySession] = useState<TodaySessionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionTitle, setSessionTitle] = useState("");
  const [search, setSearch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Map of studentId -> AttendanceStatus (Default to PRESENT)
  const [statusMap, setStatusMap] = useState<Record<string, AttendanceStatus>>({});

  useEffect(() => {
    let ignore = false;

    async function loadData() {
      const [subRes, todayRes] = await Promise.all([
        getSubjectForSession(subjectId),
        getTodaySessionForSubject(subjectId),
      ]);

      if (ignore) return;

      if (subRes.success && subRes.data) {
        const sub = subRes.data as SubjectDetail;
        setSubject(sub);

        // Initialize all enrolled students to PRESENT
        const initialMap: Record<string, AttendanceStatus> = {};
        sub.enrollments.forEach((e) => {
          initialMap[e.student.id] = "PRESENT";
        });
        setStatusMap(initialMap);

        // Auto-set title default
        const todayStr = new Date().toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
        setSessionTitle(`Attendance - ${todayStr}`);
      } else {
        toast.error(subRes.error || "Failed to load subject for attendance.");
      }

      if (todayRes.success && todayRes.data) {
        setTodaySession(todayRes.data as TodaySessionInfo);
      } else {
        setTodaySession(null);
      }

      setIsLoading(false);
    }

    loadData();
    return () => {
      ignore = true;
    };
  }, [subjectId]);

  const setSingleStatus = (studentId: string, status: AttendanceStatus) => {
    if (todaySession) return; // Locked if taken today
    setStatusMap((prev) => ({ ...prev, [studentId]: status }));
  };

  const setAllStatus = (status: AttendanceStatus) => {
    if (!subject || todaySession) return;
    const newMap: Record<string, AttendanceStatus> = {};
    subject.enrollments.forEach((e) => {
      newMap[e.student.id] = status;
    });
    setStatusMap(newMap);
    toast.success(`Marked all students as ${status}`);
  };

  const handleSubmit = async () => {
    if (todaySession) {
      toast.error("Attendance for this subject has already been recorded today.");
      return;
    }

    if (!subject || subject.enrollments.length === 0) {
      toast.error("No enrolled students to record.");
      return;
    }

    const records = Object.entries(statusMap).map(([studentId, status]) => ({
      studentId,
      status,
    }));

    setIsSubmitting(true);
    const res = await createAttendanceSessionAndRecords(
      subjectId,
      sessionTitle,
      records
    );

    if (res.success) {
      toast.success(`Attendance recorded for ${subject.code}!`);
      router.push("/subjects");
      router.refresh();
    } else {
      toast.error(res.error || "Failed to submit attendance.");
      setIsSubmitting(false);
    }
  };

  // Filter enrolled students
  const filteredEnrollments = subject?.enrollments.filter(
    (e) =>
      e.student.fullName.toLowerCase().includes(search.toLowerCase()) ||
      e.student.studentNumber.toLowerCase().includes(search.toLowerCase()) ||
      (e.student.email && e.student.email.toLowerCase().includes(search.toLowerCase()))
  );

  // Status Counts
  const counts = Object.values(statusMap).reduce(
    (acc, status) => {
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    },
    { PRESENT: 0, ABSENT: 0, LATE: 0, EXCUSED: 0 } as Record<AttendanceStatus, number>
  );

  const theme = getColorTheme(subject?.color);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-24">
      {/* Back Link & Export CSV */}
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/subjects"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Subjects
        </Link>

        {subject && (
          <button
            onClick={() => exportSubjectAttendanceCSV(subject.id, subject.code)}
            className="px-3.5 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/80 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer border border-emerald-300/60 dark:border-emerald-800"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Export Attendance CSV</span>
          </button>
        )}
      </div>

      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
        {/* Color Accent Stripe */}
        <div
          className="absolute top-0 inset-x-0 h-1.5"
          style={{ backgroundColor: theme.hex }}
        />

        <div>
          <div className="flex items-center gap-2 mb-2 pt-1">
            <span
              className={`px-2.5 py-0.5 rounded-md text-xs font-mono font-bold border ${theme.bg} ${theme.border} ${theme.text}`}
            >
              {subject?.code || "CS101"}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              {new Date().toLocaleDateString(undefined, {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Take Attendance &bull; {subject?.name || "Subject"}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{formatSchedulesDisplay(subject?.schedules, subject?.description)}</span>
          </p>
        </div>

        {/* Session Title Input */}
        <div className="w-full md:w-72">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
            Session Title / Topic
          </label>
          <input
            type="text"
            value={sessionTitle}
            disabled={!!todaySession}
            onChange={(e) => setSessionTitle(e.target.value)}
            placeholder="e.g. Lecture 5 - Loops & Arrays"
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-blue-600 text-slate-900 dark:text-white focus:outline-none transition-all font-medium disabled:opacity-60"
          />
        </div>
      </div>

      {/* ATTENDANCE ALREADY TAKEN TODAY WARNING BANNER */}
      {todaySession && (
        <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold leading-tight">
                Today&apos;s Attendance Already Submitted
              </h3>
              <p className="text-xs opacity-90 mt-1 leading-relaxed">
                Attendance for <strong className="font-bold">{subject?.code}</strong> was already taken today ({new Date().toLocaleDateString()}). Attendance can strictly only be taken once per day.
              </p>
            </div>
          </div>

          <Link
            href={`/sessions/${todaySession.id}`}
            className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 shrink-0 self-start sm:self-auto"
          >
            <History className="w-4 h-4" /> View Today&apos;s Session Log
          </Link>
        </div>
      )}

      {/* NO STUDENTS ENROLLED BANNER */}
      {subject && subject.enrollments.length === 0 && (
        <div className="p-5 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-900 dark:text-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-xl shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold leading-tight">No Students Enrolled</h3>
              <p className="text-xs opacity-90 mt-1 leading-relaxed">
                You cannot take attendance because there are no students enrolled in <strong className="font-bold">{subject.code}</strong> yet.
              </p>
            </div>
          </div>

          <Link
            href={`/subjects/${subjectId}/enrollments`}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 shrink-0 self-start sm:self-auto"
          >
            <UserCheck className="w-4 h-4" /> Enroll Students Now
          </Link>
        </div>
      )}

      {/* Control Bar: Search, Bulk Actions, and Status Counter Badges */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search student by name or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-blue-600 text-slate-900 dark:text-white focus:outline-none transition-all"
            />
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-2.5" />
          </div>

          {/* Quick Bulk Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAllStatus("PRESENT")}
              disabled={!!todaySession || (subject?.enrollments.length || 0) === 0}
              className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              Mark All Present
            </button>
            <button
              onClick={() => setAllStatus("ABSENT")}
              disabled={!!todaySession || (subject?.enrollments.length || 0) === 0}
              className="px-3 py-1.5 bg-red-50 dark:bg-red-950/60 hover:bg-red-100 dark:hover:bg-red-900/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <XCircle className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
              Mark All Absent
            </button>
          </div>
        </div>

        {/* Live Status Counter Pill Grid */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3 flex-wrap text-xs">
          <span className="text-slate-500 dark:text-slate-400 font-semibold">Summary:</span>
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
      </div>

      {/* Roll Call Cards List */}
      {isLoading ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-500 dark:text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600 dark:text-blue-400" />
          <p>Loading enrolled students...</p>
        </div>
      ) : filteredEnrollments && filteredEnrollments.length > 0 ? (
        <div className="space-y-3">
          {filteredEnrollments.map((e) => {
            const st = e.student;
            const currentStatus = statusMap[st.id] || "PRESENT";

            return (
              <div
                key={st.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  currentStatus === "PRESENT"
                    ? "bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800"
                    : currentStatus === "ABSENT"
                    ? "bg-red-50/40 dark:bg-red-950/20 border-red-200 dark:border-red-900/50"
                    : currentStatus === "LATE"
                    ? "bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50"
                    : "bg-blue-50/40 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/50"
                }`}
              >
                {/* Student Info */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold flex items-center justify-center text-xs shrink-0 border border-slate-200 dark:border-slate-700">
                    {st.fullName.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400">
                        {st.studentNumber}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        {st.fullName}
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {st.email || "No email"} {st.contactInfo ? `• ${st.contactInfo}` : ""}
                    </p>
                  </div>
                </div>

                {/* Status Toggle Switcher Buttons */}
                <div className="grid grid-cols-4 gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 self-stretch sm:self-auto">
                  <button
                    type="button"
                    disabled={!!todaySession}
                    onClick={() => setSingleStatus(st.id, "PRESENT")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed ${
                      currentStatus === "PRESENT"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Present</span>
                  </button>

                  <button
                    type="button"
                    disabled={!!todaySession}
                    onClick={() => setSingleStatus(st.id, "ABSENT")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed ${
                      currentStatus === "ABSENT"
                        ? "bg-red-600 text-white shadow-xs"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Absent</span>
                  </button>

                  <button
                    type="button"
                    disabled={!!todaySession}
                    onClick={() => setSingleStatus(st.id, "LATE")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed ${
                      currentStatus === "LATE"
                        ? "bg-amber-600 text-white shadow-xs"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Late</span>
                  </button>

                  <button
                    type="button"
                    disabled={!!todaySession}
                    onClick={() => setSingleStatus(st.id, "EXCUSED")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed ${
                      currentStatus === "EXCUSED"
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Excused</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-500 dark:text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
          <BookOpen className="w-8 h-8 text-slate-300 dark:text-slate-600" />
          <p className="font-bold text-slate-700 dark:text-slate-200 text-sm">No students to take attendance for</p>
          <p>
            {search
              ? `No student matches "${search}".`
              : "This subject has no enrolled students yet."}
          </p>
          {!search && (
            <Link
              href={`/subjects/${subjectId}/enrollments`}
              className="mt-3 px-4 py-2 text-xs font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors inline-flex items-center gap-1.5"
            >
              <UserCheck className="w-4 h-4" /> Go to Subject Roster & Enroll Students
            </Link>
          )}
        </div>
      )}

      {/* Floating Bottom Submit Bar */}
      {subject && subject.enrollments.length > 0 && !todaySession && (
        <div className="fixed bottom-0 inset-x-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 p-4 shadow-xl">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
            <div className="text-xs">
              <span className="font-bold text-slate-900 dark:text-white">
                {Object.keys(statusMap).length} Students Ready
              </span>
              <p className="text-slate-500 dark:text-slate-400 text-[11px] hidden sm:block">
                Press submit to save roll call session for today ({new Date().toLocaleDateString()})
              </p>
            </div>

            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Zap className="w-4 h-4" />
              )}
              Submit Attendance Session
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
