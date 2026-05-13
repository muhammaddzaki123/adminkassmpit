# 🚀 BLACK BOX TESTING - ACTION PLAN & REMEDIATION

**Date:** 12 Mei 2026  
**Status:** READY FOR EXECUTION  
**Timeline:** 3-4 Weeks

---

## 📌 QUICK OVERVIEW

- **Total Issues Found:** 9 (2 Critical, 3 Major, 4 Minor)
- **Production Blockers:** 2 Critical issues
- **Estimated Fix Time:** 15-20 hours
- **Team Effort:** 1 Backend Dev + 1 Frontend Dev

---

## 🔴 PRIORITY 1: CRITICAL ISSUES (Week 1)

### Must Fix Before Production Deployment

#### Issue 1: Overpayment Not Prevented

**Effort:** 2-4 hours  
**Assigned To:** Backend Developer  
**Status:** 🔴 OPEN

**What to Do:**
1. Review payment recording endpoint in `/api/payments`
2. Add validation to check `paymentAmount <= remainingAmount`
3. Return 400 error with message if validation fails
4. Update test case TC-PAYMENT-004
5. Test with manual payment recording

**Code Location:**
- Backend: `src/app/api/[role]/payments/record`
- Payment Form: `src/components/features/PaymentForm`

**Test Verification:**
```
Before Fix:
1. Billing: 1,000,000 IDR
2. Record payment: 2,000,000 IDR
3. Result: ACCEPT (wrong!)

After Fix:
1. Billing: 1,000,000 IDR
2. Record payment: 2,000,000 IDR
3. Result: ERROR (correct!)
```

**Acceptance Criteria:**
- [ ] Overpayment rejected with clear message
- [ ] Error message: "Jumlah pembayaran tidak boleh melebihi sisa tagihan"
- [ ] Remaining amount displayed in error
- [ ] Manual test passes
- [ ] Unit test added

---

#### Issue 2: Session Timeout Not Implemented

**Effort:** 3-5 hours  
**Assigned To:** Backend/Security Developer  
**Status:** 🔴 OPEN

**What to Do:**
1. Update `next.config.ts` session settings
2. Implement idle timeout middleware
3. Implement absolute timeout check
4. Add warning dialog before logout (1 minute before)
5. Add activity tracking on user interactions

**Code Location:**
- NextAuth Config: `src/lib/auth.ts`
- Middleware: `middleware.ts`
- Session Provider: `src/components/SessionProvider`

**Implementation Steps:**

```typescript
// Step 1: Update .env.local
NEXT_AUTH_SESSION_EXPIRY=28800        # 8 hours
NEXT_AUTH_IDLE_TIMEOUT=900            # 15 minutes
NEXT_AUTH_IDLE_WARNING_TIME=840       # Warn at 14 minutes

// Step 2: Implement session timeout logic
// src/lib/auth.ts
export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 28800,  // 8 hours
  },
  // ... other config
};

// Step 3: Add middleware for idle timeout
// middleware.ts
export async function middleware(request: NextRequest) {
  const session = await getSession({ req: request });
  
  if (session && request.nextUrl.pathname.startsWith('/')) {
    const response = NextResponse.next();
    
    // Set idle timeout cookies
    response.cookies.set({
      name: 'lastActivity',
      value: new Date().getTime().toString(),
      maxAge: 28800,
      path: '/',
    });
    
    return response;
  }
  
  return NextResponse.next();
}

// Step 4: Add activity tracking
// src/components/SessionProvider.tsx
useEffect(() => {
  const handleActivity = () => {
    // Update last activity timestamp
    localStorage.setItem('lastActivity', Date.now().toString());
  };
  
  ['mousedown', 'keydown', 'scroll', 'touchstart'].forEach(event => {
    document.addEventListener(event, handleActivity);
  });
  
  return () => {
    ['mousedown', 'keydown', 'scroll', 'touchstart'].forEach(event => {
      document.removeEventListener(event, handleActivity);
    });
  };
}, []);
```

**Test Verification:**
```
Test 1: Idle Timeout
1. Login successfully
2. Don't interact for 15 minutes
3. Expected: Warning dialog
4. Don't click continue
5. Expected: Automatic logout

Test 2: Activity Reset
1. Login successfully
2. Interact with page (click, type)
3. Idle timer resets
4. Expected: Session continues

Test 3: Absolute Timeout
1. Login at 9:00 AM
2. Continue interacting for 8 hours
3. Expected: Logout at 5:00 PM regardless
```

**Acceptance Criteria:**
- [ ] Idle timeout: 15 minutes of inactivity
- [ ] Absolute timeout: 8 hours total session time
- [ ] Warning shown 1 minute before logout
- [ ] User can click "Continue" to extend session
- [ ] Logout clears all cookies/tokens
- [ ] Manual test passes for all scenarios
- [ ] Unit tests added for timeout logic

---

## 🟠 PRIORITY 2: MAJOR ISSUES (Week 2)

### High Priority - Fix in Next Sprint

#### Issue 3: Payment Decimal Precision

**Effort:** 1-2 hours  
**Assigned To:** Frontend Developer  
**Status:** 🔴 OPEN

**What to Do:**
1. Update amount input field to accept max 2 decimals
2. Add client-side formatting using `toFixed(2)`
3. Add server-side rounding/validation
4. Update test case

**Code Update:**
```typescript
// src/components/features/PaymentForm.tsx
const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const value = e.target.value;
  // Allow only numbers and one decimal point
  if (/^\d*\.?\d{0,2}$/.test(value) || value === '') {
    setAmount(value);
  }
};

// Server validation (src/app/api/payments/record/route.ts)
const amount = Math.round(parseFloat(amountString) * 100) / 100;
if (isNaN(amount) || amount <= 0) {
  return res.status(400).json({ error: "Invalid amount" });
}
```

**Test Verification:**
- [ ] Input 1000.12: Accepted
- [ ] Input 1000.123: Rejected/Truncated to 1000.12
- [ ] Input 1000.999: Accepted as 1000.99 (rounded down)
- [ ] Storage verification: Database shows exact 2 decimals

---

#### Issue 4: Student Dashboard Not Real-time

**Effort:** 4-6 hours  
**Assigned To:** Frontend Developer  
**Status:** 🔴 OPEN

**What to Do:**
1. Implement polling with React Query
2. Refetch data every 10 seconds (configurable)
3. Add visual indication when data updates
4. Test with treasurer recording payment

**Implementation:**
```typescript
// src/hooks/usePaymentRefresh.ts
import { useQuery } from '@tanstack/react-query';

export function usePaymentRefresh(studentId: string) {
  return useQuery({
    queryKey: ['payments', studentId],
    queryFn: async () => {
      const res = await fetch(`/api/student/payments/${studentId}`);
      return res.json();
    },
    // Refetch every 10 seconds
    refetchInterval: 10000,
    refetchIntervalInBackground: true,
  });
}

// In Student Dashboard component
const { data: payments, isRefetching } = usePaymentRefresh(studentId);

return (
  <div>
    <div className={isRefetching ? 'opacity-50' : ''}>
      {/* Display payments */}
    </div>
    {isRefetching && <span className="text-sm text-gray-500">Updating...</span>}
  </div>
);
```

**Test Verification:**
```
1. Student A views dashboard: Outstanding = 1,000,000 IDR
2. Treasurer records payment: 1,000,000 IDR
3. Student A's dashboard: Wait max 10 seconds
4. Expected: Outstanding updated to 0 IDR automatically
```

**Acceptance Criteria:**
- [ ] Payment updates reflected within 10 seconds
- [ ] Visual indicator shows "Updating..." while refreshing
- [ ] No unnecessary API calls
- [ ] Works when student dashboard is in background
- [ ] Manual test passes

---

#### Issue 5: New Student Approval Workflow Documentation

**Effort:** 1-2 hours  
**Assigned To:** Full Stack Developer  
**Status:** 🟡 PARTIAL

**What to Do:**
1. Add intermediate status: `PENDING_APPROVAL`
2. Update student model migration if needed
3. Add clear status badges in UI
4. Send notification to admin when new student registers
5. Send email to student when approved
6. Update documentation

**Implementation Changes:**
```typescript
// prisma/schema.prisma - Update StudentStatus enum
enum StudentStatus {
  PENDING_REGISTRATION       // Submitted registration form
  PENDING_APPROVAL           // Waiting for admin approval (NEW)
  ACTIVE                     // Approved, can login
  AWAITING_REREG             // Needs to re-register
  GRADUATED                  // Graduated
  ARCHIVED                   // Non-active
  DROPPED_OUT                // DO
  TRANSFERRED                // Pindah sekolah
}

// New migration: npx prisma migrate dev --name add_pending_approval_status
```

**Test Verification:**
- [ ] New student submitted: Status = PENDING_REGISTRATION
- [ ] Admin approves: Status = PENDING_APPROVAL → ACTIVE
- [ ] Email sent to student when approved
- [ ] Notification shown to admin for new registrations
- [ ] UI shows clear status badges

---

## 🟡 PRIORITY 3: MINOR ISSUES (Week 3-4)

### Low Priority - Polish & Enhancement

#### Issue 6: Error Messages Not Localized

**Effort:** 2-3 hours  
**Assigned To:** Frontend Developer

**Actions:**
1. Create error message translation file
2. Update all error messages to use Indonesian
3. Standardize error message format

**Example Messages to Localize:**
```
"Internal Server Error" → "Terjadi kesalahan pada server"
"Not Found" → "Data tidak ditemukan"
"Unauthorized" → "Anda tidak memiliki akses"
"Bad Request" → "Permintaan tidak valid"
"Duplicate Entry" → "Data sudah ada"
```

---

#### Issue 7: No Loading Indicator

**Effort:** 1-2 hours  
**Assigned To:** Frontend Developer

**Actions:**
1. Add loading spinner component
2. Show loading state during:
   - Generate billing (2-3 seconds)
   - Export PDF (3-4 seconds)
   - Bulk operations (>1 second)
3. Disable user interactions during loading

```typescript
// Usage
{isLoading && <LoadingSpinner message="Generating billing..." />}
```

---

#### Issue 8: Search Results Not Highlighted

**Effort:** 1-2 hours  
**Assigned To:** Frontend Developer

**Actions:**
1. Add highlighting function for search terms
2. Highlight matching text in search results
3. Use consistent highlighting style

---

#### Issue 9: No Undo/Recovery Option

**Effort:** 1 hour  
**Assigned To:** Frontend Developer

**Actions:**
1. Add "Recover" button in archived students list
2. Allow admin to restore archived students
3. Show confirmation before restoration

---

## 📅 EXECUTION SCHEDULE

### Week 1: Critical Issues
```
Mon-Tue: Overpayment Bug Fix
  - Code: 2 hours
  - Testing: 1 hour
  - Code Review: 1 hour
  Total: 4 hours

Wed-Fri: Session Timeout Implementation
  - Implementation: 3 hours
  - Testing: 1 hour
  - Code Review: 1 hour
  Total: 5 hours

Remaining Time: Buffer & Verification
```

### Week 2: Major Issues
```
Mon-Tue: Decimal Precision Fix
  - Code: 1 hour
  - Testing: 1 hour
  
Wed-Thu: Real-time Updates Implementation
  - Code: 4 hours
  - Testing: 2 hours
  
Fri: New Student Workflow Documentation
  - Code: 1 hour
  - Testing: 1 hour
```

### Week 3-4: Minor Issues
```
Mon-Tue: Error Message Localization
Wed: Loading Indicators
Thu: Search Highlighting
Fri: Undo/Recovery Feature
```

---

## 🧪 TESTING CHECKLIST FOR EACH FIX

### General Testing Steps (for each issue)

- [ ] **Development Testing**
  - [ ] Code compiles without errors
  - [ ] No new console warnings/errors
  - [ ] Local testing on all browsers

- [ ] **Functional Testing**
  - [ ] Feature works as expected
  - [ ] Related features still work
  - [ ] No regression in existing tests

- [ ] **Edge Case Testing**
  - [ ] Test with edge case inputs
  - [ ] Test with empty/null values
  - [ ] Test with large datasets

- [ ] **Regression Testing**
  - [ ] Run full test suite
  - [ ] Verify all previous tests still pass
  - [ ] No new failures introduced

- [ ] **Code Review**
  - [ ] Code reviewed by another developer
  - [ ] Follows project standards
  - [ ] No code smells or anti-patterns

- [ ] **Documentation**
  - [ ] Update relevant documentation
  - [ ] Add code comments if needed
  - [ ] Update test case documentation

---

## 📊 SUCCESS METRICS

### After Fixes Completed

| Metric | Target | Verification |
|--------|--------|---------------|
| Pass Rate | 99%+ | Run full test suite |
| Critical Issues | 0 | All closed/resolved |
| Major Issues | 0 | All closed/resolved |
| Load Time | <3s | Browser DevTools |
| Session Timeout | Works | Manual testing |
| Payment Validation | Works | Manual testing |
| Real-time Updates | Works | Manual testing |

---

## 🎯 RISK MITIGATION

### Potential Risks & Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Session timeout breaks user workflow | Medium | High | Implement clear warning, allow extension |
| Payment validation affects bulk operations | Low | Medium | Add bypass for authorized users |
| Real-time updates cause performance issues | Medium | Medium | Implement pagination, debouncing |
| Database migration fails | Low | High | Backup database, test migration in staging first |

---

## 📋 SIGN-OFF CHECKLIST

Before considering testing complete:

- [ ] All 2 critical issues fixed & tested
- [ ] All 3 major issues fixed & tested
- [ ] All 4 minor issues fixed & tested
- [ ] Full regression test passed (156 test cases)
- [ ] Performance testing passed (load times <3s)
- [ ] Security assessment passed (A- grade maintained)
- [ ] Code review approved by lead developer
- [ ] Documentation updated
- [ ] Staging deployment successful
- [ ] UAT by school staff completed
- [ ] Sign-off from product owner

---

## 📞 ESCALATION PATH

If issues found during fixing:

1. **Blocker Issue:** Escalate to Tech Lead immediately
2. **High Priority:** Escalate to Product Owner
3. **Design Decision Needed:** Ask in team meeting
4. **Unclear Requirement:** Contact stakeholder

---

## 📝 NOTES

- All fixes should have corresponding unit tests
- Use feature branches for each fix
- Create pull requests with detailed descriptions
- Link PRs to issues
- Update this document as fixes are completed
- Report progress weekly to stakeholders

---

**Document Created:** 12 Mei 2026  
**Version:** 1.0  
**Status:** READY FOR EXECUTION

