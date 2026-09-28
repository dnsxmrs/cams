"use client";

import { useState, useEffect, useMemo, use } from "react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import {
  ArrowLeft,
  Loader2,
  BookOpen,
  CheckCircle2,
  XCircle,
  Clock,
  HelpCircle,
  AlertCircle,
  Mail,
  Phone,
  History,
  Download,
  Calendar,
} from "lucide-react";
import { getStudentAttendanceHistory } from "@/actions/students";
import { formatStudentName } from "@/lib/student";
import Pagination from "@/app/components/Pagination";

type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";

interface AttendanceRecordDetail {
  id: string;
  status: AttendanceStatus;
  updatedAt: Date;
  session: {
    id: string;
    sessionDate: Date;
    title: string | null;
    subject: {
      id: string;
      code: string;
      name: string;
      color: string | null;
    };
  };
}

interface EnrollmentDetail {
  id: string;
  subject: {
    id: string;
    code: string;
    name: string;
  };
}

interface StudentHistoryData {
  id: string;
  studentNumber: string;
  lastName: string;
  firstName: string;
  middleInitial: string | null;
  email: string | null;
  contactInfo: string | null;
  attendances: AttendanceRecordDetail[];
  enrollments: EnrollmentDetail[];
}

function escapeCsvValue(value: string | number | null | undefined) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

export default function StudentAttendanceHistoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: studentId } = use(params);

  const [studentData, setStudentData] = useState<StudentHistoryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    if (!studentId) return;
    let ignore = false;

    async function loadData() {
      setIsLoading(true);
      const res = await getStudentAttendanceHistory(studentId);
      if (ignore) return;
      if (res.success && res.data) {
        setStudentData(res.data as unknown as StudentHistoryData);
      } else {
        toast.error(res.error || "Failed to load student attendance history.");
      }
      setIsLoading(false);
    }

    loadData();
    return () => {
      ignore = true;
    };
  }, [studentId]);

  // Aggregate Stats
  const stats = useMemo(() => {
    if (!studentData) return { total: 0, present: 0, absent: 0, late: 0, excused: 0, rate: 0, isAtRisk: false };

    const total = studentData.attendances.length;
    let present = 0;
    let absent = 0;
    let late = 0;
    let excused = 0;

    studentData.attendances.forEach((rec) => {
      if (rec.status === "PRESENT") present++;
      else if (rec.status === "ABSENT") absent++;
      else if (rec.status === "LATE") late++;
      else if (rec.status === "EXCUSED") excused++;
    });

    const attended = present + late;
    const rate = total > 0 ? Math.round((attended / total) * 100) : 100;
    const isAtRisk = total >= 3 && rate < 80;

    return { total, present, absent, late, excused, rate, isAtRisk };
  }, [studentData]);

  // Filtered Records
  const filteredRecords = useMemo(() => {
    if (!studentData) return [];

    return studentData.attendances.filter((rec) => {
      const matchesSubject = selectedSubjectId === "ALL" || rec.session.subject.id === selectedSubjectId;
      const matchesStatus = selectedStatus === "ALL" || rec.status === selectedStatus;
      return matchesSubject && matchesStatus;
    });
  }, [studentData, selectedSubjectId, selectedStatus]);

  const visibleRecords = useMemo(() => {
    return filteredRecords.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  }, [filteredRecords, currentPage, pageSize]);

  function handleExportCsv() {
    if (!studentData || filteredRecords.length === 0) return;

    const headers = ["Student ID", "Student Name", "Subject Code", "Subject Name", "Session Title", "Session Date", "Status"];

    const rows = filteredRecords.map((rec) => [
      escapeCsvValue(studentData.studentNumber),
      escapeCsvValue(formatStudentName(studentData)),
      escapeCsvValue(rec.session.subject.code),
      escapeCsvValue(rec.session.subject.name),
      escapeCsvValue(rec.session.title || "Roll Call Session"),
      escapeCsvValue(new Date(rec.session.sessionDate).toLocaleString()),
      escapeCsvValue(rec.status),
    ]);

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const sanitizedName = formatStudentName(studentData).replace(/[^a-zA-Z0-9_-]/g, "_");
    link.setAttribute("href", url);
    link.setAttribute("download", `${sanitizedName}_Attendance_History.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function renderStatusBadge(status: AttendanceStatus) {
    switch (status) {
      case "PRESENT":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5" /> Present
          </span>
        );
      case "ABSENT":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
            <XCircle className="w-3.5 h-3.5" /> Absent
          </span>
        );
      case "LATE":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <Clock className="w-3.5 h-3.5" /> Late
          </span>
        );
      case "EXCUSED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <HelpCircle className="w-3.5 h-3.5" /> Excused
          </span>
        );
    }
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <Link
            href="/students"
            className="p-1.5 sm:p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs shrink-0"
            title="Back to Students"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                {studentData ? formatStudentName(studentData) : "Student Attendance History"}
              </h1>
              {studentData && (
                <span className="px-2 py-0.5 rounded-md text-[11px] sm:text-xs font-mono font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shrink-0">
                  {studentData.studentNumber}
                </span>
              )}
            </div>
            {studentData && (
              <div className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex flex-wrap items-center gap-x-3 sm:gap-x-4 gap-y-0.5">
                {studentData.email && (
                  <span className="inline-flex items-center gap-1 truncate">
                    <Mail className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400 shrink-0" /> {studentData.email}
                  </span>
                )}
                {studentData.contactInfo && (
                  <span className="inline-flex items-center gap-1 truncate">
                    <Phone className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400 shrink-0" /> {studentData.contactInfo}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-12 sm:p-16 text-center text-slate-500 dark:text-slate-400 text-xs flex flex-col items-center justify-center gap-2 shadow-xs">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600 dark:text-blue-400" />
          <p>Fetching student attendance records...</p>
        </div>
      ) : !studentData ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-12 sm:p-16 text-center text-slate-500 dark:text-slate-400 text-xs shadow-xs">
          <AlertCircle className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <p className="font-bold text-slate-700 dark:text-slate-200 text-sm">Failed to load history</p>
          <p className="mt-1">Student not found or no attendance records available.</p>
        </div>
      ) : (
        <>
          {/* Summary Stats - Compressed Single Container */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-3 sm:p-4 shadow-2xs">
            <div className="grid grid-cols-3 sm:grid-cols-6 divide-x divide-slate-100 dark:divide-slate-800">
              <div className="px-2 sm:px-3 text-center sm:text-left">
                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block truncate">Total</span>
                <p className="mt-0.5 text-base sm:text-xl font-extrabold text-slate-900 dark:text-white">{stats.total}</p>
              </div>
              <div className="px-2 sm:px-3 text-center sm:text-left">
                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block truncate">Present</span>
                <p className="mt-0.5 text-base sm:text-xl font-extrabold text-emerald-700 dark:text-emerald-400">{stats.present}</p>
              </div>
              <div className="px-2 sm:px-3 text-center sm:text-left">
                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400 block truncate">Absent</span>
                <p className="mt-0.5 text-base sm:text-xl font-extrabold text-red-700 dark:text-red-400">{stats.absent}</p>
              </div>
              <div className="px-2 sm:px-3 text-center sm:text-left pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block truncate">Late</span>
                <p className="mt-0.5 text-base sm:text-xl font-extrabold text-amber-700 dark:text-amber-400">{stats.late}</p>
              </div>
              <div className="px-2 sm:px-3 text-center sm:text-left pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 block truncate">Excused</span>
                <p className="mt-0.5 text-base sm:text-xl font-extrabold text-blue-700 dark:text-blue-400">{stats.excused}</p>
              </div>
              <div className="px-2 sm:px-3 text-center sm:text-left pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-center sm:justify-between gap-1">
                  <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block truncate">Rate</span>
                  {stats.isAtRisk && <span className="text-[8px] sm:text-[10px] font-extrabold text-red-600 dark:text-red-400">Risk</span>}
                </div>
                <p className={`mt-0.5 text-base sm:text-xl font-extrabold ${stats.isAtRisk ? "text-red-600 dark:text-red-400" : "text-slate-900 dark:text-white"}`}>
                  {stats.rate}%
                </p>
              </div>
            </div>
          </div>

          {/* Controls & Filter Bar */}
          <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
            <div className="flex flex-row items-center gap-2 text-xs">
              {/* Subject Dropdown */}
              <select
                value={selectedSubjectId}
                onChange={(e) => {
                  setSelectedSubjectId(e.target.value);
                  setCurrentPage(1);
                }}
                className="flex-1 min-w-0 px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 truncate cursor-pointer"
              >
                <option value="ALL">All Subjects ({studentData.enrollments.length})</option>
                {studentData.enrollments.map((e) => (
                  <option key={e.subject.id} value={e.subject.id}>
                    {e.subject.code} - {e.subject.name}
                  </option>
                ))}
              </select>

              {/* Status Dropdown */}
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="shrink-0 px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
              >
                <option value="ALL">All Status</option>
                <option value="PRESENT">PRESENT</option>
                <option value="ABSENT">ABSENT</option>
                <option value="LATE">LATE</option>
                <option value="EXCUSED">EXCUSED</option>
              </select>

              {/* Export CSV Button */}
              <button
                type="button"
                onClick={handleExportCsv}
                disabled={filteredRecords.length === 0}
                className="shrink-0 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 cursor-pointer shadow-2xs"
                title="Export filtered attendance as CSV"
              >
                <Download className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Export CSV</span>
                <span className="sm:hidden">CSV</span>
              </button>
            </div>
          </div>

          {/* History Table / Mobile Cards */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
            {visibleRecords.length === 0 ? (
              <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-xs">
                <History className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="font-bold text-slate-700 dark:text-slate-200 text-sm">No attendance records found</p>
                <p className="mt-0.5">Try adjusting your subject or status filters.</p>
              </div>
            ) : (
              <div>
                {/* Desktop Table View (md:block) */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                        <th className="py-3.5 px-4">Subject</th>
                        <th className="py-3.5 px-4">Session Title & Date</th>
                        <th className="py-3.5 px-4 text-center">Status</th>
                        <th className="py-3.5 px-4 text-right">Recorded Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                      {visibleRecords.map((rec) => (
                        <tr key={rec.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 rounded-md text-xs font-mono font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                              {rec.session.subject.code}
                            </span>
                            <p className="text-[11px] font-medium text-slate-600 dark:text-slate-300 mt-1">
                              {rec.session.subject.name}
                            </p>
                          </td>

                          <td className="py-3.5 px-4">
                            <h2 className="font-bold text-slate-900 dark:text-white">
                              {rec.session.title || "Roll Call Session"}
                            </h2>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              {new Date(rec.session.sessionDate).toLocaleDateString(undefined, {
                                weekday: "short",
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            {renderStatusBadge(rec.status)}
                          </td>

                          <td className="py-3.5 px-4 text-right text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                            {new Date(rec.updatedAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards View (md:hidden) */}
                <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800">
                  {visibleRecords.map((rec) => (
                    <div key={rec.id} className="p-4 space-y-2.5 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shrink-0">
                            {rec.session.subject.code}
                          </span>
                          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 truncate">
                            {rec.session.subject.name}
                          </span>
                        </div>
                        <div className="shrink-0">
                          {renderStatusBadge(rec.status)}
                        </div>
                      </div>

                      <div>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-snug">
                          {rec.session.title || "Roll Call Session"}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>
                            {new Date(rec.session.sessionDate).toLocaleDateString(undefined, {
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

                      <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-800/60">
                        <span>Recorded Date</span>
                        <span className="font-mono font-medium text-slate-600 dark:text-slate-300">
                          {new Date(rec.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <Pagination
                  page={currentPage}
                  pageSize={pageSize}
                  totalItems={filteredRecords.length}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={(size) => {
                    setPageSize(size);
                    setCurrentPage(1);
                  }}
                />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
