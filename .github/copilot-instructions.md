# GitHub Copilot Instructions

Project-level instructions for GitHub Copilot in this repository.

## Mandatory Codebase Context Protocol

For any work that depends on repository structure, architecture, or source code:
1. **Always consult `.agents/skills/repomix-context/SKILL.md` before exploring.**
2. **Never ask the user to paste `repomix-output.xml` into the chat window, and do not attempt to load the entire XML file into context.**
3. Verify that `repomix-output.xml` exists. If missing or empty, generate it via terminal (`npx repomix`).
4. Search `repomix-output.xml` via terminal commands to find relevant types, components, and file paths:
   - **POSIX (Linux/macOS):** `rg -n -i "<term>" repomix-output.xml`
   - **Windows PowerShell:** `Select-String -Pattern "<term>" -Path repomix-output.xml`
   - **Windows CMD:** `findstr /N /I "<term>" repomix-output.xml`
5. Read only the specific source files identified from the snapshot.

## Cross-Platform Shell Guidelines (macOS / Linux / Windows)

When executing terminal commands or guiding the user:
- Detect the operating system shell (bash/zsh vs PowerShell vs CMD).
- Use cross-platform npm/node scripts where possible (`npm test`, `npx tsc --noEmit`).
- On Windows PowerShell, use `Select-String` instead of `grep`/`rg` unless ripgrep is known to be installed.
- On Windows CMD, use `findstr` and avoid Unix-only constructs like `&&` chained with Unix commands, `test -s`, or `/tmp/`.

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

## Available Agent Skills

This repository uses the Agent Skills standard located in `.agents/skills/`. When performing tasks, read the instructions in:
- `.agents/skills/implement/SKILL.md` — Skeleton-First TDD, Codex hardening, Self-Audit Gate.
- `.agents/skills/to-tickets/SKILL.md` — Zero-Context-Loss ticket format and publication checklist.
- `.agents/skills/audit-issue/SKILL.md` — Post-implement adversarial diff-vs-ticket audit; run before Repomix snapshot.
- `.agents/skills/repomix-context/SKILL.md` — Snapshot verification and symbol search.
- `.agents/skills/tdd/SKILL.md` — Test-driven development workflow.
- `.agents/skills/code-review/SKILL.md` — Code review standards and checklists.
