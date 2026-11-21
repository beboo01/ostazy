# Deployment and rollback checklist

This branch is intended for review, not an automatic production rollout. No production database migration is supplied, because the live schema, policies and triggers were not available for inspection.

## Before merging

1. Export `teacher_state` and `subscriptions` securely from Supabase and verify the restore route. Do not commit exports or customer data.
2. Complete [SECURITY-REVIEW.md](SECURITY-REVIEW.md) using a staging project and two synthetic teacher accounts. Keep anonymous/publishable and signed-in roles separate from a service role. Never put a service-role key in browser code.
3. Confirm the existing schema actually supports the operations used by this version:
   - `teacher_state`: one unique row per `user_id`, JSON state, and an `updated_at` timestamp.
   - `SELECT`, `INSERT` and conditional `UPDATE ... RETURNING updated_at` for only the account's own row.
   - The `updated_at` value returned after a write reflects the stored version. Server triggers should generate/change it on every write so older or external writers cannot bypass conflict detection accidentally.
   - `subscriptions`: readable only as required for the user's own status, with writes reserved for trusted administrative/server paths.
4. Verify how subscription rows are provisioned for new confirmed users. Missing rows now stop editing intentionally. Repair lifecycle/provisioning on staging rather than weakening the fail-closed UI.
5. Run `npm test`, `npm run check`, and the optional browser smoke test. Test two tabs/devices against staging: save in tab A, then save an older version in B. B must stop and preserve its local changes for export. Also test first-save races and RLS-denied writes.
6. Test signup, confirmation, expiry, signout, password recovery, and offline/network failures. Password recovery still needs a full UI flow and verified Supabase email/redirect configuration before release.
7. Restore an old-format backup on a synthetic account. Confirm legacy paid flags remain visible without invented historical amounts. If a stored state fails validation, keep an original export and correct it on staging. Do not erase it to get past validation.
8. Review the UI on mobile and desktop, including RTL tabs, note fields, fee totals, errors and read-only behavior. Browser tests use a mocked SDK; verify the pinned production SDK against staging too.

## Publish after review

Deploy `index.html`, `app.js` and `core.js` together, in the same directory. There is no bundle step. Use HTTPS, short/no-cache HTML during rollout, and avoid a cached old script with a new page. Restrict hosting output to runtime files when possible; tests and internal project docs are not needed to serve the product.

Supabase URL and the **publishable** key are browser configuration, not an authorization boundary. Existing values are unchanged. A private/admin/service key must never be added to this repository. Configure confirmation/recovery redirect allowlists and email delivery in Supabase, then test them. Client-side filtering does not replace RLS.

## Rollback

Keep a verified export before changing software. If rolling back the client, do not allow an older client to edit state that already contains `paymentLedger`, because old whole-state writes may discard fields it does not understand. Put editing into maintenance/read-only mode, export affected state, then choose a compatible rollback or a forward fix. Do not blindly replace database state with an old backup.

## Not included

No schema normalization, cross-device automatic merge, durable offline sync, server-side subscription policies, database restore service, payment gateway, password recovery implementation or legal-policy approval is claimed by this branch. These are separate release gates, not completed features.
