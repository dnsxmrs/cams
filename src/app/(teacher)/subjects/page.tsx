"use client";

import { useState, useEffect, useCallback, useMemo, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import {
  Plus,
  Clock,
  Users,
  Zap,
  Search,
  UserCheck,
  X,
  BookOpen,
  Loader2,
  Edit2,
  Trash2,
  AlertCircle,
  Check,
  Trash,
  Archive,
  RotateCcw,
  FileSpreadsheet,
  Download,
  AlertTriangle,
  FolderArchive,
} from "lucide-react";
import {
  getTeacherSubjects,
  createSubject,
  updateSubject,
  archiveSubject,
  unarchiveSubject,
  deleteSubject,
} from "@/actions/subjects";
import { exportSubjectAttendanceCSV } from "@/lib/exportAttendance";

export interface ScheduleSlot {
  day: "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";
  startTime: string; // e.g. "08:00"
  endTime: string;   // e.g. "10:00"
}

export interface SubjectWithCount {
  id: string;
  code: string;
  name: string;
  description: string | null;
  schedules: string | null;
  color: string | null;
  isArchived: boolean;
  teacherId: string;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    enrollments: number;
    sessions: number;
  };
}

export const SUBJECT_COLORS = [
  { id: "blue", name: "Blue", bg: "bg-blue-50 dark:bg-blue-950/60", border: "border-blue-200 dark:border-blue-800", text: "text-blue-700 dark:text-blue-300", badgeBg: "bg-blue-500", hex: "#3b82f6" },
  { id: "indigo", name: "Indigo", bg: "bg-indigo-50 dark:bg-indigo-950/60", border: "border-indigo-200 dark:border-indigo-800", text: "text-indigo-700 dark:text-indigo-300", badgeBg: "bg-indigo-500", hex: "#6366f1" },
  { id: "violet", name: "Violet", bg: "bg-violet-50 dark:bg-violet-950/60", border: "border-violet-200 dark:border-violet-800", text: "text-violet-700 dark:text-violet-300", badgeBg: "bg-violet-500", hex: "#8b5cf6" },
  { id: "purple", name: "Purple", bg: "bg-purple-50 dark:bg-purple-950/60", border: "border-purple-200 dark:border-purple-800", text: "text-purple-700 dark:text-purple-300", badgeBg: "bg-purple-500", hex: "#a855f7" },
  { id: "fuchsia", name: "Fuchsia", bg: "bg-fuchsia-50 dark:bg-fuchsia-950/60", border: "border-fuchsia-200 dark:border-fuchsia-800", text: "text-fuchsia-700 dark:text-fuchsia-300", badgeBg: "bg-fuchsia-500", hex: "#d946ef" },
  { id: "pink", name: "Pink", bg: "bg-pink-50 dark:bg-pink-950/60", border: "border-pink-200 dark:border-pink-800", text: "text-pink-700 dark:text-pink-300", badgeBg: "bg-pink-500", hex: "#ec4899" },
  { id: "rose", name: "Rose", bg: "bg-rose-50 dark:bg-rose-950/60", border: "border-rose-200 dark:border-rose-800", text: "text-rose-700 dark:text-rose-300", badgeBg: "bg-rose-500", hex: "#f43f5e" },
  { id: "orange", name: "Orange", bg: "bg-orange-50 dark:bg-orange-950/60", border: "border-orange-200 dark:border-orange-800", text: "text-orange-700 dark:text-orange-300", badgeBg: "bg-orange-500", hex: "#f97316" },
  { id: "amber", name: "Amber", bg: "bg-amber-50 dark:bg-amber-950/60", border: "border-amber-200 dark:border-amber-800", text: "text-amber-700 dark:text-amber-300", badgeBg: "bg-amber-500", hex: "#f59e0b" },
  { id: "lime", name: "Lime", bg: "bg-lime-50 dark:bg-lime-950/60", border: "border-lime-200 dark:border-lime-800", text: "text-lime-700 dark:text-lime-300", badgeBg: "bg-lime-500", hex: "#84cc16" },
  { id: "emerald", name: "Emerald", bg: "bg-emerald-50 dark:bg-emerald-950/60", border: "border-emerald-200 dark:border-emerald-800", text: "text-emerald-700 dark:text-emerald-300", badgeBg: "bg-emerald-500", hex: "#10b981" },
  { id: "teal", name: "Teal", bg: "bg-teal-50 dark:bg-teal-950/60", border: "border-teal-200 dark:border-teal-800", text: "text-teal-700 dark:text-teal-300", badgeBg: "bg-teal-500", hex: "#14b8a6" },
  { id: "cyan", name: "Cyan", bg: "bg-cyan-50 dark:bg-cyan-950/60", border: "border-cyan-200 dark:border-cyan-800", text: "text-cyan-700 dark:text-cyan-300", badgeBg: "bg-cyan-500", hex: "#06b6d4" },
  { id: "sky", name: "Sky", bg: "bg-sky-50 dark:bg-sky-950/60", border: "border-sky-200 dark:border-sky-800", text: "text-sky-700 dark:text-sky-300", badgeBg: "bg-sky-500", hex: "#0ea5e9" },
  { id: "slate", name: "Slate", bg: "bg-slate-100 dark:bg-slate-800", border: "border-slate-300 dark:border-slate-700", text: "text-slate-800 dark:text-slate-200", badgeBg: "bg-slate-500", hex: "#64748b" },
];

const DAYS_LIST: Array<ScheduleSlot["day"]> = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

export function getColorTheme(colorId?: string | null) {
  return SUBJECT_COLORS.find((c) => c.id === colorId) || SUBJECT_COLORS[0];
}

function formatTime12h(time24: string) {
  if (!time24) return "";
  const [h, m] = time24.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const displayH = h % 12 === 0 ? 12 : h % 12;
  return `${displayH}:${m < 10 ? "0" + m : m}${period}`;
}

export function formatSchedulesDisplay(schedulesJson?: string | null, fallbackDesc?: string | null) {
  if (!schedulesJson) return fallbackDesc || "No schedule specified";
  try {
    const slots: ScheduleSlot[] = JSON.parse(schedulesJson);
    if (!Array.isArray(slots) || slots.length === 0) return fallbackDesc || "No schedule specified";
    return slots
      .map((s) => `${s.day} ${formatTime12h(s.startTime)}-${formatTime12h(s.endTime)}`)
      .join(" • ");
  } catch {
    return fallbackDesc || "No schedule specified";
  }
}

const emptySubscribe = () => () => {};

export default function SubjectsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"active" | "archived">("active");

  // Separate stored datasets for Active and Archived subjects
  const [activeSubjects, setActiveSubjects] = useState<SubjectWithCount[] | null>(null);
  const [archivedSubjects, setArchivedSubjects] = useState<SubjectWithCount[] | null>(null);

  const [isLoadingActive, setIsLoadingActive] = useState<boolean>(false);
  const [isLoadingArchived, setIsLoadingArchived] = useState<boolean>(false);

  const [search, setSearch] = useState("");

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<SubjectWithCount | null>(null);
  const [archivingSubject, setArchivingSubject] = useState<SubjectWithCount | null>(null);
  const [deletingSubject, setDeletingSubject] = useState<SubjectWithCount | null>(null);
  const [deleteConfirmCode, setDeleteConfirmCode] = useState("");

  // Form states
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    color: "blue",
  });

  const [scheduleSlots, setScheduleSlots] = useState<ScheduleSlot[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const isMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  // Fetch Active Subjects
  const fetchActive = useCallback(async () => {
    setIsLoadingActive(true);
    const res = await getTeacherSubjects(undefined, false);
    if (res.success && res.data) {
      setActiveSubjects(res.data as SubjectWithCount[]);
    } else {
      toast.error(res.error || "Failed to load active subjects.");
    }
    setIsLoadingActive(false);
  }, []);

  // Fetch Archived Subjects
  const fetchArchived = useCallback(async () => {
    setIsLoadingArchived(true);
    const res = await getTeacherSubjects(undefined, true);
    if (res.success && res.data) {
      setArchivedSubjects(res.data as SubjectWithCount[]);
    } else {
      toast.error(res.error || "Failed to load archived subjects.");
    }
    setIsLoadingArchived(false);
  }, []);

  // Fetch dataset on mount or when tab changes IF NOT YET FETCHED
  useEffect(() => {
    if (activeTab === "active") {
      if (activeSubjects === null) {
        fetchActive();
      }
    } else {
      if (archivedSubjects === null) {
        fetchArchived();
      }
    }
  }, [activeTab, activeSubjects, archivedSubjects, fetchActive, fetchArchived]);

  // Refresh datasets after data mutations (create, edit, archive, unarchive, delete)
  const refreshData = async () => {
    await Promise.all([fetchActive(), fetchArchived()]);
  };

  // Currently selected dataset based on activeTab
  const currentDataset = activeTab === "active" ? (activeSubjects || []) : (archivedSubjects || []);

  // Instant client-side search filtering over stored dataset
  const filteredSubjects = useMemo(() => {
    if (!search.trim()) return currentDataset;
    const q = search.trim().toLowerCase();
    return currentDataset.filter(
      (sub) =>
        sub.code.toLowerCase().includes(q) ||
        sub.name.toLowerCase().includes(q) ||
        (sub.description && sub.description.toLowerCase().includes(q))
    );
  }, [currentDataset, search]);

  const isLoading =
    activeTab === "active"
      ? activeSubjects === null && isLoadingActive
      : archivedSubjects === null && isLoadingArchived;

  const resetForm = () => {
    setFormData({ code: "", name: "", description: "", color: "blue" });
    setScheduleSlots([]);
    setFormError("");
    setEditingSubject(null);
  };

  const handleOpenAddModal = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (sub: SubjectWithCount) => {
    setFormError("");
    setEditingSubject(sub);
    setFormData({
      code: sub.code,
      name: sub.name,
      description: sub.description || "",
      color: sub.color || "blue",
    });

    if (sub.schedules) {
      try {
        const parsed = JSON.parse(sub.schedules);
        if (Array.isArray(parsed)) {
          setScheduleSlots(parsed);
        } else {
          setScheduleSlots([]);
        }
      } catch {
        setScheduleSlots([]);
      }
    } else {
      setScheduleSlots([]);
    }
  };

  const toggleDaySlot = (day: ScheduleSlot["day"]) => {
    const existingIndex = scheduleSlots.findIndex((s) => s.day === day);
    if (existingIndex >= 0) {
      setScheduleSlots((prev) => prev.filter((s) => s.day !== day));
    } else {
      setScheduleSlots((prev) => [
        ...prev,
        { day, startTime: "08:00", endTime: "10:00" },
      ]);
    }
  };

  const updateSlotTime = (day: ScheduleSlot["day"], field: "startTime" | "endTime", value: string) => {
    setScheduleSlots((prev) =>
      prev.map((s) => (s.day === day ? { ...s, [field]: value } : s))
    );
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formData.code.trim() || !formData.name.trim()) {
      setFormError("Subject Code and Title are required.");
      return;
    }

    setIsSubmitting(true);

    const schedulesJson = scheduleSlots.length > 0 ? JSON.stringify(scheduleSlots) : undefined;
    const payload = {
      code: formData.code,
      name: formData.name,
      description: formData.description,
      color: formData.color,
      schedules: schedulesJson,
    };

    if (editingSubject) {
      const res = await updateSubject(editingSubject.id, payload);
      if (res.success) {
        toast.success(`Subject "${formData.code.toUpperCase()}" updated successfully!`);
        setEditingSubject(null);
        resetForm();
        await refreshData();
        router.refresh();
      } else {
        setFormError(res.error || "Failed to update subject.");
        toast.error(res.error || "Update failed.");
      }
    } else {
      const res = await createSubject(payload);
      if (res.success && res.data) {
        toast.success(`Subject "${formData.code.toUpperCase()}" created! Navigating to enrollment roster...`);
        setIsAddModalOpen(false);
        const createdId = res.data.id;
        resetForm();
        await refreshData();
        router.refresh();
        router.push(`/subjects/${createdId}/enrollments`);
      } else {
        setFormError(res.error || "Failed to create subject.");
        toast.error(res.error || "Creation failed.");
      }
    }

    setIsSubmitting(false);
  };

  const handleArchiveSubject = async () => {
    if (!archivingSubject) return;
    setIsSubmitting(true);

    const res = await archiveSubject(archivingSubject.id);
    if (res.success) {
      toast.success(`Subject "${archivingSubject.code}" archived successfully.`);
      setArchivingSubject(null);
      await refreshData();
      router.refresh();
    } else {
      toast.error(res.error || "Failed to archive subject.");
    }

    setIsSubmitting(false);
  };

  const handleUnarchiveSubject = async (sub: SubjectWithCount) => {
    setIsSubmitting(true);

    const res = await unarchiveSubject(sub.id);
    if (res.success) {
      toast.success(`Subject "${sub.code}" restored to active list.`);
      await refreshData();
      router.refresh();
    } else {
      toast.error(res.error || "Failed to restore subject.");
    }

    setIsSubmitting(false);
  };

  const handleDeleteSubject = async () => {
    if (!deletingSubject) return;
    if (deleteConfirmCode.trim().toUpperCase() !== deletingSubject.code.toUpperCase()) {
      toast.error(`Please type "${deletingSubject.code}" to confirm deletion.`);
      return;
    }

    setIsSubmitting(true);

    const res = await deleteSubject(deletingSubject.id);
    if (res.success) {
      toast.success(`Subject "${deletingSubject.code}" permanently deleted.`);
      setDeletingSubject(null);
      setDeleteConfirmCode("");
      await refreshData();
      router.refresh();
    } else {
      toast.error(res.error || "Failed to delete subject.");
    }

    setIsSubmitting(false);
  };

  return (
    <div className="space-y-6 relative pb-16">
      {/* Active vs Archived Tab Selector & Top Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Tabs */}
        <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800/90 rounded-2xl w-fit border border-slate-200/80 dark:border-slate-700/80">
          <button
            onClick={() => setActiveTab("active")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "active"
                ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Active Subjects</span>
          </button>
          <button
            onClick={() => setActiveTab("archived")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "archived"
                ? "bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <FolderArchive className="w-3.5 h-3.5" />
            <span>Archived History</span>
          </button>
        </div>

        {/* Search Bar & Add Button */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 md:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search subjects..."
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all shadow-2xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded-full cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {isLoading && <Loader2 className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400" />}

          {activeTab === "active" && (
            <button
              onClick={handleOpenAddModal}
              className="hidden md:flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold text-xs rounded-xl shadow-xs shadow-blue-600/20 transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add Subject</span>
            </button>
          )}
        </div>
      </div>

      {/* Subject Cards Grid */}
      {isLoading && filteredSubjects.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-500 dark:text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600 dark:text-blue-400" />
          <p>Loading {activeTab === "archived" ? "archived" : "active"} subjects...</p>
        </div>
      ) : filteredSubjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredSubjects.map((sub: SubjectWithCount) => {
            const theme = getColorTheme(sub.color);
            const scheduleSummary = formatSchedulesDisplay(sub.schedules, sub.description);

            return (
              <div
                key={sub.id}
                className={`group bg-white dark:bg-slate-900 border ${
                  activeTab === "archived"
                    ? "border-amber-200/80 dark:border-amber-950/60 bg-amber-50/20 dark:bg-amber-950/10"
                    : "border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                } rounded-2xl p-5 sm:p-6 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between relative overflow-hidden`}
              >
                {/* Color Top Accent Stripe */}
                <div
                  className="absolute top-0 inset-x-0 h-1.5 transition-all"
                  style={{ backgroundColor: activeTab === "archived" ? "#f59e0b" : theme.hex }}
                />

                <div>
                  {/* Header: Code Badge, Counts, Actions */}
                  <div className="flex items-center justify-between gap-2 mb-3 pt-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold border ${theme.bg} ${theme.border} ${theme.text}`}
                      >
                        {sub.code}
                      </span>
                      {activeTab === "archived" && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 uppercase tracking-wider">
                          Archived
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100/90 dark:bg-slate-800 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                        {sub._count.enrollments} Enrolled
                      </span>

                      {/* Export CSV Button */}
                      <button
                        onClick={() => exportSubjectAttendanceCSV(sub.id, sub.code)}
                        className="p-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer"
                        title="Export Attendance to CSV/Excel"
                      >
                        <FileSpreadsheet className="w-4 h-4" />
                      </button>

                      {activeTab === "active" ? (
                        <>
                          <button
                            onClick={() => handleOpenEditModal(sub)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
                            title="Edit Subject"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setArchivingSubject(sub)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors cursor-pointer"
                            title="Archive Subject (Preserve Data)"
                          >
                            <Archive className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleUnarchiveSubject(sub)}
                            className="p-1.5 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
                            title="Restore Subject to Active"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setDeleteConfirmCode("");
                              setDeletingSubject(sub);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                            title="Permanently Delete Subject"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Subject Title */}
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {sub.name}
                  </h2>

                  {/* Schedule Display */}
                  <div className="mt-2.5 flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                    <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                    <span className="leading-relaxed">{scheduleSummary}</span>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/subjects/${sub.id}/enrollments`}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100/80 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700 rounded-xl transition-colors flex items-center gap-1.5"
                    >
                      <UserCheck className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                      <span>Roster ({sub._count.enrollments})</span>
                    </Link>

                    {/* <button
                      onClick={() => exportSubjectAttendanceCSV(sub.id, sub.code)}
                      className="px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer border border-emerald-200/60 dark:border-emerald-800/60"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Export CSV</span>
                    </button> */}
                  </div>

                  {activeTab === "active" ? (
                    sub._count.enrollments === 0 ? (
                      <button
                        disabled
                        title="Enroll students first to take attendance"
                        className="px-3.5 py-1.5 text-xs font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center gap-1.5 cursor-not-allowed opacity-60 border border-slate-200 dark:border-slate-700"
                      >
                        <Zap className="w-3.5 h-3.5 text-slate-400" />
                        <span>Take Attendance</span>
                      </button>
                    ) : (
                      <Link
                        href={`/subjects/${sub.id}/attendance`}
                        className="px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.98] rounded-xl transition-all shadow-2xs shadow-blue-600/20 flex items-center gap-1.5"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>Take Attendance</span>
                      </Link>
                    )
                  ) : (
                    <button
                      onClick={() => handleUnarchiveSubject(sub)}
                      className="px-3.5 py-1.5 text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 hover:bg-amber-200 dark:hover:bg-amber-900/80 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer border border-amber-300/60 dark:border-amber-800"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Restore Subject</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State Container */
        <div className="w-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-12 text-center my-4 py-16 shadow-xs flex flex-col items-center justify-center">
          <div className="w-14 h-14 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-200/60 dark:border-blue-800">
            {activeTab === "archived" ? <FolderArchive className="w-7 h-7 text-amber-600 dark:text-amber-400" /> : <BookOpen className="w-7 h-7" />}
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {activeTab === "archived" ? "No archived subjects" : "No subjects found"}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
            {activeTab === "archived"
              ? "You haven't archived any subjects. When a semester finishes, archive subjects to clean up your view while preserving all attendance history."
              : search
              ? `No results for "${search}". Try searching with a different term.`
              : "You haven't added any active subjects yet. Create your first subject to manage classes and rosters."}
          </p>
          {!search && activeTab === "active" && (
            <button
              onClick={handleOpenAddModal}
              className="mt-6 px-5 py-2.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md transition-all inline-flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" /> Add your first subject
            </button>
          )}
        </div>
      )}

      {/* Floating Add Subject Button (Mobile View) */}
      {isMounted &&
        activeTab === "active" &&
        createPortal(
          <button
            onClick={handleOpenAddModal}
            aria-label="Add New Subject"
            title="Add New Subject"
            className="md:hidden fixed bottom-20 right-5 z-50 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white w-14 h-14 rounded-full shadow-xl shadow-blue-600/30 flex items-center justify-center cursor-pointer"
          >
            <Plus className="w-6 h-6" />
          </button>,
          document.body
        )}

      {/* Modal Dialog for Adding / Editing Subject */}
      {isMounted &&
        (isAddModalOpen || editingSubject) &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-150 relative max-h-[90vh] overflow-y-auto my-8">
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingSubject(null);
                }}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold border border-blue-200/60 dark:border-blue-800">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {editingSubject ? "Edit Subject" : "Add New Subject"}
                  </h3>
                </div>
              </div>

              <form onSubmit={handleSubmitForm} className="space-y-5">
                {formError && (
                  <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Code & Name */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-1">
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      placeholder="e.g. CS101"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900 dark:text-white transition-all font-mono uppercase"
                      required
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Subject Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Computer Science I"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900 dark:text-white transition-all"
                      required
                    />
                  </div>
                </div>

                {/* COLOR SELECTOR */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Subject Color Theme
                  </label>
                  <div className="grid grid-cols-5 gap-2 p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl">
                    {SUBJECT_COLORS.map((c) => {
                      const isSelected = formData.color === c.id;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, color: c.id })}
                          title={c.name}
                          className={`h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer relative border ${
                            isSelected
                              ? "ring-2 ring-blue-600 ring-offset-1 dark:ring-offset-slate-900 scale-105 border-transparent"
                              : "border-slate-300/60 dark:border-slate-700 hover:scale-105"
                          }`}
                          style={{ backgroundColor: c.hex }}
                        >
                          {isSelected && <Check className="w-4 h-4 text-white drop-shadow-md" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* DAY & TIME SELECTOR */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Schedule & Timeslots
                    </label>
                  </div>

                  {/* Day Picker Pills */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {DAYS_LIST.map((day) => {
                      const isSelected = scheduleSlots.some((s) => s.day === day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => toggleDaySlot(day)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            isSelected
                              ? "bg-blue-600 text-white shadow-xs"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>

                  {scheduleSlots.length > 0 ? (
                    <div className="mt-3 space-y-2 max-h-48 overflow-y-auto pr-1">
                      {scheduleSlots.map((slot) => (
                        <div
                          key={slot.day}
                          className="p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between gap-3 text-xs"
                        >
                          <span className="font-bold text-blue-600 dark:text-blue-400 w-10">
                            {slot.day}
                          </span>

                          <div className="flex items-center gap-2 flex-1">
                            <input
                              type="time"
                              value={slot.startTime}
                              onChange={(e) => updateSlotTime(slot.day, "startTime", e.target.value)}
                              className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono text-xs focus:ring-1 focus:ring-blue-600"
                            />
                            <span className="text-slate-400 font-bold">to</span>
                            <input
                              type="time"
                              value={slot.endTime}
                              onChange={(e) => updateSlotTime(slot.day, "endTime", e.target.value)}
                              className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono text-xs focus:ring-1 focus:ring-blue-600"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => toggleDaySlot(slot.day)}
                            className="p-1 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                            title="Remove day"
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-center text-[11px] text-slate-400">
                      Click day pills above to configure independent start/end timeslots.
                    </div>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Notes / Description <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="e.g. Room 302 • Lab Section A"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900 dark:text-white transition-all"
                  />
                </div>

                <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddModalOpen(false);
                      setEditingSubject(null);
                    }}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-xs flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    {editingSubject ? "Save Changes" : "Create & Go to Enrollments"}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* Archive Subject Modal */}
      {isMounted &&
        archivingSubject &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-md p-5 space-y-4 animate-in zoom-in-95 duration-150 relative">
              <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
                <Archive className="w-6 h-6 shrink-0" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Archive Subject?</h2>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Are you sure you want to archive <strong className="text-slate-900 dark:text-white">{archivingSubject.code} - {archivingSubject.name}</strong>?
                <br /><br />
                Archiving will hide this subject from your active daily list, but <strong className="text-emerald-600 dark:text-emerald-400">all student enrollments, attendance logs, and reports will remain safe</strong>. You can view or restore it anytime from the <em>Archived History</em> tab.
              </p>

              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-xl flex items-center justify-between gap-2 text-xs">
                <span className="text-emerald-800 dark:text-emerald-300 font-medium">Download backup before archiving:</span>
                {/* <button
                  type="button"
                  onClick={() => exportSubjectAttendanceCSV(archivingSubject.id, archivingSubject.code)}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3 h-3" />
                  <span>Export CSV</span>
                </button> */}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => setArchivingSubject(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleArchiveSubject}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Archive Subject
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Permanent Delete Confirmation Modal (with Subject Code Confirmation) */}
      {isMounted &&
        deletingSubject &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-md p-5 space-y-4 animate-in zoom-in-95 duration-150 relative">
              <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
                <AlertTriangle className="w-6 h-6 shrink-0" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Permanently Delete Subject?</h2>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                This will <strong className="text-red-600 dark:text-red-400">permanently erase</strong> <strong className="text-slate-900 dark:text-white">{deletingSubject.code} - {deletingSubject.name}</strong> along with all <strong className="text-red-600">{deletingSubject._count.sessions} attendance sessions</strong> and <strong className="text-red-600">{deletingSubject._count.enrollments} enrollments</strong>.
                This action cannot be undone.
              </p>

              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-xl flex items-center justify-between gap-2 text-xs">
                <span className="text-emerald-800 dark:text-emerald-300 font-medium">Save a copy before deleting:</span>
                {/* <button
                  type="button"
                  onClick={() => exportSubjectAttendanceCSV(deletingSubject.id, deletingSubject.code)}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3 h-3" />
                  <span>Export CSV</span>
                </button> */}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Type subject code <span className="font-mono text-red-600 font-extrabold">{deletingSubject.code}</span> to confirm:
                </label>
                <input
                  type="text"
                  value={deleteConfirmCode}
                  onChange={(e) => setDeleteConfirmCode(e.target.value)}
                  placeholder={`Type "${deletingSubject.code}" here`}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono uppercase text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => {
                    setDeletingSubject(null);
                    setDeleteConfirmCode("");
                  }}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteSubject}
                  disabled={isSubmitting || deleteConfirmCode.trim().toUpperCase() !== deletingSubject.code.toUpperCase()}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Delete Permanently
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
