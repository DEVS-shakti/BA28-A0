import { NextResponse } from "next/server";
import { CLASS_ID } from "@/lib/auth-constants";
import { FirebaseAdminConfigError, getAdminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/server-auth";
import { appendAuditLog } from "@/lib/server-repositories";

export const runtime = "nodejs";

function csvCell(value: unknown) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

export async function GET(request: Request) {
  try {
    const admin = await requireAdmin();
    const testId = new URL(request.url).searchParams.get("testId") ?? "";
    if (!testId) return NextResponse.json({ error: "A testId is required." }, { status: 400 });
    const db = getAdminDb();
    const testSnapshot = await db.collection("tests").doc(testId).get();
    const test = testSnapshot.data();
    if (!testSnapshot.exists || test?.classId !== CLASS_ID || test.publicationStatus !== "published") return NextResponse.json({ error: "Only a published BA-28A0 test can be exported." }, { status: 400 });
    const [results, students] = await Promise.all([db.collection("results").where("testId", "==", testId).get(), db.collection("students").where("classId", "==", CLASS_ID).get()]);
    const nameById = new Map(students.docs.map((student) => [student.id, typeof student.data().name === "string" ? student.data().name : "Student"]));
    const lines = ["student_id,student_name,status,marks,max_marks,percentage"];
    for (const result of results.docs) {
      const data = result.data();
      lines.push([data.studentId, nameById.get(data.studentId) ?? "Student", data.status, data.marks, data.maxMarks, data.percentage].map(csvCell).join(","));
    }
    await appendAuditLog({ actorUid: admin.uid, action: "export.results", targetType: "test", targetId: testId, metadata: { resultCount: results.size } });
    return new Response(`${lines.join("\n")}\n`, { status: 200, headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename=classrank-${testId}.csv`, "Cache-Control": "private, no-store" } });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    if (error instanceof Error && error.message === "FORBIDDEN") return NextResponse.json({ error: "Administrator access is required." }, { status: 403 });
    if (error instanceof FirebaseAdminConfigError) return NextResponse.json({ error: "Export service is not configured." }, { status: 503 });
    return NextResponse.json({ error: "Unable to export results." }, { status: 500 });
  }
}
