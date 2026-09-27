"use client";

import { useState, useEffect, useMemo, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import {
  X,
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
} from "lucide-react";
import { toast } from "react-hot-toast";
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

interface StudentAttendanceHistoryModalProps {
  studentId: string | null;
  onClose: () => void;
}

const emptySubscribe = () => () => {};

function escapeCsvValue(value: string | number | null | undefined) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

export default function StudentAttendanceHistoryModal({
  studentId,
  onClose,
}: StudentAttendanceHistoryModalProps) {
  const [studentData, setStudentData] = useState<StudentHistoryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const isMounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  useEffect(() => {
    if (!studentId) return;
    let ignore = false;

    async function loadData() {
      setIsLoading(true);
      const res = await getStudentAttendanceHistory(studentId!);
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

    const rows = [
      ["Student Number", "Student Name", "Date & Time", "Subject", "Session Title", "Status"],
      ...filteredRecords.map((record) => [
        studentData.studentNumber,
        formatStudentName(studentData),
        new Date(record.session.sessionDate).toLocaleString(),
        record.session.subject.name,
        record.session.title || "Roll Call Session",
        record.status,
      ]),
    ];

    const csv = "\uFEFF" + rows.map((row) => row.map(escapeCsvValue).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${studentData.studentNumber}_attendance_history_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Attendance history exported successfully.");
  }

  if (!isMounted || !studentId) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-200/60 dark:border-blue-800">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  {studentData ? formatStudentName(studentData) : "Student Attendance History"}
                </h2>
                {studentData && (
                  <span className="px-2 py-0.5 rounded-md text-xs font-mono font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    {studentData.studentNumber}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-3">
                {studentData?.email && (
                  <span className="inline-flex items-center gap-1">
                    <Mail className="w-3 h-3 text-slate-400" /> {studentData.email}
                  </span>
                )}
                {studentData?.contactInfo && (
                  <span className="inline-flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" /> {studentData.contactInfo}
                  </span>
                )}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {isLoading ? (
            <div className="py-16 text-center text-slate-500 dark:text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600 dark:text-blue-400" />
              <p>Fetching student attendance records...</p>
            </div>
          ) : !studentData ? (
            <div className="py-12 text-center text-slate-500 dark:text-slate-400 text-xs">
              <AlertCircle className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="font-bold text-slate-700 dark:text-slate-200 text-sm">Failed to load history</p>
            </div>
          ) : (
            <>
              {/* Stats Bar */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 px-4 py-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="grid grid-cols-5 flex-1 divide-x divide-slate-200 dark:divide-slate-700">
                    {[
                      ["Recorded", stats.total, "text-slate-900 dark:text-white"],
                      ["Present", stats.present, "text-emerald-700 dark:text-emerald-400"],
                      ["Absent", stats.absent, "text-red-700 dark:text-red-400"],
                      ["Late", stats.late, "text-amber-700 dark:text-amber-400"],
                      ["Excused", stats.excused, "text-blue-700 dark:text-blue-400"],
                    ].map(([label, value, color]) => (
                      <div key={label} className="px-2 text-center first:pl-0 last:pr-0">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
                        <p className={`mt-0.5 text-lg font-bold ${color}`}>{value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="min-w-37.5 border-t border-slate-200 pt-3 dark:border-slate-700 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Attendance rate</span>
                      <span className={`text-lg font-bold ${stats.isAtRisk ? "text-red-700 dark:text-red-400" : "text-slate-900 dark:text-white"}`}>{stats.rate}%</span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                      <div className={`h-full rounded-full ${stats.isAtRisk ? "bg-red-500" : stats.rate >= 90 ? "bg-emerald-500" : "bg-amber-500"}`} style={{ width: `${stats.rate}%` }} />
                    </div>
                    {stats.isAtRisk && <p className="mt-1 text-[10px] font-semibold text-red-600 dark:text-red-400">At risk</p>}
                  </div>
                </div>
              </div>

              {/* Filters Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-2.5 flex-wrap text-xs">
                  {/* Subject Dropdown */}
                  <select
                    value={selectedSubjectId}
                    onChange={(e) => {
                      setSelectedSubjectId(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
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
                    className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="PRESENT">PRESENT</option>
                    <option value="ABSENT">ABSENT</option>
                    <option value="LATE">LATE</option>
                    <option value="EXCUSED">EXCUSED</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleExportCsv}
                  disabled={filteredRecords.length === 0}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-semibold transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 cursor-pointer"
                  title="Export filtered attendance as CSV"
                >
                  <Download className="h-3.5 w-3.5" />
                  Export CSV
                </button>
              </div>

              {/* History Table */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
                {filteredRecords.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-xs">
                    <BookOpen className="w-6 h-6 mx-auto mb-1.5 text-slate-300 dark:text-slate-600" />
                    <p className="font-bold text-slate-700 dark:text-slate-200">No attendance records found</p>
                    <p className="text-[11px] mt-0.5">
                      {selectedSubjectId !== "ALL" || selectedStatus !== "ALL"
                        ? "No attendance log matches the selected filters."
                        : "No attendance sessions recorded yet for this student."}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-137.5">
                      <thead>
                        <tr className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                          <th className="py-3 px-4">Date & Time</th>
                          <th className="py-3 px-4">Subject</th>
                          <th className="py-3 px-4">Session Title</th>
                          <th className="py-3 px-4 text-right">Marked Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                        {visibleRecords.map((rec) => (
                          <tr key={rec.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                              <span className="flex items-center gap-1.5">
                                {new Date(rec.session.sessionDate).toLocaleDateString(undefined, {
                                  weekday: "short",
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </td>

                            <td className="py-3 px-4">
                              <span className="text-slate-700 dark:text-slate-300 text-[11px] font-semibold">
                                {rec.session.subject.name}
                              </span>
                            </td>

                            <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                              {rec.session.title || "Roll Call Session"}
                            </td>

                            <td className="py-3 px-4 text-right">
                              {rec.status === "PRESENT" && (
                                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> PRESENT
                                </span>
                              )}
                              {rec.status === "ABSENT" && (
                                <span className="inline-flex items-center gap-1 text-xs font-bold text-red-700 dark:text-red-300">
                                  <XCircle className="w-3.5 h-3.5 text-red-600" /> ABSENT
                                </span>
                              )}
                              {rec.status === "LATE" && (
                                <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 dark:text-amber-300">
                                  <Clock className="w-3.5 h-3.5 text-amber-600" /> LATE
                                </span>
                              )}
                              {rec.status === "EXCUSED" && (
                                <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 dark:text-blue-300">
                                  <HelpCircle className="w-3.5 h-3.5 text-blue-600" /> EXCUSED
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

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

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
