# Flowchart View Implementation Plan

> **For agentic workers:** Executed inline this session. Steps use checkbox (`- [ ]`) tracking. Project has no automated test framework; each task ends with a concrete in-browser verification (per approved spec §7).

**Goal:** Add an independent, editable free-canvas flowchart view that coexists with the existing step diagram, defaulting to the flowchart, reproducing the three source images, with fully editable blocks and connectors.

**Architecture:** Single-file `index.html`, pure DOM + CDN libs (Lucide, html2canvas, jsPDF). Flowchart = absolutely-positioned block `<div>`s on a pan/zoom canvas + an `<svg>` edge layer whose paths are recomputed from block geometry. Connectors are an in-memory record array (re-rendered on any layout change) so they serialize cleanly alongside block HTML.

**Tech Stack:** Vanilla JS, CSS variables for theming, Lucide icons, localStorage persistence, CompressionStream for share links.

## Global Constraints

- Single file `index.html`; no build step; only CDN dependencies already present.
- Diagram/box copy is verbatim English (incl. original casing); UI chrome is Chinese.
- Icons via Lucide only.
- Default view on load = flowchart (`#flow-view`); step diagram (`#step-view`) hidden.
- Two views persist independently (separate localStorage keys); step-diagram behavior unchanged.
- Untrusted HTML (imports/share) always passes through `safeBoardHtml()`.
- Editing affordances (anchors, handles, selection, grid) never appear in PNG/PDF export.
- Default connector routing = elbow (orthogonal) with a solid arrowhead on the end.

---

## File Structure

- Modify only `index.html`:
  - `<head>` CSS: add flowchart-scoped styles (canvas, blocks, edge layer, anchors, handles, contextual sidebar, view toggle).
  - `<body>`: add view toggle to toolbar; wrap existing board in `#step-view`; add `#flow-view` (canvas + svg + blocks); add contextual sidebar; add connector toolbar buttons.
  - `<script>`: add flowchart module (canvas/pan/zoom, block model, connector model + geometry, sidebar, flow serialization), and make existing autosave/export/JSON/share view-aware.

---

## Task 1: View scaffolding + toggle (default flowchart)

**Files:** Modify `index.html` (toolbar, body wrappers, view-switch JS).

**Produces:** `setView('flow'|'step')`, `currentView()`, `#flow-view`, `#step-view`, `#flow-canvas`, `#flow-blocks`, `#flow-edges` (svg).

- [ ] Wrap existing `.page`/board markup region in `<div id="step-view" hidden>`; add sibling `<div id="flow-view">` containing `.flow-canvas > (#flow-blocks, svg#flow-edges)`.
- [ ] Add a segmented toggle to `.toolbar`: buttons `流程图` / `步骤图` calling `setView(...)`; mark active state.
- [ ] `setView` toggles `[hidden]` on the two views, persists last view, re-renders edges when entering flow.
- [ ] On boot, default to flow view.
- [ ] **Verify:** Page loads showing empty flow canvas; toggle swaps to the original step diagram and back; step diagram still fully works.

## Task 2: Canvas pan/zoom + grid

**Produces:** `flowState.scale/panX/panY`, `applyTransform()`, `clientToCanvas(x,y)`, `screenToCanvasRect(el)`.

- [ ] `#flow-blocks` and `#flow-edges` share a transform via a `.flow-world` wrapper translated/scaled by `flowState`.
- [ ] Wheel = zoom around cursor (clamp 0.25–2.0); drag empty canvas = pan; toolbar `+ / − / 适应(fit)` buttons.
- [ ] Light grid background that scales with zoom; grid hidden during export.
- [ ] **Verify:** Wheel zooms toward cursor; dragging blank space pans; fit recenters.

## Task 3: Block model — render, select, move, resize

**Produces:** `mkBlock(opts)->el`, `selectEl(el|null)`, `blockId(el)`, `recomputeEdges()` hook called on move/resize; `.fb` block class; resize via bottom-right handle.

- [ ] Block = `div.fb[data-id]` absolutely positioned (`left/top/width/height` inline). Header (`.fb-head`, optional) + body (`.fb-body`) with the existing item types reused (`.card-body/.field/.btn/.note/.card-icon`).
- [ ] Pointer-drag body to move (snap to grid); bottom-right handle to resize; both call `recomputeEdges()` live.
- [ ] Click selects (selection ring); click blank clears selection; `Esc` clears.
- [ ] Block variants via class: `fb-step`, `fb-decision`, `fb-terminal`, `fb-status`, `fb-note` (style only).
- [ ] **Verify:** A test block can be dragged, resized, selected/deselected.

## Task 4: SVG connector model + geometry

**Produces:** `connectors[]` array; `Edge` record (§4.4 fields); `renderEdges()`, `edgePath(rec)->{d,labelPoint}`, `anchorPoint(blockId,anchor)`, `nearestAnchor(blockId, towardPt)`.

- [ ] Define record shape and an `connectors` array. `renderEdges()` clears `#flow-edges` and rebuilds one `<path>` (+ optional `<text>`/label) per record, with `<marker>` arrowheads keyed by `arrowType`, dash by `lineStyle`, stroke `width/color`.
- [ ] `anchorPoint`: returns canvas-space point for a block edge/center; `auto` picks nearest side toward the other endpoint.
- [ ] Routing: `straight` (line), `elbow` (orthogonal H/V mid-split), `curved` (cubic). Compute `labelPoint` at `labelT` along the path.
- [ ] `recomputeEdges()` = `renderEdges()`; called on any block move/resize, pan/zoom, add/delete.
- [ ] **Verify:** Two manually-seeded blocks with one elbow connector render an arrow that follows when either block moves; switching routing/lineStyle/arrowheads in console changes rendering.

## Task 5: Connector creation + endpoint editing

**Produces:** anchor handles on hover/selection; drag-to-connect; `addFreeSegment()`; endpoint drag rebinds (snap to block anchor) or sets free `{x,y}`.

- [ ] On block hover/select, show 4 anchor dots; pointer-down on a dot + drag → live preview path → drop on a block (bind `to`) or empty (free `to`) → push record + `renderEdges()`.
- [ ] Toolbar `+ 线段` → `addFreeSegment()` places a centered 2-free-endpoint connector.
- [ ] Selecting a connector shows draggable endpoint handles; dragging snaps to a nearby block anchor (bind) else free coords.
- [ ] Delete selected connector (button + `Delete` key) with undo toast.
- [ ] **Verify:** Can draw a bound arrow between two blocks, add a free segment, drag endpoints to rebind, delete a connector with undo.

## Task 6: Connector labels

**Produces:** `setEdgeLabel(rec,text)`; foreignObject/`<text>` label rendered at `labelPoint`, click-to-edit, deletable.

- [ ] Render label (if non-empty) as an editable HTML label positioned at `labelPoint`; double-click connector or sidebar field to edit; clearing removes it.
- [ ] **Verify:** Add text on a line, edit it, delete it; label tracks the line when blocks move.

## Task 7: Contextual property sidebar

**Produces:** `renderSidebar()` switching on selection: block / connector / text-selection / none.

- [ ] Right sidebar panel; `renderSidebar()` driven by current selection:
  - Block: block bg, header bg, text color (CSS vars or inline), reuse existing add-item menu, delete block.
  - Connector: arrowStart/arrowEnd toggles, arrowType, lineStyle, routing, width, color, label text (add/clear).
  - Text selection: reuse inline bold/color tool.
  - None: global theme colors (reuse `COLORS` panel) + canvas (grid toggle, fit).
- [ ] Wire every control to mutate the selected object + `recomputeEdges()`/`scheduleFlowSave()`.
- [ ] **Verify:** Selecting a block vs a connector shows the right controls; each control visibly works.

## Task 8: Flow add/delete affordances (blocks + items)

**Produces:** `addFlowBlock(type)`, reuse delete-block logic for `.fb` and inner items.

- [ ] Toolbar `+ 组块` menu adds each block variant at canvas center.
- [ ] Extend the existing hover-delete `RM_SELECTOR` + add-`+` logic to operate inside `#flow-blocks` (whole `.fb` and inner minimal items), with undo.
- [ ] Add inner items (text/field/button/note/icon) into a selected block via the existing add menu.
- [ ] **Verify:** Add each block type; delete a whole block and an inner item with undo; add inner items.

## Task 9: Flow serialization + autosave + restore

**Produces:** `serializeFlow()->{blocksHtml,connectors,colors}`, `restoreFlow()`, `FLOW_LS_KEY`, view-aware `scheduleSave`.

- [ ] `serializeFlow`: clone `#flow-blocks` (strip editing UI), capture `connectors` array + colors.
- [ ] Autosave: observe flow mutations + connector changes → debounce → save under `flowchart-state-v1`; step view keeps its own key.
- [ ] Boot: restore flow (blocks → colors → rebuild edges); if none, build initial template (Task 11).
- [ ] `重置模板` resets the active view only.
- [ ] **Verify:** Edit flow, reload → structure + connectors + colors restored; step view independent.

## Task 10: View-aware export / JSON / share

**Produces:** export/JSON/share operate on the active view; flow payload includes connectors; backward-compatible import.

- [ ] PNG/PDF: snapshot the active view's export target (flow: the world bounds incl. SVG) with editing UI hidden.
- [ ] JSON export wraps `{view, payload}`; import routes by `view` (legacy files w/o `view` → step). Reuse `safeBoardHtml`.
- [ ] Share link: same wrapper, gzipped hash; loader routes to correct view.
- [ ] **Verify:** Export PNG of flow shows arrows, no handles; JSON round-trips; share link restores into flow view.

## Task 11: Author initial flowchart content

**Produces:** `buildFlowTemplate()` creating all blocks (verbatim copy per spec §3) at laid-out coordinates + default connectors.

- [ ] Create blocks: Application Received (terminal) → STEP 1 → DECISION POINT → STEP 2 / STEP 3 / STEP 4 (row) → STEP 2: Awaiting → Completed → POST-APPROVAL STATE; STEP 4 → Process Ends; convergence note.
- [ ] All copy verbatim from spec §3; icons per spec §5 mapping; per-variant theme colors.
- [ ] Default elbow connectors with end arrowheads wiring the structure (decision → 3 branches; both approval paths → POST-APPROVAL).
- [ ] **Verify:** Fresh load (cleared storage) shows the full flowchart matching the three images' content and structure.

## Task 12: Export-hygiene + polish + full walkthrough

- [ ] Ensure `body.exporting` hides anchors, handles, selection rings, grid, sidebar, toolbars across flow view.
- [ ] Keyboard: `Delete` removes selection; `Esc` deselects. Cursor affordances for pan/move/resize.
- [ ] Run the full §7 verification walkthrough in a browser; fix issues.
- [ ] **Verify:** All §7 checks pass.

---

## Self-Review

- **Spec coverage:** view toggle+default (T1) ✓; canvas (T2) ✓; blocks move/resize/select/variants (T3) ✓; connector model + all editable fields (T4–T6) ✓; sidebar (T7) ✓; add/delete blocks+items (T8) ✓; serialization/autosave (T9) ✓; export/json/share view-aware (T10) ✓; initial content verbatim (T11) ✓; export hygiene + verification (T12) ✓.
- **Placeholder scan:** none; each task has concrete deliverable + verify.
- **Type consistency:** `recomputeEdges`/`renderEdges`/`connectors`/`serializeFlow`/`setView` names used consistently across tasks.
