import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (file) => fs.readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

test("production mode fails closed for protected workspaces", () => {
  const proxy = read("proxy.ts");
  assert.match(proxy, /process\.env\.CLASSRANK_MODE === \"demo\"/);
  assert.match(proxy, /request\.cookies\.has\(SESSION_COOKIE\)/);
  assert.match(proxy, /url\.pathname = \"\/login\"/);
  assert.match(proxy, /\/student\/:path\*/);
  assert.match(proxy, /\/admin\/:path\*/);
});

test("production data boundary contains no seeded records or generated marks", () => {
  const data = read("lib/data.ts");
  const charts = read("components/charts.tsx");
  const shell = read("components/app-shell.tsx");
  assert.match(data, /export const students: Student\[\] = \[\];/);
  assert.match(data, /export const tests: Test\[\] = \[\];/);
  assert.match(data, /export const results: Result\[\] = \[\];/);
  assert.doesNotMatch(data, /studentIndex|testIndex|Math\.min\(max/);
  assert.doesNotMatch(charts, /Aug 29|Class average.*68|participation.*93/);
  assert.doesNotMatch(shell, /Aadya|fatherName|student\.classrank/);
});

test("legacy invalid-record access is an error, not a first-record fallback", () => {
  const data = read("lib/data.ts");
  assert.match(data, /Requested test is unavailable/);
  assert.match(data, /Requested student is unavailable/);
  assert.doesNotMatch(data, /\?\? tests\[0\]/);
  assert.doesNotMatch(data, /\?\? currentStudent/);
});

test("production login has no direct demo workspace bypass", () => {
  const login = read("app/login/page.tsx");
  assert.doesNotMatch(login, /href=\"\/student\"/);
  assert.match(login, /Firebase sign-in unavailable/);
});

test("Firebase rules default-deny client writes and broad reads", () => {
  const firestore = read("firestore.rules");
  const storage = read("storage.rules");
  assert.match(firestore, /match \/\{document=\*\*\}/);
  assert.match(firestore, /allow write: if false;/);
  assert.match(firestore, /publicationStatus == 'published'/);
  assert.match(storage, /match \/\{allPaths=\*\*\}/);
  assert.match(storage, /allow read, write: if false;/);
  assert.doesNotMatch(firestore, /match \/classes\/\{classId\} \{ allow read: if signedIn\(\);/);
});

test("Phase 1 authorization is server-owned", () => {
  const sessionRoute = read("app/api/auth/session/route.ts");
  const joinRoute = read("app/api/class/join/route.ts");
  const studentRoute = read("app/api/student/overview/route.ts");
  const clientFirebase = read("lib/firebase.ts");
  assert.match(sessionRoute, /verifyIdToken\(idToken, true\)/);
  assert.match(sessionRoute, /createSessionCookie/);
  assert.match(sessionRoute, /httpOnly: true/);
  assert.match(joinRoute, /getSessionUser/);
  assert.match(joinRoute, /verifyClassAccessCode/);
  assert.doesNotMatch(joinRoute, /body\.studentId/);
  assert.match(studentRoute, /session\.profile\.studentId/);
  assert.doesNotMatch(clientFirebase, /FIREBASE_ADMIN_PRIVATE_KEY|serviceAccount|privateKey/);
});

test("authenticated production workspaces do not render legacy demo pages", () => {
  const studentLayout = read("app/student/layout.tsx");
  const adminLayout = read("app/admin/layout.tsx");
  assert.match(studentLayout, /DataAccessGate area=\"student\"/);
  assert.match(adminLayout, /DataAccessGate area=\"admin\"/);
  assert.doesNotMatch(studentLayout, /<DataAccessGate area=\"student\"\}>\{children\}/);
  assert.doesNotMatch(adminLayout, /<DataAccessGate area=\"admin\"\}>\{children\}/);
});
