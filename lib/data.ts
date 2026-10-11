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

export const students: Student[] = [
  ["Aadya Lodha", "Sujit Lodha"], ["Aasi Mehta", "Jivitendra Kumar"], ["Aastha Singh", "Shashi Kant Singh"],
  ["Abhinav Tiwari", "Raghwendra Kumar Tiwari"], ["Adarsh Kumar", "Rupesh Kumar"], ["Aman Kumar Sah", "Ajay Kumar Sah"],
  ["Aman Kushwaha", "Nirmal Mahto"], ["Ananaya Kumari", "Santosh Kumar"], ["Anant Utkarsh", "Deo Shankar"],
  ["Aniket Kumar", "Narayan Mahto"], ["Ashwinjeet Singh", "Late Amarjeet Kumar"], ["Durga Rani Yadav", "Dhaneshwar Yadav"],
  ["Gaurav Mondal", "Sunil Kumar Mondal"], ["Inika Ranjan", "Rajeev Ranjan"], ["Kanishka Poddar", "Mrinal Poddar"],
  ["Mitali Rani", "Kishore Kumar Agrawal"], ["Nayan Gupta", "Jay Prakash Gupta"], ["Raushan Raj", "Durgesh Kumar Pandey"],
  ["Rohit Raj", "Rajendra Prasad"], ["Samanyu Singh", "Samanth Kumar Singh"], ["Shakti Raj Sahu", "Jai Prakash Sahu"],
  ["Shaurya Anant", "Rajesh Kumar"], ["Shaurya Keshri", "Santosh Kumar Keshri"], ["Sourav Bharti", "Jitendra Prasad Verma"],
  ["Tanzeel Firoz", "Mohammad Firoz"], ["Tejas Agarwal", "Rehati Raman"], ["Vaibhav Agarwal", "Vikash Agarwal"],
].map(([name, fatherName], index) => ({
  id: `BA28A0-${String(index + 1).padStart(3, "0")}`,
  name,
  fatherName,
  verified: ![3, 9, 21].includes(index),
  joinedAt: index < 24 ? "2026-06-12" : "2026-06-18",
  email: `${name.toLowerCase().replace(/[^a-z]+/g, ".")}@student.classrank.demo`,
  status: "approved" as const,
}));

export const tests: Test[] = [
  { id: "test-pcm-04", name: "PCM Weekly Sprint 04", date: "2026-09-28", category: "Combined PCM", subjects: ["Physics", "Chemistry", "Mathematics"], maxMarks: 300, status: "published", participants: 25, average: 68.4, source: "Spreadsheet import · Sep 28" },
  { id: "test-phy-03", name: "Physics · Electrostatics", date: "2026-09-21", category: "Subject test", subjects: ["Physics"], maxMarks: 100, status: "published", participants: 26, average: 71.2, source: "Manual entry · Sep 21" },
  { id: "test-jee-02", name: "JEE Pattern Mock 02", date: "2026-09-14", category: "JEE-style mock", subjects: ["Physics", "Chemistry", "Mathematics"], maxMarks: 300, status: "published", participants: 24, average: 62.8, source: "OCR review · Sep 14" },
  { id: "test-math-02", name: "Mathematics · Functions", date: "2026-09-07", category: "Subject test", subjects: ["Mathematics"], maxMarks: 100, status: "published", participants: 27, average: 74.6, source: "Spreadsheet import · Sep 07" },
  { id: "test-chem-01", name: "Chemistry · Atomic Structure", date: "2026-08-29", category: "Subject test", subjects: ["Chemistry"], maxMarks: 100, status: "published", participants: 24, average: 66.1, source: "Manual entry · Aug 29" },
  { id: "test-draft-05", name: "PCM Weekly Sprint 05", date: "2026-10-06", category: "Combined PCM", subjects: ["Physics", "Chemistry", "Mathematics"], maxMarks: 300, status: "review", participants: 0, average: 0, source: "Draft import · Oct 06" },
];

const score = (studentIndex: number, testIndex: number, max: number) => Math.min(max, Math.round(max * (0.45 + ((studentIndex * 17 + testIndex * 23) % 50) / 100)));
export const results: Result[] = tests.flatMap((test, testIndex) => students.map((student, studentIndex) => {
  const absent = (studentIndex + testIndex * 3) % 19 === 0;
  const exempt = testIndex === 4 && studentIndex === 6;
  const marks = absent || exempt ? 0 : score(studentIndex, testIndex, test.maxMarks);
  return { testId: test.id, studentId: student.id, marks, maxMarks: test.maxMarks, percentage: Math.round((marks / test.maxMarks) * 1000) / 10, status: absent ? "absent" : exempt ? "exempt" : test.status === "published" ? "completed" : "pending", subjectMarks: test.subjects.reduce((acc, subject, subjectIndex) => ({ ...acc, [subject]: absent || exempt ? 0 : Math.min(100, score(studentIndex + subjectIndex, testIndex, test.subjects.length === 1 ? 100 : 100)) }), {}), };
}));

export const currentStudent = students[0];
export const classStats = { students: 27, publishedTests: 5, average: 68.4, participation: 93 };
export const demoMode = true;

export function getResult(studentId: string, testId: string) { return results.find((result) => result.studentId === studentId && result.testId === testId); }
export function getTest(testId: string) { return tests.find((test) => test.id === testId) ?? tests[0]; }
export function getStudent(studentId: string) { return students.find((student) => student.id === studentId) ?? currentStudent; }
