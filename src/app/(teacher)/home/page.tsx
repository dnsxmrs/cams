"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { authClient } from "@/lib/auth-client";
import { getTeacherSubjects, createSubject } from "@/actions/subjects";
import {
  Plus,
  Users,
  BookOpen,
  TrendingUp,
  Calendar,
  Clock,
  Search,
  Zap,
  X,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle,
} from "lucide-react";

interface SubjectWithCount {
  id: string;
  code: string;
  name: string;
  description: string | null;
  teacherId: string;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    enrollments: number;
    sessions: number;
  };
}

export default function TeacherHome() {
  const { data: session } = authClient.useSession();
  const teacherName = session?.user?.name || "Teacher";

  // State management
  const [subjects, setSubjects] = useState<SubjectWithCount[]>([]);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubjectsExpanded, setIsSubjectsExpanded] = useState(false);

  // Create subject modal form state
  const [newSubjectCode, setNewSubjectCode] = useState("");
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newSubjectDesc, setNewSubjectDesc] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchSubjects = async () => {
    const res = await getTeacherSubjects();
    if (res.success && res.data) {
      setSubjects(res.data as SubjectWithCount[]);
    }
    setIsLoadingSubjects(false);
  };

  useEffect(() => {
    let ignore = false;
    async function loadData() {
      const res = await getTeacherSubjects();
      if (!ignore) {
        if (res.success && res.data) {
          setSubjects(res.data as SubjectWithCount[]);
        }
        setIsLoadingSubjects(false);
      }
    }
    loadData();
    return () => {
      ignore = true;
    };
  }, []);

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!newSubjectCode.trim() || !newSubjectName.trim()) {
      setFormError("Subject Code and Subject Name are required.");
      return;
    }

    setIsSubmitting(true);
    const res = await createSubject({
      code: newSubjectCode,
      name: newSubjectName,
      description: newSubjectDesc,
    });

    if (res.success) {
      toast.success(`Subject "${newSubjectCode.toUpperCase()}" created!`);
      setNewSubjectCode("");
      setNewSubjectName("");
      setNewSubjectDesc("");
      setIsCreateModalOpen(false);
      await fetchSubjects();
    } else {
      setFormError(res.error || "Failed to create subject.");
      toast.error(res.error || "Creation failed.");
    }

    setIsSubmitting(false);
  };

  const totalEnrollments = subjects.reduce((acc, s) => acc + s._count.enrollments, 0);
  const totalSessions = subjects.reduce((acc, s) => acc + s._count.sessions, 0);

  const filteredSubjects = subjects.filter(
    (s) =>
      s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4 sm:space-y-5 max-w-5xl mx-auto px-2 sm:px-4 py-1 sm:py-3">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 dark:from-blue-900 dark:via-indigo-950 dark:to-slate-900 p-5 sm:p-6 rounded-2xl text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-blue-500/20 dark:border-slate-800">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-200 dark:text-blue-400">Teacher Dashboard</span>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Welcome back, {teacherName}!</h1>
          <p className="text-xs text-blue-100 dark:text-slate-300 mt-1">Manage subjects, record student attendance, and track reports.</p>
        </div>
        <Link
          href="/subjects"
          className="self-start sm:self-auto px-4 py-2.5 bg-white text-blue-700 hover:bg-blue-50 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700 font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95 flex items-center gap-1.5"
        >
          <BookOpen className="w-4 h-4" /> Manage All Subjects
        </Link>
      </div>

      {/* QUICK ACTIONS BAR */}
      <div className="space-y-1.5">
        <h2 className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-0.5">Quick Actions</h2>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <Link
            href="/students"
            className="p-2.5 sm:p-3 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl sm:rounded-2xl shadow-2xs hover:border-blue-500 dark:hover:border-blue-500 transition-all flex items-center gap-2 text-left group"
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Users className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-900 dark:text-white leading-tight truncate">Student Directory</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate hidden xs:block sm:block">View & Manage</p>
            </div>
          </Link>

          <Link
            href="/subjects"
            className="p-2.5 sm:p-3 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl sm:rounded-2xl shadow-2xs hover:border-blue-500 dark:hover:border-blue-500 transition-all flex items-center gap-2 text-left group"
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <BookOpen className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-900 dark:text-white leading-tight truncate">Subjects</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate hidden xs:block sm:block">Manage Classes</p>
            </div>
          </Link>

          <button
            onClick={() => {
              setFormError("");
              setIsCreateModalOpen(true);
            }}
            className="p-2.5 sm:p-3 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl sm:rounded-2xl shadow-2xs hover:border-blue-500 dark:hover:border-blue-500 transition-all flex items-center gap-2 text-left group cursor-pointer"
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Plus className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-900 dark:text-white leading-tight truncate">New Subject</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate hidden xs:block sm:block">Add Class</p>
            </div>
          </button>
        </div>
      </div>

      {/* STATS & ANALYTICS SUMMARY */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 shadow-2xs hover:shadow-xs transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Subjects
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <BookOpen className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1.5 sm:mt-2">
            <div className="text-base sm:text-xl font-extrabold text-slate-900 dark:text-white">{subjects.length} Active</div>
            <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">Course rosters</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 shadow-2xs hover:shadow-xs transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Enrollments
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1.5 sm:mt-2">
            <div className="text-base sm:text-xl font-extrabold text-slate-900 dark:text-white">{totalEnrollments} Total</div>
            <p className="text-[10px] sm:text-xs text-emerald-600 dark:text-emerald-400 font-semibold truncate">Active enrollments</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 shadow-2xs hover:shadow-xs transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Avg Rate
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1.5 sm:mt-2">
            <div className="text-base sm:text-xl font-extrabold text-slate-900 dark:text-white">-- %</div>
            <p className="text-[10px] sm:text-xs text-purple-600 dark:text-purple-400 font-semibold truncate">Ready for session logs</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 shadow-2xs hover:shadow-xs transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Sessions
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Calendar className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1.5 sm:mt-2">
            <div className="text-base sm:text-xl font-extrabold text-slate-900 dark:text-white">{totalSessions} Recorded</div>
            <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 truncate font-medium">Session logs</p>
          </div>
        </div>
      </div>

      {/* ALL SUBJECTS DIRECTORY */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-2xs space-y-3 sm:space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center justify-between w-full sm:w-auto">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">Your Subjects</h2>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">Course directory & roster quick links</p>
            </div>
            <button
              onClick={() => setIsSubjectsExpanded(!isSubjectsExpanded)}
              className="sm:hidden p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1 text-xs font-bold"
            >
              {isSubjectsExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          <div className="relative w-full sm:w-56">
            <input
              type="text"
              placeholder="Search subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900 dark:text-white transition-all"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-2.5 top-2" />
          </div>
        </div>

        {/* Subject Grid */}
        {isLoadingSubjects ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600 dark:text-blue-400" />
            <p>Loading subjects...</p>
          </div>
        ) : filteredSubjects.length > 0 ? (
          <div className={`grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 ${isSubjectsExpanded ? "block" : "hidden sm:grid"}`}>
            {filteredSubjects.map((subject) => (
              <div
                key={subject.id}
                className="group bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 hover:bg-white dark:hover:bg-slate-800 hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-extrabold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800">
                      {subject.code}
                    </span>
                    <span className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                      {subject._count.enrollments} Enrolled
                    </span>
                  </div>

                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug">
                    {subject.name}
                  </h3>

                  <div className="flex items-center gap-3 text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 pt-0.5">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                      <span className="truncate">{subject.description || "No schedule specified"}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-1.5">
                  <Link
                    href={`/subjects/${subject.id}/enrollments`}
                    className="px-2.5 py-1 text-[11px] sm:text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1"
                  >
                    <BookOpen className="w-3 h-3" /> Enrollments
                  </Link>

                  <Link
                    href={`/subjects/${subject.id}/attendance`}
                    className="px-2.5 py-1 text-[11px] sm:text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs transition-all active:scale-95 flex items-center gap-1"
                  >
                    <Zap className="w-3 h-3" /> Take Attendance
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-xs">
            <BookOpen className="w-6 h-6 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="font-bold text-slate-700 dark:text-slate-200">No subjects found</p>
            <p className="mt-0.5">Click &apos;New Subject&apos; above to create your first class roster.</p>
          </div>
        )}
      </div>

      {/* CREATE NEW SUBJECT MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 max-w-sm sm:max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">Create New Subject</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubject} className="space-y-3">
              {formError && (
                <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-[10px] sm:text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                  Subject Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. CS101"
                  value={newSubjectCode}
                  onChange={(e) => setNewSubjectCode(e.target.value)}
                  className="w-full px-3 py-1.5 sm:py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-lg sm:rounded-xl text-xs focus:ring-2 focus:ring-blue-600 text-slate-900 dark:text-white focus:outline-none font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] sm:text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                  Subject Title / Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Intro to Computer Science"
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  className="w-full px-3 py-1.5 sm:py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-lg sm:rounded-xl text-xs focus:ring-2 focus:ring-blue-600 text-slate-900 dark:text-white focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] sm:text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                  Schedule / Description <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mon & Wed • 9:00 AM"
                  value={newSubjectDesc}
                  onChange={(e) => setNewSubjectDesc(e.target.value)}
                  className="w-full px-3 py-1.5 sm:py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-lg sm:rounded-xl text-xs focus:ring-2 focus:ring-blue-600 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2.5 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="min-h-[38px] px-3.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="min-h-[38px] px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" />
                  )}
                  Save Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
