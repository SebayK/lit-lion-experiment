---
applyTo: '**/*.ts'
---

# TypeScript & Clean Code Standards

Instructions for authoring, editing, and refactoring TypeScript code in this repository.

## 1. Type Modeling Hierarchy

- **Default to String Literal Unions (80% of cases):**
  For state models, discrete variants, process statuses, and component props, use pure string literal unions. Zero runtime JavaScript overhead (KISS).
  ```ts
  export type ProcessStatus = 'idle' | 'pending' | 'success' | 'error';
  ```
- **Use `as const` Object Maps for Runtime Iteration (20% of cases):**
  Use `const` objects with `as const` assertions only when runtime access (`Object.values()`, mapping dictionaries, dropdown options, UI labels) is genuinely required. Derive the type from the object:
  ```ts
  export const AuthChannel = {
    Email: 'email',
    Phone: 'phone',
  } as const;
  export type AuthChannel = (typeof AuthChannel)[keyof typeof AuthChannel];
  ```
- **Forbid Standard `enum` and `const enum`:**
  Zero tolerance for TypeScript `enum` or `const enum` in new code. Standard enums generate runtime IIFE boilerplate, conflict with structural typing (consumers cannot pass raw string literals), cause tree-shaking regressions, and break isolated transpilations (`isolatedModules`). Prefer migrating legacy enums to `as const` object maps during refactoring.
- **`interface` vs `type`:**
  - Use `interface` for domain entity models, data records, and extensible public contracts (enables `tsc` declaration caching and declaration merging).
  - Use `type` for unions, primitives, tuples, single function signatures, and utility/mapped types.
  - Never declare empty interfaces (`interface Foo {}`).

## 2. Type Strictness & Compiler Invariants

- **Zero `any`:** Never use `any`. Use `unknown` at application boundaries (API responses, event payloads, DOM events) and narrow via Custom Type Guards (`val is T`) or Assertion Functions (`asserts val is NonNullable<T>`).
- **`satisfies` Operator:** Use `satisfies` to validate object shapes against interfaces/contracts without type widening (preserves exact inferred literal keys and autocompletion).
- **Exhaustive Checking with `never`:** Always use `assertNever(x: never): never` in `switch` default branches to guarantee compile-time errors when union variants are added.

## 3. Destructuring & Context Preservation

- **Favor Destructuring:**
  - In function parameter objects (`function renderHeader({ title, currentStep }: HeaderProps)`).
  - When extracting Redux `action.payload` properties.
  - When accessing 2+ local properties repeatedly in a method body to eliminate repetitive object traversal.
- **Preserve Object Prefixes:**
  - Do NOT destructure when it obscures domain origin or causes naming collisions (e.g., retain `client.name` and `company.name`).
  - Do NOT destructure large (8+) property bags.
  - Do NOT destructure instance methods that depend on lexical `this`.
  - In Lit templates, access reactive properties via `this.<prop>` to preserve reactive tracking clarity.

## 4. Refactoring Guru Smells & Clean Code

Apply the refactoring catalog from [Refactoring.Guru](https://refactoring.guru/refactoring/smells) systematically:

### A. Bloaters (Excessive Code Size)
- **Long Method:** Functions must not exceed ~15–20 lines. Apply **Composed Method** and **SLAP (Single Level of Abstraction)**: top-level functions must read like a high-level script/table of contents, delegating detail steps to well-named helper functions.
- **Primitive Obsession:** Do not use raw `string` or `number` for domain-critical identifiers or currencies. Use **Branded Types** (`Brand<string, 'UserId'>`) or Value Objects.
- **Data Clumps & Long Parameter List:** When 3+ parameters travel together (e.g., `amount`, `currency`, `period`), apply **Introduce Parameter Object** to group them into a typed interface (e.g. `CalculationData`).
- **Large Class:** Split oversized classes by SRP into headless domain modules and focused UI components.

### B. Control Flow & Logic Smells
- **Nested Conditionals (*Arrow Anti-Pattern*):** Eliminate pyramids of `if/else` by applying **Replace Nested Conditional with Guard Clauses** (invert conditions and exit early with `return`).
- **Switch Statements Smell:** Avoid monolithic `switch/case` branches for domain logic; prefer **Strategy Pattern** or lookup dispatch maps (`Record<Status, Handler>`). Note: when `switch` is required for union narrowing, enforce exhaustiveness via `assertNever(val: never)`.

### C. Change Preventers & Couplers
- **Feature Envy:** If a function in Module A predominantly accesses data properties of Module B, apply **Move Method** to colocate the logic with the data it manipulates.
- **Inappropriate Intimacy & Shotgun Surgery:** Enforce strict Vertical Slice encapsulation. Never allow deep intra-feature imports; all cross-slice communication must flow strictly through the slice's public `index.ts`.
- **Divergent Change:** A module must have only one reason to change (SRP). Separate API translation (`ProductAdapter`) from domain rules (`domain/`) and rendering (`components/`).

### D. Dispensables (Dead Weight)
- **Comments as Deodorant:** Do not explain messy code with comments. Refactor the code and extract well-named functions so the code documents itself. Reserve comments exclusively for non-obvious "why" rationale.
- **Duplicate Code (Rule of Three):** Duplicate twice safely; extract a shared abstraction on the third repetition. Derive types from single sources of truth (`typeof`, `keyof`, `ReturnType`), but never prematurely unify distinct domain models that coincidentally share shapes.
- **Dead Code & Speculative Generality:** Zero tolerance for unused abstractions, commented-out blocks, or parameters prepared "just in case" (YAGNI).

## 5. Modern JavaScript (ES2023 / ES2024)

- **Non-mutating Array Methods:** Prefer `toSorted()`, `toReversed()`, `toSpliced()`, and `with(index, value)` over mutating counterparts.
- **Collection Partitioning:** Use `Object.groupBy()` or `Map.groupBy()` instead of custom reduce aggregations.
- **Deferred Async Operations:** Use `Promise.withResolvers()` for deferred promises in adapters and bridge layers.
