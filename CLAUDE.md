# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # start dev server (Vite HMR)
npm run build     # tsc type-check + Vite production build
npm run lint      # ESLint
npx tsc --noEmit  # type-check only (no output files)
```

There are no tests. Type-check with `npx tsc --noEmit` before considering any change done.

## Architecture

### State — `src/store/plannerStore.ts`

Single Zustand store with `persist` middleware (localStorage key `planner-storage`, version 2). All persistent state lives here:

- `projects: Project[]` — each project owns its `skillSets` and `tasks`
- `selectedProjectId` — which project the views display
- `wpOrders: Record<string, string[]>` — per-project manual WP ordering set by drag-and-drop
- `settings: PlannerSettings` — time unit (sprint/week/month), sprint length, start date

Selectors (`visibleTasks()`, `visibleSkillSets()`) always return data for the selected project only — there is no "all projects" aggregation mode.

The `migrate` function handles upgrading stored state across schema versions. Bump `version` and extend `migrate` whenever the persisted shape changes.

### Data model — `src/types/index.ts`

```
Task { id, workPackage, name, project, workload: Record<skillSetId, number> }
Project { id, name, skillSets: SkillSet[], tasks: Task[] }
SkillSet { id, name }
PlannerSettings { timeUnit, sprintDays, startDate }
```

Workload values are planning units (sprints/weeks/months), not hours.

### Views

`App.tsx` renders one of four views based on `activeView` state; the sidebar handles navigation and project selection.

**WBS (`GridView.tsx`)** — the most complex view. Built on AG Grid Community (v35). Key patterns:
- Three row types discriminated by `_rowType`: real `Task` rows, synthetic `WPHeaderRow` (full-width via `isFullWidthRow` + `fullWidthCellRenderer`), and virtual `BlankRow` (trailing placeholder per WP, never stored in Zustand)
- `rawTasks` = `visibleTasks().filter(t => t.name && t.workPackage)` — blank/unnamed tasks are never persisted
- `wpOrder` = `useMemo` combining task first-appearance order with `extraWPs` state, then applying `wpOrders[selectedProjectId]` from the store
- `extraWPs` = local React state for WPs created via "+ New WP" that have no tasks yet; cleaned up once a real task is added
- Skill set columns use `colId` (not `field`) + explicit `valueSetter`/`valueGetter`; the name column uses `valueSetter` to handle both blank-row task creation and existing-task name updates (required because AG Grid re-evaluates `valueGetter` after `valueSetter` runs to determine if the value changed)
- WP drag-and-drop uses HTML5 drag events on `WPFullWidthRenderer`; reordering writes to `wpOrders` in the store so Resource Planning stays in sync

**Resource Planning (`GanttView.tsx`)** — custom SVG-free timeline. WPs are laid out sequentially; each WP's duration = max skill workload across all its tasks. Reads `wpOrders` from the store to match WBS ordering. Skill row order is draggable and persisted via `reorderSkillSets`.

**Dashboard (`DashboardView.tsx`)** — minimal; shows total task count for the selected project.

**Settings (`SettingsView.tsx`)** — controls `PlannerSettings` (time unit, sprint days, start date).

### AG Grid notes

- Using Community edition only — no Enterprise modules. Row grouping is simulated with full-width rows.
- `ModuleRegistry.registerModules([AllCommunityModule])` is called at module level in `GridView.tsx`.
- `SkillSetHeader` is a custom AG Grid header component (double-click to rename, hover to reveal delete button).

### Path alias

`@/` maps to `src/` (configured in `vite.config.ts` and `tsconfig.app.json`).
