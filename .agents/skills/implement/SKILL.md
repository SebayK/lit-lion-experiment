---
name: implement
description: "Implement a piece of work based on a spec or set of tickets."
disable-model-invocation: true
---

Implement the work described by the user in the spec or tickets.

Before writing any code, call the Skill tool with `"repomix-context"` to pack the relevant modules. Ask the user which paths are in scope for the work, and whether to use `--compress`. Use the snapshot to understand existing patterns, find extension points, and keep the implementation consistent with surrounding code.

Use /tdd where possible, at pre-agreed seams.

Run typechecking regularly, single test files regularly, and the full test suite once at the end.

Once done, use /code-review to review the work.

Commit your work to the current branch.
