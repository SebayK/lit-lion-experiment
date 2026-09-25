# Implementation Plan - Headless Validation Engine and Domain Specification

Implement a unified, headless validation architecture for the Income Step across all 4 financial application processes. This decouples business validation logic from Lit/DOM presentation components, uses `@lion/ui` `Validator` instances programmatically via `ValidationEngine`, and integrates seamlessly with `FormController` and `<income-dialog>`.

## Proposed Changes

### Domain & Validation Engine (Headless Layer)

#### [NEW] [income-specification.ts](file:///Users/sebastian/Projects/lit-lion-experiment/src/features/income/domain/income-specification.ts)
* Declarative mapping returning field validation rules and `@lion/ui` `Validator` instances (`Required`, `MinNumber`, `MinLength`, etc.) per Income Source (`umowa_o_prace`, `800plus`, etc.).
* Merges base domain rules with product-specific rules provided via `IncomeStepConfig`.

#### [NEW] [validation-engine.ts](file:///Users/sebastian/Projects/lit-lion-experiment/src/features/income/domain/validation-engine.ts)
* Headless runner executing Lion validators (`validator.execute(value)`) programmatically on raw JS objects (`Income` or form values) without requiring DOM elements.
* Returns a rich `HeadlessValidationResult` with `isValid` and detailed per-field errors (`validatorName`, `param`, `type`).

#### [NEW] [income-specification.test.ts](file:///Users/sebastian/Projects/lit-lion-experiment/src/features/income/domain/income-specification.test.ts)
* Unit tests for `IncomeSpecification` and `ValidationEngine` verifying:
  - Base rules validation for `umowa_o_prace` (including conditional `endDate` when `type === 'okreslony'`).
  - Validation for `800plus` (ignoring duration fields).
  - Merging of `IncomeStepConfig` overrides (e.g., custom `minAmount`).
  - Execution without any DOM / browser dependencies.

---

### Feature Integration Layer

#### [MODIFY] [income-schema-engine.ts](file:///Users/sebastian/Projects/lit-lion-experiment/src/features/income/engine/income-schema-engine.ts)
* Delegate validator creation and schema queries to `IncomeSpecification` and `ValidationEngine`.

#### [MODIFY] [income-dialog.ts](file:///Users/sebastian/Projects/lit-lion-experiment/src/features/income/components/income-dialog.ts)
* Bind `.validators` in template from `IncomeSpecification`.
* Add an informational warning banner when opened for an incomplete draft income.
* Run `FormController.validate()` on open for draft items to immediately highlight missing fields.

#### [MODIFY] [income-table.ts](file:///Users/sebastian/Projects/lit-lion-experiment/src/features/income/components/income-table.ts)
* Display a "Wymaga uzupełnienia" badge next to incomplete incomes evaluated via `ValidationEngine.validate()`.

#### [MODIFY] [income-app.ts](file:///Users/sebastian/Projects/lit-lion-experiment/src/features/income/components/income-app.ts)
* Add `validateStep()` method:
  - Validates all incomes in Redux Store via `ValidationEngine.validate()`.
  - If an invalid/incomplete income is found, sets `_invalidIncomeId` to automatically open its `<income-dialog>`.

---

## Verification Plan

### Automated Tests
- Run TypeScript type check: `npx tsc --noEmit`
- Run unit tests for `IncomeSpecification` and `ValidationEngine`: `npx vitest run` or `npm test`

### Manual Verification
- Test adding and editing incomes in `<income-app>` across different income sources (`umowa_o_prace`, `800plus`).
- Verify draft import flow: pre-load an incomplete income into Redux Store, trigger "Dalej", and observe automatic dialog opening with immediate field error highlighting and info banner.
