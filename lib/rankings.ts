import { results, students, tests } from "./data";

export function competitionRank(values: number[]) {
  const sorted = [...values].sort((a, b) => b - a);
  return values.map((value) => sorted.indexOf(value) + 1);
}

export function testRanking(testId: string) {
  const rows = results.filter((result) => result.testId === testId && result.status === "completed").map((result) => ({ ...result, student: students.find((student) => student.id === result.studentId)! }));
  const ranks = competitionRank(rows.map((row) => row.percentage));
  return rows.sort((a, b) => b.percentage - a.percentage).map((row, index) => ({ ...row, rank: ranks[rows.indexOf(row)] ?? index + 1 }));
}

export function cumulativeRanking() {
  const published = tests.filter((test) => test.status === "published");
  const rows = students.map((student) => {
    const studentResults = results.filter((result) => result.studentId === student.id && published.some((test) => test.id === result.testId));
    const eligible = studentResults.filter((result) => result.status !== "exempt");
    const completed = eligible.filter((result) => result.status === "completed");
    const score = eligible.length ? eligible.reduce((sum, result) => sum + result.percentage, 0) / eligible.length : 0;
    return { student, score: Math.round(score * 10) / 10, eligible: eligible.length, completed: completed.length, absences: eligible.filter((result) => result.status === "absent").length, official: completed.length >= 3 };
  });
  const officialScores = rows.filter((row) => row.official).map((row) => row.score);
  const ranks = competitionRank(officialScores);
  return rows.sort((a, b) => b.score - a.score).map((row) => ({ ...row, rank: row.official ? ranks[officialScores.indexOf(row.score)] : null }));
}
