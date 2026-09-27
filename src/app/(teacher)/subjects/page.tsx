"use client";

import { useState, useEffect, useCallback, useSyncExternalStore } from "react";
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
} from "lucide-react";
import {
  getTeacherSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
} from "@/actions/subjects";

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
  const [subjects, setSubjects] = useState<SubjectWithCount[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<SubjectWithCount | null>(null);
  const [deletingSubject, setDeletingSubject] = useState<SubjectWithCount | null>(null);

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

  const fetchSubjects = useCallback(async (query?: string) => {
    setIsLoading(true);
    const res = await getTeacherSubjects(query);
    if (res.success && res.data) {
      setSubjects(res.data as SubjectWithCount[]);
    } else {
      toast.error(res.error || "Failed to load subjects.");
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSubjects(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search, fetchSubjects]);

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
        fetchSubjects(search);
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
        router.push(`/subjects/${createdId}/enrollments`);
      } else {
        setFormError(res.error || "Failed to create subject.");
        toast.error(res.error || "Creation failed.");
      }
    }

    setIsSubmitting(false);
  };

  const handleDeleteSubject = async () => {
    if (!deletingSubject) return;
    setIsSubmitting(true);

    const res = await deleteSubject(deletingSubject.id);
    if (res.success) {
      toast.success(`Subject "${deletingSubject.code}" deleted.`);
      setDeletingSubject(null);
      fetchSubjects(search);
    } else {
      toast.error(res.error || "Failed to delete subject.");
    }

    setIsSubmitting(false);
  };

  return (
    <div className="space-y-6 relative pb-16">
      {/* Top Control Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search subjects by code or title..."
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all shadow-2xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
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

        <div className="flex items-center justify-between sm:justify-end gap-3 text-xs font-semibold text-slate-500 dark:text-slate-400 px-1">
          {isLoading && <Loader2 className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400" />}

          <button
            onClick={handleOpenAddModal}
            className="hidden md:flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold text-xs rounded-xl shadow-xs shadow-blue-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Subject</span>
          </button>
        </div>
      </div>

      {/* Subject Cards Grid */}
      {isLoading && subjects.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-500 dark:text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600 dark:text-blue-400" />
          <p>Loading your subjects from database...</p>
        </div>
      ) : subjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {subjects.map((sub) => {
            const theme = getColorTheme(sub.color);
            const scheduleSummary = formatSchedulesDisplay(sub.schedules, sub.description);

            return (
              <div
                key={sub.id}
                className="group bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-2xl p-5 sm:p-6 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between relative overflow-hidden"
              >
                {/* Color Top Accent Stripe */}
                <div
                  className="absolute top-0 inset-x-0 h-1.5 transition-all"
                  style={{ backgroundColor: theme.hex }}
                />

                <div>
                  {/* Header: Code Badge, Counts, Edit/Delete */}
                  <div className="flex items-center justify-between gap-2 mb-3 pt-1">
                    <span
                      className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold border ${theme.bg} ${theme.border} ${theme.text}`}
                    >
                      {sub.code}
                    </span>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100/90 dark:bg-slate-800 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                        {sub._count.enrollments} Enrolled
                      </span>
                      <button
                        onClick={() => handleOpenEditModal(sub)}
                        className="p-1 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
                        title="Edit Subject"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingSubject(sub)}
                        className="p-1 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                        title="Delete Subject"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
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
                  <Link
                    href={`/subjects/${sub.id}/enrollments`}
                    className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100/80 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700 rounded-xl transition-colors flex items-center gap-1.5"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                    <span>Enrollments</span>
                  </Link>

                  {/* Disable Take Attendance if 0 enrolled students */}
                  {sub._count.enrollments === 0 ? (
                    <button
                      disabled
                      title="Enroll students first to take attendance"
                      className="px-4 py-2 text-xs font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center gap-1.5 cursor-not-allowed opacity-60 border border-slate-200 dark:border-slate-700"
                    >
                      <Zap className="w-3.5 h-3.5 text-slate-400" />
                      <span>Take Attendance</span>
                    </button>
                  ) : (
                    <Link
                      href={`/subjects/${sub.id}/attendance`}
                      className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.98] rounded-xl transition-all shadow-2xs shadow-blue-600/20 flex items-center gap-1.5"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Take Attendance</span>
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State Container spanning full width matching top control bar */
        <div className="w-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-12 text-center my-4 py-16 shadow-xs flex flex-col items-center justify-center">
          <div className="w-14 h-14 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-200/60 dark:border-blue-800">
            <BookOpen className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No subjects found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
            {search ? `No results for "${search}". Try searching with a different term.` : "You haven't added any subjects yet. Create your first subject to manage classes and rosters."}
          </p>
          {!search && (
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
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {editingSubject ? "Modify subject code, schedule or color" : "Create a subject entry and configure independent day timeslots"}
                  </p>
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

                {/* 15-COLOR SELECTOR */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Subject Color Theme <span className="text-slate-400 font-normal">(15 Colors Available)</span>
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

                {/* INDEPENDENT DAY & TIME SELECTOR */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Schedule & Timeslots <span className="text-slate-400 font-normal">(Select Days)</span>
                    </label>
                    <span className="text-[10px] text-slate-400">Independent times per day</span>
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

                  {/* Selected Days Timeslot Config Rows */}
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

                {/* Additional Description */}
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

      {/* Delete Subject Confirmation Modal */}
      {deletingSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-sm p-5 space-y-4">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Delete Subject?</h2>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Are you sure you want to delete <strong className="text-slate-900 dark:text-white">{deletingSubject.code} - {deletingSubject.name}</strong>? This will also remove all attendance sessions and student enrollments linked to this subject.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeletingSubject(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSubject}
                disabled={isSubmitting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Delete Subject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
