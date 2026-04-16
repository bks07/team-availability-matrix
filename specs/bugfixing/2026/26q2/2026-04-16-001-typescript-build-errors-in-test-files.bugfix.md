---
status: NEW
jira: ASD-16
---

# Build Failure – TypeScript Errors in Frontend Test Files

## CURRENT BEHAVIOR

Running `docker compose up --build` fails during the frontend builder step. The `RUN npm run build` command triggers TypeScript type checking, which reports three errors across two test files:

1. `src/pages/TeamsPage.test.tsx(508,13): error TS6133: 'initialLeft' is declared but its value is never read.`
2. `src/pages/admin/UsersPage.test.tsx(81,5): error TS2322: Type '2' is not assignable to type 'null'.`
3. `src/pages/admin/UsersPage.test.tsx(90,5): error TS2322: Type '2' is not assignable to type 'null'.`

These TypeScript strict-mode violations cause `vite build` to exit with a non-zero code, blocking the entire Docker build.

## EXPECTED BEHAVIOR

The frontend Docker build should complete successfully. All test files must pass TypeScript strict-mode checks without errors:

- No unused local variables (TS6133) in test files.
- Mock object property assignments must be type-compatible with their declared types (TS2322).

## IMPACT

- The application cannot be built or deployed.
- All CI/CD pipelines that rely on `docker compose up --build` are blocked.
- No other code changes can be shipped until this is resolved.

## STEPS TO REPRODUCE

1. Run `docker compose up --build` from the project root.
2. Observe the frontend builder step fail at `RUN npm run build`.
3. The error log shows three TypeScript errors in `TeamsPage.test.tsx` and `UsersPage.test.tsx`.

## ROOT CAUSE

### Error 1 – Unused variable `initialLeft` (TS6133)

In `src/pages/TeamsPage.test.tsx`, line 508, the test "updates indicator style when active tab changes" declares:

```ts
const initialLeft = indicator.style.left;
```

This variable is assigned but never referenced afterward. TypeScript's `noUnusedLocals` strict check flags it.

### Error 2 & 3 – Type mismatch on mock properties (TS2322)

In `src/pages/admin/UsersPage.test.tsx`, the top-level mock object `mockUseUsersPage` declares:

```ts
editModalUserId: null,
passwordModalUserId: null,
```

TypeScript infers these properties as type `null`. In the test bodies at lines 81 and 90, the tests assign:

```ts
mockUseUsersPage.editModalUserId = 2;
mockUseUsersPage.passwordModalUserId = 2;
```

Since `2` (type `number`) is not assignable to type `null`, TypeScript reports TS2322.

## ADDITIONAL INFORMATION

- Target app: `team-availability-matrix`
- Affected files:
  - `frontend/src/pages/TeamsPage.test.tsx`
  - `frontend/src/pages/admin/UsersPage.test.tsx`
- This is a test-only fix; no production source code changes are required.
- A prior related bugfix (ASD-12) addressed an identical class of error (TS6133 unused variable) in `MyTeamsTab.test.tsx`.
