# Technical Initiative: Migrate Frontend from Angular to React

## WHAT

Replace the current Angular frontend with a React frontend while preserving existing product behavior.

The implementation must:

- Replace Angular project structure and dependencies in the frontend workspace.
- Rebuild the existing UI flows in React.
- Preserve functional behavior and API usage.

## WHY

- Simplify frontend development with a leaner component model.
- Align the frontend stack with team preferences and hiring familiarity.
- Reduce framework-specific complexity in day-to-day maintenance.
- Improve developer experience with the React ecosystem and tooling.

## IN-SCOPE

- Rebuild `frontend/` with React and TypeScript (Vite preferred).
- Migrate all current user-facing flows from Angular to React:
  - authentication (register and login)
  - availability matrix rendering
  - status updates and status cycling behavior
- Preserve API base URL integration with `http://localhost:3000/api`.
- Preserve authentication session behavior using `availability-matrix.session` in local storage.
- Preserve matrix cell key format `${userId}:${date}`.
- Preserve status domain values and transitions (`W`, `V`, `A`).
- Remove Angular-specific source files and configuration from the frontend app.
- Update `.gitignore` to remove Angular-specific artifacts and include React/Vite artifacts.
- Update frontend documentation and run/build instructions for React.

## OUT-OF-SCOPE

- Any backend implementation changes in Rust/Axum.
- Database schema or migration changes.
- API contract changes (request and response shape).
- New product features unrelated to framework migration.

## ACCEPTANCE CRITERIA

- React frontend provides feature parity with the previous Angular frontend for all existing user flows.
- Authentication behavior remains unchanged from user perspective.
- Matrix behavior remains unchanged from user perspective, including status transitions.
- Frontend compiles and runs successfully using the new React toolchain.
- Angular dependencies and Angular-specific build/runtime artifacts are removed from the frontend application.
- Existing backend endpoints are consumed without contract changes.
- Documentation reflects the React setup and developer commands.

## ADDITIONAL INFORMATION

Suggested implementation sequence:

1. Initialize React + TypeScript frontend structure (Vite preferred).
2. Implement shared API and auth session utilities.
3. Rebuild authentication screens and flows.
4. Rebuild matrix UI and interaction logic.
5. Add or update tests for critical user flows.
6. Remove legacy Angular artifacts and finalize docs.

Notes:

- Keep behavior compatibility as the primary objective.
- If any behavior must change due to framework differences, document the delta explicitly before merging.
