---
applyTo: 'src/**/*.ts'
---

# Architecture, State Management & Layering Guidelines

Guidelines for Vertical Slice Architecture, Lit components, and Redux Toolkit within `src/`.

## 1. Vertical Slice Architecture (VSA)

- **Feature Organization:**
  Group features under `src/features/<feature-name>/` (e.g. `src/features/income/`, `src/features/authentication/`). Each feature contains its own UI components, headless domain engines, and RTK store slice.
- **Public API Barrier (`index.ts`):**
  External modules must consume a feature solely via its public entry point `src/features/<feature-name>/index.ts`. Deep imports into internal files (e.g. `../income/domain/internal-helper.js`) are strictly forbidden.
- **Shared Code Discipline:**
  Only truly generic utilities, cross-feature contracts, and base wrappers belong in `src/shared/`. Never import feature-specific code into `src/shared/`.

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
  Discrete Process Steps (`Process Step`) must not be imported statically in the initial application bundle. Use dynamic imports (`await import('../features/income/index.js')`) when entering each step.
- **Lazy-Load Heavy Dialogs:**
  Heavy modal dialogs, secondary workflows, and outlier product features must be loaded on-demand.
- **WebView Performance:**
  Minimizing initial bundle size and memory footprint is critical for mobile WebViews and Native Bridge startup performance.
