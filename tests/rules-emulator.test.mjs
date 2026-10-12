import assert from "node:assert/strict";
import test from "node:test";

const projectId = process.env.GCLOUD_PROJECT || "classrank-rules-test";

async function firestore(path, options = {}) {
  return fetch(`http://127.0.0.1:8080/v1/projects/${projectId}/databases/(default)/documents/${path}`, options);
}

async function storage(path, options = {}) {
  return fetch(`http://127.0.0.1:9199/v0/b/demo-bucket/o/${encodeURIComponent(path)}`, options);
}

test("unauthenticated Firestore writes are denied", async () => {
  const response = await firestore("users/unauthorized", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fields: { role: { stringValue: "admin" } } }) });
  assert.ok(response.status === 401 || response.status === 403, `expected denial, got ${response.status}`);
});

test("unauthenticated Storage uploads are denied", async () => {
  const response = await storage("imports/unauthorized.csv", { method: "POST", headers: { "Content-Type": "text/csv" }, body: "student_id,marks\n" });
  assert.ok(response.status === 401 || response.status === 403, `expected denial, got ${response.status}`);
});
