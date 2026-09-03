# 0001: Generic Income Step configured via props

We decided to consolidate three separate but highly similar "Income Step" components into a single, generic `<income-step>` component. This single component will handle the income collection process for all 4 financial products (credit card, loan, etc.).

We chose to inject the product-specific configuration (such as allowed income sources, validation limits) directly into the component via properties (props), rather than having the component fetch this context from a global state (e.g. Redux).

This trade-off means the parent container (which knows about the product) is responsible for mapping business rules into a config object, keeping the `income-step` itself "dumb", highly reusable, and decoupled from the overall product logic.
