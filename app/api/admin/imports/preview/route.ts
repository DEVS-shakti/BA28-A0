import { NextResponse } from "next/server";
import { CLASS_ID } from "@/lib/auth-constants";
import { FirebaseAdminConfigError, getAdminDb } from "@/lib/firebase-admin";
import { MAX_IMPORT_BYTES, parseSpreadsheet } from "@/lib/import-service";
import { requireAdmin } from "@/lib/server-auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const form = await request.formData();
    const file = form.get("file");
    const testId = typeof form.get("testId") === "string" ? String(form.get("testId")) : "";
    if (!(file instanceof File) || !testId) return NextResponse.json({ error: "Choose a test and a CSV/XLSX file." }, { status: 400 });
    if (file.size > MAX_IMPORT_BYTES) return NextResponse.json({ error: "File exceeds the 10 MB import limit." }, { status: 413 });

    const testSnapshot = await getAdminDb().collection("tests").doc(testId).get();
    const test = testSnapshot.data();
    if (!testSnapshot.exists || test?.classId !== CLASS_ID || test.publicationStatus === "published") return NextResponse.json({ error: "Only an existing unpublished BA-28A0 test can receive a draft import." }, { status: 400 });
    const maxMarks = typeof test.overallMaxMarks === "number" ? test.overallMaxMarks : typeof test.maxMarks === "number" ? test.maxMarks : 0;
    if (maxMarks <= 0) return NextResponse.json({ error: "The selected test has no valid maximum marks." }, { status: 400 });
    const studentSnapshot = await getAdminDb().collection("students").where("classId", "==", CLASS_ID).get();
    const knownStudentIds = new Set(studentSnapshot.docs.filter((student) => student.data().verified === true).map((student) => student.id));
    const preview = await parseSpreadsheet(Buffer.from(await file.arrayBuffer()), file.name, knownStudentIds, maxMarks);
    return NextResponse.json({ testId, maxMarks, ...preview });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    if (error instanceof Error && error.message === "FORBIDDEN") return NextResponse.json({ error: "Administrator access is required." }, { status: 403 });
    if (error instanceof FirebaseAdminConfigError) return NextResponse.json({ error: "Import service is not configured." }, { status: 503 });
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to preview the import." }, { status: 400 });
  }
}
