"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import { Globe, Plus, Search, Edit2, BookOpen } from "lucide-react";

export default function StudentDirectoryPage() {
  const [search, setSearch] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Mock student directory data for frontend preview
  const mockStudents = [
    { id: "1", studentNumber: "2024-0001", fullName: "Ada Lovelace", email: "ada.lovelace@school.edu", contactInfo: "+1 555-0101", enrolledSubjectsCount: 3 },
    { id: "2", studentNumber: "2024-0002", fullName: "Grace Hopper", email: "grace.hopper@school.edu", contactInfo: "+1 555-0102", enrolledSubjectsCount: 4 },
    { id: "3", studentNumber: "2024-0003", fullName: "Claude Shannon", email: "claude.shannon@school.edu", contactInfo: "+1 555-0103", enrolledSubjectsCount: 2 },
    { id: "4", studentNumber: "2024-0004", fullName: "Margaret Hamilton", email: "m.hamilton@school.edu", contactInfo: "+1 555-0104", enrolledSubjectsCount: 3 },
    { id: "5", studentNumber: "2024-0005", fullName: "John von Neumann", email: "j.vonneumann@school.edu", contactInfo: "+1 555-0105", enrolledSubjectsCount: 2 },
  ];

  const filteredStudents = mockStudents.filter(
    (st) =>
      st.fullName.toLowerCase().includes(search.toLowerCase()) ||
      st.studentNumber.toLowerCase().includes(search.toLowerCase()) ||
      st.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-page-entry space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold mb-2">
              <Globe className="w-3.5 h-3.5" /> Centralized Database
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Global Student Directory</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Browse, search, and add students to the school directory before enrolling them into subjects.
            </p>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add New Student
          </button>
        </div>

        {/* Search & Stats */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search by student number, name, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-600 focus:bg-white focus:outline-none transition-all"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Showing <span className="font-bold text-slate-900">{filteredStudents.length}</span> of {mockStudents.length} students
          </div>
        </div>

        {/* Directory Table */}
        <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">Student ID</th>
                <th className="py-3.5 px-4">Full Name</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4">Contact</th>
                <th className="py-3.5 px-4">Enrolled Subjects</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredStudents.map((st) => (
                <tr key={st.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-blue-600">{st.studentNumber}</td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">{st.fullName}</td>
                  <td className="py-3.5 px-4 text-slate-600">{st.email}</td>
                  <td className="py-3.5 px-4 text-slate-500">{st.contactInfo}</td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 font-bold">
                      <BookOpen className="w-3.5 h-3.5" /> {st.enrolledSubjectsCount} Subjects
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-2">
                    <button className="text-xs font-bold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1">
                      <Edit2 className="w-3.5 h-3.5" /> Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
