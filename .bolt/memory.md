# Project memory

## Product intent & audience

- Internal Spanish-language inventory and sales app for Mexican employees.
- Employees consult inventory, register sales, review cash totals, and access customer-facing sale receipts; the jefe/superuser manages stock and daily cash setup.
- Sales history must remain auditable, preserve sold-item details, and make daily revenue easy to review.

## Brand personality & voice

- Direct, instructional Spanish copy suited to operational workflows.
- Stock, cash, availability, sale completion, and historical totals should be immediately understandable.
- Error messages should explain the cause and next action.
- Financial labels should distinguish opening cash, sales totals, cash cuts, withdrawals, and ticket totals.

## Visual design & UX direction

- Preserve the existing purple visual system, session-aware shell, navigation, typography, responsive layout, and general styles.
- Inventory table columns remain `Código`, `Descripción`, `Precio`, and `Existencias por talla`.
- Each article/model appears once, with size data grouped in one cell and aligned `#`/`Existencia` rows.
- Zero-stock sizes use a light red background and red text. Narrow inventory tables may scroll horizontally without breaking the surrounding layout.
- Employees see inventory as read-only; only the superuser can edit quantities per size.
- Article-level pause/delete actions appear under the description, not once per size.
- Sales capture uses model selection followed by explicit available-size selection. Sold-out sizes are visibly disabled; multi-size code entry proceeds to size selection.
- Successful sales show an on-screen receipt containing folio, date/time, seller, sold articles, size, quantity, price, line amount, and total. It remains visible until `Nueva venta` resets the flow.
- Cash is accessed through a dedicated `Caja` page available to both roles. Employees can consult it; only the superuser sees editing controls.
- Sales history is organized into one expandable card/section per day. Each day shows its total sold, number of sales, and pieces; selecting a day reveals its sales and sold-line details.
- Within an opened day, sold products are shown with time, size, quantity, line amount, and a running accumulated total, ending with the day total.

## Decisions, constraints & rationale

- Stock is stored per size as separate `articulos` rows; no `existencias` table or migration was added.
- Inventory and sales data are grouped by model in the API/UI layer so a model is presented once while retaining size-specific stock.
- Newly created models use one shared barcode; older records may have one barcode per size and can appear as separate rows.
- Article pause and deletion operate on the complete model/article grouping rather than an individual size row.
- Historical sales must not be lost when an article is deleted; sold descriptions, sizes, and prices remain available in history.
- Supabase remains the data/authentication layer with RLS and role-based access.
- Sales lookup separates model selection from size selection; existing pricing behavior and the remainder of the sale flow are preserved.
- The completed sale response/data renders the receipt immediately; displayed receipt time currently comes from the client device.
- The receipt is currently screen-only; printing/download behavior and browser validation are not established.
- Daily sales history is derived from already persisted sales; no data model changes were made for the day grouping or totals.
- Daily history aggregation currently displays each sold line and computes a running amount plus final total for the selected day.
- Daily opening cash is persisted in a dedicated database record and supports reading plus same-day insert/update behavior. Only the superuser may write it; employees are read-only.
- Opening cash remains separate from cash cuts and withdrawals.
- Recent work touched inventory, sale history, Caja, ticket, and related API/type/UI files; type checking for recent changes passed.
- Production build remains blocked when database URL/key environment variables are absent; this is currently an environment issue rather than an established code regression.
- Browser validation of the updated sales history and prior ticket/Caja flows has not yet been completed.

## Open questions & assumptions

- Verify daily history in a browser with multiple days, multiple sales, multiple products, quantities, sizes, line amounts, running totals, and final daily totals.
- Confirm the intended ordering within a day and whether the day boundary/timezone should use server time rather than the client device.
- Confirm whether daily totals should aggregate identical products into one row or retain each sold line while only accumulating the monetary total.
- Decide whether history needs filtering, search, pagination, printing, export, or date-range summaries.
- Decide whether receipts should support printing, downloading, or sharing.
- Confirm whether “total en caja” means opening cash only or current cash including sales, cuts, or withdrawals; current implementation centers on the persisted opening amount.
- Confirm wording and behavior when no opening cash exists, including whether sales should be allowed.
- Define the opening-cash calendar-day timezone and whether corrections require an audit trail.
- Verify currency formatting, decimal handling, invalid/negative amounts, and historical sale totals.
- Verify grouped inventory rows with varied size ranges, zero stock, long descriptions, and horizontal scrolling.
- Verify barcode entry, single-/multi-size sales, disabled sold-out sizes, submitted size, and superuser-only stock updates through direct requests.
- Confirm handling of legacy articles with one code per size and database constraints for shared model codes.
- Verify article-level pause/delete behavior with historical sales, RLS, and foreign-key edge cases.
- Resolve missing database environment variables and rerun the production build.
- Confirm first-admin bootstrapping and the boundary between Supabase Auth and custom user records.
- SMS recovery provider and credentials remain undecided.