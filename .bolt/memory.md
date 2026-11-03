# Project memory

## Product intent & audience

- Internal business app for Mexican employees, with authentication, registration, password recovery, and role-based access.
- UI is Spanish-language.
- New registrations default to `vendedor`; the first admin is created manually.
- Employees created with temporary passwords must change them before accessing Ventas.

## Brand personality & voice

- Direct, instructional Spanish copy.
- Authentication and form errors should explain the actionable cause rather than use a generic failure message.
- Password-change guidance should clearly communicate requirements, confirmation state, and next action.

## Visual design & UX direction

- Next.js App Router with Server Components by default; interactive behavior stays behind the appropriate client boundary.
- Tailwind CSS, shadcn/ui, and Lucide React are the established UI stack.
- Authenticated screens use the existing session-aware layout and `AuthShell`.
- Desktop navigation uses a sidebar; mobile navigation uses a bottom bar with logout.
- Password recovery remains a three-step flow: identify user, enter SMS code, set a new password.
- The temporary-password flow uses `/cambiar-contrasena`, with new-password and confirmation fields, a save action, and navigation to Ventas after success.
- Password-change failures should distinguish mismatched fields from backend/authentication rejection and surface the useful reason inline or in a clear banner.

## Decisions, constraints & rationale

- The employee login 404 was caused by redirecting to `/cambiar-contrasena` before that route existed; the route now exists and can use the root layout’s `RequireSession` guard.
- A successful temporary-password change sends the employee to Ventas.
- The generic “Revise los datos del formulario y las contraseñas si coinciden” response was traced to broad Supabase error handling. Error mapping was updated to expose the actual reason.
- Supabase may reject a new password that is identical to the temporary password; the employee must use a different password.
- Supabase provides the backend, database tables, and Row-Level Security for internal screens; unauthenticated users are redirected to login.
- Registration and password-recovery server functions are deployed separately; Deno Edge Functions are excluded from TypeScript compilation.
- SMS recovery depends on an external provider. Twilio is the current candidate but remains unconfigured, so recovery cannot send messages until credentials are supplied.
- Type checking passed after adding the missing route; the complete employee flow and revised error behavior have not been verified in a real browser session.

## Open questions & assumptions

- Test the full employee flow with a real temporary-password account, including a new password distinct from the temporary one and a mismatched confirmation.
- Confirm the exact Supabase error variants and ensure each is translated into useful Spanish feedback.
- Twilio account SID, auth token, and sender number remain pending; confirm whether Twilio is the preferred provider.
- Confirm the procedure for bootstrapping the first admin user.
- Mexican phone numbers are assumed to be 10 digits with the `+52` prefix.
- The exact boundary between Supabase Auth and custom user tables remains unclear and should be confirmed against the implementation.