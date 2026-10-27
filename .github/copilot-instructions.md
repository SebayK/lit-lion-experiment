# GitHub Copilot Instructions

Project-level instructions for GitHub Copilot in this repository.

## Mandatory Codebase Context Protocol

For any work that depends on repository structure, architecture, or source code:
1. **Always consult `.agents/skills/repomix-context/SKILL.md` before exploring.**
2. **Never ask the user to paste `repomix-output.xml` into the chat window, and do not attempt to load the entire XML file into context.**
3. Verify that `repomix-output.xml` exists. If missing or empty, generate it via terminal (`npx repomix`).
4. Search `repomix-output.xml` via terminal commands to find relevant types, components, and file paths:
   - **Windows PowerShell (Default):** `Select-String -Pattern "<term>" -Path repomix-output.xml` (or `rg -n -i "<term>" repomix-output.xml` if ripgrep is installed)
   - **Windows CMD:** `findstr /N /I "<term>" repomix-output.xml`
   - **POSIX (Linux/macOS):** `rg -n -i "<term>" repomix-output.xml`
5. Read only the specific source files identified from the snapshot.

## Platform & Shell Guidelines (Default: Windows PowerShell)

Assume by default that the user operates on **Windows**:
- Primary shell is **Windows PowerShell**. Always provide PowerShell-compatible commands by default.
- Use cross-platform npm/node scripts where possible (`npm test`, `npx tsc --noEmit`).
- For text searching, prefer `Select-String -Pattern "<term>" -Path <file>` or `rg` if ripgrep is available on PATH.
- Avoid Unix-only constructs (such as `test -s`, `/tmp/`, `export VAR=...`, or unquoted paths with spaces) unless explicitly instructed otherwise.
- In Git commands on Windows, keep paths forward-slash or properly quoted.

## Architecture and Domain Docs

- **Domain model & terminology**: Consult `CONTEXT.md` at repo root and ADRs under `docs/adr/`.
- **Issues and task tracking**: Issues and scratchpads live under `.scratch/`.
- **Triage labels**: Documented in `docs/agents/triage-labels.md`.

## Ticket Format — Zero-Context-Loss (mandatory for all tickets)

Tickets are the **sole source of truth** for an implementation session. When you receive a ticket (`issue-NN.md`), it must already be self-contained. You are **forbidden** from:
- Loading ADR files or SPEC.md to supplement missing ticket information.
- Treating prose paragraphs in a ticket as requirements — only atomic checkboxes count.

Every ticket must have: **Inlined Contracts** (interfaces, types), **Requirements** (atomic checkboxes, strictly 3–5 items), **Blast Radius & Call-Sites** (files + consumers), **Guardrails & DO NOTs**, and **Verification & Test Assertions** (concrete `it('should...')` scenarios or complete pre-authored `.test.ts` file).

- **Strict Sizing:** Tickets are limited to 3–5 checkboxes. Larger features are split into `01a`, `01b`.
- **Pre-authored Tests:** When a pre-authored contract test file is provided, do NOT modify assertions. Your single job is to make existing failing assertions pass.

## Quality Guardrails & Anti-Gaming Rules

When implementing tasks or working with tests:
1. **Never game or hack tests (Anti-Overfitting):** Never hardcode return values, mock required domain logic, or write conditionals tailored only to specific test fixtures (`if (param === 'fixture') return ...`). The implementation must be genuine, generic domain logic.
2. **Never modify pre-authored test assertions:** When working from tickets with existing tests, you are strictly forbidden from modifying test assertions to force a test to pass.
3. **Respect architectural layering and project standards:**
   - Business & validation logic belongs in headless domain modules (`src/features/*/domain/`) or reactive controllers, never embedded directly in Lit view components.
   - Lit components must remain declarative, using `@open-wc/scoped-elements` and `@lion/ui` form controls.
   - Types and identifiers must align strictly with `CONTEXT.md`.
4. **Anti-Silent-Drop / Self-Audit Gate (mandatory before any commit):**
   - Re-read the ticket file in full.
   - Run `rg -n "<symbol>" src/` for every changed function or type to verify all call-sites are updated.
   - Run `npx tsc --noEmit && npm test` — both must exit 0.
   - Produce a per-checkbox audit table: `| # | Requirement | Status (DONE/MISSING) | File:Line |`. Any MISSING row must be patched in the same turn before committing.
5. **Skeleton-First:** Before modifying any business logic, list all ticket checkboxes and create failing test stubs from the Verification section. Confirm red before writing production code.
6. **No placeholders:** Zero tolerance for `// TODO`, unused abstractions, or placeholder return values. Prefer the simplest diff that uses existing project utilities.
7. **Scoped Modular Instructions (`.github/instructions/`):**
   Detailed file-type specific guidelines are modularized and automatically injected by GitHub Copilot via `applyTo` globs:
   - [TypeScript & Clean Code Standards](.github/instructions/typescript-standards.instructions.md) (`applyTo: '**/*.ts'`): Type modeling hierarchy (unions default, `as const` for runtime, zero `enum`), `interface` vs `type`, safe destructuring, Refactoring Guru code smells (Composed Method, SLAP, Guard Clauses, Rule of Three), and modern ES2023/ES2024 idioms.
   - [Architecture, State & Layering Guidelines](.github/instructions/architecture-vsa.instructions.md) (`applyTo: 'src/**/*.ts'`): Vertical Slice Architecture (VSA) with public `index.ts` boundaries, Headless Domain logic (SRP) vs thin Lit views, Redux Toolkit (`createSlice`) event-driven patterns, and dynamic import code splitting.
   - [Testing, TDD & Anti-Gaming Guardrails](.github/instructions/testing-tdd.instructions.md) (`applyTo: '**/*.test.ts'`): Strict anti-gaming / anti-overfitting rules, pre-authored test assertion protection, Skeleton-First TDD flow, and characterization testing.

## Available Agent Skills & CLI Invocation

This repository uses the Agent Skills standard located in `.agents/skills/`.
When performing tasks, Copilot CLI invokes these skills via the `skill` tool or slash commands:
- `/implement` (`.agents/skills/implement/SKILL.md`) — Skeleton-First TDD, Codex hardening, Self-Audit Gate.
- `/to-tickets` (`.agents/skills/to-tickets/SKILL.md`) — Zero-Context-Loss ticket generation and publication checklist.
- `/audit-issue` (`.agents/skills/audit-issue/SKILL.md`) — Post-implement adversarial diff-vs-ticket audit; run before Repomix snapshot.
- `/repomix-context` (`.agents/skills/repomix-context/SKILL.md`) — Snapshot verification and symbol search.
- `/tdd` (`.agents/skills/tdd/SKILL.md`) — Test-driven development loop.
- `/code-review` (`.agents/skills/code-review/SKILL.md`) — Dual-axis review (Standards + Spec).

### CLI Execution Modes:
- **Interactive Mode:** Type the slash command directly (e.g. `/implement .scratch/<feature>/issues/01.md`).
- **Script / Non-Interactive Mode (`copilot -p` / `gh copilot -p`):** Slash commands are not expanded in prompt mode. Use explicit tool instructions:
  `copilot -p 'Use the skill tool to invoke the "implement" skill for .scratch/feature/issues/01.md' --allow-all`

## Copilot CLI Plan Mode & Workflow Integration

Follow the official **Explore → Plan → Code → Commit** workflow:
1. **Explore:** Scoped inspection using `repomix-output.xml` search or ticket Blast Radius. Do not write code yet.
2. **Plan (`/plan`):** For multi-step tasks without ready tickets, press `Shift+Tab` or run `/plan` to generate structured implementation steps, or run `/to-tickets` to emit Zero-Context-Loss micro-tickets.
3. **Code (`/implement`):** Work one ticket at a time using red-green-refactor.
4. **Audit (`/audit-issue`):** Adversarially verify git diff against ticket checkboxes before commit.
5. **Review (`/review` or `/code-review`):** Validate against coding standards and specs before opening PR.

## Token & AI Credit Optimization Protocols

To minimize token consumption, avoid context window saturation, and preserve reasoning sharpness (staying within the Smart Zone):
1. **Context Reset Between Tickets:** Always run `/clear` or `/new` between tickets. Tickets are 100% self-contained work orders; keeping past conversation history dilutes model attention and wastes AI credits.
2. **Zero Global Dumps:** Never load full `repomix-output.xml`, complete ADR folders, or previous transcripts into context. Query only specific symbols via PowerShell (`Select-String -Pattern "<term>" -Path repomix-output.xml`) or read designated Blast Radius files.
3. **Compact at Phase Boundaries:** If a complex design or exploration session nears 100k+ tokens before ticket emission, run `/compact` to summarize history before proceeding to implementation.
4. **Subagent Offloading:** Let Copilot offload command execution and repo searches to built-in subagents (`task`, `explore`) to keep main session context lean.
