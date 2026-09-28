"use client";

import { useState, useEffect, useCallback, use, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { toast } from "react-hot-toast";
import {
  ArrowLeft,
  UserPlus,
  Search,
  UserMinus,
  Users,
  BookOpen,
  Loader2,
  X,
  AlertCircle,
  Plus,
  Mail,
  Phone,
  Calendar,
} from "lucide-react";
import {
  getSubjectEnrollments,
  getAvailableStudentsForSubject,
  enrollStudent,
  unenrollStudent,
} from "@/actions/enrollments";
import { formatSchedulesDisplay } from "@/app/(teacher)/subjects/page";
import { formatStudentName } from "@/lib/student";
import Pagination from "@/app/components/Pagination";

interface Student {
  id: string;
  studentNumber: string;
  lastName: string;
  firstName: string;
  middleInitial: string | null;
  email: string | null;
  contactInfo: string | null;
}

interface EnrollmentItem {
  id: string;
  subjectId: string;
  studentId: string;
  enrolledAt: Date;
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

const emptySubscribe = () => () => {};

export default function SubjectEnrollmentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: subjectId } = use(params);

  const [subject, setSubject] = useState<SubjectDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [rosterSearch, setRosterSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal State for Enrolling Students
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [availableStudents, setAvailableStudents] = useState<Student[]>([]);
  const [availableSearch, setAvailableSearch] = useState("");
  const [isLoadingAvailable, setIsLoadingAvailable] = useState(false);
  const [enrollingMap, setEnrollingMap] = useState<Record<string, boolean>>({});

  // Unenroll Confirmation State
  const [unenrollingStudent, setUnenrollingStudent] = useState<Student | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const fetchRoster = useCallback(async () => {
    const res = await getSubjectEnrollments(subjectId);
    if (res?.success && res?.data) {
      setSubject(res.data as SubjectDetail);
      setCurrentPage(1);
    } else {
      toast.error(res?.error || "Failed to load subject details.");
    }
    setIsLoading(false);
  }, [subjectId]);

  useEffect(() => {
    let ignore = false;
    async function loadRoster() {
      const res = await getSubjectEnrollments(subjectId);
      if (!ignore) {
        if (res?.success && res?.data) {
          setSubject(res.data as SubjectDetail);
        } else {
          toast.error(res?.error || "Failed to load subject details.");
        }
        setIsLoading(false);
      }
    }
    loadRoster();
    return () => {
      ignore = true;
    };
  }, [subjectId]);

  useEffect(() => {
    if (!isEnrollModalOpen) return;
    let ignore = false;
    async function loadAvailable() {
      setIsLoadingAvailable(true);
      const res = await getAvailableStudentsForSubject(subjectId, availableSearch);
      if (!ignore) {
        if (res?.success && res?.data) {
          setAvailableStudents(res.data as Student[]);
        }
        setIsLoadingAvailable(false);
      }
    }
    loadAvailable();
    return () => {
      ignore = true;
    };
  }, [isEnrollModalOpen, availableSearch, subjectId]);

  const handleEnrollStudent = async (st: Student) => {
    setEnrollingMap((prev) => ({ ...prev, [st.id]: true }));

    const res = await enrollStudent(subjectId, st.id);
    if (res.success) {
      toast.success(`${formatStudentName(st)} enrolled in ${subject?.code}!`);
      // Update UI state
      setAvailableStudents((prev) => prev.filter((s) => s.id !== st.id));
      fetchRoster();
    } else {
      toast.error(res.error || "Failed to enroll student.");
    }

    setEnrollingMap((prev) => ({ ...prev, [st.id]: false }));
  };

  const handleUnenrollStudent = async () => {
    if (!unenrollingStudent) return;
    setIsSubmitting(true);

    const res = await unenrollStudent(subjectId, unenrollingStudent.id);
    if (res.success) {
      toast.success(`${formatStudentName(unenrollingStudent)} removed from roster.`);
      setUnenrollingStudent(null);
      fetchRoster();
    } else {
      toast.error(res.error || "Failed to remove student.");
    }

    setIsSubmitting(false);
  };

  const filteredEnrollments = subject?.enrollments.filter(
    (item) =>
      formatStudentName(item.student).toLowerCase().includes(rosterSearch.toLowerCase()) ||
      item.student.studentNumber.toLowerCase().includes(rosterSearch.toLowerCase()) ||
      (item.student.email && item.student.email.toLowerCase().includes(rosterSearch.toLowerCase()))
  );
  const visibleEnrollments = (filteredEnrollments || []).slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Back Link */}
      <Link
        href="/subjects"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Subjects
      </Link>

      {/* HEADER BANNER - REARRANGED:
          Row 1: SUBJECT NAME - SUBJECT CODE | ADD STUDENT BUTTON
          Row 2: SCHEDULE - STUDENT ENROLLED
      */}
      {/* HEADER BANNER - Compact design */}
      <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-2">
        {/* Row 1: Subject Name - Subject Code | Add Student Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="h-6 w-40 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
              <div className="h-5 w-16 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                {subject?.name || "Subject Roster"}
              </h1>
              {subject?.code && (
                <span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  {subject.code}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Row 2: Schedule - Student Enrolled */}
        {isLoading ? (
          <div className="flex items-center gap-3 pt-1.5 border-t border-slate-100 dark:border-slate-800">
            <div className="h-3.5 w-36 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
            <div className="h-3.5 w-24 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-slate-500 dark:text-slate-400 pt-1.5 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5 text-[11px] sm:text-xs">
              <span>{formatSchedulesDisplay(subject?.schedules, subject?.description)}</span>
            </div>
            <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>
            <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300 text-[11px] sm:text-xs">
              <Users className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>{subject?.enrollments.length || 0} Students Enrolled</span>
            </div>
          </div>
        )}
      </div>

      {/* Roster Search and Results */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-3 sm:p-3.5 border-b border-slate-200/90 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search enrolled students..."
              value={rosterSearch}
              onChange={(e) => {
                setRosterSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-blue-600 text-slate-900 dark:text-white focus:outline-none transition-all"
            />
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-2" />
          </div>

          <button
            onClick={() => setIsEnrollModalOpen(true)}
            disabled={isLoading}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
          >
            <UserPlus className="w-3.5 h-3.5" /> Enroll Students
          </button>
        </div>

        {/* Roster Display Section */}
        <div className="space-y-3 p-3 sm:p-4">
        {isLoading ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-8 text-center text-slate-500 dark:text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600 dark:text-blue-400" />
            <p>Loading subject roster...</p>
          </div>
        ) : filteredEnrollments && filteredEnrollments.length > 0 ? (
          <>
            {/* DESKTOP TABLE VIEW (hidden on mobile, visible on md+) */}
            <div className="hidden md:block overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[500px]">
                  <thead>
                    <tr className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                      <th className="py-2.5 px-3">Student ID</th>
                      <th className="py-2.5 px-3">Full Name</th>
                      <th className="py-2.5 px-3">Enrolled Date</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    {visibleEnrollments.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                          {item.student.studentNumber}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                          {formatStudentName(item.student)}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 font-medium text-[11px]">
                          {new Date(item.enrolledAt).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => setUnenrollingStudent(item.student)}
                            className="text-xs font-bold text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 inline-flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <UserMinus className="w-3.5 h-3.5" /> Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* MOBILE CARD VIEW (visible on mobile, hidden on md+) */}
            <div className="grid grid-cols-1 gap-2.5 md:hidden">
              {visibleEnrollments.map((item) => (
                <div
                  key={item.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-3 shadow-2xs space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shrink-0">
                        {item.student.studentNumber}
                      </span>
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {formatStudentName(item.student)}
                      </h3>
                    </div>

                    <button
                      onClick={() => setUnenrollingStudent(item.student)}
                      className="px-2 py-1 text-[11px] font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-md hover:bg-red-100 transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      <UserMinus className="w-3 h-3" /> Remove
                    </button>
                  </div>

                  <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800 text-[11px] flex items-center justify-between text-slate-400 dark:text-slate-500">
                    <span>Enrolled Date</span>
                    <span className="font-mono text-slate-600 dark:text-slate-300">
                      {new Date(item.enrolledAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <Pagination
              page={currentPage}
              pageSize={pageSize}
              totalItems={filteredEnrollments.length}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(1);
              }}
            />
          </>
        ) : (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
            <BookOpen className="w-8 h-8 text-slate-300 dark:text-slate-600" />
            <p className="font-bold text-slate-700 dark:text-slate-200 text-sm">No students enrolled yet</p>
            <p>
              {rosterSearch
                ? `No enrolled student matches "${rosterSearch}".`
                : "Click 'Enroll Students' to select students from the global directory."}
            </p>
            {!rosterSearch && (
              <button
                onClick={() => setIsEnrollModalOpen(true)}
                className="mt-3 px-4 py-2 text-xs font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" /> Enroll First Student
              </button>
            )}
          </div>
        )}
      </div>
      </div>

      {/* ENROLL STUDENTS MODAL (Uses React Portal to span entire screen) */}
      {isMounted &&
        isEnrollModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-150 relative space-y-4 max-h-[85vh] flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Enroll Students into {subject?.code}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Select students from the global school directory
                  </p>
                </div>
                <button
                  onClick={() => setIsEnrollModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search Input */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search global directory by name or ID..."
                  value={availableSearch}
                  onChange={(e) => setAvailableSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-blue-600 text-slate-900 dark:text-white focus:outline-none transition-all"
                />
                <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-2.5" />
              </div>

              {/* Available Students List */}
              <div className="flex-1 overflow-y-auto min-h-[250px] border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800">
                {isLoadingAvailable ? (
                  <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-600 dark:text-blue-400" />
                    <p>Searching global directory...</p>
                  </div>
                ) : availableStudents.length > 0 ? (
                  availableStudents.map((st) => (
                    <div
                      key={st.id}
                      className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center justify-between gap-3 transition-colors text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                            {st.studentNumber}
                          </span>
                          <span className="font-bold text-slate-900 dark:text-white">{formatStudentName(st)}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleEnrollStudent(st)}
                        disabled={enrollingMap[st.id]}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 shrink-0 disabled:opacity-50 cursor-pointer"
                      >
                        {enrollingMap[st.id] ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Plus className="w-3.5 h-3.5" />
                        )}
                        Enroll
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-xs flex flex-col items-center justify-center gap-1">
                    {/* <Check className="w-6 h-6 text-emerald-500" /> */}
                    <p className="font-bold text-slate-700 dark:text-slate-200">No students found</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {availableSearch
                        ? "No matching student in directory."
                        : "All directory students are already enrolled in this subject."}
                    </p>
                    <Link
                      href="/students"
                      className="mt-5 text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline"
                    >
                      + Add new student to directory
                    </Link>
                  </div>
                )}
              </div>

              <div className="pt-2 flex items-center justify-end">
                <button
                  onClick={() => setIsEnrollModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* UNENROLL CONFIRMATION MODAL */}
      {isMounted &&
        unenrollingStudent &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-sm p-5 space-y-4">
              <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
                <AlertCircle className="w-6 h-6 shrink-0" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Remove from Roster?</h2>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Are you sure you want to remove <strong className="text-slate-900 dark:text-white">{formatStudentName(unenrollingStudent)}</strong> ({unenrollingStudent.studentNumber}) from <strong className="text-slate-900 dark:text-white">{subject?.code}</strong>?
              </p>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setUnenrollingStudent(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUnenrollStudent}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Remove Student
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
