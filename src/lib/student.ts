export interface StudentNameInput {
  lastName: string;
  firstName: string;
  middleInitial?: string | null;
}

/**
 * Formats a student's name into standard display format:
 * "Lastname, Firstname Middle Initial" (e.g. "Dela Cruz, Juan A.")
 */
export function formatStudentName(student: StudentNameInput): string {
  const mi = student.middleInitial?.trim()
    ? ` ${student.middleInitial.trim().replace(/\.$/, "")}.`
    : "";
  return `${student.lastName.trim()}, ${student.firstName.trim()}${mi}`;
}
