import { results, students, tests } from "./data";
import { calculateCumulative, rankRows } from "./ranking-engine";

export function competitionRank(values: number[]) {
  const sorted = [...values].sort((a, b) => b - a);
  return values.map((value) => sorted.indexOf(value) + 1);
}

export function testRanking(testId: string) {
  const rows = results.filter((result) => result.testId === testId && result.status === "completed").map((result) => ({ ...result, student: students.find((student) => student.id === result.studentId) })).filter((row): row is typeof row & { student: (typeof students)[number] } => Boolean(row.student));
  return rankRows(rows, (row) => row.percentage);
}

export function cumulativeRanking() {
  const published = tests.filter((test) => test.status === "published");
  const calculated = calculateCumulative(students.map((student) => ({ studentId: student.id, results: Object.fromEntries(results.filter((result) => result.studentId === student.id).map((result) => [result.testId, { status: result.status, percentage: result.percentage }])) })), published.map((test) => test.id));
  return calculated.map((row) => ({ ...row, student: students.find((student) => student.id === row.studentId)! })).filter((row) => Boolean(row.student));
}
