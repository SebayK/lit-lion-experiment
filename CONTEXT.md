# Lit Lion Experiment

This project manages application processes for various financial products, utilizing a shared component library built with Lit, Lion.js, and Redux Toolkit.

## Language

**Product**:
A financial offering (e.g., Credit Card, Loan, Account Limit) that a customer applies for. Each product has its own multi-step application process and specific business rules.
_Avoid_: Product type, Offering

**Income Step**:
A single screen in the application process where the customer manages their declared revenue. It contains a table of already added incomes and a dialog/form to add or edit incomes.
_Avoid_: Income form, Income screen

**Income**:
A single source of revenue declared by the customer within the Income Step. It contains details such as the source type, amount, duration, and payment method.
_Avoid_: Salary, Revenue

**Income Source**:
The classification of the revenue (e.g., Employment Contract, 800+, Alimony). The Income Source intrinsically determines which specific fields (like NIP, company name, or children details) are collected, as well as baseline validations.
_Avoid_: Income type, Category

**Application Process**:
A multi-step business flow guiding a customer through applying for a financial product from initiation to completion.
_Avoid_: Flow, Wizard, Journey

**Process Step**:
A discrete, sequential stage or screen within an Application Process (e.g., Calculation, Contact Verification, Income, Summary).
_Avoid_: Screen, Sub-page, Phase

**Calculation Data**:
The financial parameters and calculated terms (e.g., loan amount, period, monthly installment) established during the Calculation step and required by subsequent Process Steps.
_Avoid_: Calc result, Simulation

**Native Bridge**:
The abstract communication layer that translates between the web application's Request-Response model and the underlying native device WebView bridges (Android's `addJavascriptInterface` and iOS's `WKScriptMessageHandler`). It handles JSON serialization and Correlation ID mapping.
_Avoid_: window.android, postMessage wrapper
