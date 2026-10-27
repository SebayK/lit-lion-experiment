---
applyTo: '**/*.test.ts'
---

# Testing, TDD & Anti-Gaming Guardrails

Guidelines for test implementation, TDD execution, and quality guardrails.

## 1. Anti-Gaming & Anti-Overfitting (Strict Invariant)

- **Never Game or Hack Tests:**
  Never hardcode mock return values or branch specifically for test fixture inputs (`if (param === 'fixture') return ...`). Implement genuine, generic domain logic that satisfies the contract.
- **Never Modify Pre-Authored Test Assertions:**
  When working from tickets or specifications with pre-authored test files, editing test assertions to force a test to pass is strictly forbidden. The implementation code must adapt to the contract test, not vice versa.

## 2. Skeleton-First TDD Flow

- **Red-Green-Refactor:**
  1. **Red:** Stub the contract or export, establish failing test assertions, and verify that the suite fails for the intended reason.
  2. **Green:** Write the minimal production code needed to pass the tests.
  3. **Refactor:** Clean up code smells, apply Composed Method / SLAP, and eliminate duplication while keeping all tests green.
- **Characterization Tests:**
  Before migrating legacy Redux `switch/case` reducers to RTK `createSlice`, lock current behavior using retroactively written characterization tests. Do not modify these assertions during slice rewrite.

## 3. Self-Audit Gate (Mandatory Before Commit)

- Re-read ticket requirements and atomic checkboxes in full.
- Verify all modified symbol call-sites across `src/`.
- Ensure `npx tsc --noEmit && npm test` exit with 0.
- Verify that no placeholders (`// TODO`), dummy return values, or unused abstractions were left behind.
