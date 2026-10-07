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

## Available Agent Skills

This repository uses the Agent Skills standard located in `.agents/skills/`. When performing tasks, read the instructions in:
- `.agents/skills/implement/SKILL.md` — Implementation workflow and TDD loop.
- `.agents/skills/repomix-context/SKILL.md` — Snapshot verification and symbol search.
- `.agents/skills/tdd/SKILL.md` — Test-driven development workflow.
- `.agents/skills/code-review/SKILL.md` — Code review standards and checklists.
