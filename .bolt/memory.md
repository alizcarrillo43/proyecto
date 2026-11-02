# Project memory

## Product intent & audience

- Internal business app for Mexican users, with authentication, registration, password recovery, and role-based employee access.
- Spanish-language UI.
- New registrations default to the `vendedor` role; the first admin is created manually.
- Employees created with temporary passwords must change them before accessing Ventas.

## Brand personality & voice

- Direct, instructional Spanish copy.
- Authentication errors are shown clearly in banners or inline feedback.
- Password-change guidance should make the required action and validation state obvious.

## Visual design & UX direction

- Next.js App Router using Server Components by default; interactive components use the appropriate client-component boundary.
- Tailwind CSS, shadcn/ui, and Lucide React are the established UI stack.
- Authenticated screens use the existing session-aware layout and `AuthShell` visual frame.
- Desktop navigation uses a sidebar; mobile navigation uses a bottom bar with logout.
- Password recovery remains a three-step flow: identify user, enter SMS code, set a new password.
- The temporary-password flow now includes `/cambiar-contrasena`: new password field, confirmation field, save action, then navigation to Ventas.

## Decisions, constraints & rationale

- The employee login 404 was traced to a redirect toward `/cambiar-contrasena` while that route was missing.
- `/cambiar-contrasena` has been created and can use the existing `RequireSession` session guard from the root layout.
- After successfully changing a temporary password, the employee is sent to Ventas.
- Supabase provides the backend, database tables, and Row-Level Security for internal screens; unauthenticated users are redirected to login.
- Registration and password-recovery server functions are deployed separately; Deno Edge Functions are excluded from TypeScript compilation.
- SMS recovery depends on an external provider. Twilio is the current candidate but remains unconfigured, so recovery cannot send messages until credentials are supplied.
- Type checking passed after adding the missing route; the complete employee flow has not yet been verified in a real browser session.

## Open questions & assumptions

- The new employee password-change flow still needs end-to-end testing with a real employee account.
- Twilio account SID, auth token, and sender number are still pending; confirm whether Twilio is the preferred provider.
- Confirm the procedure for bootstrapping the first admin user.
- Mexican phone numbers are currently assumed to be 10 digits with the `+52` prefix.
- The exact boundary between Supabase Auth and any custom user tables remains unclear and should be confirmed against the implementation.