# Implementation Plan: Process State Management

## Overview

This implementation adds route guards, step progression validation, and user notifications to the Application Process flow. The work enhances ProcessController with redirect logic, adds guard callbacks to ProcessShell routes, creates a notification system, updates the stepper UI to reflect step accessibility, and creates four new step pages following the established VSA pattern.

## Tasks

- [x] 1. Enhance ProcessController with redirect logic
  - [x] 1.1 Add getFirstUncompletedStep() method to ProcessController
    - Implement method that iterates through step order ['calculation', 'email-verification', 'phone-verification', 'dashboard']
    - Return first step with status 'pending', or 'calculation' as fallback
    - Add JSDoc comment explaining redirect use case
    - _Requirements: 3.1_
  
  - [ ]* 1.2 Write unit tests for getFirstUncompletedStep()
    - Test returns 'calculation' when all steps pending
    - Test returns 'email-verification' when calculation completed
    - Test returns 'phone-verification' when email-verification completed
    - Test returns 'calculation' as fallback when all completed
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 2. Add notification system to ProcessShell
  - [x] 2.1 Implement notification state and methods in ProcessShell
    - Add private reactive properties: notificationVisible, notificationMessage, notificationTimeout
    - Implement _showRedirectNotification(targetStep) method with 3-second timeout
    - Implement _dismissNotification() method with timeout cleanup
    - Add STEP_LABELS constant mapping ProcessStep to Polish labels
    - _Requirements: 5.1, 5.2_
  
  - [x] 2.2 Render notification banner in ProcessShell template
    - Add notification banner with role="alert" for accessibility
    - Conditionally render based on notificationVisible state
    - Include dismiss button calling _dismissNotification()
    - Style with warning colors (--notification-bg, --notification-border, --notification-text)
    - _Requirements: 5.1, 5.2, 5.3_
  
  - [x] 2.3 Add disconnectedCallback cleanup for notification timeout
    - Override disconnectedCallback to clear notificationTimeout if set
    - Prevent memory leaks when component unmounts
    - _Requirements: 5.2_
  
  - [ ]* 2.4 Write integration tests for notification system
    - Test notification appears when _showRedirectNotification called
    - Test notification auto-dismisses after 3 seconds
    - Test dismiss button hides notification immediately
    - Test timeout is cleaned up on component disconnect
    - _Requirements: 5.1, 5.2, 5.3_

- [x] 3. Checkpoint - Verify ProcessController and notification system
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement route guards in ProcessShell
  - [x] 4.1 Add route guard to email-verification route
    - Add enter callback checking processCtrl.canAccess('email-verification')
    - If false, get redirect target from getFirstUncompletedStep()
    - Call _showRedirectNotification(redirectTo)
    - Execute this.routes.goto() to redirect
    - Return false to block original navigation
    - Add try-catch with error logging and fallback to calculation
    - _Requirements: 2.1, 2.4, 3.1_
  
  - [x] 4.2 Add route guard to phone-verification route
    - Implement same guard pattern as 4.1 for 'phone-verification' step
    - Include error handling and calculation fallback
    - _Requirements: 2.2, 2.4, 3.1_
  
  - [x] 4.3 Add route guard to dashboard route
    - Implement same guard pattern as 4.1 for 'dashboard' step
    - Include error handling and calculation fallback
    - _Requirements: 2.3, 2.4, 3.1_
  
  - [x] 4.4 Ensure calculation route has no guard
    - Verify calculation route allows access without prerequisites
    - Add comment documenting that calculation is always accessible
    - _Requirements: 2.5_
  
  - [ ]* 4.5 Write integration tests for route guards
    - Test navigating to email-verification without calculation completed blocks access
    - Test navigating to phone-verification without email-verification completed blocks access
    - Test navigating to dashboard without phone-verification completed blocks access
    - Test calculation route always allows access
    - Test guards redirect to correct first uncompleted step
    - Test notification appears on blocked navigation
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1_

- [x] 5. Enhance stepper UI to reflect step accessibility
  - [x] 5.1 Refactor stepper rendering to show accessibility state
    - Modify _renderStepItem() to accept step and return different HTML based on canAccess()
    - For inaccessible steps: render disabled div with tooltip explaining prerequisites
    - For accessible steps: render clickable anchor with href
    - Add CSS classes: 'disabled', 'active', 'completed'
    - Add title attribute to disabled steps
    - _Requirements: 6.1, 6.2, 6.3_
  
  - [x] 5.2 Add tooltip display on disabled step hover
    - When user hovers over disabled step, show tooltip "Ukończ poprzednie kroki aby odblokować"
    - Implement using title attribute or custom tooltip component
    - _Requirements: 6.4_
  
  - [x] 5.3 Style stepper states with CSS design tokens
    - Add CSS variables for disabled, active, and completed states
    - Disabled: --step-disabled-bg, --step-disabled-text, --step-disabled-border
    - Completed: --step-completed-bg, --step-completed-text, --step-completed-border
    - Ensure visual distinction between states
    - _Requirements: 6.1, 6.2, 6.3_
  
  - [ ]* 5.4 Write integration tests for stepper UI
    - Test stepper renders disabled state for inaccessible steps
    - Test stepper renders clickable links for accessible steps
    - Test completed steps show completion indicator
    - Test tooltip appears on disabled step hover
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 6. Checkpoint - Verify route guards and stepper UI
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Create calculation-step-page component
  - [x] 7.1 Create calculation-step-page.ts with VSA co-location pattern
    - Define @customElement('calculation-step-page') extending LitElement
    - Consume processContext with @consume decorator
    - Implement form UI for loan amount, period, and interest rate inputs
    - Add _handleComplete(data) method that calls processCtrl.completeCalculation(data)
    - Dispatch 'request-navigate' custom event to '/process/email-verification'
    - Add styles following existing step page patterns
    - _Requirements: 1.1_
  
  - [ ]* 7.2 Write unit tests for calculation-step-page
    - Test component renders form inputs
    - Test ProcessController context consumption
    - Test form submission calls completeCalculation with correct data
    - Test navigation event is dispatched with correct detail
    - _Requirements: 1.1_

- [x] 8. Create email-verification-step-page component
  - [x] 8.1 Create email-verification-step-page.ts with VSA pattern
    - Define @customElement('email-verification-step-page') extending LitElement
    - Consume processContext with @consume decorator
    - Implement email input field and verification button
    - Add _handleVerify(email) method that calls processCtrl.completeEmailVerification(email)
    - Dispatch 'request-navigate' custom event to '/process/phone-verification'
    - Add error state UI when ProcessController context unavailable
    - _Requirements: 1.1_
  
  - [ ]* 8.2 Write unit tests for email-verification-step-page
    - Test component renders email input and button
    - Test ProcessController context consumption
    - Test verification calls completeEmailVerification with email
    - Test navigation event dispatched with correct detail
    - Test error state renders when context unavailable
    - _Requirements: 1.1_

- [x] 9. Create phone-verification-step-page component
  - [x] 9.1 Create phone-verification-step-page.ts with VSA pattern
    - Define @customElement('phone-verification-step-page') extending LitElement
    - Consume processContext with @consume decorator
    - Implement phone input field and verification button
    - Add _handleVerify(phone) method that calls processCtrl.completePhoneVerification(phone)
    - Dispatch 'request-navigate' custom event to '/process/dashboard'
    - Add error state UI when ProcessController context unavailable
    - _Requirements: 1.1_
  
  - [ ]* 9.2 Write unit tests for phone-verification-step-page
    - Test component renders phone input and button
    - Test ProcessController context consumption
    - Test verification calls completePhoneVerification with phone
    - Test navigation event dispatched with correct detail
    - Test error state renders when context unavailable
    - _Requirements: 1.1_

- [x] 10. Create dashboard-step-page component
  - [x] 10.1 Create dashboard-step-page.ts with VSA pattern
    - Define @customElement('dashboard-step-page') extending LitElement
    - Consume processContext with @consume decorator
    - Render summary displaying calculationData (loan amount, period, installment)
    - Display email and phone from ProcessController
    - Add "Rozpocznij nowy proces" button calling processCtrl.reset()
    - Dispatch 'request-navigate' event to '/process/calculation' on reset
    - Add error state UI when ProcessController context unavailable
    - _Requirements: 1.1_
  
  - [ ]* 10.2 Write unit tests for dashboard-step-page
    - Test component renders all summary data from ProcessController
    - Test reset button calls processCtrl.reset()
    - Test navigation event dispatched to calculation on reset
    - Test error state renders when context unavailable
    - _Requirements: 1.1_

- [x] 11. Update ProcessShell route configuration
  - [x] 11.1 Add route definition for calculation step
    - Add route with path '/calculation'
    - Import calculation-step-page.ts in enter callback
    - No guard needed (always accessible)
    - Render <calculation-step-page> component
    - _Requirements: 1.1, 2.5_
  
  - [x] 11.2 Add route definition for email-verification step
    - Add route with path '/email-verification'
    - Import email-verification-step-page.ts in enter callback
    - Include route guard from task 4.1
    - Render <email-verification-step-page> component
    - _Requirements: 1.1, 2.1_
  
  - [x] 11.3 Add route definition for phone-verification step
    - Add route with path '/phone-verification'
    - Import phone-verification-step-page.ts in enter callback
    - Include route guard from task 4.2
    - Render <phone-verification-step-page> component
    - _Requirements: 1.1, 2.2_
  
  - [x] 11.4 Add route definition for dashboard step
    - Add route with path '/dashboard'
    - Import dashboard-step-page.ts in enter callback
    - Include route guard from task 4.3
    - Render <dashboard-step-page> component
    - _Requirements: 1.1, 2.3_

- [x] 12. Add backward compatibility redirects
  - [x] 12.1 Add redirect from /income to /calculation
    - Add route with path '/income'
    - In enter callback, call this.routes.goto('/process/calculation')
    - Return false to block rendering
    - Add comment explaining backward compatibility
    - _Requirements: 8.1_
  
  - [x] 12.2 Add redirect from /summary to /dashboard
    - Add route with path '/summary'
    - In enter callback, call this.routes.goto('/process/dashboard')
    - Return false to block rendering
    - Add comment explaining backward compatibility
    - _Requirements: 8.2_
  
  - [ ]* 12.3 Write integration tests for backward compatibility
    - Test navigation to /process/income redirects to /process/calculation
    - Test navigation to /process/summary redirects to /process/dashboard
    - _Requirements: 8.1, 8.2_

- [x] 13. Handle page refresh guard enforcement
  - [x] 13.1 Verify route guards execute on page refresh
    - Test refreshing browser on email-verification page without calculation completed
    - Verify guard redirects to appropriate step
    - Test refreshing on calculation page always allows access
    - _Requirements: 7.1, 7.2_
  
  - [ ]* 13.2 Write end-to-end tests for refresh behavior
    - Test refresh on each step page with various ProcessController states
    - Verify correct redirect behavior matches guard logic
    - _Requirements: 7.1, 7.2_

- [x] 14. Update process-start-page to redirect to calculation
  - [x] 14.1 Modify process-start-page.ts
    - Update component to immediately redirect to '/process/calculation'
    - Can use connectedCallback or render with meta refresh pattern
    - Add comment explaining calculation is now the entry point
    - _Requirements: 1.2_

- [x] 15. Final checkpoint - Integration and validation
  - [x] 15.1 Run full test suite
    - Execute all unit tests for ProcessController
    - Execute all integration tests for route guards and stepper
    - Execute end-to-end tests for complete process flow
    - Verify test coverage meets targets (85% controller, 70% UI)
  
  - [x] 15.2 Manual QA checklist
    - Complete full process flow from calculation to dashboard
    - Attempt to skip steps via URL manipulation - verify guards block
    - Test backward compatibility routes redirect correctly
    - Verify notification appears and dismisses correctly
    - Test stepper visual states for all scenarios
    - Test page refresh on each step with various states
    - Verify accessibility with keyboard navigation
  
  - [x] 15.3 Final review and cleanup
    - Remove any console.log statements used for debugging
    - Ensure all code follows project style conventions
    - Verify all JSDoc comments are complete and accurate
    - Check for any TODO comments that should be addressed
    - Ensure all imports use .js extension (ESM compliance)

- [x] 16. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- The design document includes correctness properties but notes that property-based testing is not appropriate for this UI/routing feature - use example-based integration tests instead
- All new step pages follow the existing VSA (Vertical Slice Architecture) pattern with co-located components
- Route guards execute in the `enter` callback before rendering, leveraging @lit-labs/router functionality
- ProcessController state is in-memory only for this implementation (persistence is a future enhancement)
- All user-facing strings are in Polish per project requirements

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "2.1"] },
    { "id": 2, "tasks": ["2.2", "2.3"] },
    { "id": 3, "tasks": ["2.4", "4.1", "4.2", "4.3", "4.4"] },
    { "id": 4, "tasks": ["4.5", "5.1", "5.2", "5.3"] },
    { "id": 5, "tasks": ["5.4", "7.1"] },
    { "id": 6, "tasks": ["7.2", "8.1"] },
    { "id": 7, "tasks": ["8.2", "9.1"] },
    { "id": 8, "tasks": ["9.2", "10.1"] },
    { "id": 9, "tasks": ["10.2", "11.1", "11.2", "11.3", "11.4"] },
    { "id": 10, "tasks": ["12.1", "12.2"] },
    { "id": 11, "tasks": ["12.3", "13.1"] },
    { "id": 12, "tasks": ["13.2", "14.1"] },
    { "id": 13, "tasks": ["15.1", "15.2", "15.3"] }
  ]
}
```
