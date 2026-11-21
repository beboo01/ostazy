# Supabase review needed before launch

The frontend alone cannot prove tenant isolation or enforce paid access. No customer tables were queried and no policies were applied during this code change.

## Minimum access or evidence

A read-only view of the intended Supabase project's database definitions and authentication settings is enough for the first review. Alternatively, export the following definitions, without any student rows, user passwords, tokens or API secrets:

- Definitions, column types, defaults, primary/unique/foreign keys and indexes for `teacher_state` and `subscriptions`.
- RLS enabled/forced flags and every policy for both tables, including policy roles, command, `USING` and `WITH CHECK` expressions.
- Grants to `anon`, `authenticated`, and other application roles, plus any write path exposed through database functions.
- Triggers and their function definitions for timestamps, new-user/trial creation, subscription changes and teacher-state writes. Redact any secret literals if the current definitions contain them.
- Supabase Auth settings for email confirmation, password policy, allowed redirect URLs, SMTP/rate limits and session lifetime. Do not export signing secrets.

Do not send passwords or service-role keys in chat or commit them here. Use secure account access if interactive review is needed. Database definitions should be reviewed as private project material until cleared for publication.

## Verify with two synthetic users on staging

- Signed-out requests cannot read, insert, update or delete teacher state, or alter subscriptions.
- User A can read only A's state and necessary subscription fields; A cannot read B's state even with B's known identifier or without a filter.
- A cannot insert a row with B's `user_id`, change an existing row's owner, update/delete B's state, or change their own entitlement through any exposed table/function.
- An active/trial user can create and update their own state. A missing, invalid or expired entitlement denies modification at the database/trusted service, not merely in the JavaScript UI.
- Expired users retain only the intended read/export capability. Decide separately how account deletion is authorized and audited.
- Provisioning a trial cannot be repeated to reset its end date. Paid dates and renewal events are changed only through trusted administrative/payment processing paths.
- `teacher_state.user_id` uniqueness prevents two sessions from creating duplicate records. A concurrent first insert must fail safely in the second session.
- Conditional writes return the actual new `updated_at`. An update with an obsolete timestamp cannot change state. All writers, including administrative tools, advance the version.
- Expired sessions, token refresh, authorization failures and network failures do not turn into a new blank state or overwrite existing rows.

Record test inputs, roles and pass/fail results without real student data. Keep the tests repeatable. The current JavaScript regression tests use mocks and cannot certify any of the above database properties.

## Follow-on design

After inspecting the actual schema, design a reviewed migration for database ownership and subscription policies. Do not paste a generic policy into production: overly broad existing policies combine with new policies, and security-definer functions, grants and triggers can change the result.

For scale, consider relational student/enrollment/session/payment tables, immutable server-owned payment events, explicit schema versions, audited administrative changes, and organizations/staff roles when required by the target customers. The current account-wide JSON and receipt list are an incremental client fix, not that migration.
