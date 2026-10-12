import { NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { CLASS_ID } from "@/lib/auth-constants";
import { FirebaseAdminConfigError, getAdminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/server-auth";
import { appendAuditLog } from "@/lib/server-repositories";
import { recalculateRankingSnapshot } from "@/lib/server-ranking-repository";

export const runtime = "nodejs";

const allowedStatuses = new Set(["completed", "absent", "exempt", "pending"]);

export async function POST(request: Request, context: { params: Promise<{ resultId: string }> }) {
  try {
    const admin = await requireAdmin();
    const { resultId } = await context.params;
    const body = await request.json().catch(() => null) as { marks?: unknown; status?: unknown; reason?: unknown } | null;
    const reason = typeof body?.reason === "string" ? body.reason.trim() : "";
    const status = typeof body?.status === "string" && allowedStatuses.has(body.status) ? body.status : "";
    if (!reason || reason.length < 8 || !status) return NextResponse.json({ error: "A correction reason and valid result status are required." }, { status: 400 });
    const db = getAdminDb();
    const resultRef = db.collection("results").doc(resultId);
    const resultSnapshot = await resultRef.get();
    const before = resultSnapshot.data();
    if (!resultSnapshot.exists || before?.classId !== CLASS_ID) return NextResponse.json({ error: "Result not found." }, { status: 404 });
    const testSnapshot = await db.collection("tests").doc(String(before.testId)).get();
    const test = testSnapshot.data();
    const maxMarks = typeof before.maxMarks === "number" ? before.maxMarks : typeof test?.overallMaxMarks === "number" ? test.overallMaxMarks : typeof test?.maxMarks === "number" ? test.maxMarks : 0;
    const marks = status === "completed" ? (typeof body?.marks === "number" ? body.marks : Number(body?.marks)) : null;
    if (status === "completed" && (!Number.isFinite(maxMarks) || maxMarks <= 0 || marks === null || !Number.isFinite(marks) || marks < 0 || marks > maxMarks)) return NextResponse.json({ error: `Marks must be between 0 and ${maxMarks}.` }, { status: 400 });
    const percentage = status === "completed" && maxMarks > 0 && marks !== null ? Math.round((marks / maxMarks) * 10000) / 100 : null;
    const version = Number(before.correctionVersion ?? 0) + 1;
    const after = { ...before, status, marks, percentage, maxMarks, public: false, publicationStatus: "review", correctionVersion: version, updatedAt: Timestamp.now() };
    const batch = db.batch();
    batch.set(resultRef, after);
    batch.create(db.collection("publicationHistory").doc(), { testId: before.testId, importId: before.sourceImportId ?? null, action: "correction", version, summary: { resultId, reason }, actorUid: admin.uid, createdAt: Timestamp.now() });
    if (testSnapshot.exists && test?.publicationStatus === "published") batch.update(testSnapshot.ref, { publicationStatus: "review", updatedAt: Timestamp.now() });
    await batch.commit();
    await appendAuditLog({ actorUid: admin.uid, action: "result.corrected", targetType: "result", targetId: resultId, metadata: { reason, before: { status: before.status, marks: before.marks, percentage: before.percentage }, after: { status, marks, percentage }, version } });
    await recalculateRankingSnapshot();
    return NextResponse.json({ ok: true, status: "review", correctionVersion: version });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    if (error instanceof Error && error.message === "FORBIDDEN") return NextResponse.json({ error: "Administrator access is required." }, { status: 403 });
    if (error instanceof FirebaseAdminConfigError) return NextResponse.json({ error: "Correction service is not configured." }, { status: 503 });
    return NextResponse.json({ error: "Unable to record this correction." }, { status: 400 });
  }
}
