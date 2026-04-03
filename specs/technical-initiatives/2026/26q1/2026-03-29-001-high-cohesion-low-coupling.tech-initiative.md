---
status: DONE
---

# Technical Initiative: Enforce High Cohesion and Low Coupling

## WHAT

Decompose the monolithic backend into a modular file structure where each file has a single, well-defined purpose. Apply the same structural discipline to frontend files that have grown beyond a single responsibility. Every source file in the project should adhere to the One-Thing Rule: export exactly one primary entity or serve exactly one cohesive concern.

## WHY

The backend is a single file containing all request/response types, all handler functions, all helper utilities, all database logic, and the application entry point. This structure violates High Cohesion (unrelated concerns are grouped together) and creates implicit Low Coupling violations (any change risks unintended side effects across unrelated features). As the application grows, this monolith will become increasingly difficult to navigate, review, test in isolation, and extend safely.

On the frontend, most files follow good separation, but several page components have grown to combine form state management, API orchestration, and rendering logic in a single file, making them harder to reason about and test independently.

Enforcing High Cohesion and Low Coupling across the entire codebase will improve maintainability, enable parallel development, reduce merge conflicts, and align the project with the Coder agent's structural requirements for safe, scoped implementation.

## IN-SCOPE

### Backend

- Decompose the single-file backend into a module structure where each module serves one cohesive domain concern.
- Separate request and response types from handler logic so that data contracts are independently defined.
- Separate database row types from API-facing types.
- Isolate handler functions by domain area so that each domain's handlers live in their own module.
- Extract shared helper functions and utilities into dedicated modules.
- Extract database initialisation logic from the application entry point.
- Extract authentication and authorisation logic into a dedicated module.
- Use Rust visibility modifiers (`pub`, `pub(crate)`, private) strictly to expose only what is needed across module boundaries.
- Ensure the application entry point (`main`) is minimal: configuration, initialisation, and router assembly only.

### Frontend

- Extract business logic from page components that combine form state, API calls, and rendering into a single file.
- Use custom hooks to decouple data-fetching and state management from UI rendering where page components exceed a single responsibility.
- Ensure each component file exports exactly one component.

## OUT-OF-SCOPE

- Changes to API contracts (request and response shapes remain identical).
- Changes to database schema or queries.
- Changes to application behavior, business rules, or user-facing functionality.
- New product features unrelated to the structural refactoring.
- Introduction of new frameworks, ORMs, or architectural patterns (e.g. CQRS, hexagonal architecture).
- Performance optimisations beyond what naturally results from better structure.
- Test creation (testing is a separate initiative; this initiative focuses on structural decomposition only).
- CSS or visual changes of any kind.

## ACCEPTANCE CRITERIA

- No source file combines more than one primary domain concern.
- Every backend module has a clear, single responsibility evident from its name and contents.
- The backend entry point (`main` function) contains only configuration, initialisation, and router assembly — no handler logic, no type definitions, no helper functions.
- All request/response types are separated from the handler functions that use them.
- All database row types are separated from API-facing types.
- Authentication and authorisation logic is isolated and reusable without importing handler-specific code.
- Shared helpers and validation functions are in dedicated utility modules, not co-located with unrelated handlers.
- Rust visibility modifiers are applied strictly: internal implementation details are private; only the module's public API is exposed.
- Frontend page components that previously combined data management and rendering are split into a rendering component and a custom hook (or equivalent separation).
- Each frontend component file exports exactly one component.
- `cargo build`, `cargo clippy`, and `cargo test` pass without errors or warnings.
- `npm run build` and `npm run typecheck` pass without errors.
- All existing API endpoints behave identically from the frontend perspective.
- No functional regression: the application works exactly as before from the user's perspective.

## ADDITIONAL INFORMATION

### Guiding Principles

These principles — derived from the Coder agent's implementation standards — define the quality bar for this refactoring:

1. **One-Thing Rule:** Each file should export exactly one primary entity.
2. **High Cohesion:** Group related logic within a single file. A module about locations should contain only location-related code.
3. **Low Coupling:** Minimise the knowledge one file has about the inner workings of another. Favour explicit interfaces over reaching into sibling module internals.
4. **Flattened Hierarchy:** Prefer composition over deep nesting. Keep module hierarchies shallow and independent.
5. **Explicit Flow:** Keep control flow readable and deterministic. Avoid hidden dependencies between modules.

### Constraints

- The refactoring must be behaviour-preserving. No API contract changes, no schema changes, no feature changes.
- The inline `CREATE TABLE IF NOT EXISTS` approach for database initialisation is preserved. No migration framework is introduced.
- The suggested implementation sequence below is a recommendation for the agents. The agents decide on the concrete file structure and module boundaries during implementation.

### Suggested Implementation Sequence

1. Define the backend module structure and create module files.
2. Extract types (request, response, database row) into their respective modules.
3. Extract handler functions by domain area into their respective modules.
4. Extract authentication, authorisation, and shared helpers into utility modules.
5. Reduce the entry point to configuration, initialisation, and router assembly.
6. Apply strict Rust visibility modifiers across all modules.
7. Extract frontend custom hooks from page components that exceed a single responsibility.
8. Full build, lint, type-check, and runtime verification.
