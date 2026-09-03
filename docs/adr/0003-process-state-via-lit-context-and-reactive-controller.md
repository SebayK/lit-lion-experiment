---
status: accepted
---

# Process State Management via ReactiveController and @lit/context in VSA

We have decided to manage multi-step Application Process state using a dedicated `ProcessController` (implementing Lit's `ReactiveController`) provided down the DOM component tree via `@lit/context`.

## Context & Problem
An Application Process spans multiple steps (Calculation, Contact Verification, Income, Summary). The process requires sharing state (e.g. calculation parameters, verification status) between steps and enforcing step progression guards, while keeping each step's UI and local logic modular following Vertical Slice Architecture (VSA).

## Decision
1. **Hierarchical State**: The shell (`process-shell`) instantiates `ProcessController` which manages process-wide state, step progression status, and navigation guards. Individual steps may have local controllers for step-internal UI tasks.
2. **Distribution via Lit Context**: The `ProcessController` instance is provided at `ProcessShell` using `@provide({ context: processContext })` and consumed by step pages/controllers using `@consume({ context: processContext })`.
3. **In-Memory Lifespan**: The state lives in-memory for the duration of the SPA session.
4. **VSA Locality**: Slices specific to the process are co-located directly in `src/features/process/<step-name>/` (e.g. `calculation/`, `email-verification/`, `phone-verification/`, `dashboard/`).
5. **Step Guards**: Direct navigation to subsequent steps is validated against `ProcessController.canAccess(step)`, redirecting to the earliest uncompleted step if prerequisites are missing.

## Trade-offs & Consequences
- **Decoupled Slices**: Step components remain decoupled from global stores (e.g. Redux) and do not need complex prop-drilling through `@lit-labs/router`.
- **Lit Idiomatic**: Leverages native web component community context protocol and Lit's reactive lifecycle.
- **In-Memory Boundary**: Refreshing the browser page resets the in-memory state; persistent recovery (if needed in future) can be added as a hydration layer within `ProcessController` without modifying step views.
