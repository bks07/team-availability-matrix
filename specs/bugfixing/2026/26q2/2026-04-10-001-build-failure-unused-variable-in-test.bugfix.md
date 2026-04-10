---
status: DONE
jira: ASD-12
---

# Build Failure – Unused Variable in Test File

## CURRENT BEHAVIOR

Running `docker compose up --build` fails during the frontend builder step. The `RUN npm run build` command triggers `npm run typecheck`, which reports:

```
src/pages/teams/MyTeamsTab.test.tsx(123,11): error TS6133: 'rows' is declared but its value is never read.
```

This TypeScript strict-mode violation causes `vite build` to exit with code 2, blocking the entire Docker build.

## EXPECTED BEHAVIOR

The frontend Docker build should complete successfully. All test files must pass TypeScript strict-mode checks (`noUnusedLocals`) without unused variable errors.

## IMPACT

- The application cannot be built or deployed.
- All CI/CD pipelines that rely on `docker compose up --build` are blocked.
- No other code changes can be shipped until this is resolved.

## STEPS TO REPRODUCE

1. Run `docker compose up --build` from the project root.
2. Observe the frontend builder step fail at `RUN npm run build`.
3. The error log shows TS6133 for `rows` in `MyTeamsTab.test.tsx` at line 123.

## ROOT CAUSE

In `src/pages/teams/MyTeamsTab.test.tsx`, line 123, the test "shows em dash for empty description" declares:

```ts
const rows = screen.getAllByRole('row');
```

This variable is never referenced in any subsequent assertion or logic within the test. TypeScript strict mode (`noUnusedLocals`) correctly flags this as error TS6133.

## FIX GUIDANCE

Remove the unused `const rows` declaration on line 123, since the test already queries the DOM directly via `document.querySelectorAll('td.teams-col-desc')` for its assertions. No other lines in the file depend on `rows`.

## ACCEPTANCE CRITERIA

- [ ] The unused `rows` variable declaration is removed from `MyTeamsTab.test.tsx`.
- [ ] `npm run typecheck` passes with zero errors.
- [ ] `npm run build` (i.e. `vite build`) completes successfully.
- [ ] `docker compose up --build` succeeds for the frontend service.
- [ ] Existing test behavior is unaffected (the test still validates em-dash rendering).
