# Firebase data model

All document IDs are stable IDs or generated IDs; names are display fields only.

```text
classes/{classId}
  codeHash, codeEnabled, codeRotatedAt, name, batch, rankingPolicy,
  demoMode, createdAt, updatedAt

users/{uid}
  role: admin | student, studentId?, email, createdAt, lastSignInAt

students/{studentId}
  name, fatherName, verified, claimStatus, userId?, classId,
  source, spellingFlags[], createdAt, updatedAt

enrollments/{enrollmentId}
  classId, studentId, uid, claimMethod, status, reviewedBy?, reviewedAt,
  createdAt, rejectedReason?

tests/{testId}
  classId, name, date, category, subjects[], maxMarksBySubject,
  overallMaxMarks, markingScheme, eligiblePopulation, topics[],
  publicationStatus, source, importIds[], createdAt, updatedAt

results/{resultId}
  testId, classId, studentId, userId, status, marks, maxMarks,
  percentage, subjectResultIds[], public, sourceImportId,
  correctionVersion, updatedAt

subjectResults/{subjectResultId}
  resultId, testId, studentId, subject, marks, maxMarks,
  status, updatedAt

questionResponses/{responseId}
  testId, studentId, questionId, subject, chapter?, topic?,
  maxMarks, response?, correctAnswer?, attempted, classification?,
  marksAwarded?, explanation?, availability

imports/{importId}
  classId, testId, kind, storagePath, originalFilename, status,
  columnMap, rowCount, validCount, warningCount, errorCount,
  createdBy, createdAt, reviewedAt

importErrors/{errorId}
  importId, rowNumber, studentId?, code, severity, message,
  rawValue, resolved, resolvedBy?, resolvedAt?

publicationHistory/{eventId}
  testId, importId, action, version, summary, actorUid, createdAt

auditLogs/{logId}
  actorUid, action, targetType, targetId, beforeHash?, afterHash?,
  metadata, createdAt

rankingSnapshots/{snapshotId}
  classId, policyVersion, publishedTestIds[], generatedAt,
  rows: [{ studentId, score, rank, eligibleCount, completedCount,
            absenceCount, exemptionCount, official }]
```

`rankingSnapshots` is derived and reproducible. It is never the source of truth for a student's marks. A trusted publish/correction function should transactionally update publication history, result visibility and the ranking snapshot. Student report reads must validate the authenticated user's `studentId` on the server; a client-supplied student ID is not authorization.
