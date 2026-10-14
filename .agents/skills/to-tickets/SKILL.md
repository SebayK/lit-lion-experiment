---
name: to-tickets
description: Break a plan, spec, or conversation into tracer-bullet tickets. Each ticket is a Zero-Context-Loss self-contained work order that an isolated coding agent can execute without access to the grilling session history.
disable-model-invocation: true
---

# To Tickets

Break a plan, spec, or conversation into **self-contained work orders**: tracer-bullet vertical slices, each declaring the tickets that **block** it.

The issue tracker and triage label vocabulary should have been provided to you. If not, tell the user to run `/setup-matt-pocock-skills`.

## Core constraint: Zero-Context-Loss Handoff

The implementing agent (e.g. GitHub Copilot Codex) starts each ticket in a **fresh context window with no access to the grilling session**. Every ticket must carry all information the agent needs, inline. A ticket that says "see ADR-002" or "per the spec" is a broken ticket.

## Process

### 1. Gather context

Work from whatever is already in the conversation context. If the user passes a reference (a spec path, an issue number or URL) as an argument, fetch it and read its full body and comments.

### 2. Explore the codebase

Invoke `repomix-context` first. Use the snapshot to understand the current state of the code. Ticket titles and descriptions must use the project's domain glossary vocabulary and respect ADRs — but the ADR content must be inlined into the ticket, not referenced by pointer.

Look for opportunities to prefactor. "Make the change easy, then make the easy change."

### 3. Draft vertical slices

Break the work into **tracer bullet** tickets.

<vertical-slice-rules>

- Each slice cuts a narrow but COMPLETE path through every layer (schema, API, UI, tests): vertical, NOT a horizontal slice of one layer
- A completed slice is demoable or verifiable on its own
- Each slice is sized to fit in a single fresh context window
- Any prefactoring should be done first
- **Strict Sizing (Max 3–5 checkboxes / ~120 lines of diff):** A single ticket must contain no more than 3 to 5 atomic checkboxes in Requirements, touching at most 3–4 files and targeting ~120–150 lines of diff. If a feature exceeds this scope, split it into sequential micro-tickets (e.g. `01a-<slug>-domain.md`, `01b-<slug>-slice.md`, `01c-<slug>-ui.md`). Coding agent attention drops sharply on tickets with >5 items.

</vertical-slice-rules>

Give each ticket its **blocking edges**: the other tickets that must complete before it can start. A ticket with no blockers can start immediately.

**Wide refactors** follow expand–contract: expand (add new form beside old), migrate call sites in batches (each a ticket blocked by expand), contract (delete old form, blocked by all migrate batches).

### 4. Quiz the user

Present the proposed breakdown as a numbered list. For each ticket, show:

- **Title**: short descriptive name
- **Blocked by**: which other tickets (if any) must complete first
- **What it delivers**: the end-to-end behaviour this ticket makes work

Ask the user: Does the granularity feel right? Are blocking edges correct? Should any tickets be merged or split?

Iterate until the user approves the breakdown.

### 5. Publish tickets

Write one file per ticket under `.scratch/<feature-slug>/issues/<NN>-<slug>.md`, numbered from `01` in dependency order (blockers first). Use the template below. Never combine tickets into a single file.

For a real tracker (GitHub, Linear): publish one issue per ticket in dependency order with native blocking links and the `ready-for-agent` label.

Do NOT close or modify any parent issue.

---

## Ticket template

Every ticket must satisfy the **self-contained test**: an agent who has never seen the grilling session can read this one file and produce a correct, complete, standards-compliant implementation.

Use this structure for every `.scratch/<feature>/issues/<NN>-<slug>.md` file:

```
# <NN>: <Ticket title>

**Status:** ready-for-agent
**Blocked by:** <numbers/titles of blocking tickets, or "None">

## What to build

One paragraph: the end-to-end behaviour this ticket makes work, from the user's perspective.

## Inlined Contracts

All data shapes, interfaces, and payload schemas the agent needs — copied verbatim.
No "see ADR" or "see SPEC.md" references permitted.

(Paste exact TypeScript interfaces, Redux action types, Lion validator signatures, etc.)

## Requirements

One checkbox = one concrete code change. Prose sentences forbidden.
Group by layer (domain / state / UI / tests) if helpful, but every item is atomic.

- [ ] 1. <exact, verifiable requirement — names specific file, function, or type>
- [ ] 2. <next requirement>
- [ ] 3. ...

## Blast Radius & Call-Sites

### Files to create or modify

| File path | Action | What changes |
|-----------|--------|--------------|
| path/to/file.ts | create / modify | Description |

### Call-sites to update

Every place in the repo that calls the changed function/type. Write "None" if none.

| Call-site path | Symbol | Change required |
|----------------|--------|-----------------|
| path/to/consumer.ts | functionName | Why it must change |

## Guardrails & DO NOTs

Rejected paths, pitfalls, and forbidden shortcuts surfaced during grilling.
Phrase positively (state the target) where possible; reserve DO NOT for hard bans.

- DO keep validation logic in domain/; Lit components receive derived state only.
- DO NOT dispatch Redux actions from inside Lit lifecycle methods — use a ReactiveController.
- DO NOT use `any` casts for Native Bridge payloads — define typed interfaces.
- <copy every rejected shortcut from the grilling session>

## Verification & Test Assertions

Concrete `it('should...')` scenarios that must exist as passing tests before closing.

### Golden Ticket Pattern (Pre-authored Contract Test File)
Whenever possible in M365 Copilot, generate the **complete target test file** (`.test.ts`) covering all scenarios.
Save this file to disk (e.g. `src/features/.../__tests__/issue-NN.test.ts`) alongside the ticket.
The ticket lists the path and inlines the test code:

```ts
// File: src/features/income/__tests__/issue-01-sanitizer.test.ts
// The implementing agent MUST make this test pass and MUST NOT modify any assertions.
import { expect } from '@esm-bundle/chai';
import { sanitizeIncomes } from '../domain/income-sanitizer.js';

it('should remove B2B incomes when business activity is false', () => { ... });
```

If a complete file is not generated, list every concrete test scenario that the agent must author:
- it('should ...', () => { ... });
- it('should ...', () => { ... });

## Architectural Constraints (inlined from ADR)

Copy the relevant ADR decision text here verbatim.
Do not reference the ADR file by path — the agent may not load it.

- <constraint 1>
- <constraint 2>
```

---

## Checklist before publishing

Before writing any ticket file, verify each ticket satisfies the self-contained test:

- [ ] Sizing limit satisfied: ticket has between 1 and 5 atomic checkboxes (split into 01a/01b if >5)
- [ ] Every interface and schema is inlined — no "see ADR/SPEC" references remain
- [ ] Every requirement is an atomic checkbox, not a prose sentence
- [ ] Blast Radius table lists every file to touch and every call-site to update
- [ ] Guardrails section contains all rejected paths from the grilling session
- [ ] Pre-authored test file generated or concrete `it('should...')` assertions inlined
- [ ] Architectural constraints are copied inline, not referenced by pointer
