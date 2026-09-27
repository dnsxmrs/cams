"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import {
  TrendingUp,
  Users,
  BookOpen,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Search,
} from "lucide-react";
import { getAttendanceReports } from "@/actions/attendance";
import Pagination from "@/app/components/Pagination";

import { formatStudentName } from "@/lib/student";

interface StudentReport {
  id: string;
  studentNumber: string;
  lastName: string;
  firstName: string;
  middleInitial: string | null;
  email: string | null;
  totalRecorded: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  rate: number;
  isAtRisk: boolean;
}

interface SubjectReport {
  id: string;
  code: string;
  name: string;
  enrolledCount: number;
  sessionsCount: number;
  totalRecords: number;
  presentRecords: number;
  rate: number;
}

type RawSubject = {
  id: string;
  code: string;
  name: string;
  enrollments: { id: string }[];
  sessions: {
    records: { status: string }[];
  }[];
};

type RawStudent = {
  id: string;
  studentNumber: string;
  lastName: string;
  firstName: string;
  middleInitial: string | null;
  email: string | null;
  attendances: { status: string }[];
};

export default function AttendanceReportsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [searchStudent, setSearchStudent] = useState("");
  const [subjectReports, setSubjectReports] = useState<SubjectReport[]>([]);
  const [studentReports, setStudentReports] = useState<StudentReport[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    let ignore = false;
    async function loadData() {
      setIsLoading(true);
      const res = await getAttendanceReports();
      if (ignore) return;
      if (res.success && res.data) {
        const { subjects, students } = res.data;

        // Process Subject Reports
        const subRep: SubjectReport[] = (subjects as RawSubject[]).map((sub) => {
          let totalRecords = 0;
          let presentRecords = 0;

          sub.sessions.forEach((sess) => {
            sess.records.forEach((rec) => {
              totalRecords++;
              if (rec.status === "PRESENT" || rec.status === "LATE") {
                presentRecords++;
              }
            });
          });

          const rate = totalRecords > 0 ? Math.round((presentRecords / totalRecords) * 100) : 0;

          return {
            id: sub.id,
            code: sub.code,
            name: sub.name,
            enrolledCount: sub.enrollments.length,
            sessionsCount: sub.sessions.length,
            totalRecords,
            presentRecords,
            rate,
          };
        });

        // Process Student Reports
        const stRep: StudentReport[] = (students as RawStudent[]).map((st) => {
          const totalRecorded = st.attendances.length;
          let presentCount = 0;
          let absentCount = 0;
          let lateCount = 0;
          let excusedCount = 0;

          st.attendances.forEach((att) => {
            if (att.status === "PRESENT") presentCount++;
            else if (att.status === "ABSENT") absentCount++;
            else if (att.status === "LATE") lateCount++;
            else if (att.status === "EXCUSED") excusedCount++;
          });

          const attended = presentCount + lateCount;
          const rate = totalRecorded > 0 ? Math.round((attended / totalRecorded) * 100) : 100;
          const isAtRisk = totalRecorded >= 3 && rate < 80;

          return {
            id: st.id,
            studentNumber: st.studentNumber,
            lastName: st.lastName,
            firstName: st.firstName,
            middleInitial: st.middleInitial,
            email: st.email,
            totalRecorded,
            presentCount,
            absentCount,
            lateCount,
            excusedCount,
            rate,
            isAtRisk,
          };
        });

        setSubjectReports(subRep);
        setStudentReports(stRep);
      } else {
        toast.error(res.error || "Failed to load reports analytics.");
      }
      setIsLoading(false);
    }
    loadData();
    return () => {
      ignore = true;
    };
  }, []);

  const totalSessionsCount = subjectReports.reduce((acc, s) => acc + s.sessionsCount, 0);
  const grandTotalRecords = subjectReports.reduce((acc, s) => acc + s.totalRecords, 0);
  const grandPresentRecords = subjectReports.reduce((acc, s) => acc + s.presentRecords, 0);
  const overallRate = grandTotalRecords > 0 ? Math.round((grandPresentRecords / grandTotalRecords) * 100) : 0;
  const atRiskCount = studentReports.filter((st) => st.isAtRisk).length;

  const filteredStudents = studentReports.filter(
    (st) =>
      formatStudentName(st).toLowerCase().includes(searchStudent.toLowerCase()) ||
      st.studentNumber.toLowerCase().includes(searchStudent.toLowerCase()) ||
      (st.email && st.email.toLowerCase().includes(searchStudent.toLowerCase()))
  );
  const visibleStudents = filteredStudents.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-xs font-bold mb-2 border border-purple-200 dark:border-purple-800">
            <TrendingUp className="w-3.5 h-3.5" /> Summary Analytics
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Attendance Reports & Analytics
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Monitor subject performance, overall attendance rates, and identify at-risk students.
          </p>
        </div>
      </div>

      {/* Analytics Summary Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-4 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
              Overall Rate
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {overallRate}%
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Average attendance rate</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-4 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
              Total Sessions
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {totalSessionsCount}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Recorded roll calls</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-4 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
              Tracked Students
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {studentReports.length}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">In global directory</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-4 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
              At-Risk Students
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">
              {atRiskCount}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Below 80% attendance</p>
          </div>
        </div>
      </div>

      {/* Per-Subject Breakdown */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-2xs space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Per-Subject Performance</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Attendance percentage rate aggregated per course</p>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            <p>Loading analytics data...</p>
          </div>
        ) : subjectReports.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {subjectReports.map((sub) => (
              <div
                key={sub.id}
                className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-4 rounded-xl flex items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                      {sub.code}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      {sub.sessionsCount} Sessions Recorded
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{sub.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {sub.enrolledCount} Enrolled Students
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xl font-extrabold text-slate-900 dark:text-white">
                    {sub.rate}%
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                    Attendance Rate
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-xs">
            <BookOpen className="w-6 h-6 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p>No subjects found for reports.</p>
          </div>
        )}
      </div>

      {/* Per-Student Attendance Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Student Attendance Records</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Individual student attendance percentages and risk status</p>
          </div>

          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search student..."
              value={searchStudent}
              onChange={(e) => {
                setSearchStudent(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-blue-600 text-slate-900 dark:text-white focus:outline-none transition-all"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-2.5 top-2" />
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <p>Loading student analytics...</p>
          </div>
        ) : filteredStudents.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[650px]">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Student ID</th>
                  <th className="py-3.5 px-4">Full Name</th>
                  <th className="py-3.5 px-4">Total Logged</th>
                  <th className="py-3.5 px-4">Present / Absent</th>
                  <th className="py-3.5 px-4">Attendance Rate</th>
                  <th className="py-3.5 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {visibleStudents.map((st) => (
                  <tr key={st.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                      {st.studentNumber}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                      {formatStudentName(st)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 font-medium">
                      {st.totalRecorded} Sessions
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-emerald-600 font-bold">{st.presentCount + st.lateCount} P</span>
                      {" / "}
                      <span className="text-red-600 font-bold">{st.absentCount} A</span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                      {st.rate}%
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {st.isAtRisk ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[10px] font-bold">
                          <AlertTriangle className="w-3 h-3" /> At Risk (&lt;80%)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold">
                          <CheckCircle2 className="w-3 h-3" /> Good Standing
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
              totalItems={filteredStudents.length}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(1);
              }}
            />
          </div>
        ) : (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-xs">
            <p>No student records match search criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}
