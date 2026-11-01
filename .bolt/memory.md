# Project memory

## Product intent & audience

- Internal business app with user authentication, registration, and password recovery
- Spanish-language UI (Mexican users); phone numbers assumed 10 digits with +52 (México) prefix
- New registrations default to "vendedor" role; requires manual creation of first admin user

## Brand personality & voice

- Spanish-language interface throughout
- User-facing messaging is direct and instructional (e.g., "usuario no registrado", error banners for incorrect login data)

## Visual design & UX direction

- Next.js App Router with Server Components; client components use "use client" directive
- Tailwind CSS + shadcn/ui components; Lucide React icons
- Sidebar layout on desktop with logout button; mobile bottom bar with logout
- Error banners for failed authentication feedback
- Password recovery is a 3-step flow: identify user → enter SMS verification code → set new password

## Decisions, constraints & rationale

- Supabase backend: database tables + Row-Level Security rules protect internal screens; unauthenticated users are redirected to login
- Server functions deployed for registration and password recovery (Deno Edge Functions excluded from TS compilation)
- SMS sending requires external provider; Twilio chosen but not yet configured (needs account SID, auth token, sender number)
- Until SMS is configured, recovery flow returns "message could not be sent" error
- First admin user must be created manually; all new sign-ups get "vendedor" role by default

## Open questions & assumptions

- **Pending credentials:** Twilio account SID, auth token, and sender phone number from user
- **Alternative SMS provider:** User may prefer a provider other than Twilio — needs confirmation
- **Admin bootstrap:** How/when to create the first admin user (manual SQL? seeded registration?)
- **Phone format:** Assumed 10-digit Mexican numbers with +52 prefix — needs user confirmation
- **Auth provider choice:** Using Supabase Auth vs. custom auth against Supabase tables — unclear which was implemented