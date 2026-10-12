import { NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { CLASS_ID } from "@/lib/auth-constants";
import { FirebaseAdminConfigError, getAdminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/server-auth";
import { appendAuditLog } from "@/lib/server-repositories";
import { recalculateRankingSnapshot } from "@/lib/server-ranking-repository";

export const runtime = "nodejs";

export async function POST(_request: Request, context: { params: Promise<{ testId: string }> }) {
  try {
    const admin = await requireAdmin();
    const { testId } = await context.params;
    const db = getAdminDb();
    const testRef = db.collection("tests").doc(testId);
    const testSnapshot = await testRef.get();
    const test = testSnapshot.data();
    if (!testSnapshot.exists || test?.classId !== CLASS_ID) return NextResponse.json({ error: "Test not found." }, { status: 404 });
    if (test.publicationStatus === "published") return NextResponse.json({ error: "This test is already published." }, { status: 409 });
    const resultSnapshot = await db.collection("results").where("testId", "==", testId).get();
    if (resultSnapshot.empty) return NextResponse.json({ error: "A test must have reviewed results before publication." }, { status: 400 });
    const unreviewed = resultSnapshot.docs.find((result) => !["completed", "absent", "exempt"].includes(String(result.data().status)));
    if (unreviewed) return NextResponse.json({ error: "Every result must be completed, explicitly absent, or explicitly exempt before publication." }, { status: 400 });

    const batch = db.batch();
    batch.update(testRef, { publicationStatus: "published", updatedAt: Timestamp.now() });
    for (const result of resultSnapshot.docs) batch.update(result.ref, { public: true, publicationStatus: "published", updatedAt: Timestamp.now() });
    const historyRef = db.collection("publicationHistory").doc();
    batch.create(historyRef, { testId, action: "publish", version: Number(test.publicationVersion ?? 0) + 1, summary: { resultCount: resultSnapshot.size }, actorUid: admin.uid, createdAt: Timestamp.now() });
    await batch.commit();
    await recalculateRankingSnapshot();
    await appendAuditLog({ actorUid: admin.uid, action: "test.published", targetType: "test", targetId: testId, metadata: { resultCount: resultSnapshot.size, publicationHistoryId: historyRef.id } });
    return NextResponse.json({ ok: true, status: "published", resultCount: resultSnapshot.size });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    if (error instanceof Error && error.message === "FORBIDDEN") return NextResponse.json({ error: "Administrator access is required." }, { status: 403 });
    if (error instanceof FirebaseAdminConfigError) return NextResponse.json({ error: "Publication service is not configured." }, { status: 503 });
    return NextResponse.json({ error: "Unable to publish this test." }, { status: 400 });
  }
}
