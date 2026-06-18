# Implementation Plan

Working name: TBD (candidates: Throughline, Flowcraft, Cardinal).

## What this is

A themeable, export-first editor for structured process diagrams: process boards,
journey maps, and (planned) branching flowcharts. Inline editing, color theming,
PNG/PDF export. Goal is a portfolio-grade hosted demo, AI-assisted, built around
one real customer's franchise onboarding process.

Current state: single self-contained `index.html` (no build step, CDN libs:
Lucide, html2canvas, jsPDF).

## Done (verified in a live browser)

- Export bug: editable colored boxes vanished in PNG/PDF. Cause was a blanket
  `background:transparent` on `[contenteditable]` during export. Removed it.
  Verified by counting colored pixels in the real html2canvas output.
- Delete UX: 20px faded button, 240ms hover-intent, two-stage arm preview.
- Autosave: debounced `localStorage` of board HTML + color theme, restore on load,
  reset-to-template button. One MutationObserver + input listener drives it.

## The one architectural decision

Today the live DOM is the source of truth. That caps every future feature
(multi-type, undo, drag-reorder, AI generation, sharing). The whole plan rests on
extracting a JSON data model and rendering from it. A "chart type" becomes a
**template** (layout mode + block palette + theme defaults + AI prompt), which is
data, not code. Do this first; everything else is cheap after.

## Phases

### Phase 0 — Data model + portability (single file, no hosting)
- Define the board JSON schema. Render the franchisee journey from it (template #1).
- JSON export/import (also the foundation for URL sharing in Phase 1).
- Undo/redo across all edits (autosave snapshots already give most of the machinery).
- Exit criteria: the current board round-trips through JSON with no visual diff.

### Phase 1 — Hosted demo
- Scaffold with the official CLI (`npm create vite@latest`), port `index.html` in.
  No hand-written build config.
- Deploy to Vercel.
- Share via state encoded in the URL. No backend, no DB, no auth.
- Exit criteria: a shareable link reopens an identical board.

### Phase 2 — AI generation (the headline)
- "Describe your process" or paste an SOP, Claude returns board JSON.
- Server route on Vercel (Anthropic via AI Gateway).
- Exit criteria: a plain-text process produces an editable, on-brand board.

### Phase 3 — Flow mode (connectors)
- Second layout mode: a graph of `{ nodes, edges }` instead of columns of cards.
- Nodes reuse the existing card renderer. New work is confined to:
  - SVG edge layer (arrowheads, 1-to-many branch, many-to-1 merge, elbow routing).
  - Auto-layout via a library (elkjs or dagre), not hand-rolled.
  - Two node shapes (start/end pill, decision) as CSS variants of the card.
  - Bulleted-list block and an assignment/TODO chip block.
- Fixture / target spec: the franchise approval flow (see below).
- Watch: html2canvas must capture absolute nodes + SVG edges together; may need a
  different exporter (html-to-image).
- Exit criteria: the approval flow below renders from JSON and exports cleanly.

## Scope of chart family (what to build, what to refuse)

Litmus test: boxes of text in rows/columns/grid, no connectors, no numeric axes →
in scope. Arrows between nodes → flow mode (Phase 3). Numeric data or axes → out.

- Tier 1 (cheap, same engine + a layout mode): kanban, roadmap, pricing cards,
  customer journey map, comparison matrix, SWOT, RACI, checklist/SOP.
  Needs only three layout modes: columns-of-stacks, semantic grid, single stack.
- Tier 2 (deliberate, Phase 3): flowchart, timeline. Org chart / mind map only if
  a real need appears (auto-layout heavy).
- Out of scope: quantitative charts (bar/line/pie), Gantt, UML/ER/network graphs,
  free-form whiteboard. Wrong engine and/or commoditized.

## Flow-mode target spec (the franchise approval flow)

Node graph:
- `Application Received` → `Step 1: Accept Application` → `Decision Point`
- `Decision Point` branches to `Step 2: Financial Check`, `Step 3: Approved`, `Step 4: Declined`
- `Step 4: Declined` → `Process Ends` (terminal)
- `Step 2` → `Awaiting Financial Submission` → `Financial Check Completed` → converge
- `Step 3` → converge
- Step 2 path and Step 3 path both converge → `Post-Approval State`
- Implicit (text-described, not drawn): Decision Point auto-declines after 7 days;
  Step 2 auto-declines after 5 days.

Recurring block to model: a "Sana to share email content" assignment chip (appears
on four nodes).

## Open decisions

- Project name.
- When to start Phase 1 hosting vs. finishing Phase 0 polish.
- Exporter choice once SVG edges land.
