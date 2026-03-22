# Documentation Index

The `docs` folder is the source of truth for agent execution.
Each folder in the folder hierarchy contains markdown documents that describe features, technical changes, or changes to the user interface.
Each markdown document defines work that agents should plan and implement.

Use this index to understand:

1. Which folder to use?
2. What kind of change is expected?
3. How should agents turn documentation into implementation tasks?

Every implementation document should use the following templates so agents can execute without having to guess.

## Product Areas

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

### General Markdown Design

The markdown files in the product area folder represent user story descriptions, as they describe user-facing functionality.
These files are rather small, as they describe single items of user interactions.
These files do not contain any implementation details, as they only describe the WHAT and WHY.
All implementation details fully remain to the agent who is doing it.

The files can be updated to reflect the described system capabilities. 

### Markdown Template

1. STORY
  - A user story using the following format
    - **IN ORDER TO** ´user value´
    - **AS** ´type of user´
    - **I WANT TO** ´user need´
2. ACCEPTANCE CRITERIA
  - Testable completion conditions.
4. IN-SCOPE
  - In-scope boundaries.
5. OUT-OF-SCOPE
  - In-scope boundaries.
6. ADDITIONAL INFORMATION 
  - Dependencies, constraints, rollout notes, or references.

If any section is missing, agents must ask clarifying questions before implementation.

## Rebrushes

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

### General Markdown Design

The markdown files under the Rebrushes folder are held rather simplistic so that they allow more degrees of freedom to foster creativity of the designer.

### Markdown Template

1. WHAT
  - The exact change to be delivered.
2. WHY
  - The business or technical reason.
3. ADDITIONAL INFORMATION
  - Dependencies, constraints, rollout notes, or references.

If any section is missing, agents must ask clarifying questions before implementation.

## Technical Initiatives

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

### General Markdown Design

The markdown files for technical initiatives can be rather long.
These files should not change once they have been used for implementation.

### Markdown Template

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
