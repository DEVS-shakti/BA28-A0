import "server-only";

import { Timestamp } from "firebase-admin/firestore";
import { CLASS_ID } from "./auth-constants";
import { getAdminDb } from "./firebase-admin";

export type UserRole = "admin" | "student";

export type UserProfile = {
  uid: string;
  email: string | null;
  role: UserRole;
  classId?: string;
  studentId?: string;
  enrollmentStatus?: "pending" | "approved" | "rejected";
};

export type Enrollment = {
  id: string;
  classId: string;
  uid: string;
  status: "pending" | "approved" | "rejected";
  claimMethod: "class_code";
  studentId?: string;
};

function roleFrom(value: unknown): UserRole | null {
  return value === "admin" || value === "student" ? value : null;
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snapshot = await getAdminDb().collection("users").doc(uid).get();
  if (!snapshot.exists) return null;
  const data = snapshot.data() ?? {};
  const role = roleFrom(data.role);
  if (!role) return null;
  return {
    uid,
    email: typeof data.email === "string" ? data.email : null,
    role,
    classId: typeof data.classId === "string" ? data.classId : undefined,
    studentId: typeof data.studentId === "string" ? data.studentId : undefined,
    enrollmentStatus: data.enrollmentStatus === "approved" || data.enrollmentStatus === "rejected" ? data.enrollmentStatus : data.enrollmentStatus === "pending" ? "pending" : undefined,
  };
}

export async function ensureStudentProfile(uid: string, email: string | null): Promise<UserProfile> {
  const db = getAdminDb();
  const ref = db.collection("users").doc(uid);
  const existing = await ref.get();
  if (existing.exists) {
    const profile = await getUserProfile(uid);
    if (!profile) throw new Error("Invalid account profile");
    await ref.set({ email, lastSignInAt: Timestamp.now() }, { merge: true });
    return profile;
  }

  await ref.create({ uid, email, role: "student", classId: CLASS_ID, enrollmentStatus: "approved", createdAt: Timestamp.now(), lastSignInAt: Timestamp.now() });
  await db.collection("enrollments").doc(`${CLASS_ID}_${uid}`).set({
    id: `${CLASS_ID}_${uid}`,
    classId: CLASS_ID,
    uid,
    status: "approved",
    claimMethod: "class_code",
    createdAt: Timestamp.now(),
  }, { merge: true });
  return { uid, email, role: "student", classId: CLASS_ID, enrollmentStatus: "approved" };
}

export async function getEnrollment(uid: string): Promise<Enrollment | null> {
  const snapshot = await getAdminDb().collection("enrollments").doc(`${CLASS_ID}_${uid}`).get();
  if (!snapshot.exists) return null;
  const data = snapshot.data() ?? {};
  if (data.uid !== uid || data.classId !== CLASS_ID) return null;
  if (data.status !== "pending" && data.status !== "approved" && data.status !== "rejected") return null;
  return {
    id: snapshot.id,
    classId: CLASS_ID,
    uid,
    status: data.status,
    claimMethod: "class_code",
    studentId: typeof data.studentId === "string" ? data.studentId : undefined,
  };
}

export async function createPendingEnrollment(uid: string): Promise<Enrollment> {
  const db = getAdminDb();
  const id = `${CLASS_ID}_${uid}`;
  const ref = db.collection("enrollments").doc(id);
  const existing = await ref.get();
  if (existing.exists) {
    const current = await getEnrollment(uid);
    if (current) return current;
    throw new Error("Enrollment record is invalid");
  }

  await ref.create({ classId: CLASS_ID, uid, status: "pending", claimMethod: "class_code", createdAt: Timestamp.now() });
  return { id, classId: CLASS_ID, uid, status: "pending", claimMethod: "class_code" };
}

export async function appendAuditLog(entry: { actorUid: string; action: string; targetType: string; targetId: string; metadata?: Record<string, unknown> }) {
  await getAdminDb().collection("auditLogs").add({ ...entry, metadata: entry.metadata ?? {}, createdAt: Timestamp.now() });
}
