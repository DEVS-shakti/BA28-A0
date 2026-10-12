import { NextResponse } from "next/server";
import { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from "@/lib/auth-constants";
import { FirebaseAdminConfigError, getAdminAuth } from "@/lib/firebase-admin";
import { ensureStudentProfile } from "@/lib/server-repositories";

export const runtime = "nodejs";

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
  };
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const idToken = body && typeof body === "object" && "idToken" in body && typeof body.idToken === "string" ? body.idToken : "";
  if (!idToken || idToken.length > 20_000) return NextResponse.json({ error: "Invalid sign-in request." }, { status: 400 });

  try {
    const decoded = await getAdminAuth().verifyIdToken(idToken, true);
    const email = typeof decoded.email === "string" ? decoded.email : null;
    const profile = await ensureStudentProfile(decoded.uid, email);
    const sessionCookie = await getAdminAuth().createSessionCookie(idToken, { expiresIn: SESSION_MAX_AGE_SECONDS * 1000 });
    const response = NextResponse.json({ ok: true, role: profile.role, needsEnrollment: profile.role === "student" && !profile.studentId });
    response.cookies.set(SESSION_COOKIE, sessionCookie, { ...cookieOptions(), maxAge: SESSION_MAX_AGE_SECONDS });
    return response;
  } catch (error) {
    if (error instanceof FirebaseAdminConfigError) return NextResponse.json({ error: "Authentication service is not configured." }, { status: 503 });
    return NextResponse.json({ error: "Unable to sign in with those credentials." }, { status: 401 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", { ...cookieOptions(), maxAge: 0 });
  return response;
}
