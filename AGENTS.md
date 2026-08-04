# AGENTS

## Project file protocol

- [`README.md`](README.md) is the project entry point and maps each top-level module to its source, contract, and Task list.
- [`human-checklist.md`](human-checklist.md) records only confirmed human decisions and acceptance boundaries.
- [`todo.md`](todo.md) contains unresolved or deferred work.
- Each Module Contract owns its responsibility, public interfaces, lifecycle, failure semantics, and business validation.
- Each module Task list records implementation order; each Task owns one bounded implementation closure.
- Tasks reference higher authorities instead of copying them, stay within 200 lines, and include mandatory Out of Scope and Stop Conditions.
- Human-confirmed product or contract decisions are recorded in [`human-checklist.md`](human-checklist.md) before downstream Tasks rely on them.
- Execute, Review, and Smoke consume the same Task and do not rewrite the Task or its authorities.
- Update the existing Owner of each fact; do not create parallel coordination or status documents.
