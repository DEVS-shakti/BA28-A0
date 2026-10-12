export type RankingStatus = "completed" | "absent" | "exempt" | "pending";

export type RankedRow = {
  studentId: string;
  score: number;
  rank: number | null;
};

export type CumulativeInput = {
  studentId: string;
  results: Record<string, { status: RankingStatus; percentage?: number | null }>;
};

export type CumulativeRow = {
  studentId: string;
  score: number;
  eligible: number;
  completed: number;
  absences: number;
  exemptions: number;
  pending: number;
  official: boolean;
  rank: number | null;
};

export function rankRows<T extends { studentId: string }>(rows: T[], scoreOf: (row: T) => number): Array<T & { score: number; rank: number }> {
  const sorted = rows.map((row) => ({ row, score: scoreOf(row) })).sort((a, b) => b.score - a.score || a.row.studentId.localeCompare(b.row.studentId));
  let previousScore: number | null = null;
  let previousRank = 0;
  return sorted.map((entry, index) => {
    const rank = previousScore === entry.score ? previousRank : index + 1;
    previousScore = entry.score;
    previousRank = rank;
    return { ...entry.row, score: entry.score, rank };
  });
}

export function calculateCumulative(input: CumulativeInput[], publishedTestIds: string[], minimumCompleted = 3): CumulativeRow[] {
  const rows = input.map((student) => {
    let total = 0;
    let eligible = 0;
    let completed = 0;
    let absences = 0;
    let exemptions = 0;
    let pending = 0;
    for (const testId of publishedTestIds) {
      const result = student.results[testId];
      if (!result || result.status === "pending") {
        if (result?.status === "pending") pending += 1;
        continue;
      }
      if (result.status === "exempt") {
        exemptions += 1;
        continue;
      }
      eligible += 1;
      if (result.status === "absent") {
        absences += 1;
        continue;
      }
      if (result.status === "completed" && typeof result.percentage === "number" && Number.isFinite(result.percentage)) {
        completed += 1;
        total += result.percentage;
      }
    }
    const score = eligible ? Math.round((total / eligible) * 100) / 100 : 0;
    return { studentId: student.studentId, score, eligible, completed, absences, exemptions, pending, official: completed >= minimumCompleted, rank: null };
  });
  const official = rankRows(rows.filter((row) => row.official).map((row) => ({ studentId: row.studentId, value: row.score })), (row) => row.value);
  const rankByStudent = new Map(official.map((row) => [row.studentId, row.rank]));
  return rows.sort((a, b) => b.score - a.score || a.studentId.localeCompare(b.studentId)).map((row) => ({ ...row, rank: rankByStudent.get(row.studentId) ?? null }));
}
