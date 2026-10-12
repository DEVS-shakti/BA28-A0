import assert from "node:assert/strict";
import test from "node:test";
import { calculateCumulative, rankRows } from "../lib/ranking-engine";

test("competition ranking preserves ties and skipped ranks", () => {
  const rows = rankRows([{ studentId: "a", value: 90 }, { studentId: "b", value: 80 }, { studentId: "c", value: 80 }, { studentId: "d", value: 70 }], (row) => row.value);
  assert.deepEqual(rows.map((row) => [row.studentId, row.rank]), [["a", 1], ["b", 2], ["c", 2], ["d", 4]]);
});

test("cumulative ranking handles absence, exemption and threshold", () => {
  const rows = calculateCumulative([
    { studentId: "official", results: { one: { status: "completed", percentage: 90 }, two: { status: "completed", percentage: 80 }, three: { status: "absent" }, four: { status: "exempt" }, five: { status: "completed", percentage: 95 } } },
    { studentId: "provisional", results: { one: { status: "completed", percentage: 100 }, two: { status: "completed", percentage: 100 } } },
  ], ["one", "two", "three", "four", "five"]);
  assert.equal(rows.find((row) => row.studentId === "official")?.score, 66.25);
  assert.equal(rows.find((row) => row.studentId === "official")?.rank, 1);
  assert.equal(rows.find((row) => row.studentId === "official")?.absences, 1);
  assert.equal(rows.find((row) => row.studentId === "official")?.exemptions, 1);
  assert.equal(rows.find((row) => row.studentId === "provisional")?.official, false);
  assert.equal(rows.find((row) => row.studentId === "provisional")?.rank, null);
});

test("pending and missing rows are not silently converted to absence", () => {
  const [row] = calculateCumulative([{ studentId: "pending", results: { one: { status: "pending" } } }], ["one", "two"]);
  assert.equal(row.eligible, 0);
  assert.equal(row.absences, 0);
  assert.equal(row.pending, 1);
});
