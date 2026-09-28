"use client";

import { useState, useEffect, useCallback, useMemo, useSyncExternalStore, useRef } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { Globe, Plus, UserPlus, Search, Edit2, Trash2, BookOpen, Loader2, X, AlertCircle, Upload, History, Mail, Phone } from "lucide-react";
import { toast } from "react-hot-toast";
import { getStudents, createStudent, updateStudent, deleteStudent, importStudents } from "@/actions/students";
import { formatStudentName } from "@/lib/student";
import Pagination from "@/app/components/Pagination";
import StudentAttendanceHistoryModal from "@/app/components/StudentAttendanceHistoryModal";

interface StudentWithCount {
  id: string;
  studentNumber: string;
  lastName: string;
  firstName: string;
  middleInitial: string | null;
  email: string | null;
  contactInfo: string | null;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    enrollments: number;
  };
}

const emptySubscribe = () => () => {};

function parseCsvLine(line: string) {
  return line
    .split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/)
    .map((value) => value.trim().replace(/^"|"$/g, "").replace(/""/g, '"'));
}

function parseNameString(rawName: string) {
  const trimmed = rawName.trim();
  if (!trimmed) return { lastName: "", firstName: "", middleInitial: "" };

  if (trimmed.includes(",")) {
    const [lastPart, restPart] = trimmed.split(",").map((s) => s.trim());
    const restTokens = (restPart || "").split(/\s+/).filter(Boolean);
    let middleInitial = "";
    let firstName = restPart || "";
    if (restTokens.length > 1 && restTokens[restTokens.length - 1].length <= 2) {
      middleInitial = restTokens.pop()?.replace(/\.$/, "") || "";
      firstName = restTokens.join(" ");
    }
    return { lastName: lastPart || "", firstName, middleInitial };
  } else {
    const tokens = trimmed.split(/\s+/).filter(Boolean);
    if (tokens.length === 1) return { lastName: tokens[0], firstName: tokens[0], middleInitial: "" };
    if (tokens.length === 2) return { lastName: tokens[1], firstName: tokens[0], middleInitial: "" };
    let middleInitial = "";
    if (tokens[1].length <= 2) {
      middleInitial = tokens[1].replace(/\.$/, "");
      return { lastName: tokens.slice(2).join(" "), firstName: tokens[0], middleInitial };
    }
    return { lastName: tokens[tokens.length - 1], firstName: tokens.slice(0, tokens.length - 1).join(" "), middleInitial };
  }
}

function parseStudentCsv(csv: string) {
  const lines = csv.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length === 0) return [];

  const firstRow = parseCsvLine(lines[0]).map((value) => value.toLowerCase().replace(/[^a-z]/g, ""));
  const hasHeader = firstRow.some((value) =>
    ["studentnumber", "studentid", "id", "lastname", "firstname", "fullname", "name"].includes(value)
  );
  const headers = hasHeader ? firstRow : ["studentnumber", "lastname", "firstname", "middleinitial", "email", "contactinfo"];
  const rows = hasHeader ? lines.slice(1) : lines;
  const indexOf = (names: string[]) => headers.findIndex((header) => names.includes(header));
  
  const studentNumberIndex = indexOf(["studentnumber", "studentid", "id"]);
  const lastNameIndex = indexOf(["lastname", "last", "familyname", "surname"]);
  const firstNameIndex = indexOf(["firstname", "first", "givenname"]);
  const middleInitialIndex = indexOf(["middleinitial", "mi", "middlename", "middle"]);
  const fullNameIndex = indexOf(["fullname", "name"]);
  const emailIndex = indexOf(["email", "emailaddress"]);
  const contactIndex = indexOf(["contact", "contactinfo", "phone", "phonenumber"]);

  return rows
    .map((line) => {
      const values = parseCsvLine(line);
      const studentNumber = values[studentNumberIndex >= 0 ? studentNumberIndex : 0] || "";
      let lastName = "";
      let firstName = "";
      let middleInitial = "";

      if (lastNameIndex >= 0 || firstNameIndex >= 0) {
        lastName = values[lastNameIndex >= 0 ? lastNameIndex : 1] || "";
        firstName = values[firstNameIndex >= 0 ? firstNameIndex : 2] || "";
        middleInitial = values[middleInitialIndex >= 0 ? middleInitialIndex : 3] || "";
      } else if (fullNameIndex >= 0) {
        const rawName = values[fullNameIndex] || "";
        const parsed = parseNameString(rawName);
        lastName = parsed.lastName;
        firstName = parsed.firstName;
        middleInitial = parsed.middleInitial;
      }

      return {
        studentNumber,
        lastName,
        firstName,
        middleInitial,
        email: values[emailIndex >= 0 ? emailIndex : 4] || "",
        contactInfo: values[contactIndex >= 0 ? contactIndex : 5] || "",
      };
    })
    .filter((student) => student.studentNumber || student.lastName || student.firstName || student.email || student.contactInfo);
}

export default function StudentDirectoryPage() {
  const [students, setStudents] = useState<StudentWithCount[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentWithCount | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<StudentWithCount | null>(null);
  const [historyStudentId, setHistoryStudentId] = useState<string | null>(null);

  // Form States
  const [formData, setFormData] = useState({
    studentNumber: "",
    lastName: "",
    firstName: "",
    middleInitial: "",
    email: "",
    contactInfo: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const isMounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  // Floating Action Button state
  const [isFabOpen, setIsFabOpen] = useState(false);
  const fabRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (fabRef.current && !fabRef.current.contains(event.target as Node)) {
        setIsFabOpen(false);
      }
    }
    if (isFabOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isFabOpen]);

  const fetchStudents = useCallback(async () => {
    setIsLoading(true);
    const res = await getStudents();
    if (res.success && res.data) {
      const sortedStudents = [...(res.data as StudentWithCount[])].sort((a, b) =>
        formatStudentName(a).localeCompare(formatStudentName(b), undefined, { sensitivity: "base" })
      );
      setStudents(sortedStudents);
      setCurrentPage(1);
    } else {
      toast.error(res.error || "Failed to load students");
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const resetForm = () => {
    setFormData({ studentNumber: "", lastName: "", firstName: "", middleInitial: "", email: "", contactInfo: "" });
    setFormError("");
    setEditingStudent(null);
  };

  const handleOpenAddModal = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (st: StudentWithCount) => {
    setFormError("");
    setEditingStudent(st);
    setFormData({
      studentNumber: st.studentNumber,
      lastName: st.lastName,
      firstName: st.firstName,
      middleInitial: st.middleInitial || "",
      email: st.email || "",
      contactInfo: st.contactInfo || "",
    });
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formData.studentNumber.trim()) {
      setFormError("Student ID / Number is required.");
      return;
    }
    if (!formData.lastName.trim()) {
      setFormError("Last name is required.");
      return;
    }
    if (!formData.firstName.trim()) {
      setFormError("First name is required.");
      return;
    }
    if (formData.email.trim() && !/^\S+@\S+\.\S+$/.test(formData.email.trim())) {
      setFormError("Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingStudent) {
        const res = await updateStudent(editingStudent.id, formData);
        if (res.success) {
          toast.success("Student updated successfully!");
          setEditingStudent(null);
          resetForm();
          fetchStudents();
        } else {
          setFormError(res.error || "Failed to update student.");
          toast.error(res.error || "Update failed.");
        }
      } else {
        const res = await createStudent(formData);
        if (res.success) {
          toast.success("Student added to global directory!");
          setIsAddModalOpen(false);
          resetForm();
          fetchStudents();
        } else {
          setFormError(res.error || "Failed to add student.");
          toast.error(res.error || "Creation failed.");
        }
      }
    } catch {
      setFormError("The request failed. Check your connection and try again.");
      toast.error("The request failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteStudent = async () => {
    if (!deletingStudent) return;
    setIsSubmitting(true);
    try {
      const res = await deleteStudent(deletingStudent.id);
      if (res.success) {
        toast.success("Student removed from directory.");
        setDeletingStudent(null);
        fetchStudents();
      } else {
        toast.error(res.error || "Failed to delete student.");
      }
    } catch {
      toast.error("The delete request failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImportCsv = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv") && file.type !== "text/csv") {
      toast.error("Please select a CSV file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("CSV files must be smaller than 5 MB.");
      return;
    }

    setIsSubmitting(true);
    try {
      const studentsToImport = parseStudentCsv(await file.text());
      if (studentsToImport.length === 0) {
        toast.error("No student rows found in the CSV file.");
        return;
      }
      const res = await importStudents(studentsToImport);
      if (res.success) {
        toast.success(`${res.imported} student${res.imported === 1 ? "" : "s"} imported${res.skipped ? `; ${res.skipped} duplicate${res.skipped === 1 ? "" : "s"} skipped` : ""}.`);
        if (res.invalidRows?.length) toast.error(res.invalidRows.join(" "));
        fetchStudents();
      } else {
        toast.error(res.error || "Failed to import students.");
      }
    } catch {
      toast.error("The CSV import failed. Check the file and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return students;
    return students.filter((student) =>
      [
        student.studentNumber,
        formatStudentName(student),
        student.lastName,
        student.firstName,
        student.middleInitial || "",
        student.email || "",
        student.contactInfo || "",
      ].some((value) => value.toLowerCase().includes(query))
    );
  }, [search, students]);
  const visibleStudents = filteredStudents.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6">
      {/* Search & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="Search by ID, name, or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all shadow-2xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
          />
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          {search && (
            <button
              onClick={() => {
                setSearch("");
                setCurrentPage(1);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded-full cursor-pointer"
              aria-label="Clear student search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="hidden sm:flex sm:items-center gap-2.5">
          <label className="px-3.5 py-2.5 sm:py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs rounded-xl shadow-2xs transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer">
            <Upload className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span>Import CSV</span>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={handleImportCsv}
              disabled={isSubmitting}
              className="hidden"
            />
          </label>
          <button
            onClick={handleOpenAddModal}
            className="px-3.5 py-2.5 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Student</span>
          </button>
        </div>
      </div>

      {/* Directory Table / Cards View */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        {isLoading && students.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600 dark:text-blue-400" />
            <p>Loading global student directory...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
            <Globe className="w-8 h-8 text-slate-300 dark:text-slate-600" />
            <p className="font-bold text-slate-700 dark:text-slate-200 text-sm">No students found</p>
            <p>{search ? "No student matches your search criteria." : "The global directory is currently empty. Click 'Add Student' to get started."}</p>
          </div>
        ) : (
          <div>
            {/* Desktop Table View (md:block) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-4">Student ID</th>
                    <th className="py-3.5 px-4">Student Name (Last, First M.I.)</th>
                    <th className="py-3.5 px-4">Email</th>
                    <th className="py-3.5 px-4">Contact</th>
                    <th className="py-3.5 px-4">Enrolled Subjects</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {visibleStudents.map((st) => (
                    <tr key={st.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">{st.studentNumber}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">{formatStudentName(st)}</td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">{st.email || "—"}</td>
                      <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">{st.contactInfo || "—"}</td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800">
                          {st._count.enrollments} {st._count.enrollments === 1 ? "Subject" : "Subjects"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-3">
                        <Link
                          href={`/students/${st.id}/history`}
                          className="text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 inline-flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <History className="w-3.5 h-3.5" /> History
                        </Link>
                        <button
                          onClick={() => handleOpenEditModal(st)}
                          className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 inline-flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button
                          onClick={() => setDeletingStudent(st)}
                          className="text-xs font-bold text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 inline-flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View (md:hidden) */}
            <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {visibleStudents.map((st) => (
                <div key={st.id} className="p-4 space-y-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-snug truncate">
                        {formatStudentName(st)}
                      </h3>
                      <span className="inline-block mt-1 px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800">
                        {st.studentNumber}
                      </span>
                    </div>
                    <span className="shrink-0 px-2.5 py-0.5 rounded-full text-[11px] font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800">
                      {st._count.enrollments} {st._count.enrollments === 1 ? "Subject" : "Subjects"}
                    </span>
                  </div>

                  {(st.email || st.contactInfo) && (
                    <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400 pt-0.5">
                      {st.email && (
                        <div className="flex items-center gap-1.5 truncate">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{st.email}</span>
                        </div>
                      )}
                      {st.contactInfo && (
                        <div className="flex items-center gap-1.5 truncate">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{st.contactInfo}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800/60">
                    <Link
                      href={`/students/${st.id}/history`}
                      className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100/80 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <History className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                      <span>History</span>
                    </Link>
                    <button
                      onClick={() => handleOpenEditModal(st)}
                      className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50/70 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200/70 dark:border-blue-800/60 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => setDeletingStudent(st)}
                      className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50/70 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60 border border-red-200/70 dark:border-red-800/60 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <Pagination
              page={currentPage}
              pageSize={pageSize}
              totalItems={filteredStudents.length}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(1);
              }}
            />
          </div>
        )}
      </div>

      {/* Add / Edit Student Modal */}
      {isMounted &&
        (isAddModalOpen || editingStudent) &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {editingStudent ? "Edit Student Details" : "Add New Student"}
              </h2>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingStudent(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Student Number / ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. STU-2026-001"
                  value={formData.studentNumber}
                  onChange={(e) => setFormData({ ...formData, studentNumber: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-blue-600 text-slate-900 dark:text-white focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Dela Cruz"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-blue-600 text-slate-900 dark:text-white focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Juan"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-blue-600 text-slate-900 dark:text-white focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Middle Initial <span className="text-slate-400 font-normal">(Optional, e.g. A)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. A"
                  maxLength={5}
                  value={formData.middleInitial}
                  onChange={(e) => setFormData({ ...formData, middleInitial: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-blue-600 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="email"
                  placeholder="e.g. juan.delacruz@school.edu"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-blue-600 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Contact Info / Phone <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. +63 9123456789"
                  value={formData.contactInfo}
                  onChange={(e) => setFormData({ ...formData, contactInfo: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-blue-600 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingStudent(null);
                  }}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {editingStudent ? "Save Changes" : "Create Student"}
                </button>
              </div>
            </form>
          </div>
          </div>,
          document.body
        )}

      {/* Delete Confirmation Modal */}
      {isMounted &&
        deletingStudent &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-sm p-5 space-y-4">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Delete Student?</h2>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Are you sure you want to remove <strong className="text-slate-900 dark:text-white">{formatStudentName(deletingStudent)}</strong> ({deletingStudent.studentNumber}) from the global directory? This will also remove their subject enrollments.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeletingStudent(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteStudent}
                disabled={isSubmitting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Delete Student
              </button>
            </div>
          </div>
          </div>,
          document.body
        )}

      {/* History Modal */}
      {historyStudentId && (
        <StudentAttendanceHistoryModal
          studentId={historyStudentId}
          onClose={() => setHistoryStudentId(null)}
        />
      )}

      {/* Floating Action Button Speed Dial (Mobile View) */}
      {isMounted &&
        createPortal(
          <div ref={fabRef} className="sm:hidden fixed bottom-20 right-5 z-50 flex flex-col items-end gap-2.5">
            {isFabOpen && (
              <div className="flex flex-col items-end gap-2 animate-in fade-in slide-in-from-bottom-3 duration-150">
                {/* Import CSV Option */}
                <label className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 dark:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-xl cursor-pointer active:scale-95 transition-all border border-slate-700/50">
                  <Upload className="w-4 h-4 text-blue-400" />
                  <span>Import CSV</span>
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    onChange={(e) => {
                      setIsFabOpen(false);
                      handleImportCsv(e);
                    }}
                    disabled={isSubmitting}
                    className="hidden"
                  />
                </label>

                {/* Add Student Option */}
                <button
                  onClick={() => {
                    setIsFabOpen(false);
                    handleOpenAddModal();
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xl cursor-pointer active:scale-95 transition-all"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Add Student</span>
                </button>
              </div>
            )}

            <button
              onClick={() => setIsFabOpen(!isFabOpen)}
              aria-label="Student action menu"
              title="Student action menu"
              className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white w-14 h-14 rounded-full shadow-xl shadow-blue-600/30 flex items-center justify-center cursor-pointer transition-transform duration-200"
            >
              <Plus className={`w-6 h-6 transition-transform duration-200 ${isFabOpen ? "rotate-45" : ""}`} />
            </button>
          </div>,
          document.body
        )}
    </div>
  );
}
