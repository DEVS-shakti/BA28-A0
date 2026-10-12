# ClassRank · BA-28A0

ClassRank is a responsive academic analytics prototype for Brother's Academy, Ranchi. It includes separate student and admin workspaces, seeded BA-28A0 directory records, demo results, import review surfaces, ranking policy UI, question evidence, report export surfaces, Firebase adapters and rule templates.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. The landing page links to both demo workspaces.

## Demo vs Firebase mode

The visible `Demo mode · fictional data` pill is intentional. Demo data is defined in `lib/data.ts` and is never silently used as a Firebase fallback. To prepare Firebase mode, copy `.env.example` to `.env.local` and provide the public Firebase web configuration values. `lib/firebase.ts` exposes the configured Auth, Firestore and Storage clients only when the required environment variables exist.

The Firebase web config is public application configuration; service-account credentials and privileged server secrets do not belong in `.env.local` or browser code. Publishing, ranking recalculation, identity approvals and bulk exports should be implemented as trusted server-side operations before enabling live mode.

## Included routes

- Public: `/`, `/login`, `/join`, `/pending`, `/unauthorized`
- Student: `/student`, `/student/tests`, `/student/tests/[testId]`, both leaderboards, class and subject analytics, history, question analysis, personal report and settings
- Admin: `/admin`, student directory/profile, test management, import center with spreadsheet/OCR/manual flows, result review, analytics, ranking policy, enrollment, audit logs and settings

## Data and ranking notes

- The 27 supplied student records are seeded with immutable IDs in `lib/data.ts`; three records are intentionally flagged for spelling verification.
- Father's names only appear in the admin directory/profile.
- Demo marks are fictional and do not represent official Brother's Academy results.
- Cumulative ranking uses normalized percentage per published eligible test, equal test weight, absence as zero, exemption excluded, a minimum of three completed tests and competition ranking.
- Published results, corrections and imports are represented in the UI as explicit review states; no missing spreadsheet row is inferred as absent.

## Security completion checklist

- [x] Demo/live boundary is visible and no silent demo fallback is wired.
- [x] Stable student IDs, separate admin identity fields and explicit result statuses.
- [x] Firestore and Storage rule templates included in `firestore.rules` and `storage.rules`.
- [x] Import validation schema and preview/error states included.
- [x] Admin publication review and audit-log surfaces included.
- [x] Implement trusted server-side import/publish/ranking functions.
- [ ] Configure Firebase Authentication, Firestore, Storage and App Check.
- [ ] Run Emulator Suite tests for unauthorized reads/writes and private report endpoints.
- [x] Replace demo PDF buttons with a server-generated, identity-scoped PDF endpoint.
- [ ] Verify live imports, correction recalculation, retention and backups against real approved records.

The prototype is deliberately not described as production-secure until the unchecked items are completed and tested.

# BA28-A0

## Phase 0 containment

The production default now fails closed: `/student/*` and `/admin/*` are blocked by the Next.js proxy until Firebase Authentication is configured and a valid server session is present. The current production data boundary contains no seeded student directory, marks, generated results or static chart metrics. Invalid record access raises a safe request error instead of selecting the first record.

The repository history has not been rewritten in this phase. Because an earlier public commit may have been copied, history cleanup and repository-privacy decisions require a separate approved operation with a secure backup. No Firebase/Vercel settings or live records were changed.

## Phase 1 authentication and data access

Phase 1 adds server-validated Firebase ID-token exchange and an HttpOnly `__classrank_session` cookie. Protected layouts verify the cookie with Firebase Admin and independently enforce the `admin` or approved `student` role. The proxy is only an early redirect; it is not the authorization boundary.

Student accounts are created with the least-privileged `student` role. `/api/class/join` validates a server-stored scrypt class-code hash and creates a pending enrollment without accepting a client-supplied student ID. An administrator must perform the identity match and approval later. `/api/student/overview` returns only the authenticated student's sanitized published data and never returns father names.

Required server-only variables are listed in `.env.example`: `FIREBASE_ADMIN_PROJECT_ID`, `FIREBASE_ADMIN_CLIENT_EMAIL`, and `FIREBASE_ADMIN_PRIVATE_KEY`. Configure Firebase Email/Password Authentication and provision the first administrator through a trusted server process; do not edit a user's role from the browser. Firebase/Vercel settings and live records remain unchanged until reviewed and configured.

## Results and ranking policy

CSV/XLSX imports are staged under protected Storage paths, parsed server-side, matched by stable student ID, and saved as reviewable drafts. Unknown IDs, duplicates and out-of-range scores block application. Missing spreadsheet rows are never converted to absences. Applying a draft cannot overwrite a published result; publication is a separate audited operation.

Published-test cumulative scores use equal-weight normalized percentages. Explicit unexcused absences contribute zero, approved exemptions are excluded, pending/ungraded records are excluded from the denominator, and missing records are not inferred as absences. An official cumulative rank requires three completed tests and uses competition ranking (`1, 2, 2, 4`). Corrections invalidate publication until explicitly republished.

The personal report endpoint is `GET /api/student/report/pdf`; it derives scope from the authenticated session and does not accept a student ID. Class CSV exports require an administrator session. Emulator rule tests require Java 21 and run through `npm run test:rules`.
