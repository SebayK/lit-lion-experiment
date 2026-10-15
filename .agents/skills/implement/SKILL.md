---
name: implement
description: "Implement a piece of work based on a spec or set of tickets (issue-NN.md). Hardened for isolated agents: blocks silent requirement dropping via Skeleton-First TDD and a mandatory Self-Audit Gate before any commit. Use when asked to implement a ticket, build a feature from an issue, or when the user invokes /implement."
allowed-tools: shell
---

Implement the work described in the ticket file passed by the user.

## 0. Context isolation (mandatory first step)

Read **only** the designated ticket file (`issue-NN.md`) and the files listed in its Blast Radius table. Do not load global ADR files, SPEC.md, or repomix-output.xml into context — they bloat the window and are already inlined in the ticket.

If the ticket file is missing or empty, stop and tell the user: the ticket must be created first with `/to-tickets`.

**Ticket Sizing Gate:** Verify the ticket has 1–5 checkboxes. If it has >5, warn the user: *"Ticket exceeds 5 checkboxes; implementing first 5 to prevent attention degradation."*

## 1. Skeleton-First: surface all requirements before writing logic

Before modifying any source file:

1. Read the ticket's **Requirements** section aloud in your response, listing every checkbox (strictly 1–5).
2. Establish the failing test:
   - **Variant A (Pre-authored test file provided):** If the ticket provides or points to a pre-authored test file (`.test.ts`), confirm it exists on disk. Run it immediately:
     `npm test -- <path-to-test>`
     Confirm it fails for the expected reason. **You are strictly forbidden from modifying, deleting, or loosening pre-authored test assertions.** Your sole job is to write production code to turn it green.
   - **Variant B (Test assertions listed in ticket):** Create or update the test file using the exact `it('should...')` scenarios from the ticket's Verification section. Run it to confirm it is red.
3. Only after red is confirmed may you proceed to write production code.

**Anti-shortcut:** No `// TODO`, placeholder returns, or unused abstractions. If a requirement cannot be implemented in this ticket, flag it explicitly — do not silently omit it.

## 2. Codebase context (scoped)

For each file listed in the ticket's Blast Radius:

- **In agents with a native Skill tool (Antigravity / Claude Code):** Use the targeted file read — do not invoke `repomix-context` for the whole repo.
- **In GitHub Copilot Agent Mode:** Query repomix-output.xml only for the specific symbols named in the ticket:
  - Windows PowerShell (Default): `Select-String -Pattern "<symbol>" -Path repomix-output.xml` (or `rg -n -i "<symbol>" repomix-output.xml`)
  - Bash / POSIX: `rg -n -i "<symbol>" repomix-output.xml`

Inspect only the files identified above.

## 3. Implementation & TDD loop

Implement behaviour incrementally, one requirement checkbox at a time, using red-green-refactor:

### Loop rules

1. **Red:** Confirm the failing test fails for the expected reason.
2. **Green:** Write the minimal implementation code to pass the test.
3. **Verify green:** Re-run the test to confirm it passes.
4. **Refactor & standards check:** Enforce domain vocabulary (`CONTEXT.md`), maintain module depth, keep tests green.
5. **Tick the checkbox** in your running response as each requirement is satisfied.

### Anti-gaming guardrails (non-negotiable)

- **No test-gaming:** Never hardcode return values or write artificial branches (`if (arg === 'fixture') return ...`) to pass assertions. The implementation must express genuine domain logic.
- **No test modification:** When working from a ticket with pre-authored assertions, you are forbidden from modifying those assertions to make the test pass.
- **Architectural seams:** Respect the Guardrails & DO NOTs section of the ticket verbatim.
  - Domain logic belongs in `domain/` or controllers.
  - UI components remain thin and declarative (Lit + ScopedElementsMixin + @lion/ui).
  - State management follows the established pattern (Redux slice or ReactiveController).
- **Domain vocabulary:** Type names, public methods, and domain entities must match CONTEXT.md and the Inlined Contracts in the ticket.

## 4. Self-Audit Gate (mandatory before any commit)

**Do not summarise or commit until all four steps below pass.**

### Step 1 — Re-read the ticket

Re-read the ticket file in full (`read_file issue-NN.md`). Compare every checkbox against your implementation.

### Step 2 — Call-site search

For every function, type, or constant you created or renamed, search across the repository:

- **Windows PowerShell (Default):** `Select-String -Pattern "<symbol>" -Path (Get-ChildItem -Path src/ -Recurse -File).FullName` (or `rg -n "<symbol>" src/`)
- **Bash / POSIX:** `rg -n "<symbol>" src/`

Verify that every call-site listed in the ticket's Blast Radius table has been updated. If you find an uncovered call-site not in the table, update it now.

### Step 3 — Compile and test

```bash
npx tsc --noEmit
npm test
```

Both commands must exit with code 0 before proceeding.

### Step 4 — Audit table

Produce this table in your response. If any row shows MISSING, implement the gap in the same turn before committing.

| # | Requirement (from ticket checkbox) | Status | File:Line |
|---|-------------------------------------|--------|-----------|
| 1 | <requirement text> | DONE / MISSING | src/...:42 |
| 2 | ... | ... | ... |

## 5. Review & commit

Only after the audit table shows all rows as DONE:

1. Review the git diff against the ticket spec for regressions and standard compliance.
2. If working in an asymmetric workflow (architect in M365 Copilot, executor here), export the diff for the dual-axis review (Spec + Standards) before committing.
3. Commit with a clear, concise message referencing the ticket number.
