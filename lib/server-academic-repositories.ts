import "server-only";

import { CLASS_ID } from "./auth-constants";
import { getAdminDb } from "./firebase-admin";

export type AuthorizedTestSummary = {
  id: string;
  name: string;
  date: string | null;
  category: string | null;
  subjects: string[];
  overallMaxMarks: number | null;
};

export type AuthorizedResultSummary = {
  testId: string;
  status: "completed" | "absent" | "exempt" | "pending";
  marks: number | null;
  maxMarks: number | null;
  percentage: number | null;
};

export type AuthorizedStudentOverview = {
  student: { id: string; name: string };
  tests: AuthorizedTestSummary[];
  results: AuthorizedResultSummary[];
};

function dateValue(value: unknown): string | null {
  if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function") return value.toDate().toISOString();
  return typeof value === "string" ? value : null;
}

function statusValue(value: unknown): AuthorizedResultSummary["status"] {
  return value === "absent" || value === "exempt" || value === "pending" ? value : "completed";
}

export async function getAuthorizedStudentOverview(uid: string, studentId: string): Promise<AuthorizedStudentOverview | null> {
  const db = getAdminDb();
  const studentSnapshot = await db.collection("students").doc(studentId).get();
  const student = studentSnapshot.data();
  if (!studentSnapshot.exists || student?.classId !== CLASS_ID || student.userId !== uid || student.verified !== true) return null;

  const [testsSnapshot, resultsSnapshot] = await Promise.all([
    db.collection("tests").where("classId", "==", CLASS_ID).get(),
    db.collection("results").where("userId", "==", uid).get(),
  ]);

  const tests = testsSnapshot.docs
    .map((document) => {
      const data = document.data();
      if (data.publicationStatus !== "published") return null;
      return {
        id: document.id,
        name: typeof data.name === "string" ? data.name : "Published test",
        date: dateValue(data.date),
        category: typeof data.category === "string" ? data.category : null,
        subjects: Array.isArray(data.subjects) ? data.subjects.filter((subject): subject is string => typeof subject === "string") : [],
        overallMaxMarks: typeof data.overallMaxMarks === "number" ? data.overallMaxMarks : null,
      } satisfies AuthorizedTestSummary;
    })
    .filter((value): value is AuthorizedTestSummary => value !== null);

  const results = resultsSnapshot.docs
    .map((document) => {
      const data = document.data();
      if (data.classId !== CLASS_ID || typeof data.testId !== "string" || !tests.some((test) => test.id === data.testId)) return null;
      const status = statusValue(data.status);
      return {
        testId: data.testId,
        status,
        marks: status === "completed" && typeof data.marks === "number" ? data.marks : null,
        maxMarks: typeof data.maxMarks === "number" ? data.maxMarks : null,
        percentage: status === "completed" && typeof data.percentage === "number" ? data.percentage : null,
      } satisfies AuthorizedResultSummary;
    })
    .filter((value): value is AuthorizedResultSummary => value !== null);

  return { student: { id: studentId, name: typeof student.name === "string" ? student.name : "Student" }, tests, results };
}
