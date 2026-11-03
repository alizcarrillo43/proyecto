# Project memory

## Product intent & audience

- Internal business app for Mexican employees, with authentication, registration, password recovery, role-based access, inventory, sales, and audit history.
- UI is Spanish-language.
- Inventory supports shoe models with multiple sizes and per-size stock quantities.
- Each model uses one shared barcode across all its sizes.
- Employees created with temporary passwords must change them before accessing Ventas.
- Sales history preserves auditable line-item details, including seller, item, size, quantity, price, folio, and timestamp.

## Brand personality & voice

- Direct, instructional Spanish copy.
- Form and operational errors should explain the actionable cause.
- Inventory status labels should be concise and unambiguous, especially availability and paused-sale states.
- Success messages should summarize a model’s shared barcode and associated sizes without repeating the code unnecessarily.
- Destructive actions should clarify whether historical sales data is retained.

## Visual design & UX direction

- Next.js App Router with Server Components by default; interactive behavior stays behind the appropriate client boundary.
- Tailwind CSS, shadcn/ui, and Lucide React are the established UI stack.
- Authenticated screens use the existing session-aware layout and `AuthShell`.
- Desktop navigation uses a sidebar; mobile navigation uses a bottom bar with logout.
- Password recovery remains a three-step flow: identify user, enter SMS code, set a new password.
- Temporary-password changes use `/cambiar-contrasena` and route successfully to Ventas.
- Sales history displays one row per sold article and remains legible for multi-line sales.
- Article management supports creating one model with multiple size and quantity entries in a single flow.
- Creating a model generates one barcode shared by every size entry; the result presents that code once alongside the model’s sizes.
- Sales barcode lookup must handle multiple matching sizes explicitly: scanning a shared model code prompts the employee to choose a size before adding it, rather than selecting an arbitrary size.
- Article management supports deleting articles with historical sales, pausing/resuming sale availability, and showing a visible `En pausa` status.
- Paused articles should not appear in Ventas and should be rejected by the sale operation if submitted through stale UI or another client.
- Article deletion is expected to preserve historical sales details rather than erase audit records.

## Decisions, constraints & rationale

- Barcode identity is model-level, not size-level. Database uniqueness was adjusted so the same code can be stored for the model’s different size rows while preserving the intended size-specific inventory records.
- Existing articles retain their previously assigned codes; no migration of old codes was performed.
- Ventas resolves a shared barcode to its available size choices and requires an explicit size selection when more than one applies.
- The temporary-password route exists because redirecting employees there previously caused a 404; it uses the root layout’s session guard.
- Supabase provides authentication, database tables, and Row-Level Security for internal screens; unauthenticated users are redirected to login.
- Registration and password-recovery server functions are deployed separately; Deno Edge Functions are excluded from TypeScript compilation.
- SMS recovery depends on an external provider; Twilio remains a candidate but is not configured.
- Sales history uses `ventas` joined with `detalle_venta` and seller data through `ventas.usuario_id`/`usuarios`; placeholder data was removed.
- Article deletion was changed to avoid losing historical sales. The implementation preserves the original sold description, size, and price in sales history.
- Sale availability is controlled with a persisted pause state; pausing affects current sale discovery and validation without deleting inventory data.
- Multi-size article creation captures model-level information once and records separate size/quantity entries.
- Type checking/build compilation succeeds after the barcode changes, but the updated barcode and size-selection flow has not been verified in a real browser session.
- Production builds may still fail across pages when database environment configuration is missing; this has not been established as a code regression.

## Open questions & assumptions

- Verify shared-barcode creation in the browser, including multiple sizes, stock counts, generated code display, and duplicate/invalid size validation.
- Verify scanning a shared code in Ventas, selecting each size, stock validation, and behavior when only one size is available.
- Confirm the database constraint accurately supports one shared code across all size rows without allowing unintended collisions between different models.
- Confirm how existing articles with legacy per-size codes should behave alongside newly created shared-code models.
- Verify deletion behavior with an article that has existing sales, including history rendering and foreign-key/RLS edge cases.
- Verify pausing/resuming in the browser, including stale sale forms and direct server-side sale attempts.
- Resolve missing database environment variables and rerun a production build.
- Confirm exact Supabase error variants and useful Spanish translations for password and inventory operations.
- Twilio credentials and preferred SMS provider remain pending.
- Confirm the first-admin bootstrapping procedure.
- Mexican phone numbers are assumed to be 10 digits with the `+52` prefix.
- The boundary between Supabase Auth and custom user tables remains unclear and should be confirmed against the implementation.