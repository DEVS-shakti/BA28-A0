import { NextResponse } from "next/server";
import { CLASS_ID } from "@/lib/auth-constants";
import { FirebaseAdminConfigError, getAdminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/server-auth";
import { appendAuditLog } from "@/lib/server-repositories";

export const runtime = "nodejs";

export async function POST(_request: Request, context: { params: Promise<{ importId: string }> }) {
  try {
    const admin = await requireAdmin();
    const { importId } = await context.params;
    const db = getAdminDb();
    const importRef = db.collection("imports").doc(importId);
    const importSnapshot = await importRef.get();
    const importData = importSnapshot.data();
    if (!importSnapshot.exists || importData?.classId !== CLASS_ID) return NextResponse.json({ error: "Import draft not found." }, { status: 404 });
    if (importData.status !== "draft") return NextResponse.json({ error: "Only a draft import can be applied." }, { status: 409 });
    if (importData.errorCount > 0) return NextResponse.json({ error: "Resolve or exclude every validation error before applying the import." }, { status: 400 });

    const testRef = db.collection("tests").doc(String(importData.testId));
    const testSnapshot = await testRef.get();
    if (!testSnapshot.exists || testSnapshot.data()?.publicationStatus === "published") return NextResponse.json({ error: "Published tests cannot be overwritten by an import." }, { status: 409 });
    const testData = testSnapshot.data() ?? {};
    const maxMarks = typeof testData.overallMaxMarks === "number" ? testData.overallMaxMarks : typeof testData.maxMarks === "number" ? testData.maxMarks : 0;
    if (!Number.isFinite(maxMarks) || maxMarks <= 0) return NextResponse.json({ error: "The selected test has no valid maximum marks." }, { status: 400 });
    const rowSnapshot = await importRef.collection("rows").get();
    const batch = db.batch();
    let applied = 0;
    for (const rowDocument of rowSnapshot.docs) {
      const row = rowDocument.data();
      if (row.valid !== true || typeof row.studentId !== "string" || typeof row.marks !== "number") continue;
      const resultRef = db.collection("results").doc(`${importData.testId}_${row.studentId}`);
      const existing = await resultRef.get();
      if (existing.exists && existing.data()?.publicationStatus === "published") return NextResponse.json({ error: `Published result for ${row.studentId} cannot be overwritten.` }, { status: 409 });
      const studentSnapshot = await db.collection("students").doc(row.studentId).get();
      if (!studentSnapshot.exists || studentSnapshot.data()?.classId !== CLASS_ID || studentSnapshot.data()?.verified !== true) return NextResponse.json({ error: `Approved student record ${row.studentId} is unavailable.` }, { status: 400 });
      const student = studentSnapshot.data() ?? {};
      batch.set(resultRef, { classId: CLASS_ID, testId: importData.testId, studentId: row.studentId, userId: typeof student.userId === "string" ? student.userId : null, status: "completed", marks: row.marks, maxMarks, percentage: Math.round((row.marks / maxMarks) * 10000) / 100, public: false, publicationStatus: "draft", sourceImportId: importId, correctionVersion: existing.exists ? (existing.data()?.correctionVersion ?? 0) + 1 : 0, updatedAt: new Date() }, { merge: true });
      applied += 1;
    }
    if (applied === 0) return NextResponse.json({ error: "The import has no valid rows to apply." }, { status: 400 });
    batch.update(importRef, { status: "applied", reviewedAt: new Date(), reviewedBy: admin.uid, appliedCount: applied });
    batch.update(testRef, { publicationStatus: "review", updatedAt: new Date() });
    await batch.commit();
    await appendAuditLog({ actorUid: admin.uid, action: "import.applied", targetType: "import", targetId: importId, metadata: { testId: importData.testId, applied } });
    return NextResponse.json({ ok: true, status: "applied", applied });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    if (error instanceof Error && error.message === "FORBIDDEN") return NextResponse.json({ error: "Administrator access is required." }, { status: 403 });
    if (error instanceof FirebaseAdminConfigError) return NextResponse.json({ error: "Import service is not configured." }, { status: 503 });
    return NextResponse.json({ error: "Unable to apply the import draft." }, { status: 400 });
  }
}
