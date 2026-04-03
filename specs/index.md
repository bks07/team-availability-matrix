---
status: DONE
---

# Specification Index

This file indexes the sub-folders of `specs/`. Each sub-folder contains markdown files that describe **what** to build and **why**. No spec file contains implementation details.

## Bugfixing

Folder: `./bugfixing`

Each file describes an error reported by end users: the observed behavior, the expected behavior, impact, and steps to reproduce. Once implemented, these files are not updated or reused for further work.

## Product Areas

Folder: `./product-areas`

Each file is a user story describing a single unit of user-facing functionality. Files are small and scoped to one interaction. They must be kept up to date to reflect current system capabilities.

## Rebrushes

Folder: `./rebrushes`

Each file describes a frontend-only visual or interaction redesign. Specs are intentionally brief to allow creative freedom during implementation. Once implemented, these files are not updated or reused for further work.

## Technical Initiatives

Folder: `./technical-initiatives`

Each file describes a non-functional improvement to system quality (refactoring, migrations, performance, security) without changing product intent. These files can be long. Once implemented, they are not updated or reused for further work.

## Quality Bar

The specification should be:

- Specific enough to implement without assumptions.
- Small enough to execute in clear phases.
- Verifiable through acceptance criteria.
- Explicit about boundaries and risks.
