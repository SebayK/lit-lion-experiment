---
name: implement
description: "Implement a piece of work based on a spec or set of tickets."
allowed-tools: shell
disable-model-invocation: true
---

Implement the work described by the user in the spec, tickets, or active prompt.

## 1. Codebase Context (Mandatory)

Before writing any code, establish codebase context:
- **In agents with a native Skill tool (Antigravity / Claude Code):** Invoke `repomix-context`.
- **In GitHub Copilot Agent Mode (or environments without a Skill tool):**
  1. Check if `repomix-output.xml` exists and is non-empty:
     - **Bash:** `test -s repomix-output.xml || npx repomix`
     - **PowerShell:** `if (!(Test-Path repomix-output.xml) -or (Get-Item repomix-output.xml).Length -eq 0) { npx repomix }`
     - **CMD:** `if not exist repomix-output.xml (npx repomix) else for %I in (repomix-output.xml) do if %~zI equ 0 npx repomix`
     - **Cross-platform (Node):** `node -e "const fs = require('fs'); if (!fs.existsSync('repomix-output.xml') || fs.statSync('repomix-output.xml').size === 0) { require('child_process').execSync('npx repomix', { stdio: 'inherit' }); }"`
  2. **Do NOT dump the entire `repomix-output.xml` into the LLM context.**
  3. Instead, query the file via terminal to locate relevant symbols, types, and paths:
     - **Bash / POSIX:** `rg -n -i "<symbol-or-path>" repomix-output.xml`
     - **PowerShell:** `Select-String -Pattern "<symbol-or-path>" -Path repomix-output.xml`
     - **CMD:** `findstr /N /I "<symbol-or-path>" repomix-output.xml`
  4. Inspect only the relevant source files identified from the snapshot.

## 2. Implementation & TDD Loop

Implement behaviour incrementally using a red-green-refactor cycle:
1. **Red:** Write a failing test covering the new or changed behavior at a clean seam.
2. **Verify Red:** Run the single test file to confirm it fails for the expected reason:
   - **Bash / PowerShell / CMD:** `npm test -- <path-to-test>` (or the project's test runner command)
3. **Green:** Write the minimal implementation code to pass the test.
4. **Verify Green:** Re-run the test file to ensure it passes.
5. **Refactor:** Clean up code, enforce domain vocabulary (`CONTEXT.md`), and maintain module depth while keeping tests green.

## 3. Verification

Throughout the task and before completion:
- Run typechecking: `npm run typecheck` or `npx tsc --noEmit`
- Run the relevant test suite: `npm test`

## 4. Review & Commit

1. Review the git diff against the working tree/spec to check for regressions, consistency, and standard compliance.
2. Commit the changes to the current working branch with a clear, concise commit message.
