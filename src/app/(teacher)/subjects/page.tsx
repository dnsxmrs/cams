"use client";

import { useState, useEffect, useCallback, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
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
} from "lucide-react";
import {
  getTeacherSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
} from "@/actions/subjects";

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

const emptySubscribe = () => () => {};

export default function SubjectsPage() {
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
  });
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
    setFormData({ code: "", name: "", description: "" });
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
    });
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formData.code.trim() || !formData.name.trim()) {
      setFormError("Subject Code and Title are required.");
      return;
    }

    setIsSubmitting(true);

    if (editingSubject) {
      const res = await updateSubject(editingSubject.id, formData);
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
      const res = await createSubject(formData);
      if (res.success) {
        toast.success(`Subject "${formData.code.toUpperCase()}" created successfully!`);
        setIsAddModalOpen(false);
        resetForm();
        fetchSubjects(search);
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
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded-full"
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
          {subjects.map((sub) => (
            <div
              key={sub.id}
              className="group bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-2xl p-5 sm:p-6 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                {/* Header: Code Badge, Counts, Edit/Delete */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold border bg-blue-50 dark:bg-blue-950/60 border-blue-200/60 dark:border-blue-800 text-blue-700 dark:text-blue-300">
                    {sub.code}
                  </span>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100/90 dark:bg-slate-800 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                      {sub._count.enrollments} Enrolled
                    </span>
                    <button
                      onClick={() => handleOpenEditModal(sub)}
                      className="p-1 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                      title="Edit Subject"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingSubject(sub)}
                      className="p-1 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
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

                {/* Description / Schedule */}
                <div className="mt-2.5 flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                  <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                  <span>{sub.description || "No schedule specified"}</span>
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

                <Link
                  href={`/subjects/${sub.id}/sessions/new`}
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.98] rounded-xl transition-all shadow-2xs shadow-blue-600/20 flex items-center gap-1.5"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Take Attendance</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-12 text-center max-w-md mx-auto my-8">
          <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto text-slate-400 dark:text-slate-500 mb-3">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No subjects found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {search ? `No results for "${search}". Try searching with a different term.` : "You haven't added any subjects yet."}
          </p>
          {!search && (
            <button
              onClick={handleOpenAddModal}
              className="mt-4 px-4 py-2 text-xs font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors inline-flex items-center gap-1.5"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-150 relative">
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingSubject(null);
                }}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {editingSubject ? "Edit Subject" : "Add New Subject"}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {editingSubject ? "Modify subject code or details" : "Create a subject entry to manage students and attendance"}
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmitForm} className="space-y-4">
                {formError && (
                  <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <span>{formError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Subject Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="e.g. CS101"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900 dark:text-white transition-all font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Subject Title / Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Introduction to Computer Science"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900 dark:text-white transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Schedule / Description <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="e.g. Mon & Wed • 9:00 AM"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900 dark:text-white transition-all"
                  />
                </div>

                <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddModalOpen(false);
                      setEditingSubject(null);
                    }}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-2xs flex items-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    {editingSubject ? "Save Changes" : "Create Subject"}
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
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
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
