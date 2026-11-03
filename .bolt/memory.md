# Project memory

## Product intent & audience

- Internal Spanish-language inventory and sales app for Mexican employees.
- Employees consult inventory, register sales, and consult cash totals; the jefe/superuser manages stock and daily cash setup.
- Inventory models represent articles with one shared model-level code and multiple shoe sizes, each with its own stock.
- Sales history must remain auditable and preserve sold-item details.

## Brand personality & voice

- Direct, instructional Spanish copy suited to operational workflows.
- Stock, cash, and availability states should be immediately understandable.
- Error messages should explain the cause and next action.
- Destructive or state-changing actions should clarify their scope and historical impact.
- Financial labels should distinguish clearly between opening cash, sales totals, cash cuts, and withdrawals.

## Visual design & UX direction

- Existing purple visual system, session-aware shell, navigation, typography, and general styles should remain consistent.
- Inventory table has four columns in this order: `Código`, `Descripción`, `Precio`, `Existencias por talla`.
- Each article/model appears once. Size data is grouped in one cell with aligned `#` and `Existencia` rows.
- Each model may display its own size range; do not assume a global set of sizes.
- Zero-stock sizes use a light red background and red text.
- Inventory supports horizontal scrolling on narrow screens without breaking the surrounding layout.
- Employees see inventory as read-only; only the superuser can edit quantities, with editing available per size.
- Article-level pause/delete actions appear under the description, not once per size.
- Sales product capture uses two stages: select an article/model with its price, then select an available size.
- Sold-out sizes are visibly disabled; scanning or entering a multi-size model code should go directly to size selection.
- Cash information is accessed from a dedicated `Caja` page available to both roles, not from the `Inicio`/Ventas page.
- The Caja page should clearly present the current cash total/opening amount and latest update information. Employees can consult it; only the superuser sees editing controls.
- Cash entry should use a clear monetary input and make same-day correction behavior apparent.
- Preserve the existing responsive layout and session-aware navigation when adding Caja.

## Decisions, constraints & rationale

- Stock is stored per size as separate `articulos` rows; no `existencias` table or migration was added.
- Inventory and sales data are grouped by model in the API/UI layer so a model is presented once while retaining size-specific stock.
- Newly created models use one shared barcode; older records may have one barcode per size and can appear as separate rows.
- Article pause and deletion operate on the complete model/article grouping rather than an individual size row.
- Historical sales must not be lost when an article is deleted; sold descriptions, sizes, and prices remain available in history.
- Supabase remains the data/authentication layer with RLS and role-based access.
- Sales lookup and capture separate model selection from explicit size selection; existing pricing behavior and the remainder of the sale flow are preserved.
- Daily opening cash is persisted in a dedicated database record and survives reloads. The current implementation supports reading and same-day insert/update behavior.
- Only the superuser may write opening cash; employees have read-only access. This is enforced through database permissions as well as the UI.
- Opening cash is intentionally separate from cash cuts and withdrawals; those workflows were not changed.
- Cash information was moved out of the Inicio/Ventas screen into a dedicated Caja route/menu item so employees can consult it without placing it on the home screen.
- The Caja menu item and page are visible to employees and superuser; editing remains superuser-only.
- Recent inventory changes touched `app/(app)/articulos/page.tsx`, `components/articulos/eliminar-articulo-dialog.tsx`, `lib/inventario-api.ts`, and `lib/types.ts`.
- Production build remains blocked when database URL/key environment variables are absent; this is an environment issue not yet established as a code regression.
- Type checking for the recent Caja/navigation change passed; browser validation has not yet been completed.

## Open questions & assumptions

- Verify the Caja page in a browser for superuser and employee sessions, including visibility, read-only employee behavior, reload persistence, and same-day correction.
- Confirm whether “total en caja” means opening cash only or a calculated current cash total including sales, cuts, or withdrawals; current implementation appears centered on the persisted opening amount.
- Confirm the desired wording and behavior when no opening cash has been recorded, including whether sales should be allowed.
- Define whether opening cash is one record per calendar day and which timezone determines the day boundary.
- Verify currency formatting, decimal handling, negative/invalid amounts, and whether an audit trail is needed for corrections.
- Verify grouped inventory rows with different size ranges, zero stock, long descriptions, and horizontal scrolling.
- Verify sales for single-size and multi-size articles, barcode entry, direct size selection, disabled sold-out sizes, and correct submitted size.
- Verify superuser-only quantity editing and that non-superusers cannot update stock through stale UI or direct requests.
- Confirm whether legacy articles with one code per size should eventually be consolidated or remain separate.
- Verify article-level pause/delete behavior when historical sales exist, including RLS and foreign-key edge cases.
- Confirm database constraints around shared model codes and distinct models.
- Resolve missing database environment variables and rerun the production build.
- Confirm first-admin bootstrapping and the boundary between Supabase Auth and custom user records.
- SMS recovery provider and credentials remain undecided.