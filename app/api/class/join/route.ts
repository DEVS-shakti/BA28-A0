import { NextResponse } from "next/server";
import { CLASS_ID } from "@/lib/auth-constants";
import { verifyClassAccessCode } from "@/lib/class-code";
import { FirebaseAdminConfigError, getAdminDb } from "@/lib/firebase-admin";
import { createPendingEnrollment } from "@/lib/server-repositories";
import { getSessionUser } from "@/lib/server-auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Sign in before joining a class." }, { status: 401 });
  if (session.profile.role !== "student") return NextResponse.json({ error: "This account cannot submit a student enrollment." }, { status: 403 });
  if (session.profile.studentId) return NextResponse.json({ error: "This account is already linked to an approved student record." }, { status: 409 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Enter the class access code." }, { status: 400 });
  }
  const code = body && typeof body === "object" && "code" in body && typeof body.code === "string" ? body.code.trim() : "";
  if (code.length < 6 || code.length > 128) return NextResponse.json({ error: "Unable to validate that class code." }, { status: 400 });

  try {
    const classSnapshot = await getAdminDb().collection("classes").doc(CLASS_ID).get();
    const classData = classSnapshot.data();
    const valid = classSnapshot.exists && classData?.codeEnabled === true && typeof classData.codeHash === "string" && verifyClassAccessCode(code, classData.codeHash);
    if (!valid) return NextResponse.json({ error: "Unable to validate that class code." }, { status: 400 });
    const enrollment = await createPendingEnrollment(session.uid);
    return NextResponse.json({ ok: true, status: enrollment.status }, { status: 201 });
  } catch (error) {
    if (error instanceof FirebaseAdminConfigError) return NextResponse.json({ error: "Enrollment service is not configured." }, { status: 503 });
    return NextResponse.json({ error: "Unable to submit the enrollment request." }, { status: 500 });
  }
}
