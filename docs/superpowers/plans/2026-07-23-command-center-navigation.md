# Command Center Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make each PracticeOps navigation item functional and refresh the dashboard into a distinctive Figma-informed command center.

**Architecture:** Keep one Angular standalone component and use signals for selected-view state. Reuse the existing dashboard API payload, rendering a focused section for each nav choice.

**Tech Stack:** Angular 20, TypeScript strict mode, Jasmine/Karma, CSS.

## Global Constraints

- Use only fictional data.
- Preserve the modular-monolith API boundary and existing dashboard payload.
- Keep loading, retry, responsive, and keyboard-accessible behavior.

---

### Task 1: Navigation behavior

**Files:** Modify `frontend/src/main.ts`; Test `frontend/src/app.spec.ts`.

- [ ] Add a failing component test asserting that selecting `Claims` changes the visible heading.
- [ ] Add `activeView` signal, view metadata, and click handlers to the rail buttons.
- [ ] Render selected-view content and active button semantics.
- [ ] Run `npm run test -- --watch=false`.

### Task 2: Command-center visual system

**Files:** Modify `frontend/src/main.ts`, `frontend/src/styles.css`.

- [ ] Apply Figma-informed dark ink, cyan active state, data-dense section headers, and status chips.
- [ ] Keep the narrow viewport navigation grid and validate the production build.
- [ ] Run `npm run build`.

### Task 3: Browser validation

**Files:** No source files.

- [ ] Verify Overview and Claims views render in the local browser.
- [ ] Verify no current console errors and commit focused source changes.
