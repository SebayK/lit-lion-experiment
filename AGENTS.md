# AGENTS.md

Project-level guidance for AI coding agents working in this repo.

## Agent skills

### Codebase context

For work that depends on repository structure or source code, invoke `.agents/skills/repomix-context` before exploring. It reuses a non-empty `repomix-output.xml` when available and generates one with Repomix when needed. Use the working tree for exact current diffs, conflict state, generated files, and files the task changes.

### Issue tracker

Issues live as local markdown files under `.scratch/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Using the default five-label vocabulary (needs-triage, needs-info, ready-for-agent, ready-for-human, wontfix). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout — `CONTEXT.md` at the repo root, ADRs under `docs/adr/`. See `docs/agents/domain.md`.

