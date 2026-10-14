---
name: repomix-context
description: Load a current Repomix repository snapshot before codebase work; refresh it when relevant contents are missing or stale, then use the refreshed snapshot. Use for implementation, testing, debugging, review, design, planning, or triage that depends on repository structure or code.
allowed-tools: shell
---

Use Repomix as the shared codebase context for the calling skill. The snapshot is an input, not a replacement for the working tree: use the working tree for the exact current diff, conflict markers, generated files, and any file the task explicitly changes.

## Step 1 — Check the existing snapshot

From the repository root, check whether `repomix-output.xml` exists and is non-empty:

- **POSIX (Bash / Zsh):**
  ```bash
  test -s repomix-output.xml
  ```
- **Windows PowerShell:**
  ```powershell
  Test-Path repomix-output.xml -PathType Leaf; if ($?) { (Get-Item repomix-output.xml).Length -gt 0 }
  ```
- **Windows CMD:**
  ```cmd
  if exist repomix-output.xml (for %I in (repomix-output.xml) do @if %~zI gtr 0 (exit /b 0) else (exit /b 1)) else (exit /b 1)
  ```
- **Cross-platform (Node.js):**
  ```bash
  node -e "const fs = require('fs'); process.exit(fs.existsSync('repomix-output.xml') && fs.statSync('repomix-output.xml').size > 0 ? 0 : 1)"
  ```

If it exists, check its file entries against the task's relevant paths in the working tree. A path mentioned in prose or the directory tree alone does not establish that its contents were packed. Reuse it only when the relevant file contents are present and agree with the current working tree. Treat it as stale when a relevant path is missing, the packed content differs from the current file, or a relevant change made since the snapshot cannot be verified in the pack. When unsure, regenerate rather than use possibly stale context. Do not ask the user whether to refresh it.

If it is absent, empty, or the relevant scope is missing, continue to Step 2.

## Step 2 — Generate the snapshot when needed

### Select an available executable

Prefer the project-local repomix:
- **POSIX:** `node_modules/.bin/repomix`
- **Windows:** `node_modules\.bin\repomix.cmd` or `npx repomix`
- Global: `repomix` on `PATH`.

The local dependency is the reproducible default; do not update it to a global version. If neither executable exists, check for an already installed executable in npm's npx cache (`npm config get cache`). Confirm the selected executable with `--version`.

If no installed executable is available, make one offline attempt:

- **POSIX / PowerShell / CMD:**
  ```bash
  npx --offline --yes repomix --version
  ```

If the package is unavailable offline and network access is permitted:

- **POSIX / PowerShell / CMD:**
  ```bash
  npx --yes --fetch-retries=0 --fetch-timeout=15000 repomix --version
  ```

### Pack and validate

Run from the repository root with `.` as the input directory. Select a focused scope with quoted, comma-separated `--include` globs, which keeps file paths relative to the repository root. Positional arguments are directories, not file globs. Explicitly set `--style xml`. Add `--compress` only when a large scope warrants it.

Generate to a temporary output outside the packed scope:
- **POSIX:**
  ```bash
  repomix . --include "src/**,CONTEXT.md,package.json" --style xml --output /tmp/snapshot.xml
  ```
- **Windows PowerShell:**
  ```powershell
  npx repomix . --include "src/**,CONTEXT.md,package.json" --style xml --output "$env:TEMP\snapshot.xml"
  ```
- **Windows CMD:**
  ```cmd
  npx repomix . --include "src/**,CONTEXT.md,package.json" --style xml --output "%TEMP%\snapshot.xml"
  ```

After a successful exit, verify that the temporary output is non-empty and contains required file entries:
- **POSIX:**
  ```bash
  rg -n -F '<file path="src/example.ts">' /tmp/snapshot.xml
  ```
- **Windows PowerShell:**
  ```powershell
  Select-String -Pattern '<file path="src/example.ts">' -Path "$env:TEMP\snapshot.xml"
  ```
- **Windows CMD:**
  ```cmd
  findstr /N /C:"<file path=\"src/example.ts\">" "%TEMP%\snapshot.xml"
  ```

Once verified, replace `repomix-output.xml` with the validated file:
- **POSIX:** `mv /tmp/snapshot.xml repomix-output.xml`
- **Windows PowerShell:** `Move-Item -Force "$env:TEMP\snapshot.xml" repomix-output.xml`
- **Windows CMD:** `move /Y "%TEMP%\snapshot.xml" repomix-output.xml`

## Step 3 — Explore the output first

**CRITICAL: Do NOT load or paste the entire `repomix-output.xml` into the LLM chat window.**

Search before reading large sections. Use a command-line search against `repomix-output.xml` to locate the file tree, relevant paths, symbols, and neighbouring modules; then read only the sections needed:

- **POSIX (ripgrep):**
  ```bash
  rg -n -i "<domain-term>|<symbol>|<relevant/path>" repomix-output.xml
  ```
- **Windows PowerShell:**
  ```powershell
  Select-String -Pattern "<symbol-or-path>" -Path repomix-output.xml
  ```
- **Windows CMD:**
  ```cmd
  findstr /N /I "<symbol-or-path>" repomix-output.xml
  ```

Use direct file reads from the working tree after the snapshot when exact current contents matter.

Report: `Repomix context loaded — scope <patterns-or-root>, format <compressed|full>.` Then proceed with the task.
