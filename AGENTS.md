# Agent Rules

Before planning, design, implementation, or review, read [`README.md`](README.md). It is the project entry point and maps each product area to its authoritative documents and current prototype.

## Current phase

This repository is currently designing the product and its UI. Unless the human explicitly asks for implementation detail, reason from the user's goal, journey, information needs, actions, feedback, and next step—not from the current code, database, Agent protocol, or persistence model.

For product discussions:

- lead with the business conclusion and user-visible impact;
- keep the default answer to 5–10 sentences;
- expand technical detail only when asked;
- resolve one material human decision at a time;
- do not turn every open question into a framework, table, or implementation plan.

## Human and Agent responsibility

The human owns product intent, user-visible behavior, architecture decisions, acceptance standards, and final judgment. The Agent owns evidence retrieval, coherent product proposals, implementation and review when requested, and honest reporting of uncertainty or blockers.

Ask for human judgment only when there is a real unresolved choice in user behavior, product scope, ownership, persistence, permissions, or acceptance. Record confirmed decisions in [`human-checklist.md`](human-checklist.md) before downstream work relies on them.

## Product-design discipline

- Follow the real journey from market discovery through company or industry detail, joining research, Wiki use, report generation, and data management.
- For every interaction, identify the user's intent, visible information, primary action, system feedback, and natural next step.
- Keep each surface focused: market supports breadth-first discovery, research supports sustained understanding, and data supports source and knowledge management.
- Treat loading, empty, stale, conflicting, failed, and completed states as part of the product experience.
- Do not expose backend terminology or processing detail unless it helps the user make a decision.
- Reuse confirmed navigation and interaction patterns before proposing a new page, mode, card, or workflow.
- Prefer removing duplication over adding another control or view.
- Follow [`docs/ui-design/DESIGN.md`](docs/ui-design/DESIGN.md) for visual language and component discipline.

## Authority and document ownership

- [`human-checklist.md`](human-checklist.md) owns confirmed human decisions and acceptance boundaries.
- [`todo.md`](todo.md) owns unresolved or deferred work; it is not implementation status.
- [`docs/flow_design.md`](docs/flow_design.md) owns the cross-page business journey.
- Product-area documents listed in [`README.md`](README.md) own their respective responsibilities and boundaries.
- [`docs/ui-design/DESIGN.md`](docs/ui-design/DESIGN.md) owns shared visual and interaction rules.
- `prototype/` demonstrates and validates a direction; it does not override confirmed product documents.
- [`design-qa.md`](design-qa.md) records evidence from completed prototype checks; it does not create product decisions.

Update the existing owner of a fact. Do not create parallel summaries, coordination documents, or competing sources of truth. When documents disagree, surface the conflict instead of silently choosing one.

## Engineering principles

1. **Less is more.** Any new structure or abstraction needs evidence from the current problem.
2. **Ownership is cohesive and singular.** Avoid multiple writers and duplicated paths.
3. **Prefer the simplest expression.** Consolidate before adding another route or layer.
4. **Stop after two patches to the same behavior.** Reassess the owner or design instead of stacking fixes.
5. **Do not speculate.** Do not pre-design versions, compatibility layers, extension points, or migrations without a current need.

## Implementation workflow

Small, explicit changes may stay in the main session. Larger implementation work follows one ready Task and the project file protocol:

- each Module Contract owns responsibility, interfaces, lifecycle, failure semantics, and business validation;
- each module Task list records implementation order;
- each Task owns one bounded implementation closure, stays within 200 lines, and includes Out of Scope and Stop Conditions;
- Tasks reference higher authorities instead of copying them;
- Execute, Review, and Smoke consume the same Task and do not rewrite it or its authorities.

Stop and ask when implementation would introduce an unconfirmed user behavior, new owner, persistence path, cross-module contract, or acceptance boundary. Preserve unrelated work, and do not commit unless the human explicitly asks.
