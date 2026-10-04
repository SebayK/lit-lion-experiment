---
name: repomix-context
description: Load a current Repomix repository snapshot before codebase work; refresh it when relevant contents are missing or stale, then use the refreshed snapshot. Use for implementation, testing, debugging, review, design, planning, or triage that depends on repository structure or code.
---

Use Repomix as the shared codebase context for the calling skill. The snapshot is an input, not a replacement for the working tree: use the working tree for the exact current diff, conflict markers, generated files, and any file the task explicitly changes.

## Step 1 — Check the existing snapshot

From the repository root, check whether `repomix-output.xml` exists and is non-empty:

    test -s repomix-output.xml

If it exists, check its file entries against the task's relevant paths in the working tree. A path mentioned in prose or the directory tree alone does not establish that its contents were packed. Reuse it only when the relevant file contents are present and agree with the current working tree. Treat it as stale when a relevant path is missing, the packed content differs from the current file, or a relevant change made since the snapshot cannot be verified in the pack. When unsure, regenerate rather than use possibly stale context. Do not ask the user whether to refresh it.

If it is absent, empty, or the relevant scope is missing, continue to Step 2.

## Step 2 — Generate the snapshot when needed

### Select an available executable

Prefer the project-local `node_modules/.bin/repomix` installed from this repository's `devDependency`, then `repomix` on `PATH`. The local dependency is the reproducible default; do not update it to a global version. If neither executable exists, check for an already installed executable in npm's npx cache (`npm config get cache`, then `<cache>/_npx/*/node_modules/repomix/package.json`). Read that package's `bin` field and invoke the resolved entrypoint with `node`; this avoids registry resolution when network access is restricted. Confirm the selected executable with `--version` and consult its `--help` for supported options.

If no installed executable is available, make one offline attempt:

    npx --offline --yes repomix --version

Use the same launcher for packing if it succeeds. If the package is unavailable offline and network access is permitted, make at most one online attempt with non-interactive installation and bounded npm fetches:

    npx --yes --fetch-retries=0 --fetch-timeout=15000 repomix --version

Use those npm flags before `repomix` for the packing command too. Prefer the available version; resolving `@latest` on every invocation adds an unnecessary registry dependency. Keep npm cache writes within the environment's permitted locations.

### Pack and validate

Run from the repository root with `.` as the input directory. Select a focused scope with quoted, comma-separated `--include` globs, which keeps file paths relative to the repository root. Positional arguments are directories, not file globs. Include the relevant collaborators and project context; omit `--include` to pack the root when the scope is unknown. Explicitly set `--style xml`; a filename extension does not override configuration. Add `--compress` only when a large scope or the calling skill warrants it.

Generate a new snapshot whenever the existing one is absent, stale, or lacks the task's required paths. Write to a unique temporary output outside the packed scope so a failed pack cannot destroy the last usable snapshot. For example, with the selected executable in place of `repomix`:

    repomix . --include "src/features/authentication/**,src/shared/**,CONTEXT.md,package.json" --style xml --output /tmp/<unique-directory>/snapshot.xml

Enforce a wall-clock deadline of 120 seconds per attempt, including launcher startup. A tool's polling/yield interval is not a process timeout. Use a process supervisor, `timeout`/`gtimeout` when installed, or Python subprocess supervision with process-group cleanup on macOS. Poll in intervals of at most 30 seconds; on expiry, terminate the launched process and its children and collect its exit status and diagnostic output. Retry only when a concrete cause has been corrected, never the same silent command indefinitely.

After a successful exit, check that the temporary output is non-empty and contains file entries for the required paths, for example:

    rg -n -F '<file path="src/features/authentication/authentication-code-verification.ts">' /tmp/<unique-directory>/snapshot.xml

If required files are missing, inspect the chosen scope and ignore/configuration rules before one corrected attempt. Once the generated output is non-empty and contains the task's required file entries and current contents, replace `repomix-output.xml` with it. Then use that refreshed root snapshot in Step 3; do not continue using the old snapshot after a successful refresh. Record the command, version, scope, files processed, and estimated tokens from the summary.

On unavailability, failure, timeout, or incomplete output after the corrected attempt, preserve the old snapshot and report the observed reason. Continue the calling task by searching and reading the relevant working-tree files, labelled `Repomix unavailable — working-tree fallback: <reason>`. Do not claim a snapshot was loaded in this branch.

## Step 3 — Explore the output first

Search before reading large sections. Use `rg` against `repomix-output.xml` to locate the file tree, relevant paths, symbols, and neighbouring modules; then read only the sections needed by the calling skill. Keep the snapshot's path boundaries and any compression limits in mind.

For example:

    rg -n -i "<domain-term>|<symbol>|<relevant/path>" repomix-output.xml

Use direct file reads after the snapshot when exact current contents matter. Never infer an unobserved implementation from a compressed or stale snapshot.

Report: `Repomix context loaded — <N> tokens, scope <patterns-or-root>, format <compressed|full>.` If reusing a snapshot without a token summary or known compression mode, report those values as unknown. Then hand back to the calling skill.

## Completion criterion

Done when either the relevant sections of a validated snapshot have been searched and read into this context window, or the bounded generation attempt has ended and the relevant working-tree files have been searched and read with the fallback reason reported. The calling skill may proceed in either branch.
