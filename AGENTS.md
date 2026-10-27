# AGENTS.md

Project-level guidance for AI coding agents working in this repo.

## Agent skills

### Codebase context

For work that depends on repository structure or source code, invoke `.agents/skills/repomix-context` before exploring. It reuses a non-empty `repomix-output.xml` when available and generates one with Repomix when needed. Use the working tree for exact current diffs, conflict state, generated files, and files the task changes.

### Issue tracker

Issues live as local markdown files under `.scratch/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Using the default five-label vocabulary (needs-triage, needs-info, ready-for-agent, ready-for-human, wontfix). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout — `CONTEXT.md` at the repo root, ADRs under `docs/adr/`. See `docs/agents/domain.md`.

### Ticket handoff (Zero-Context-Loss)

Tickets are written by an Architect model (M365 Copilot / high-reasoning) and executed by a coding agent (GitHub Copilot Codex) in a fresh context window. Tickets must be **fully self-contained**: every contract, interface, and constraint is inlined — no external references to ADR files or SPEC.md. See `.agents/skills/to-tickets/SKILL.md` for the template and publication checklist.

- **Ticket Sizing Rule:** Every ticket has 3–5 atomic checkboxes (~120–150 lines of diff). Anything larger is split into sequential micro-tickets (`01a`, `01b`).
- **Pre-authored Test File (Golden Ticket):** Whenever possible, the Architect provides a complete, runnable failing test file (`.test.ts`). The coding agent is forbidden from editing assertions.

After `/implement`, run `/audit-issue` on a clean chat before snapshotting with Repomix. The audit skill performs an adversarial diff-vs-ticket check and patches all gaps it finds.

### Implementation & Quality Guardrails

- Consult `.agents/skills/implement/SKILL.md` for the TDD cycle, Skeleton-First flow, and Self-Audit Gate.
- **Anti-Gaming:** Agents must never hardcode mock values or branch specifically for test inputs.
- **Anti-Silent-Drop:** The Self-Audit Gate in `/implement` is mandatory. The agent must re-read the ticket, grep all changed symbols, compile, run tests, and produce a per-checkbox audit table before committing. Any MISSING row must be patched in the same turn.
- **TypeScript Idioms & Interfaces:** Use `interface` for domain entity models and extensible public contracts (enables `tsc` caching and declaration merging); use `type` for unions, primitives, tuples, and mapped types. Forbid `enum`/`const enum`. Default to string literal unions; use `as const` object maps when runtime iteration/lookup is needed. Zero `any` (use `unknown` + guards, `satisfies`, and `assertNever`).
- **Clean Code & Destructuring:** Apply Composed Method and SLAP to keep functions small. Replace nested conditionals with guard clauses. Destructure parameter objects and local props, but preserve object prefixes (`client.name`, `company.name`) where domain context would be lost. Follow Rule of Three for pragmatic DRY.
- **Redux Toolkit (`createSlice`):** Dispatch semantic domain events rather than setters. Keep state minimal and serializable. Use `createSelector` for derived state. In Immer, mutate directly OR return, never both.
- **Modern JS & Dynamic Loading:** Prefer non-mutating array methods (`toSorted`, `toReversed`, `toSpliced`, `with`), `Object.groupBy`, and `Promise.withResolvers`. Lazy-load discrete Process Steps (`await import(...)`) and heavy dialogs to minimize mobile WebView startup time and RAM.
- **Architecture (VSA & SRP):** Keep business/validation logic in headless domain modules (`domain/` or controllers); Lit components remain thin presentation layers using `@open-wc/scoped-elements` and `@lion/ui`. External consumers import strictly via feature `index.ts`.
- **Review:** All changes must satisfy both **Spec** (complete requirements) and **Standards** (clean architecture, no Fowler smells) via `.agents/skills/code-review/SKILL.md`.
