---
applyTo: 'src/**/*.ts'
---

# Architecture, State Management & Layering Guidelines

Guidelines for Vertical Slice Architecture, Lit components, and Redux Toolkit within `src/`.

## 1. Vertical Slice Architecture (VSA)

- **Slice Organization (`src/pages/<step-or-page>/` or `src/features/<feature>/`):**
  Vertical Slices are organized primarily by process steps/pages under `src/pages/<step-name>/` (or feature slices under `src/features/<feature-name>/`).
  In a multi-step application process / wizard, organizing slices around `src/pages/` is an industry-standard, highly cohesive approach. Each folder encapsulates its entire vertical stack:
  - `components/` — Lit UI presentation components and form controls
  - `domain/` — headless validation engine, specifications, and business rules (zero DOM/Lit dependencies)
  - `store/` — dedicated Redux Toolkit slice
  - `types.ts` — local domain types and interfaces
  - `index.ts` — public API barrier consumed by the Process Shell / router
- **Public API Barrier (`index.ts`):**
  External modules (e.g. Process Shell, router, layout) must consume a step/page slice solely via its public barrel (`src/pages/<step>/index.ts` or `src/features/<feature>/index.ts`). Deep imports into internal files (e.g. `../pages/income/domain/internal-helper.js`) are strictly forbidden.
- **Shared Code Discipline:**
  Only truly generic utilities, cross-step contracts ([Shared Domain Contract](file:///Users/sebastian/Projects/lit-lion-experiment/CONTEXT.md#L59)), and base Lion/Lit wrappers belong in `src/shared/`. Never import step-specific code into `src/shared/`.

## 2. Single Responsibility & Headless Domain

- **Headless Domain Logic:**
  Business logic, calculation algorithms, and validation engines belong in pure TypeScript modules (`domain/` or controllers) with zero DOM, HTML, or Lit dependencies. They must be runnable and testable in headless Node.js without browser mocks.
- **Thin Lit View Components:**
  Lit components must remain declarative presentation layers using `@open-wc/scoped-elements` and `@lion/ui` form controls. Their responsibility is limited to template rendering, accessibility (a11y), and event dispatching.
- **Product Adapters:**
  Each financial product encapsulates its backend communication and state-machine nuances in a dedicated `ProductAdapter`, normalizing external payloads into the [Shared Domain Contract](file:///Users/sebastian/Projects/lit-lion-experiment/CONTEXT.md#L59).

## 3. Redux Toolkit (`createSlice`) Best Practices

- **Actions as Domain Events, Not Setters:**
  Dispatch semantic domain events (`incomeDeclared`), never generic property setters (`setAmount`). This encapsulates business rules within reducers and allows multiple slices to react to shared events.
- **Immer Mutation Discipline:**
  Inside reducers, directly mutate `state` properties OR return a new state object. Never mutate and return simultaneously.
- **Minimal Serializable State:**
  Store only raw, serializable JSON data. Never place functions, class instances, or Promises into Redux state.
- **Memoized Selectors (`createSelector`):**
  Derived data, filtering, and sorting must be computed via `createSelector` to avoid redundant Lit re-renders.

## 4. Dynamic Loading & Code Splitting

- **Lazy-Load Process Steps:**
  Discrete Process Steps (`Process Step`) must not be imported statically in the initial application bundle. Use dynamic imports (`await import('../pages/income/index.js')` or `await import('../features/income/index.js')`) when entering each step.
- **Lazy-Load Heavy Dialogs:**
  Heavy modal dialogs, secondary workflows, and outlier product features must be loaded on-demand.
- **WebView Performance:**
  Minimizing initial bundle size and memory footprint is critical for mobile WebViews and Native Bridge startup performance.
