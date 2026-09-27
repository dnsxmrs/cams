import { getSubjectAttendanceExportData } from "@/actions/subjects";
import { formatStudentName } from "@/lib/student";
import { toast } from "react-hot-toast";

function escapeCSV(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

export async function exportSubjectAttendanceCSV(subjectId: string, subjectCode: string) {
  try {
    const loadingToast = toast.loading("Generating attendance CSV report...");
    const res = await getSubjectAttendanceExportData(subjectId);
    toast.dismiss(loadingToast);

    if (!res.success || !res.data) {
      toast.error(res.error || "Failed to fetch attendance data for export.");
      return;
    }

    const subject = res.data;
    const enrollments = subject.enrollments || [];
    const sessions = subject.sessions || [];

    if (enrollments.length === 0) {
      toast.error("No enrolled students found in this subject to export.");
      return;
    }

    const rows: string[] = [];

    // Header info rows
    rows.push(`${escapeCSV("Subject Code")},${escapeCSV(subject.code)}`);
    rows.push(`${escapeCSV("Subject Name")},${escapeCSV(subject.name)}`);
    rows.push(`${escapeCSV("Export Date")},${escapeCSV(new Date().toLocaleString())}`);
    rows.push(`${escapeCSV("Total Students")},${escapeCSV(enrollments.length)}`);
    rows.push(`${escapeCSV("Total Sessions")},${escapeCSV(sessions.length)}`);
    rows.push(""); // Blank row separator

    // Table headers
    const headerCols = [
      "Student Number",
      "Student Name",
      "Email",
      ...sessions.map((s) => {
        const dateStr = new Date(s.sessionDate).toLocaleDateString();
        return s.title ? `${dateStr} (${s.title})` : dateStr;
      }),
      "Present",
      "Absent",
      "Late",
      "Excused",
      "Total Marked",
      "Attendance Rate (%)",
    ];
    rows.push(headerCols.map(escapeCSV).join(","));

    // Student rows
    enrollments.forEach((e) => {
      const student = e.student;
      let present = 0;
      let absent = 0;
      let late = 0;
      let excused = 0;

      const sessionStatuses = sessions.map((sess) => {
        const record = sess.records.find((r) => r.studentId === student.id);
        if (!record) return "UNRECORDED";

        switch (record.status) {
          case "PRESENT":
            present++;
            return "PRESENT";
          case "ABSENT":
            absent++;
            return "ABSENT";
          case "LATE":
            late++;
            return "LATE";
          case "EXCUSED":
            excused++;
            return "EXCUSED";
          default:
            return record.status;
        }
      });

      const totalMarked = present + absent + late + excused;
      // Count Present and Late as attended
      const attended = present + late;
      const rate = totalMarked > 0 ? ((attended / totalMarked) * 100).toFixed(1) : "N/A";

      const studentRow = [
        student.studentNumber,
        formatStudentName(student),
        student.email || "N/A",
        ...sessionStatuses,
        present,
        absent,
        late,
        excused,
        totalMarked,
        rate !== "N/A" ? `${rate}%` : "0%",
      ];

      rows.push(studentRow.map(escapeCSV).join(","));
    });

    const csvContent = "\uFEFF" + rows.join("\n"); // UTF-8 BOM for Excel compatibility
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    const sanitizedCode = subjectCode.replace(/[^a-zA-Z0-9_-]/g, "_");
    link.download = `${sanitizedCode}_Attendance_Report_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success("Attendance report downloaded successfully!");
  } catch (error) {
    console.error("Export error:", error);
    toast.error("Failed to generate export file.");
  }
}
