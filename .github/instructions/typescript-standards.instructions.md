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

- **Composed Method & SLAP:** Eliminate *Long Method*. Functions must operate at a Single Level of Abstraction (SLAP). Top-level methods must read like a high-level script/table of contents, delegating low-level operations to helper functions.
- **Guard Clauses:** Eliminate nested conditionals (*Arrow Anti-Pattern*) with early inverted guard clauses and early returns.
- **Pragmatic DRY (Rule of Three):** Duplicate twice safely; extract an abstraction on the third repetition. Derive types from a single source of truth (`typeof`, `keyof`, `ReturnType`), but never prematurely unify distinct domain models that coincidentally share shapes.
- **Eliminate Primitive Obsession & Data Clumps:** Use Branded Types (`Brand<string, 'UserId'>`) for identifiers and Parameter Objects for grouped parameters.

## 5. Modern JavaScript (ES2023 / ES2024)

- **Non-mutating Array Methods:** Prefer `toSorted()`, `toReversed()`, `toSpliced()`, and `with(index, value)` over mutating counterparts.
- **Collection Partitioning:** Use `Object.groupBy()` or `Map.groupBy()` instead of custom reduce aggregations.
- **Deferred Async Operations:** Use `Promise.withResolvers()` for deferred promises in adapters and bridge layers.
