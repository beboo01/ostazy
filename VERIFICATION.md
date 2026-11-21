# Verification record, 21 November 2026

## Code and browser checks

- The branch files were fetched back from GitHub and matched against the tested files byte for byte.
- All 17 Node regression tests passed, as did JavaScript syntax checks.
- A real Chromium mobile/desktop smoke test passed for note persistence, recording receipts, export, validated restore and stale-write locking. The browser test uses synthetic data and a mocked Supabase SDK; it is not an authenticated end-to-end production-account test.
- Mobile and desktop screenshots were inspected for layout, readable RTL text, saved notes, save confirmation and conflict status.

## Database inspection and live role tests

The existing Supabase project was inspected through its dashboard, matched to the project reference already used by the app. No schema, policy, subscription or customer record was permanently changed.

Confirmed existing configuration:

- `teacher_state` and `subscriptions` have RLS enabled, a primary key on `user_id`, and a foreign key to `auth.users(id)` with cascading deletion.
- State reads/deletes require the signed-in user's identifier. Inserts and updates additionally require `is_active(auth.uid())`.
- The only subscription policy allows users to read their own subscription; no client write policy exists.
- `is_active` is a stable security-definer function with a fixed `public` search path, checking either a future trial end or paid-until date. Its execution grant is limited to authenticated/service roles rather than anonymous callers.
- A new-auth-user trigger creates the subscription; the default trial is 14 days.
- `teacher_state.updated_at` is a non-null timestamp. There is no automatic timestamp update trigger. This app sends a new timestamp on every save and uses the previously read value for its conditional update. All other writers must follow the version convention too.

A live SQL transaction created two synthetic user identifiers, exercised the actual `authenticated` role and JWT subject, then rolled everything back. Assertions passed for:

1. A new trial is provisioned and active.
2. The trial user can insert and update their own state.
3. They cannot read another user's subscription or insert state under the other user's identifier.
4. They cannot extend their own subscription by updating the subscription table.
5. The other user cannot read or update the first user's state.
6. After expiry, reading state for export is allowed but updates are denied.

The transaction returned its PASS result after `ROLLBACK`. A separate read confirmed zero synthetic auth rows remained. Existing state passed the new client-side validation; no customer fields are included in this document or test fixtures.

**Correction to the initial code-only assessment:** server-side subscription checks already existed. The repository alone did not expose them. A missing subscription record opened the old UI, but it is incorrect to infer from that alone that writes could bypass the existing database policy. The new UI guard is defense in depth and clearer failure handling, not the creation of the project's first subscription enforcement.

## Remaining limits and follow-up

- The role test is not a real email/password/signup flow through Supabase Auth and PostgREST. Password recovery, SMTP/redirect settings, session behavior and authenticated multi-device end-to-end testing remain separate work.
- Table grants include broad default privileges for anonymous/authenticated roles. RLS gates the inspected row operations, but grants such as TRUNCATE are not constrained by row policies. No anonymous database login or exposed truncate endpoint was established. Tighten privileges after checking every application/admin integration and validating on staging; no grant changes were silently made here.
- No staging project, managed backup/restore service, automatic payment integration, legal policy, server-owned accounting ledger or organization/staff model was created.
- The client still uses account-wide JSON. It detects stale versions rather than automatically merging concurrent edits; it does not provide durable offline storage.
- These checks support an incremental client update. They do not certify the product as fully hardened or ready for unrestricted paid acquisition.
