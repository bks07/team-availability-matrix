# Documentation Index

This folder is the source of truth for agent execution.
Each markdown document defines work that agents should plan and implement.

Use this index to understand:

1. Which folder to use.
2. What kind of change is expected.
3. How agents should turn documentation into implementation tasks.

## Folder Overview

### Product Areas

Folder: `./product-areas`

Product area docs describe user-facing functionality.
They define behavior that users can see and use.

Typical outputs:

- New features.
- Enhancements to existing features.
- UX improvements tied to product behavior.

Execution guidance:

- Planner should map each product area document to feature-oriented tasks.
- Orchestrator should assign Coder and Designer based on task type.
- Coder and Designer should implement only the scoped changes described in the plan.

### Rebrushes

Folder: `./rebrushes`

Rebrushes are frontend-only redesign efforts.
They are intentionally broad visual and interaction updates focused on usability and presentation.

Typical outputs:

- Updated information hierarchy.
- New visual language.
- Revised interaction patterns and responsive behavior.

Execution guidance:

- Designer leads the design direction and accessibility requirements.
- Coder implements approved design decisions.
- Orchestrator should split work into phases to avoid file overlap.

### Technical Initiatives

Folder: `./technical-initiatives`

Technical initiatives are non-functional improvements.
They should improve system quality without changing product intent.

Typical outputs:

- Refactoring and architecture cleanup.
- Framework or dependency migrations.
- Performance, reliability, observability, and security improvements.

Execution guidance:

- Planner should map each initiative to refactoring-oriented tasks.
- Orchestrator should enforce dependency order and conflict-safe parallelization.
- Coder should preserve external behavior unless explicitly stated otherwise.

## Required Document Structure

Every implementation document should include these sections so agents can execute without guessing:

1. WHAT
  - The exact change to be delivered.
2. WHY
  - The business or technical reason.
3. IN-SCOPE
  - In-scope boundaries.
4. OUT-OF-SCOPE
  - Out-of-scope boundaries.
5. ACCEPTANCE CRITERIA
  - Testable completion conditions.
6. ADDITIONAL INFORMATION
  - Dependencies, constraints, rollout notes, or references.

If any section is missing, agents must ask clarifying questions before implementation.

## Agent Handoff Expectations

To keep execution reliable, each stage should produce explicit outputs:

1. Planner
  - Task breakdown with owner, file scope, dependencies, and acceptance criteria.
2. Orchestrator
  - Phase plan with parallel or sequential rationale.
3. Coder and Designer
  - Scoped implementation aligned with acceptance criteria.
4. Final report
  - Completed items, blockers, risks, and open questions.

## Quality Bar

Documentation should be:

- Specific enough to implement without assumptions.
- Small enough to execute in clear phases.
- Verifiable through acceptance criteria.
- Explicit about boundaries and risks.
