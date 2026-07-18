export type Semester = "1st" | "2nd";

// Calendar-year semesters: Jan–Jun = 1st, Jul–Dec = 2nd.
export function getCurrentTerm(date: Date = new Date()): {
  year: number;
  semester: Semester;
} {
  return {
    year: date.getFullYear(),
    semester: date.getMonth() < 6 ? "1st" : "2nd",
  };
}
