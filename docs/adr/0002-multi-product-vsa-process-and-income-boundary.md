# ADR 0002: Multi-Product Process Orchestration and Autonomous Income Domain Boundary

## Status
Accepted

## Context
Our application manages multi-step Application Processes for various financial products (e.g. Loan, Credit Card, Account Limit). 
While certain steps (like Client Profile) are shared across products, others (like the Income Step) have a shared UI structure but dynamic business rules, differing validation constraints, and product-specific income sources.

We needed to establish:
1. How independent products compose their own steps and state.
2. How the reusable `income` domain maintains state across step transitions without tight compile-time coupling to other step slices.
3. How step-dependent changes (such as disabling business activity in client data) propagate to and sanitize the income state.

## Decision

1. **Autonomous Peer Slices in Redux Store**:
   - Each domain step maintains its own slice (`clientProfileSlice`, `calculationSlice`, `incomesSlice`) combined via `combineSlices`.
   - The Store instance is managed per Product Session via a store factory (e.g. `createProductStore()`), ensuring clean state isolation between different financial products.
   - The `incomesSlice` state lives in memory for the duration of the process session, allowing seamless back/forward step navigation and global summary access.

2. **Explicit Context Injection over Action Coupling**:
   - The reusable `<income-step>` component receives applicant attributes and product rules via explicit property contracts (`.clientContext` and `.specification`).
   - The income domain does not directly import or depend on the internal action types of the client profile slice.

3. **In-Step Data Sanitization**:
   - `<income-step>` acts as the guardian of its own data integrity. When mounted or when `.clientContext` changes, it validates existing declared incomes against the current context (e.g. automatically removing B2B incomes if business activity was unticked).

4. **Composition-based Process Shells**:
   - Each financial product defines its own dedicated Process Shell (e.g. `LoanProcessShell`) using Lit `ReactiveController` composition (`RouteGuardController`, `StepNavigationController`) rather than deep inheritance hierarchies.

## Consequences

### Positive
- **High Reusability**: The `income` feature can be embedded into any financial product or standalone flow without pulling in unrelated process state.
- **Strong Isolation**: Changes to client profile API payloads or internal store shapes do not break the income domain.
- **Clean Testing**: Steps can be unit-tested in isolation by providing mock context objects.

### Trade-offs
- The Product Shell is responsible for mapping applicant profile data to the `.clientContext` contract required by `<income-step>`.
- Cross-step sanitization is evaluated at the step boundary rather than via background global Redux action listeners.
