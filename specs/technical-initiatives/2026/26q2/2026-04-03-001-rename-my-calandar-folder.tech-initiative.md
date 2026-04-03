---
status: NEW
---

# Rename my-calandar folder

## What

The spec folder `specs/product-areas/workspace/my-calandar/` contains a typo — "calandar" should be "calendar". This technical initiative renames the folder and updates all cross-references.

## Why

The misspelling creates confusion when navigating the spec tree and could propagate to documentation or tooling that references spec paths. Correcting it now prevents the typo from becoming entrenched in more places.

## Scope

### Files to rename

The folder and its contents:
- `specs/product-areas/workspace/my-calandar/` → `specs/product-areas/workspace/my-calendar/`

Contained files (paths update automatically with the folder rename):
- `clear-status-from-calendar.story.md`
- `enrich-calendar.story.md`
- `set-status-from-calendar.story.md`
- `view-my-calendar.story.md`

### Cross-references to update

Any spec files that reference the old `my-calandar` path in their dependency, additional information, or out-of-scope sections must be updated to use `my-calendar`.

### NOT in scope

- Frontend route paths (the app uses `/my-calendar` which is already correct).
- Backend code (no reference to this spec folder path).
- File content within the `my-calendar/` folder (only the folder name changes, not file contents).

## Risks

- Git history for the files will show a rename. No content is lost.
- If any automation or CI references the old folder path, it will need updating.

## Acceptance criteria

1. The folder is renamed from `my-calandar` to `my-calendar`.
2. All 4 story files inside the folder are accessible at their new paths.
3. No spec file anywhere in `specs/` references the old `my-calandar` path.
4. Git tracks the change as a rename (not delete + create) to preserve history.