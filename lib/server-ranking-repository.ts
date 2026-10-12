import "server-only";

import { Timestamp } from "firebase-admin/firestore";
import { CLASS_ID } from "./auth-constants";
import { getAdminDb } from "./firebase-admin";
import { calculateCumulative } from "./ranking-engine";

export async function recalculateRankingSnapshot() {
  const db = getAdminDb();
  const [testSnapshot, studentSnapshot, resultSnapshot] = await Promise.all([
    db.collection("tests").where("classId", "==", CLASS_ID).get(),
    db.collection("students").where("classId", "==", CLASS_ID).get(),
    db.collection("results").where("classId", "==", CLASS_ID).get(),
  ]);
  const publishedTestIds = testSnapshot.docs.filter((test) => test.data().publicationStatus === "published").map((test) => test.id);
  const inputs = studentSnapshot.docs.filter((student) => student.data().verified === true).map((student) => {
    const studentResults = Object.fromEntries(resultSnapshot.docs.filter((result) => result.data().studentId === student.id && publishedTestIds.includes(result.data().testId)).map((result) => [result.data().testId, { status: result.data().status, percentage: result.data().percentage }]));
    return { studentId: student.id, results: studentResults };
  });
  const rows = calculateCumulative(inputs, publishedTestIds);
  const snapshotRef = db.collection("rankingSnapshots").doc(`${CLASS_ID}_${Date.now()}`);
  await snapshotRef.create({ classId: CLASS_ID, policyVersion: "v1.0", publishedTestIds, generatedAt: Timestamp.now(), rows });
  return { snapshotId: snapshotRef.id, rows, publishedTestIds };
}
