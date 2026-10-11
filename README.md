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
- [ ] Deploy trusted server-side import/publish/ranking functions.
- [ ] Configure Firebase Authentication, Firestore, Storage and App Check.
- [ ] Run Emulator Suite tests for unauthorized reads/writes and private report endpoints.
- [ ] Replace demo PDF buttons with a server-generated, identity-scoped PDF endpoint.
- [ ] Verify live imports, correction recalculation, retention and backups against real approved records.

The prototype is deliberately not described as production-secure until the unchecked items are completed and tested.

# BA28-A0
