# Hermes-Like UI/UX Implementation Plan

> **For Hermes:** Implement this plan inside `/Users/mitraa/Desktop/Personal/docker/spectre` only. Do not create, edit, or delete files outside this directory.

**Goal:** Make Spectre feel like Subbu/Hermes from first launch through provider setup, model switching, and agent task assignment/execution.

**Architecture:** Build on the existing Ink React TUI (`src/tui/app.tsx`) and command parser. Keep persistence in the current Spectre config layer, but add richer session state, command affordances, model/provider flows, and task status visualization. Favor minimal focused changes with tests after each slice.

**Tech Stack:** TypeScript, React, Ink, @inkjs/ui, Vitest, existing provider discovery/config/orchestrator modules.

---

## Scope Guard

- Allowed write scope: `/Users/mitraa/Desktop/Personal/docker/spectre/**`
- Do not write to `~/.spectre`, `~/.hermes`, `/tmp`, sibling folders, or any other path while implementing.
- Tests may use temporary directories only if created by the test runner; do not hard-code writes outside the repo.

---

## Target UX

Spectre should expose a Hermes-like operator flow:

1. First-run welcome makes setup obvious and friendly.
2. `/setup` is a full-screen guided model/provider setup flow.
3. `/model` opens an interactive model switcher when used without args, and still supports `/model <name>`.
4. `/agent <task>` assigns work as a visible task with planning/running/completed/failed states.
5. Side/status areas surface active provider, model, status, shortcuts, and task progress.
6. Command palette/help communicate setup, model switching, task assignment, and interruption clearly.

---

## Task 1: Baseline verification

**Objective:** Establish current health before changes.

**Files:**
- Read only: `package.json`, `src/tui/app.tsx`, `src/commands/model.ts`, `src/commands/setup.ts`, `src/agent/orchestrator.ts`

**Steps:**
1. Run `npm run typecheck`.
2. Run `npm test`.
3. Record failures in `.spectre-work/progress.log` if present.

**Verification:** Know whether failures are pre-existing before implementation.

---

## Task 2: Extract provider/model setup state helpers

**Objective:** Reduce duplication between command setup and TUI setup, and make model switching reusable.

**Files:**
- Modify: `src/utils/config.ts`
- Create if useful: `src/ai/provider-options.ts`
- Test: `tests/unit/config.test.ts` or new focused test file

**Steps:**
1. Add exported provider option metadata shared by setup/model UI.
2. Add safe helper(s) for replacing an active provider model.
3. Add tests for active-provider model update behavior.
4. Run targeted tests and typecheck.

**Verification:** Existing `/setup` and `/model <name>` still work; tests pass.

---

## Task 3: Add interactive model switcher state to TUI

**Objective:** When users type `/model` without args, show a Hermes-like interactive selector instead of only printing text.

**Files:**
- Modify: `src/tui/app.tsx`
- Modify: `src/commands/model.ts` only if needed to return a sentinel like `__MODEL_SWITCHER__`
- Test: add/update TUI or command tests if practical

**Steps:**
1. Return a sentinel from `/model` without args when running in TUI.
2. Add `showModelSwitcher` state and keyboard handling in `SpectreApp`.
3. Discover models for the active provider with spinner/loading state.
4. Support arrow navigation, fuzzy filter via `/` or Tab, Enter select, Esc cancel.
5. Persist selected model using config helpers.
6. Update status bar immediately.

**Verification:** `/model` opens selector; `/model <name>` still switches directly.

---

## Task 4: Improve setup wizard polish

**Objective:** Make provider setup feel like Hermes: guided, status-rich, searchable, safe with secrets.

**Files:**
- Modify: `src/tui/app.tsx` or extract `src/tui/components/SetupWizard.tsx`
- Test: component/unit tests if feasible

**Steps:**
1. Mask API key display instead of rendering raw key characters.
2. Fix model discovery fallback logic so it uses the newly discovered list, not stale React state.
3. Add source labels: API/local/fallback.
4. Add final screen with next commands: `/model`, `/agent`, `/help`.
5. Keep Esc cancel behavior.

**Verification:** Setup can complete with fallback models even when discovery fails; no raw key is displayed.

---

## Task 5: Add task assignment view for `/agent`

**Objective:** Make agent tasks visibly assigned and tracked in the UI.

**Files:**
- Modify: `src/tui/app.tsx`
- Modify if useful: `src/agent/orchestrator.ts`
- Test: focused state/render tests if feasible

**Steps:**
1. Introduce task state with id, title, status, completed/total steps, current step, errors.
2. When `/agent <task>` is submitted, render an assignment card: “Assigned to Spectre”.
3. During planning/execution, update a single progress message/card instead of appending noisy duplicate progress messages.
4. Show completed/failed summary with step list.
5. Add interrupt affordance text if current orchestrator supports it.

**Verification:** `/agent demo task` shows clear planning/running/completed/failed progression.

---

## Task 6: Hermes-like command discoverability

**Objective:** Make command usage obvious from inside the TUI.

**Files:**
- Modify: `src/commands/help.ts`
- Modify: `src/tui/app.tsx`
- Modify if needed: `src/tui-lib/components/CommandPalette.tsx`

**Steps:**
1. Add a command palette shortcut hint to the status line if available.
2. Ensure `/help` groups commands by Setup, Models, Agent, Codebase, Session.
3. Include examples for `/setup`, `/model`, `/agent <task>`.
4. Add unknown-command suggestions already present in parser to remain unchanged.

**Verification:** `/help` and welcome screen guide the user through setup → model switch → task assignment.

---

## Task 7: Final validation and docs

**Objective:** Validate and document the new UX.

**Files:**
- Modify: `README.md`
- Possibly create: `docs/ui-ux.md`

**Steps:**
1. Run `npm run typecheck`.
2. Run `npm test`.
3. Run `npm run build`.
4. Update docs with the new operator flow and shortcuts.
5. Record final changed paths and validation results in `.spectre-work/progress.log`.

**Verification:** Build/typecheck/tests pass or documented pre-existing failures remain clearly separated.
