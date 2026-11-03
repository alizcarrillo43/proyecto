# Project memory

## Product intent & audience

- Internal Spanish-language inventory and sales app for Mexican employees.
- Inventory models represent articles with one shared model-level code and multiple shoe sizes, each with its own stock.
- Employees primarily consult inventory and sell products; superusers manage stock and article-level actions.
- Sales history must remain auditable and preserve sold-item details.
- Creating a sale now guides the employee through selecting an article/model first, then selecting its specific size.

## Brand personality & voice

- Direct, instructional Spanish copy suited to operational workflows.
- Stock and availability states should be immediately understandable.
- Error messages should explain the cause and next action.
- Destructive or state-changing actions should clarify their scope and historical impact.

## Visual design & UX direction

- Existing purple visual system should remain unchanged outside targeted inventory/product-selection views.
- Inventory table has four columns in this order: `Código`, `Descripción`, `Precio`, `Existencias por talla`.
- Each article/model appears once. Size data is grouped in one cell with two aligned rows:
  - `#`: size numbers.
  - `Existencia`: available pair quantities directly beneath each size.
- Each model may display its own size range; do not assume a global set of sizes.
- Zero-stock sizes use a light red background and red text.
- Inventory table supports horizontal scrolling on narrow screens without breaking the surrounding layout.
- Employees see inventory as read-only; only the superuser can edit quantities, with editing available per size.
- Article-level pause/delete actions appear under the article description rather than being repeated per size.
- Sales product capture uses two stages:
  - First select one article/model entry, showing its price.
  - Then select an available size for that article.
- Sold-out sizes are visibly disabled in the size selector.
- Scanning or entering a model code with multiple sizes should take the user directly to size selection.
- Preserve the existing session-aware app shell, navigation, typography, and general styles.

## Decisions, constraints & rationale

- Stock is already stored per size as separate `articulos` rows; no `existencias` table or migration was added.
- Inventory and sales data are grouped by model in the API/UI layer so a model is presented once while retaining size-specific stock.
- Newly created models use one shared barcode; older records may still have one barcode per size and therefore can appear as separate rows.
- Article pause and deletion operate on the complete model/article grouping rather than an individual size row.
- Historical sales must not be lost when an article is deleted; sold descriptions, sizes, and prices remain available in history.
- Supabase remains the data/authentication layer with RLS and role-based access.
- Sales lookup and capture were changed to separate model selection from explicit size selection; pricing behavior and the remainder of the sale flow were preserved.
- Latest inventory-table changes touched:
  - `app/(app)/articulos/page.tsx`
  - `components/articulos/eliminar-articulo-dialog.tsx`
  - `lib/inventario-api.ts`
  - `lib/types.ts`
- The latest sales selection change passed type checking.
- Production build remains blocked when database URL/key environment variables are absent; this is an environment issue not yet established as a code regression.

## Open questions & assumptions

- Verify in a browser that grouped rows correctly handle models with different size ranges, zero stock, long descriptions, and horizontal scrolling.
- Verify the sales flow for single-size and multi-size articles, including barcode entry, direct size selection, disabled sold-out sizes, and correct submitted size.
- Verify superuser-only quantity editing and that non-superusers cannot update stock through stale UI or direct requests.
- Confirm whether legacy articles with one code per size should eventually be consolidated or remain displayed as separate rows.
- Verify article-level pause/delete behavior when historical sales exist, including RLS and foreign-key edge cases.
- Confirm the database constraint prevents collisions between distinct models while allowing one code across a model’s size records.
- Resolve missing database environment variables and rerun the production build.
- Confirm first-admin bootstrapping and the exact boundary between Supabase Auth and custom user records.
- SMS recovery provider and credentials remain undecided.