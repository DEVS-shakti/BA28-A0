# ClassRank production runbook

This runbook covers the steps that cannot be completed only from the repository. The application is not considered production-secure until each external control below has been configured and tested against the deployed project.

## Environment separation

Use a separate Firebase project for each environment. Set `CLASSRANK_MODE=production` and `CLASSRANK_DEMO_ENABLED=false` in every deployed environment. Do not copy demo data into the live project.

Required client variables are listed in `.env.example`. The Admin SDK variables must only exist in the server environment. Store the private key as a secret and preserve its escaped newlines when configuring the deployment platform.

Provision the first admin directly in Firestore through a controlled operator process. The `users/{uid}` document must contain the expected `uid`, `role: "admin"`, and `active: true`. Never allow a client to assign its own role.

## Firebase controls

1. Deploy `firestore.rules` and `storage.rules` from the reviewed commit.
2. Enable Firebase App Check for the web app and enforce it for Firestore, Storage, and callable/server entry points where supported by the selected Firebase setup.
3. Rotate the class access code after initial enrollment and disable it when the enrollment window closes. Store only its scrypt hash in `classes/{classId}`.
4. Verify that private uploads are not publicly readable. Original imports are written below `imports/{classId}/...` and are intentionally denied by Storage Rules to client users.
5. Enable Firebase Authentication providers required by the deployment and configure authorized domains for the production host.
6. Turn on Firebase/Google Cloud audit logging and alerts for rule denials, authentication anomalies, elevated error rates, and unexpected Storage reads.

## Backup, recovery, and rollback

- Schedule Firestore exports to a separate protected bucket before importing real results.
- Retain the original import file and the import hash for every published result set.
- Before publication, save the release commit, test configuration, import ID, and publication audit event together.
- To correct a published result, use the correction endpoint; do not edit result documents manually. A correction moves the test back to review and invalidates its public publication state before rankings are recalculated.
- To roll back an application release, redeploy the previous immutable build. Do not roll back Firestore data by deleting documents; restore from an export only after confirming the affected document set and audit trail.
- Test one restore in a non-production Firebase project before accepting the backup process.

## Release verification

Run locally or in CI:

```text
npm ci
npm run test
npm run test:rules
npm run lint
npx tsc --noEmit --incremental false
npm run build
```

`test:rules` requires Java 21 for the current Firebase Emulator Suite. CI provisions it explicitly. The emulator suite must pass before treating rules as verified.

After deployment, verify in a private browser session:

- unauthenticated access redirects to login;
- a student can read only their own private report;
- a student cannot read imports, audit logs, another student’s report, or write scores;
- a non-admin cannot access admin routes or publication endpoints;
- an admin can preview, correct, publish, and export the intended test;
- published pages contain only approved live records and no demo fixture;
- PDF download contains the authenticated student’s ID and cannot be changed through a query parameter;
- headers are present and no source map or secret environment variable is exposed.

## Monitoring and operational limits

Configure alerting for failed session creation, repeated join-code failures, import validation errors, publication failures, and ranking recalculation failures. Add rate limiting at the hosting edge or API gateway for authentication, class-code joins, imports, and PDF generation before opening the service to untrusted traffic.

The repository includes secure defaults and server-side authorization checks, but external Firebase rules, App Check, secrets, backups, monitoring, and deployment verification remain operator responsibilities.
