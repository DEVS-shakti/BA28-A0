export type Subject = "Physics" | "Chemistry" | "Mathematics";
export type ResultStatus = "completed" | "absent" | "exempt" | "pending";

export type Student = {
  id: string;
  name: string;
  fatherName: string;
  verified: boolean;
  joinedAt: string;
  email: string;
  status: "approved" | "pending";
};

export type Test = {
  id: string;
  name: string;
  date: string;
  category: "Subject test" | "Combined PCM" | "JEE-style mock";
  subjects: Subject[];
  maxMarks: number;
  status: "published" | "draft" | "review";
  participants: number;
  average: number;
  source: string;
};

export type Result = {
  testId: string;
  studentId: string;
  marks: number;
  maxMarks: number;
  percentage: number;
  status: ResultStatus;
  subjectMarks: Partial<Record<Subject, number>>;
};

// Deliberately empty in production. Real student records must come from the
// authorized Firebase repository and must never be bundled as fixtures.
export const students: Student[] = [];

export const tests: Test[] = [];

export const results: Result[] = [];

// Sentinel only for legacy UI type compatibility. It is never an authorized
// identity and must not be rendered as a real student record.
export const currentStudent: Student = { id: "__unauthenticated__", name: "Authenticated student", fatherName: "", verified: false, joinedAt: "", email: "", status: "pending" };
export const classStats = { students: 0, publishedTests: 0, average: null as number | null, participation: null as number | null };
export const demoMode = false;

export function getResult(studentId: string, testId: string) { return results.find((result) => result.studentId === studentId && result.testId === testId); }
export function getTest(testId: string): Test { const test = tests.find((candidate) => candidate.id === testId); if (!test) throw new Error("Requested test is unavailable"); return test; }
export function getStudent(studentId: string): Student { const student = students.find((candidate) => candidate.id === studentId); if (!student) throw new Error("Requested student is unavailable"); return student; }
