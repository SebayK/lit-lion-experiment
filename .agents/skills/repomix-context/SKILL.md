---
name: repomix-context
description: Pack a scoped slice of this repo into an AI-readable repomix file, then load it as context before the main skill runs. Use when another skill needs a focused codebase snapshot.
disable-model-invocation: true
---

Pack a scoped slice of the repo with `repomix` so the calling skill has structured codebase context before it acts.

## Step 1 — Check for an existing snapshot

Check whether `repomix-output.xml` already exists in the working directory (run `ls repomix-output.xml 2>/dev/null`).

**If it exists**, ask the user in one message:

> A `repomix-output.xml` was found. Do you want to reuse it, or regenerate it for a different scope/format?

- If they say **reuse** (or say nothing), skip to Step 3.
- If they say **regenerate**, continue to Step 2.

**If it does not exist**, continue to Step 2.

## Step 2 — Ask for scope and run repomix

Ask the user two questions in one message:

> 1. **Scope**: which path(s) should repomix pack? Give a folder, a glob (e.g. `src/features/process/**`), or leave blank for the whole repo.
> 2. **Format**: `--compress` (token-efficient signatures only — recommended for large scopes) or full source?

If the user leaves scope blank, use the repo root with `--compress`.

Build and run the command:

    npx repomix [<path>] [--compress] --output repomix-output.xml

Show the token count from repomix's summary line so the user can see how large the snapshot is.

## Step 3 — Load the output

Read `repomix-output.xml` into context. From this point the calling skill has the full snapshot available.

Report: "Repomix context loaded — `<N>` tokens, scope `<path-or-root>`, format `<compressed|full>`." Then hand back to the calling skill.

## Completion criterion

Done when `repomix-output.xml` exists, is non-empty, and its content has been read into this context window. The calling skill may now proceed.
