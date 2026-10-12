import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server-auth";
import { getAuthorizedStudentOverview } from "@/lib/server-academic-repositories";

export const runtime = "nodejs";

export async function GET() {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if (session.profile.role !== "student" || !session.profile.studentId) return NextResponse.json({ error: "Approved enrollment is required." }, { status: 403 });

  const overview = await getAuthorizedStudentOverview(session.uid, session.profile.studentId);
  if (!overview) return NextResponse.json({ error: "Student record is unavailable." }, { status: 404 });
  return NextResponse.json(overview);
}
