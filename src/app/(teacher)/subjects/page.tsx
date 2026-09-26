"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { Plus, Clock, UserCheck, Zap } from "lucide-react";

export default function SubjectsPage() {
  const [search, setSearch] = useState("");

  const mockSubjects = [
    { id: "1", code: "CS101", name: "Introduction to Computer Science", studentsCount: 38, schedule: "Mon & Wed • 9:00 AM", color: "from-blue-600 to-indigo-600" },
    { id: "2", code: "MATH202", name: "Calculus II & Differential Equations", studentsCount: 42, schedule: "Tue & Thu • 10:30 AM", color: "from-emerald-600 to-teal-600" },
    { id: "3", code: "PHYS101", name: "General Physics I with Lab", studentsCount: 32, schedule: "Friday • 1:00 PM", color: "from-amber-600 to-orange-600" },
    { id: "4", code: "DS301", name: "Data Structures & Algorithms", studentsCount: 30, schedule: "Mon & Wed • 2:00 PM", color: "from-purple-600 to-pink-600" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-page-entry space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Subject Management</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Create, view, and manage your assigned subjects and student rosters.
            </p>
          </div>
          <button className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> Add Subject
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {mockSubjects.map((sub) => (
            <div key={sub.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between">
                <span className={`px-3 py-1 rounded-lg text-xs font-extrabold text-white bg-gradient-to-r ${sub.color}`}>
                  {sub.code}
                </span>
                <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
                  {sub.studentsCount} Students
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-900">{sub.name}</h2>
              <p className="text-xs text-slate-500 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" /> {sub.schedule}
              </p>
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <Link href={`/subjects/${sub.id}/enrollments`} className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5" /> Enrollments
                </Link>
                <Link href={`/subjects/${sub.id}/sessions/new`} className="px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5" /> Take Attendance
                </Link>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
