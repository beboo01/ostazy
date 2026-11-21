# أستاذي لإدارة المجموعات

Arabic, RTL teacher group management MVP. Static HTML/CSS/JavaScript with Supabase authentication and persistence. Includes groups, students, attendance, monthly fee tracking, exams, reports and user-initiated WhatsApp links.

**This is not a production security approval.** Database policies and production authentication settings must be inspected before selling subscriptions. See [DEPLOYMENT.md](DEPLOYMENT.md).

## Files

- `index.html`: page structure and styles.
- `app.js`: UI, authentication, load/save, backup and restore.
- `core.js`: pure student, subscription, date, receipt and validation rules.
- `core.test.js`: regression tests and a mocked persistence harness.
- `browser-smoke.cjs`: real Chromium interaction checks with synthetic data. All external requests are blocked or mocked.
- `SECURITY-REVIEW.md`: database access and verification checklist.

## Run locally

Serve the directory over HTTP, for example:

```sh
python3 -m http.server 8000
```

Open `http://localhost:8000`. Serving locally does **not** create a test database: the configuration in `app.js` still targets the configured Supabase project. Use a staging project and synthetic accounts for interactive testing. Never enter real customer data during development.

No build step or npm dependency is needed to serve the app. Node 20+ is needed for tests:

```sh
npm test
npm run check
```

Optional browser smoke test:

```sh
npm install --no-save playwright@1.65.1
npx playwright install chromium
node browser-smoke.cjs
```

Browser tests start their own local server, mock authentication/storage, and do not contact the real Supabase project. Screenshots are written to `/tmp` by default; set `OSTAZY_SCREENSHOT_DIR` to an existing directory to keep them elsewhere. They are not a substitute for two-account RLS tests on staging.

## Behavior and limits

- Editing a student profile now changes the student stored in application state.
- Missing, unreadable or expired subscription metadata puts the UI in read-only mode. This is a UX guard, **not** server-side subscription enforcement.
- Saves compare the previously loaded `updated_at` value before updating. A stale write stops rather than silently replacing another device's changes. It does not merge conflicts or provide live sync. Keep a backup, then reload and reapply local edits.
- Closing a page with pending changes shows a browser warning when the browser permits it. There is no durable offline queue. A mobile OS may close a page without giving it time to save.
- Each newly confirmed payment captures its amount, student name, month and timestamp. Reversing it records the original amount, independent of current pricing. Historical `true/false` payment flags have no known amount: they remain visible as legacy payments and are not silently priced at today's rate.
- The receipt list remains within the teacher's JSON state. It is not a server-enforced, tamper-proof accounting ledger and does not yet support partial payments, discounts, invoices or automatic reconciliation.
- JSON export includes student and parent data. Keep it private. Restore validates structure, limits file size to 5 MB, asks for confirmation, and downloads the previous state first. This is client-side recovery, not managed database backup.
- Delete actions ask for confirmation. Deleted groups/students/exams are not automatically archived; download a backup before deleting. New receipt amounts survive removal of a student from the current lists.
- Old unscoped `localStorage` data is no longer copied automatically into whichever account signs in. A legacy user should export their old data with the old version and restore it intentionally into the correct account.
- Calendar dates use the device's local day, not the UTC day. Reports use month starts to avoid month-end rollover errors.
- Opening a WhatsApp link prepares a message; the user still sends it.

## Remaining product work

1. Inspect and test RLS, ownership constraints, subscription lifecycle and server-side enforcement before any wider launch.
2. Configure and test password recovery, email confirmation, SMTP, redirect allowlists, session expiry and abuse controls on staging. No production auth settings were changed in this branch.
3. Add operational backups with a tested restore procedure, error monitoring without student data, and an incident/contact process.
4. Agree privacy, retention, deletion, parental-data handling and support terms appropriate to the service. This repository does not assert legal compliance.
5. Validate pricing and workflows with a small group of teachers. Add partial payments and per-student pricing when real use warrants them. Add organizations, staff roles and branches only if the product targets teams or centers.
6. Decide on a payment provider and merchant setup before adding automatic billing. The current manual payment flow remains manual; no bank, payment or live subscription settings were changed.
