# Test Strategy

## Goal

The repository uses a single-entry orchestration model. The user should only need to select `Manager` and type `Start`.

From there, the workflow must:

1. Pull the next ready requirement from Jira.
2. Create or update the correct specification files.
3. Implement the required changes.
4. Run the required automated testing.
5. Prevent untested code from reaching `develop`.
6. Feed testing discoveries back into the specification workflow when broader rework is required.

## Entry Point

The only user-facing trigger is `Manager` with the prompt `Start`.

The `Manager` is responsible for running the complete cycle across the three orchestrators:

1. `Specification / Orchestrator`
2. `Developing / Orchestrator`
3. `Testing / Orchestrator`

No direct user interaction with lower-level agents is required for the normal workflow.

## Orchestrator Responsibilities

### `Manager`

- Owns the overall Jira-to-spec-to-code-to-test loop.
- Is the only intended user entry point.
- Keeps the active work item in progress until it is either tested and promoted or explicitly blocked.
- Promotes changes to `develop` only after testing passes.

### `Specification / Orchestrator`

- Is the only contact point for specification sub-agents.
- Supports three orchestration modes:
	- `Start`: fetch next Jira item and create initial spec deltas.
	- `Spec Maintenance`: apply testing-driven or manager-driven spec maintenance.
	- `Finalize Implemented Specs`: mark implemented specs `DONE` after tested promotion.

### `Developing / Orchestrator`

- Is the only contact point for development sub-agents.
- Consumes the active spec deltas from `Manager`.
- Produces implementation changes and local validation results.
- Must not merge or push implementation code to `develop`.

### `Testing / Orchestrator`

- Is the only contact point for testing sub-agents.
- Runs the testing gate for the current implementation scope.
- Can request spec maintenance only through `Specification / Orchestrator`.
- Returns either `Ready to promote to develop` or `Block promotion to develop`.

## Full Workflow

### 1. Jira Intake

`Manager` delegates `Start` to `Specification / Orchestrator`.

`Specification / Orchestrator`:

- fetches the highest-ranked ready Jira work item,
- transitions it to `In Progress`,
- plans spec work,
- delegates to the correct spec scribes,
- updates `NEW`, `CHANGED`, or `OBSOLETE` through `Specification / Status`,
- reports the resulting spec deltas.

If no Jira work item exists, the workflow ends cleanly.

### 2. Implementation

`Manager` passes the active Jira work item and active spec deltas to `Developing / Orchestrator`.

`Developing / Orchestrator`:

- plans implementation from the active spec set,
- delegates coding and design work,
- runs local validation,
- returns a test-ready implementation summary,
- confirms that nothing has been merged or pushed to `develop`.

### 3. Testing Gate

`Manager` passes the active work item, active spec deltas, and implementation summary to `Testing / Orchestrator`.

`Testing / Orchestrator` decides which parts of the test stack are required:

- Rust unit tests
- Rust integration tests with real PostgreSQL
- React unit and component tests with Vitest and Testing Library
- Playwright E2E tests
- Docker Compose-backed environment tests where needed
- CI workflow updates and verification where relevant

It delegates to the appropriate testing specialists and finishes with `Testing / Test Quality Reviewer`.

### 4. Promotion Decision

If testing passes:

1. `Manager` promotes the tested changes to `develop`.
2. `Manager` asks `Specification / Orchestrator` to finalize the implemented spec files.
3. `Specification / Orchestrator` sets those files to `DONE` through `Specification / Status`.

If testing blocks promotion:

- promotion does not happen,
- untested code must not be pushed to `develop`.

## Testing-Driven Spec Maintenance

Testing may reveal issues that cannot be addressed as a small test-only fix.

Examples:

- a new bugfix spec is needed,
- a technical initiative must be split out,
- an existing story or rebrush spec is incomplete,
- the implementation needs a broader rework than the current spec describes.

In those cases:

1. `Testing / Orchestrator` must not talk directly to spec scribes.
2. `Testing / Orchestrator` delegates to `Specification / Orchestrator` in `Spec Maintenance` mode.
3. `Specification / Orchestrator` creates or updates the required spec files.
4. The resulting follow-up spec deltas are returned to `Manager`.
5. `Manager` keeps the same Jira work item active and starts another implementation/testing pass for the new active spec deltas.

This creates an inner remediation loop:

1. Implement current active spec deltas.
2. Test them.
3. If testing requires larger rework, create follow-up specs.
4. Re-implement against those updated specs.
5. Re-test.
6. Promote only after the gate passes.

## Quality Gate Rules

These rules are mandatory:

1. No implementation code is pushed to `develop` before testing passes.
2. No spec file is marked `DONE` before tested promotion to `develop`.
3. Orchestrators remain the only contact points for their specialist sub-agents.
4. `Manager` is the only intended user entry point for the normal delivery cycle.

## Test Layers

### Rust Unit Tests

- Scope: pure backend logic and deterministic handler-adjacent behavior.
- Runner: `cargo test`.

### Rust Integration Tests

- Scope: SQL, persistence, auth persistence, and behavior that depends on real PostgreSQL.
- Environment: local PostgreSQL through Docker Compose or equivalent real database setup.
- Runner: `cargo test` with a real PostgreSQL-backed environment.

### Frontend Unit and Component Tests

- Scope: React rendering, interaction, hooks, and local UI logic.
- Runner: `npm run test`.
- Stack: Vitest, Testing Library, jsdom.

### UI End-to-End Tests

- Scope: user journeys across the real stack.
- Runner: `npm run test:e2e`.
- Stack: Playwright.

### CI Verification

- Scope: GitHub Actions workflows and the same logical test contract on Ubuntu.
- Owner: `Testing / CI Engineer`.

## Local Test Commands

Current local entry points are:

```bash
cd backend && cargo test
cd frontend && npm run typecheck
cd frontend && npm run test
cd frontend && npm run test:e2e
cd /home/bks707/Projects/team-availability-matrix && docker compose up -d postgres
```

PostgreSQL-backed testing should use the Compose-managed database where real DB behavior is required.

## Linux and Tooling Notes

The repository is prepared so the agents can use:

- Node and npm for frontend tests
- Rust and Cargo for backend tests
- Docker Compose for PostgreSQL-backed testing
- Playwright Chromium for browser tests

Optional host-level utilities such as `psql` are useful but are not required for the validated agent workflow as long as Docker Compose is available.

## Expected Outcome

When the system is working correctly, the repository supports this operator model:

1. Select `Manager`.
2. Type `Start`.
3. Let the orchestrators pull from Jira, create specs, implement, test, and only then promote tested code to `develop`.

That is the intended steady-state workflow for this project.
