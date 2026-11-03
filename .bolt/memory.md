# Project memory

## Product intent & audience

- Internal business app for Mexican employees, with authentication, registration, password recovery, role-based access, inventory, sales, and audit history.
- UI is Spanish-language.
- Inventory supports shoe models with multiple sizes and per-size stock quantities.
- Employees created with temporary passwords must change them before accessing Ventas.
- Sales history is intended to preserve auditable line-item details, including seller, item, size, quantity, price, folio, and timestamp.

## Brand personality & voice

- Direct, instructional Spanish copy.
- Form and operational errors should explain the actionable cause.
- Inventory status labels should be concise and unambiguous, especially availability and paused-sale states.
- Destructive actions should clarify whether historical sales data is retained.

## Visual design & UX direction

- Next.js App Router with Server Components by default; interactive behavior stays behind the appropriate client boundary.
- Tailwind CSS, shadcn/ui, and Lucide React are the established UI stack.
- Authenticated screens use the existing session-aware layout and `AuthShell`.
- Desktop navigation uses a sidebar; mobile navigation uses a bottom bar with logout.
- Password recovery remains a three-step flow: identify user, enter SMS code, set a new password.
- Temporary-password changes use `/cambiar-contrasena` and route successfully to Ventas.
- Sales history displays one row per sold article and remains legible for multi-line sales.
- The article-management UI now supports:
  - Creating one model with multiple size entries and quantities in a single flow.
  - Generating a barcode/code per size entry.
  - Deleting articles even when historical sales exist.
  - Pausing and resuming sale availability with a pause/play icon.
  - Showing a visible `En pausa` status.
- Paused articles should not appear in Ventas and should be rejected by the sale operation if submitted through stale UI or another client.
- Article deletion is expected to preserve historical sales details rather than erase audit records.

## Decisions, constraints & rationale

- The temporary-password route exists because redirecting employees there previously caused a 404; it uses the root layout’s session guard.
- Supabase provides authentication, database tables, and Row-Level Security for internal screens; unauthenticated users are redirected to login.
- Registration and password-recovery server functions are deployed separately; Deno Edge Functions are excluded from TypeScript compilation.
- SMS recovery depends on an external provider; Twilio remains a candidate but is not configured.
- Sales history uses `ventas` joined with `detalle_venta` and seller data through `ventas.usuario_id`/`usuarios`; placeholder data was removed.
- Article deletion was changed to avoid losing historical sales. The exact implementation preserves the original sold description, size, and price in sales history.
- Sale availability is controlled with a persisted pause state; pausing affects current sale discovery and validation without deleting inventory data.
- Multi-size article creation captures model-level information once and records separate size/quantity entries.
- Type checking passes after the inventory changes.
- The production build currently fails across pages because database environment configuration appears to be missing during build; this has not been established as a code regression.
- The updated inventory and sales behavior has not yet been verified in a real browser session.

## Open questions & assumptions

- Clarify the intended meaning of “eliminarlo de la ventana de ventas”: current implementation interprets the request as preserving sales history, while paused articles are removed from active Ventas.
- Verify deletion behavior with an article that has existing sales, including history rendering after deletion and any foreign-key/RLS edge cases.
- Verify pausing/resuming in the browser, including stale sale forms and direct server-side sale attempts.
- Verify multi-size creation, stock counts, generated codes, editing, and validation for duplicate or invalid sizes.
- Resolve missing database environment variables and rerun a production build.
- Confirm exact Supabase error variants and useful Spanish translations for password and inventory operations.
- Twilio credentials and preferred SMS provider remain pending.
- Confirm the first-admin bootstrapping procedure.
- Mexican phone numbers are assumed to be 10 digits with the `+52` prefix.
- The boundary between Supabase Auth and custom user tables remains unclear and should be confirmed against the implementation.