import { NextResponse } from "next/server";
import { CLASS_ID } from "@/lib/auth-constants";
import { FirebaseAdminConfigError, getAdminDb, getAdminStorage } from "@/lib/firebase-admin";
import { MAX_IMPORT_BYTES, parseSpreadsheet } from "@/lib/import-service";
import { requireAdmin } from "@/lib/server-auth";
import { appendAuditLog } from "@/lib/server-repositories";

export const runtime = "nodejs";

function safeFilename(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100) || "upload.xlsx";
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    const form = await request.formData();
    const file = form.get("file");
    const testId = typeof form.get("testId") === "string" ? String(form.get("testId")) : "";
    if (!(file instanceof File) || !testId) return NextResponse.json({ error: "Choose a test and a CSV/XLSX file." }, { status: 400 });
    if (file.size > MAX_IMPORT_BYTES) return NextResponse.json({ error: "File exceeds the 10 MB import limit." }, { status: 413 });

    const db = getAdminDb();
    const testSnapshot = await db.collection("tests").doc(testId).get();
    const test = testSnapshot.data();
    if (!testSnapshot.exists || test?.classId !== CLASS_ID || test.publicationStatus === "published") return NextResponse.json({ error: "Only an existing unpublished BA-28A0 test can receive a draft import." }, { status: 400 });
    const maxMarks = typeof test.overallMaxMarks === "number" ? test.overallMaxMarks : typeof test.maxMarks === "number" ? test.maxMarks : 0;
    if (maxMarks <= 0) return NextResponse.json({ error: "The selected test has no valid maximum marks." }, { status: 400 });
    const buffer = Buffer.from(await file.arrayBuffer());
    const studentSnapshot = await db.collection("students").where("classId", "==", CLASS_ID).get();
    const preview = await parseSpreadsheet(buffer, file.name, new Set(studentSnapshot.docs.filter((student) => student.data().verified === true).map((student) => student.id)), maxMarks);
    const importId = `${CLASS_ID}_${testId}_${preview.sourceHash.slice(0, 24)}`;
    const importRef = db.collection("imports").doc(importId);
    if ((await importRef.get()).exists) return NextResponse.json({ error: "This exact source file has already been submitted for this test." }, { status: 409 });

    const filename = safeFilename(file.name);
    const storagePath = `imports/${CLASS_ID}/${testId}/${preview.sourceHash}/${filename}`;
    await getAdminStorage().bucket().file(storagePath).save(buffer, { resumable: false, metadata: { contentType: file.type || "application/octet-stream", metadata: { importId, createdBy: admin.uid } } });
    const batch = db.batch();
    batch.create(importRef, { classId: CLASS_ID, testId, kind: "spreadsheet", storagePath, originalFilename: filename, sourceHash: preview.sourceHash, status: "draft", createdBy: admin.uid, rowCount: preview.rows.length, validCount: preview.validCount, warningCount: preview.warningCount, errorCount: preview.errorCount, createdAt: new Date() });
    for (const row of preview.rows) batch.create(importRef.collection("rows").doc(String(row.rowNumber)), row);
    for (const row of preview.rows.filter((candidate) => candidate.errors.length > 0)) for (const message of row.errors) batch.create(importRef.collection("errors").doc(`${row.rowNumber}_${Buffer.from(message).toString("hex").slice(0, 16)}`), { importId, rowNumber: row.rowNumber, studentId: row.studentId || null, code: "VALIDATION_ERROR", severity: "error", message, rawValue: row.marks, resolved: false });
    await batch.commit();
    await appendAuditLog({ actorUid: admin.uid, action: "import.created", targetType: "import", targetId: importId, metadata: { testId, sourceHash: preview.sourceHash, errorCount: preview.errorCount } });
    return NextResponse.json({ ok: true, importId, status: "draft", ...preview }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    if (error instanceof Error && error.message === "FORBIDDEN") return NextResponse.json({ error: "Administrator access is required." }, { status: 403 });
    if (error instanceof FirebaseAdminConfigError) return NextResponse.json({ error: "Import service is not configured." }, { status: 503 });
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create the import draft." }, { status: 400 });
  }
}
