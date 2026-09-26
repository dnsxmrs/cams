"use client";

import { useState, useSyncExternalStore } from "react";
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
} from "lucide-react";

interface SubjectItem {
  id: string;
  code: string;
  name: string;
  studentsCount: number;
  schedule: string;
  badgeBg: string;
  badgeText: string;
}

const emptySubscribe = () => () => {};

export default function SubjectsPage() {
  const [search, setSearch] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const isMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  // Initial subjects data
  const [subjects, setSubjects] = useState<SubjectItem[]>([
    {
      id: "1",
      code: "CS101",
      name: "Introduction to Computer Science",
      studentsCount: 38,
      schedule: "Mon & Wed • 9:00 AM",
      badgeBg: "bg-blue-50 border-blue-200/60 text-blue-700",
      badgeText: "CS101",
    },
    {
      id: "2",
      code: "MATH202",
      name: "Calculus II & Differential Equations",
      studentsCount: 42,
      schedule: "Tue & Thu • 10:30 AM",
      badgeBg: "bg-emerald-50 border-emerald-200/60 text-emerald-700",
      badgeText: "MATH202",
    },
    {
      id: "3",
      code: "PHYS101",
      name: "General Physics I with Lab",
      studentsCount: 32,
      schedule: "Friday • 1:00 PM",
      badgeBg: "bg-amber-50 border-amber-200/60 text-amber-700",
      badgeText: "PHYS101",
    },
    {
      id: "4",
      code: "DS301",
      name: "Data Structures & Algorithms",
      studentsCount: 30,
      schedule: "Mon & Wed • 2:00 PM",
      badgeBg: "bg-purple-50 border-purple-200/60 text-purple-700",
      badgeText: "DS301",
    },
  ]);

  // Modal form state
  const [newCode, setNewCode] = useState("");
  const [newName, setNewName] = useState("");
  const [newSchedule, setNewSchedule] = useState("");
  const [selectedTheme, setSelectedTheme] = useState("blue");

  const themeOptions = [
    { id: "blue", label: "Blue", badgeBg: "bg-blue-50 border-blue-200/60 text-blue-700" },
    { id: "emerald", label: "Emerald", badgeBg: "bg-emerald-50 border-emerald-200/60 text-emerald-700" },
    { id: "amber", label: "Amber", badgeBg: "bg-amber-50 border-amber-200/60 text-amber-700" },
    { id: "purple", label: "Purple", badgeBg: "bg-purple-50 border-purple-200/60 text-purple-700" },
    { id: "rose", label: "Rose", badgeBg: "bg-rose-50 border-rose-200/60 text-rose-700" },
  ];

  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim() || !newName.trim()) {
      toast.error("Please fill out the subject code and name.");
      return;
    }

    const theme = themeOptions.find((t) => t.id === selectedTheme) || themeOptions[0];

    const newSubject: SubjectItem = {
      id: Date.now().toString(),
      code: newCode.toUpperCase().trim(),
      name: newName.trim(),
      studentsCount: 0,
      schedule: newSchedule.trim() || "Schedule TBD",
      badgeBg: theme.badgeBg,
      badgeText: newCode.toUpperCase().trim(),
    };

    setSubjects([newSubject, ...subjects]);
    toast.success(`Subject "${newSubject.code}" added successfully!`);
    
    // Reset form & close modal
    setNewCode("");
    setNewName("");
    setNewSchedule("");
    setIsAddModalOpen(false);
  };

  // Filter subjects based on search input
  const filteredSubjects = subjects.filter(
    (sub) =>
      sub.code.toLowerCase().includes(search.toLowerCase()) ||
      sub.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 relative pb-16">
      {/* Minimal Top Control Bar (Search, Counter & Desktop Add Button) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search subjects by code or title..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all shadow-2xs text-slate-800 placeholder-slate-400"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3 text-xs font-semibold text-slate-500 px-1">
          {/* <span className="bg-slate-200/60 text-slate-700 px-2.5 py-1 rounded-lg">
            {filteredSubjects.length} {filteredSubjects.length === 1 ? "Subject" : "Subjects"}
          </span> */}

          {/* Desktop Add Subject Button (Not Floating) */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="hidden md:flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold text-xs rounded-xl shadow-xs shadow-blue-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Subject</span>
          </button>
        </div>
      </div>

      {/* Minimal Subject Cards Grid */}
      {filteredSubjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredSubjects.map((sub) => (
            <div
              key={sub.id}
              className="group bg-white border border-slate-200/90 hover:border-slate-300 rounded-2xl p-5 sm:p-6 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between"
            >
              {/* Card Header: Subject Code Badge & Student Count */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span
                    className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold border ${sub.badgeBg}`}
                  >
                    {sub.code}
                  </span>
                  <span className="text-xs font-semibold text-slate-500 bg-slate-100/90 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    {sub.studentsCount} Enrolled
                  </span>
                </div>

                {/* Subject Title */}
                <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug group-hover:text-blue-600 transition-colors">
                  {sub.name}
                </h2>

                {/* Schedule */}
                <div className="mt-2.5 flex items-center gap-1.5 text-xs font-medium text-slate-500">
                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{sub.schedule}</span>
                </div>
              </div>

              {/* Card Footer: Action Links */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <Link
                  href={`/subjects/${sub.id}/enrollments`}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100/80 hover:bg-slate-200/80 rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <UserCheck className="w-3.5 h-3.5 text-slate-500" />
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
        <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center max-w-md mx-auto my-8">
          <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400 mb-3">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No subjects found</h3>
          <p className="text-xs text-slate-500 mt-1">
            {search ? `No results for "${search}". Try searching with a different term.` : "You haven't added any subjects yet."}
          </p>
          {!search && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="mt-4 px-4 py-2 text-xs font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Add your first subject
            </button>
          )}
        </div>
      )}

      {/* Floating Add Subject Button (Mobile View Only - Portalled to body to stay fixed to screen viewport) */}
      {isMounted &&
        createPortal(
          <button
            onClick={() => setIsAddModalOpen(true)}
            aria-label="Add New Subject"
            title="Add New Subject"
            className="md:hidden fixed bottom-20 right-5 z-50 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white w-14 h-14 rounded-full shadow-xl shadow-blue-600/30 flex items-center justify-center cursor-pointer"
          >
            <Plus className="w-6 h-6" />
          </button>,
          document.body
        )}

      {/* Modal Dialog for Adding Subject */}
      {isMounted &&
        isAddModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150 relative">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Add New Subject</h3>
                  <p className="text-xs text-slate-500">Create a subject entry to manage students and attendance</p>
                </div>
              </div>

              <form onSubmit={handleAddSubject} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Subject Code
                  </label>
                  <input
                    type="text"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    placeholder="e.g. CS101"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white text-slate-900 transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Subject Title / Name
                  </label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Introduction to Computer Science"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white text-slate-900 transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Schedule (Optional)
                  </label>
                  <input
                    type="text"
                    value={newSchedule}
                    onChange={(e) => setNewSchedule(e.target.value)}
                    placeholder="e.g. Mon & Wed • 9:00 AM"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white text-slate-900 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Badge Color Accent
                  </label>
                  <div className="flex items-center gap-2">
                    {themeOptions.map((theme) => (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => setSelectedTheme(theme.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${theme.badgeBg} ${
                          selectedTheme === theme.id ? "ring-2 ring-blue-600 ring-offset-1" : "opacity-70 hover:opacity-100"
                        }`}
                      >
                        {theme.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-2xs"
                  >
                    Create Subject
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
