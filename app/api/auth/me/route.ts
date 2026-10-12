import { NextResponse } from "next/server";
import { getEnrollment } from "@/lib/server-repositories";
import { getSessionUser } from "@/lib/server-auth";

export const runtime = "nodejs";

export async function GET() {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const enrollment = session.profile.role === "student" ? await getEnrollment(session.uid) : null;
  return NextResponse.json({
    uid: session.uid,
    email: session.email,
    role: session.profile.role,
    classId: session.profile.classId,
    studentId: session.profile.studentId,
    enrollmentStatus: session.profile.enrollmentStatus ?? enrollment?.status ?? null,
  });
}
