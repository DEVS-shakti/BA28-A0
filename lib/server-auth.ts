import "server-only";

import { cookies } from "next/headers";
import { SESSION_COOKIE } from "./auth-constants";
import { getAdminAuth } from "./firebase-admin";
import { getUserProfile, type UserProfile } from "./server-repositories";

export type SessionUser = {
  uid: string;
  email: string | null;
  profile: UserProfile;
};

export async function getSessionUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const decoded = await getAdminAuth().verifySessionCookie(token, true);
    const profile = await getUserProfile(decoded.uid);
    if (!profile) return null;
    return { uid: decoded.uid, email: typeof decoded.email === "string" ? decoded.email : profile.email, profile };
  } catch {
    return null;
  }
}

export async function requireSession(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireSession();
  if (user.profile.role !== "admin") throw new Error("FORBIDDEN");
  return user;
}

export async function requireApprovedStudent(): Promise<SessionUser> {
  const user = await requireSession();
  if (user.profile.role !== "student" || !user.profile.studentId) throw new Error("FORBIDDEN");
  return user;
}
