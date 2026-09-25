# 4. Headless Validation Engine and Domain Specifications

* Status: Accepted
* Date: 2026-09-05

## Context and Problem Statement

Application process steps (such as the Income Step) require validation at two distinct levels:
1. **DOM / UI Level**: Interactive feedback in forms, focusing first error, scrolling error into view, and updating field visual states.
2. **Domain / Store Level**: Verifying pre-filled or API-imported draft items (e.g., when the user attempts to proceed to the next step) without needing active DOM form elements mounted in the tree.

Duplicating validation logic between UI components and store validation functions violates the Single Source of Truth (SSOT) principle and increases maintenance costs.

## Decision Drivers

* Need a single source of truth for validation rules per Income Source (`umowa_o_prace`, `800plus`, etc.).
* Must reuse `@lion/ui` `Validator` instances (`Required`, `MinNumber`, `MinLength`, etc.) programmatically without mounting DOM elements.
* Maintain clean separation of concerns between domain logic and Lit/DOM presentation layers.

## Considered Options

1. **DOM-Only Validation**: Rely solely on `<lion-form>` and `<lion-input>` components mounted in DOM to perform validation.
2. **Duplicated Validators**: Write custom JS validation functions for Store/Step validation and separate Lion validators for UI inputs.
3. **Headless Specification & Validation Engine (Chosen)**: A standalone `IncomeSpecification` defining rules via Lion `Validator` instances, evaluated programmatically by a `ValidationEngine` for domain/store data, and bound to Lion UI controls via `FormController`.

## Decision Outcome

Chosen Option: **Option 3 (Headless Specification & Validation Engine)**.

### Details:
* **`IncomeSpecification`**: Declarative map returning field rules and `@lion/ui` `Validator` instances per Income Source. Combines base domain rules with product-specific rules provided via `IncomeStepConfig` composition.
* **`ValidationEngine`**: Headless runner executing Lion validators (`validator.execute(value)`) against raw JS objects from the Redux Store. Returns rich error details (`validatorName`, `param`, `type`). Keeps Redux state strictly serializable by instantiating Lion `Validator` objects on the fly within the engine.
* **`FormController`**: Integrates with Lit components and `<lion-form>` to manage UI navigation (focus, scroll, error highlighting) using the same specifications injected via component props (`IncomeStepConfig`).

## Consequences

### Positive:
* Single source of truth for all validation rules across all 4 financial application processes.
* Redux store remains 100% serializable (no class instances stored in state).
* 100% unit-testable domain validation without browser/JSDOM dependencies.
* Seamless UX: Incomplete draft incomes from API trigger automatic dialog opening with immediate field error highlighting.

### Negative:
* Slightly higher initial setup abstraction for schema maps.

