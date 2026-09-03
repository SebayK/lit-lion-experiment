# Manual QA Checklist - Process State Management

**Feature:** Process State Management with Route Guards and Stepper UI  
**Spec Path:** `.kiro/specs/process-state-management`  
**Date Created:** Task 15.2 Execution  
**Status:** Ready for QA

## Prerequisites

Before starting QA, ensure:

1. ✅ The development server is running:
   ```bash
   npm start
   ```

2. ✅ Navigate to the application process shell (typically at `http://localhost:8000/process` or similar)

3. ✅ Open browser DevTools Console to monitor route guard logs

4. ✅ Have browser DevTools Network tab open to verify no 404 errors

## QA Test Scenarios

### 1. Complete Full Process Flow (Happy Path)

**Objective:** Verify users can complete the entire process from calculation to dashboard when following the correct sequence.

**Steps:**

1. [ ] Navigate to `/process` (or the process entry point)
   - **Expected:** Should redirect or show the calculation step page
   
2. [ ] On the Calculation step page:
   - **Expected:** See a form with fields for loan amount, period (months), and interest rate
   - [ ] Fill in valid calculation data:
     - Loan Amount: 100000
     - Period: 60 months
     - Interest Rate: 5.5%
   - [ ] Click "Complete" or submit button
   - **Expected:** Page navigates to `/process/email-verification`

3. [ ] On the Email Verification step page:
   - **Expected:** See an email input field and verification button
   - [ ] Enter a valid email address (e.g., `test@example.com`)
   - [ ] Click "Verify" button
   - **Expected:** Page navigates to `/process/phone-verification`

4. [ ] On the Phone Verification step page:
   - **Expected:** See a phone input field and verification button
   - [ ] Enter a valid phone number (e.g., `+48 123 456 789`)
   - [ ] Click "Verify" button
   - **Expected:** Page navigates to `/process/dashboard`

5. [ ] On the Dashboard step page:
   - **Expected:** See a summary displaying:
     - Loan Amount: 100000 zł
     - Period: 60 months
     - Monthly Installment: (calculated value)
     - Email: test@example.com
     - Phone: +48 123 456 789
   - [ ] Verify all data is displayed correctly
   - [ ] See a "Rozpocznij nowy proces" (Start new process) button

6. [ ] Click "Rozpocznij nowy proces" button
   - **Expected:** Should reset process and navigate back to `/process/calculation`
   - **Expected:** All stepper badges should show as "pending" (not completed)

**Validation:** ✅ / ❌

---

### 2. Route Guard Blocking - Direct URL Manipulation

**Objective:** Verify that route guards prevent users from accessing steps they haven't unlocked yet.

#### Test 2.1: Skip to Email Verification without Calculation

1. [ ] Open a fresh browser tab (or clear process state by refreshing)
2. [ ] Manually navigate to `/process/email-verification` in the URL bar
   - **Expected:** Should be blocked by route guard
   - **Expected:** Notification banner appears with message: "Aby kontynuować, najpierw ukończ krok: Kalkulacja"
   - **Expected:** Automatically redirected to `/process/calculation`
   - **Expected:** URL changes to `/process/calculation`

**Validation:** ✅ / ❌

#### Test 2.2: Skip to Phone Verification without Email

1. [ ] Complete the Calculation step (fill form and submit)
2. [ ] **Without** completing Email Verification, manually navigate to `/process/phone-verification`
   - **Expected:** Should be blocked by route guard
   - **Expected:** Notification banner appears: "Aby kontynuować, najpierw ukończ krok: Weryfikacja Email"
   - **Expected:** Redirected to `/process/email-verification`

**Validation:** ✅ / ❌

#### Test 2.3: Skip to Dashboard without All Steps

1. [ ] Complete only Calculation and Email Verification
2. [ ] **Without** completing Phone Verification, manually navigate to `/process/dashboard`
   - **Expected:** Should be blocked by route guard
   - **Expected:** Notification banner appears: "Aby kontynuować, najpierw ukończ krok: Weryfikacja Telefonu"
   - **Expected:** Redirected to `/process/phone-verification`

**Validation:** ✅ / ❌

#### Test 2.4: Skip Multiple Steps

1. [ ] Open fresh browser tab / clear state
2. [ ] Manually navigate to `/process/dashboard` (without completing any steps)
   - **Expected:** Should be blocked
   - **Expected:** Notification appears: "Aby kontynuować, najpierw ukończ krok: Kalkulacja"
   - **Expected:** Redirected to `/process/calculation` (first uncompleted step)

**Validation:** ✅ / ❌

---

### 3. Backward Compatibility Route Redirects

**Objective:** Verify legacy routes redirect to the new route structure.

#### Test 3.1: Legacy `/process/income` Route

1. [ ] Navigate to `/process/income`
   - **Expected:** Should automatically redirect to `/process/calculation`
   - **Expected:** URL updates to `/process/calculation`
   - **Expected:** No error or 404 page

**Validation:** ✅ / ❌

#### Test 3.2: Legacy `/process/summary` Route

1. [ ] Complete all steps through Phone Verification
2. [ ] Navigate to `/process/summary`
   - **Expected:** Should automatically redirect to `/process/dashboard`
   - **Expected:** URL updates to `/process/dashboard`
   - **Expected:** Dashboard content displays correctly

**Validation:** ✅ / ❌

---

### 4. Notification System Behavior

**Objective:** Verify notifications appear correctly and can be dismissed.

#### Test 4.1: Auto-Dismiss Timer

1. [ ] Trigger a route guard redirect (e.g., navigate to `/process/dashboard` without prerequisites)
2. [ ] Observe the notification banner
   - **Expected:** Notification appears with warning icon (⚠️)
   - **Expected:** Message is clearly visible
   - [ ] Wait 3 seconds without interaction
   - **Expected:** Notification automatically disappears after 3 seconds

**Validation:** ✅ / ❌

#### Test 4.2: Manual Dismiss

1. [ ] Trigger a route guard redirect again
2. [ ] Immediately click the "×" dismiss button on the notification
   - **Expected:** Notification dismisses immediately (before 3 seconds)
   - **Expected:** No console errors

**Validation:** ✅ / ❌

#### Test 4.3: Multiple Rapid Redirects

1. [ ] Without completing any steps, rapidly navigate between:
   - `/process/email-verification` → redirects
   - `/process/phone-verification` → redirects
   - `/process/dashboard` → redirects
   - **Expected:** Each redirect shows notification briefly
   - **Expected:** Old notifications are replaced by new ones (no stacking)
   - **Expected:** No memory leaks or timeout conflicts

**Validation:** ✅ / ❌

---

### 5. Stepper Visual States

**Objective:** Verify the stepper correctly reflects step accessibility, completion, and active states.

#### Test 5.1: Initial State (All Steps Pending)

1. [ ] Navigate to `/process/calculation` in a fresh session
2. [ ] Observe the stepper UI
   - **Expected:** "Kalkulacja" badge shows as active (blue, highlighted)
   - **Expected:** "Email", "Telefon", "Panel" badges are disabled (gray, not clickable)
   - **Expected:** Hover over disabled badges shows tooltip: "Ukończ poprzednie kroki aby odblokować"

**Validation:** ✅ / ❌

#### Test 5.2: After Completing Calculation

1. [ ] Complete the calculation step (submit form)
2. [ ] Observe the stepper on Email Verification page
   - **Expected:** "Kalkulacja" badge shows as completed (green background)
   - **Expected:** "Email" badge shows as active (blue, highlighted)
   - **Expected:** "Telefon" and "Panel" badges remain disabled (gray)
   - [ ] Click on "Kalkulacja" badge
   - **Expected:** Can navigate back to calculation (accessible)

**Validation:** ✅ / ❌

#### Test 5.3: Progressive Unlocking

1. [ ] Complete Email Verification step
2. [ ] Observe stepper on Phone Verification page
   - **Expected:** "Kalkulacja" and "Email" badges show as completed (green)
   - **Expected:** "Telefon" badge shows as active (blue)
   - **Expected:** "Panel" badge is still disabled (gray)

3. [ ] Complete Phone Verification step
4. [ ] Observe stepper on Dashboard page
   - **Expected:** "Kalkulacja", "Email", "Telefon" badges all show as completed (green)
   - **Expected:** "Panel" badge shows as active (blue)

**Validation:** ✅ / ❌

#### Test 5.4: Disabled Step Click Behavior

1. [ ] On Calculation page (fresh state)
2. [ ] Attempt to click on "Panel" (disabled) badge
   - **Expected:** Does NOT navigate (link is disabled)
   - **Expected:** Tooltip appears on hover explaining prerequisites
   - **Expected:** Cursor shows "not-allowed" style

**Validation:** ✅ / ❌

#### Test 5.5: Clicking Accessible Completed Steps

1. [ ] After completing Calculation and Email, while on Phone Verification page
2. [ ] Click on "Kalkulacja" badge (completed, accessible)
   - **Expected:** Navigates back to `/process/calculation`
   - **Expected:** Can navigate forward again (state is preserved)
3. [ ] Click on "Email" badge
   - **Expected:** Navigates to `/process/email-verification`

**Validation:** ✅ / ❌

---

### 6. Page Refresh Scenarios

**Objective:** Verify route guards enforce prerequisites even after page refresh.

#### Test 6.1: Refresh on Calculation Page

1. [ ] Navigate to `/process/calculation` (fresh state)
2. [ ] Press F5 or refresh the page
   - **Expected:** Page reloads successfully
   - **Expected:** Stays on calculation page
   - **Expected:** No redirect or error

**Validation:** ✅ / ❌

#### Test 6.2: Refresh on Email Verification (Without Prerequisites)

1. [ ] Open a fresh browser tab
2. [ ] Navigate directly to `/process/email-verification`
3. [ ] Wait for redirect to `/process/calculation`
4. [ ] **Without completing calculation**, manually change URL back to `/process/email-verification`
5. [ ] Press F5 to refresh
   - **Expected:** Route guard blocks access on refresh
   - **Expected:** Redirects back to `/process/calculation`
   - **Expected:** Notification appears

**Validation:** ✅ / ❌

#### Test 6.3: Refresh on Completed Step

1. [ ] Complete Calculation and Email Verification
2. [ ] While on `/process/email-verification`, press F5 to refresh
   - **Expected:** Page reloads successfully
   - **Expected:** **CAVEAT:** If state is in-memory only (not persisted), refresh will lose state and redirect to calculation
   - **Note:** This is expected behavior based on design (in-memory state, no persistence)

**Validation:** ✅ / ❌ (Expected: Redirect due to state loss)

#### Test 6.4: Refresh at Various Steps

Test refresh behavior at each step with appropriate prerequisites completed:

1. [ ] Complete Calculation → Refresh on Email Verification page
   - **Expected:** State lost, redirects to Calculation (in-memory design)

2. [ ] Complete Calculation + Email → Refresh on Phone Verification page
   - **Expected:** State lost, redirects to Calculation

3. [ ] Complete all steps → Refresh on Dashboard page
   - **Expected:** State lost, redirects to Calculation

**Validation:** ✅ / ❌ (Expected: All redirect to Calculation)

---

### 7. Browser Navigation (Back/Forward Buttons)

**Objective:** Verify route guards work correctly with browser back/forward navigation.

#### Test 7.1: Navigate Forward Through Steps, Then Back

1. [ ] Complete Calculation → lands on Email Verification
2. [ ] Complete Email Verification → lands on Phone Verification
3. [ ] Press browser Back button
   - **Expected:** Navigates back to `/process/email-verification`
   - **Expected:** Email verification page displays correctly
4. [ ] Press browser Back button again
   - **Expected:** Navigates back to `/process/calculation`

**Validation:** ✅ / ❌

#### Test 7.2: Back Button from Guarded Redirect

1. [ ] Fresh state, navigate to `/process/dashboard`
2. [ ] Route guard redirects to `/process/calculation`
3. [ ] Press browser Back button
   - **Expected:** May go to previous page in history (before entering /process/dashboard)
   - **Note:** Behavior may vary by browser; verify no infinite redirect loop

**Validation:** ✅ / ❌

---

### 8. Accessibility - Keyboard Navigation

**Objective:** Verify the application is accessible via keyboard navigation.

#### Test 8.1: Tab Navigation Through Stepper

1. [ ] Navigate to `/process/calculation`
2. [ ] Press Tab repeatedly to navigate through the page
   - **Expected:** Focus moves through stepper badges (accessible ones)
   - **Expected:** Focus indicators are visible (outline/highlight)
   - **Expected:** Disabled badges are skipped (not focusable) OR focusable with aria-disabled

**Validation:** ✅ / ❌

#### Test 8.2: Enter Key Navigation

1. [ ] Tab to an accessible stepper badge (e.g., "Kalkulacja" after completing it)
2. [ ] Press Enter key
   - **Expected:** Navigates to that step
   - **Expected:** Same behavior as clicking with mouse

**Validation:** ✅ / ❌

#### Test 8.3: Notification Dismissal via Keyboard

1. [ ] Trigger a redirect notification
2. [ ] Tab to the dismiss "×" button
3. [ ] Press Enter or Space
   - **Expected:** Notification dismisses
   - **Expected:** Focus moves appropriately

**Validation:** ✅ / ❌

#### Test 8.4: Form Field Navigation

1. [ ] On Calculation page, Tab through form fields
   - **Expected:** Can navigate to all inputs via Tab
   - **Expected:** Can submit form via Enter key (if applicable)

**Validation:** ✅ / ❌

#### Test 8.5: Screen Reader Announcements

1. [ ] Enable screen reader (VoiceOver on Mac, NVDA on Windows)
2. [ ] Navigate through the stepper
   - **Expected:** Screen reader announces "Kroki procesu" navigation landmark
   - **Expected:** Announces step names and states (active, completed, disabled)
3. [ ] Trigger a notification
   - **Expected:** Screen reader announces the notification (role="alert")

**Validation:** ✅ / ❌

---

### 9. Edge Cases and Error Scenarios

#### Test 9.1: Navigate to Unknown Route

1. [ ] Navigate to `/process/unknown-step-that-does-not-exist`
   - **Expected:** Fallback route catches it
   - **Expected:** Redirects to process start page or calculation
   - **Expected:** No 404 error or blank page

**Validation:** ✅ / ❌

#### Test 9.2: ProcessController Context Missing (Error State)

**Note:** This requires temporarily breaking the context provision to test error handling.

1. [ ] If possible, modify code to simulate missing ProcessController
2. [ ] Navigate to a step page
   - **Expected:** Should render error state UI
   - **Expected:** Shows message like "Nie można załadować stanu procesu"
   - **Expected:** Provides link back to process start

**Validation:** ✅ / ❌ / ⏭️ (Skip if cannot simulate)

#### Test 9.3: Rapid Navigation Clicks

1. [ ] Complete all steps to Dashboard
2. [ ] Rapidly click between stepper badges (Kalkulacja → Email → Telefon → Panel → Kalkulacja)
   - **Expected:** No console errors
   - **Expected:** Pages render correctly
   - **Expected:** No race conditions or navigation failures

**Validation:** ✅ / ❌

---

### 10. Visual Design and Styling

**Objective:** Verify UI matches design specifications.

#### Test 10.1: Notification Banner Styling

1. [ ] Trigger a notification
2. [ ] Verify visual design:
   - [ ] Background: Light yellow/amber (#fffbeb)
   - [ ] Border: Gold/amber (#fbbf24)
   - [ ] Text color: Dark brown (#92400e)
   - [ ] Warning icon (⚠️) is visible
   - [ ] Dismiss button (×) is visible and styled
   - [ ] Banner has border radius and padding

**Validation:** ✅ / ❌

#### Test 10.2: Stepper Badge States

Verify badge styling for each state:

1. [ ] **Disabled step:**
   - [ ] Background: Light gray (#f8fafc)
   - [ ] Text: Light gray (#cbd5e1)
   - [ ] Border: Light gray (#e2e8f0)
   - [ ] Cursor: not-allowed

2. [ ] **Active step:**
   - [ ] Background: Blue (#2563eb)
   - [ ] Text: White
   - [ ] Border: Blue
   - [ ] Box shadow/glow effect

3. [ ] **Completed step:**
   - [ ] Background: Light green (#dcfce7)
   - [ ] Text: Dark green (#166534)
   - [ ] Border: Green (#86efac)

**Validation:** ✅ / ❌

#### Test 10.3: Animations

1. [ ] Observe page load animation
   - **Expected:** Smooth fade-in animation (fadeIn 0.3s)
2. [ ] Trigger notification
   - **Expected:** Smooth slide-in animation (slideIn 0.3s)

**Validation:** ✅ / ❌

---

### 11. Mobile/Responsive Testing

**Objective:** Verify the application works on different screen sizes.

#### Test 11.1: Mobile View (375px width)

1. [ ] Resize browser to mobile width or use DevTools device emulation
2. [ ] Navigate through all steps
   - **Expected:** Stepper adapts to smaller screen (may stack or scroll)
   - **Expected:** Form fields are usable on mobile
   - **Expected:** Notification banner fits on screen
   - **Expected:** All interactive elements are tappable (min 44x44px touch target)

**Validation:** ✅ / ❌

#### Test 11.2: Tablet View (768px width)

1. [ ] Resize to tablet width
2. [ ] Verify layout looks good and functions correctly

**Validation:** ✅ / ❌

---

## Code-Level Automated Checks

The following checks can be performed via code review or automated tools:

### Check 1: Route Configuration Review

1. [ ] Open `process-shell.ts` and verify:
   - [ ] Route guards are implemented for email-verification, phone-verification, and dashboard
   - [ ] Calculation route has NO guard (always accessible)
   - [ ] Backward compatibility routes (/income → /calculation, /summary → /dashboard) are present
   - [ ] Fallback route (/*) redirects to start page

**Validation:** ✅ / ❌

### Check 2: ProcessController Logic

1. [ ] Open `process-controller.ts` and verify:
   - [ ] `getFirstUncompletedStep()` method exists
   - [ ] `canAccess()` method checks prerequisites correctly:
     - calculation: always true
     - email-verification: requires calculation completed + calculationData not null
     - phone-verification: requires email-verification completed
     - dashboard: requires phone-verification completed

**Validation:** ✅ / ❌

### Check 3: Notification Cleanup

1. [ ] Verify `disconnectedCallback()` in ProcessShell clears notification timeout
   - [ ] Prevents memory leaks when component unmounts

**Validation:** ✅ / ❌

### Check 4: Accessibility Attributes

1. [ ] Verify notification banner has `role="alert"`
2. [ ] Verify stepper has `aria-label="Kroki procesu"`
3. [ ] Verify disabled steps have `title` attribute with explanation
4. [ ] Verify dismiss button has `aria-label="Zamknij powiadomienie"`

**Validation:** ✅ / ❌

---

## Summary & Sign-Off

### Test Results Summary

| Test Category | Passed | Failed | Skipped | Total |
|---------------|--------|--------|---------|-------|
| 1. Full Process Flow | ? | ? | ? | ? |
| 2. Route Guard Blocking | ? | ? | ? | ? |
| 3. Backward Compatibility | ? | ? | ? | ? |
| 4. Notification System | ? | ? | ? | ? |
| 5. Stepper Visual States | ? | ? | ? | ? |
| 6. Page Refresh | ? | ? | ? | ? |
| 7. Browser Navigation | ? | ? | ? | ? |
| 8. Accessibility | ? | ? | ? | ? |
| 9. Edge Cases | ? | ? | ? | ? |
| 10. Visual Design | ? | ? | ? | ? |
| 11. Responsive | ? | ? | ? | ? |
| Code-Level Checks | ? | ? | ? | ? |

### Known Issues

List any bugs or issues discovered during QA:

1. 
2. 
3. 

### Notes

- **In-Memory State Limitation:** The current implementation uses in-memory state (no localStorage/sessionStorage). This means refreshing the page will lose all progress and redirect to the calculation step. This is **expected behavior** per the design document (persistence is a future enhancement).

### QA Sign-Off

- [ ] All critical tests passed
- [ ] All known issues documented
- [ ] Feature ready for user acceptance testing

**QA Performed By:** _______________  
**Date:** _______________  
**Approved:** ✅ / ❌
