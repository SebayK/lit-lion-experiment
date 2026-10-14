---
name: audit-issue
description: Adversarial diff-vs-ticket auditor. Run on a clean chat after /implement to catch every requirement the coding agent silently dropped, find uncovered call-sites, and patch all gaps before Repomix snapshot.
disable-model-invocation: true
---

# Audit Issue

Adversarially compare the current `git diff` against the designated ticket file. Patch every gap found without prompting.

Run this skill **after `/implement` and before creating a Repomix snapshot**, on a clean chat context.

## Input

The user provides the ticket file path, e.g. `.scratch/income/issues/03-sanitize-b2b.md`.

## Process

### 1. Load the ticket

Read the ticket file in full. Extract:

- Every checkbox from **Requirements**
- Every row from **Blast Radius & Call-Sites**
- Every `it('should...')` from **Verification & Test Assertions**
- Every rule from **Guardrails & DO NOTs**

### 2. Load the diff

```bash
git diff main...HEAD   # or: git diff HEAD~1 if on a single-commit branch
```

If the diff is large, also run:

```bash
git diff main...HEAD --name-only
```

to get the file list first, then inspect individual files as needed.

### 3. Atomise and cross-check

For each checkbox in Requirements:

1. Parse it into its minimal atomic claim (function name, file, behaviour, type shape).
2. Search the diff for evidence the claim is satisfied.
3. If evidence is absent or partial, mark the checkbox **MISSING**.

### 4. Call-site sweep

For every function, type, or constant named in Blast Radius, run:

```bash
rg -n "<symbol>" src/
```

Compare results against the "Call-sites to update" table. Flag any live call-site that:

- Still uses the old signature, or
- Was not listed in the ticket but would be affected by the change.

### 5. Test coverage check

For every `it('should...')` in the ticket's Verification section:

```bash
rg -n "should <key phrase>" src/
```

Confirm the test exists in the diff or in an existing test file and is not skipped (`xit`, `it.skip`, `xtest`).

### 6. Guardrails check

For each DO NOT rule in Guardrails & DO NOTs, grep the diff for the forbidden pattern:

```bash
git diff main...HEAD | rg "<forbidden pattern>"
```

Flag any hit.

### 7. Audit report

Produce the full audit report:

```
## Audit Report — <ticket title>

### Requirements

| # | Requirement | Status | Evidence (file:line or "not found") |
|---|-------------|--------|--------------------------------------|
| 1 | ... | DONE / MISSING | src/...:42 |

### Call-sites

| Symbol | Expected sites updated | Found uncovered sites |
|--------|------------------------|-----------------------|
| fn() | loan-shell.ts:17 | ✓ / MISSING: path:line |

### Test coverage

| Scenario | Test file:line | Status |
|----------|----------------|--------|
| should remove B2B... | income.test.ts:34 | DONE / MISSING |

### Guardrail violations

| Rule | Violation found | Diff line |
|------|-----------------|-----------|
| No any casts | — | — |
```

### 8. Patch all gaps

For every MISSING or VIOLATION row:

1. Implement the missing code immediately — do not ask the user for permission.
2. After patching, re-run compile and tests:
   ```bash
   npx tsc --noEmit && npm test
   ```
3. Re-generate the affected table rows with updated status.

Do not close the audit until every row shows DONE and compile + tests exit 0.
