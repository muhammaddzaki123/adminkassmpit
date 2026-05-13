# 🐛 TESTING ISSUES & BUGS TRACKER

**Last Updated:** 12 Mei 2026  
**Total Issues:** 9 (2 Critical, 3 Major, 4 Minor)

---

## 🔴 CRITICAL ISSUES

### BUG-2026-0512-CRITICAL-001: Overpayment Not Prevented

| Property | Value |
|----------|-------|
| **ID** | BUG-2026-0512-CRITICAL-001 |
| **Severity** | 🔴 CRITICAL |
| **Component** | Payment Recording Module |
| **Status** | 🔴 OPEN |
| **Priority** | MUST FIX BEFORE PRODUCTION |
| **Effort** | LOW (2-4 hours) |
| **Assigned To** | Backend Developer |
| **Created** | 12 Mei 2026 |

#### Description
System allows recording payment amount exceeding the total billing amount. This creates financial discrepancies and can lead to negative account balances or incorrect financial reports.

#### Steps to Reproduce
1. Navigate to Treasurer dashboard
2. Go to Billing Management
3. Select a billing with total = 1,000,000 IDR
4. Click "Record Payment"
5. Enter amount: 2,000,000 IDR (exceeds total)
6. Submit form
7. System accepts the overpayment ❌

#### Current Behavior
- Payment recorded successfully
- Remaining amount becomes negative
- No warning or error shown

#### Expected Behavior
- Validation error message: "Jumlah pembayaran tidak boleh melebihi sisa tagihan"
- Payment rejected
- User must enter valid amount

#### Impact
- **Financial Risk:** HIGH - Accounting discrepancies
- **User Experience:** MEDIUM - User confusion
- **Data Integrity:** HIGH - Incorrect balances
- **Business Impact:** HIGH - Financial audit concerns

#### Proposed Fix
```typescript
// In payment recording endpoint
if (paymentAmount > remainingAmount) {
  return res.status(400).json({ 
    error: "Jumlah pembayaran tidak boleh melebihi sisa tagihan",
    remainingAmount: remainingAmount
  });
}
```

#### Test Case
- TC-PAYMENT-004: Overpayment Prevention

---

### BUG-2026-0512-CRITICAL-002: Session Timeout Not Implemented

| Property | Value |
|----------|-------|
| **ID** | BUG-2026-0512-CRITICAL-002 |
| **Severity** | 🔴 CRITICAL |
| **Component** | Authentication/Session Management |
| **Status** | 🔴 OPEN |
| **Priority** | MUST FIX BEFORE PRODUCTION |
| **Effort** | LOW (3-5 hours) |
| **Assigned To** | Backend/Security Developer |
| **Created** | 12 Mei 2026 |

#### Description
User sessions do not timeout after inactivity. Sessions persist indefinitely, creating serious security risk if device is left unattended. This violates industry security standards (PCI DSS, ISO 27001).

#### Current Behavior
- User logs in
- Session remains valid forever
- No automatic logout on inactivity
- No warning before logout

#### Expected Behavior
- Idle timeout: 15 minutes of inactivity → automatic logout
- Absolute timeout: 8 hours total session time → automatic logout
- User warned 1 minute before logout
- Logout clears session data

#### Security Impact
- **Risk Level:** CRITICAL - Unauthorized access if device left unattended
- **Compliance:** Non-compliant with security standards
- **User Devices:** Risk if loan device or shared computer

#### Proposed Implementation
```typescript
// .env.local
NEXT_AUTH_SESSION_EXPIRY=28800        // 8 hours
NEXT_AUTH_IDLE_TIMEOUT=900            // 15 minutes
NEXT_AUTH_IDLE_WARNING_TIME=840       // Warn 1 min before timeout

// middleware
export async function middleware(request: NextRequest) {
  const session = await getSession({ req: request });
  
  if (session) {
    const lastActivity = session.lastActivity || Date.now();
    const idleTime = Date.now() - lastActivity;
    
    if (idleTime > NEXT_AUTH_IDLE_TIMEOUT) {
      // Logout user
      await signOut();
    }
  }
}
```

---

## 🟠 MAJOR ISSUES

### BUG-2026-0512-MAJOR-001: Payment Decimal Precision Issue

| Property | Value |
|----------|-------|
| **ID** | BUG-2026-0512-MAJOR-001 |
| **Severity** | 🟠 MAJOR |
| **Component** | Payment Form |
| **Status** | 🔴 OPEN |
| **Priority** | HIGH (Fix in Sprint 1) |
| **Effort** | LOW (1-2 hours) |

#### Description
Payment amount field accepts more than 2 decimal places. Should enforce currency format (max 2 decimals).

#### Example
- Input: 1000.12345
- Expected: 1000.12
- Actual: 1000.12345 (stored as-is)

#### Impact
- Accounting inaccuracy
- Database storage inconsistency

#### Solution
```typescript
// Client-side validation
const handleAmountChange = (value: string) => {
  const formatted = parseFloat(value).toFixed(2);
  setAmount(formatted);
};

// Server-side validation
const amount = Math.round(parseFloat(amountString) * 100) / 100;
```

---

### BUG-2026-0512-MAJOR-002: Student Dashboard Not Real-time

| Property | Value |
|----------|-------|
| **ID** | BUG-2026-0512-MAJOR-002 |
| **Severity** | 🟠 MAJOR |
| **Component** | Student Dashboard |
| **Status** | 🔴 OPEN |
| **Priority** | MEDIUM (Fix in Sprint 2) |
| **Effort** | MEDIUM (4-6 hours) |

#### Description
After payment is recorded by treasurer, student's dashboard does not update automatically. Requires manual page refresh to see updated payment status.

#### Steps to Reproduce
1. Student views dashboard: Outstanding = 1,000,000 IDR
2. Treasurer records full payment: 1,000,000 IDR
3. Student's dashboard still shows 1,000,000 IDR ❌
4. After F5 refresh: shows correct amount ✅

#### Impact
- **UX:** User confusion - student thinks payment not recorded
- **Support:** Increased support tickets
- **Trust:** Reduces user confidence in system

#### Solution Options
1. WebSocket for real-time updates (recommended)
2. Server-Sent Events (SSE)
3. Polling with 5-10 second interval

#### Recommended Implementation
```typescript
// Use React Query with WebSocket subscription
const usePaymentUpdates = (studentId: string) => {
  return useQuery({
    queryKey: ['payments', studentId],
    queryFn: () => fetchPayments(studentId),
    // Poll every 10 seconds
    refetchInterval: 10000,
    refetchIntervalInBackground: true,
  });
};
```

---

### BUG-2026-0512-MAJOR-003: New Student Approval Workflow Documentation

| Property | Value |
|----------|-------|
| **ID** | BUG-2026-0512-MAJOR-003 |
| **Severity** | 🟠 MAJOR |
| **Component** | Student Management |
| **Status** | 🟡 PARTIAL (Works but needs clarity) |
| **Priority** | MEDIUM |
| **Effort** | LOW (1-2 hours) |

#### Description
New student approval process exists and works but is poorly documented. Status transitions during approval workflow are unclear.

#### Observations
- Process exists ✅
- Approval works ✅
- BUT: No clear status display during workflow ❌
- Missing intermediate PENDING_APPROVAL status ❌

#### Recommended Improvements
1. Add intermediate status: PENDING_APPROVAL
2. Show clear status badges
3. Notify approver when new applications received
4. Email student when approved

#### Status Flow (Proposed)
```
NEW_STUDENT (registration form submitted)
↓
PENDING_APPROVAL (waiting for admin approval)
↓
ACTIVE (approved, can login)
```

---

## 🟡 MINOR ISSUES

### BUG-2026-0512-MINOR-001: Error Messages Not Localized

| Property | Value |
|----------|-------|
| **ID** | BUG-2026-0512-MINOR-001 |
| **Severity** | 🟡 MINOR |
| **Component** | UI/Error Handling |
| **Status** | 🔴 OPEN |
| **Priority** | LOW |
| **Effort** | MEDIUM (2-3 hours) |

#### Examples Found
- "Internal Server Error" → should be "Terjadi kesalahan server"
- "Not Found" → should be "Tidak ditemukan"
- "Unauthorized" → should be "Tidak diizinkan"

#### Impact
- Minor user confusion
- Inconsistent UX

---

### BUG-2026-0512-MINOR-002: No Loading Indicator on Long Operations

| Property | Value |
|----------|-------|
| **ID** | BUG-2026-0512-MINOR-002 |
| **Severity** | 🟡 MINOR |
| **Component** | UX/UI |
| **Status** | 🔴 OPEN |
| **Priority** | LOW |
| **Effort** | LOW (1-2 hours) |

#### Description
Long-running operations (generate billing, export PDF) don't show loading indicator. User thinks app is frozen.

#### Operations Affected
- Generate monthly billing (2-3 seconds)
- Export report to PDF (3-4 seconds)
- Bulk payment recording

#### Solution
- Add loading spinner
- Show progress percentage
- Show estimated time remaining

---

### BUG-2026-0512-MINOR-003: Search Results Not Highlighted

| Property | Value |
|----------|-------|
| **ID** | BUG-2026-0512-MINOR-003 |
| **Severity** | 🟡 MINOR |
| **Component** | Search Feature |
| **Status** | 🔴 OPEN |
| **Priority** | LOW |
| **Effort** | LOW (1-2 hours) |

#### Description
Search returns correct results but doesn't highlight matching text. User must scan to find searched term.

#### Impact
- Minor UX degradation
- User experience could be improved

---

### BUG-2026-0512-MINOR-004: No Undo/Recovery for Destructive Actions

| Property | Value |
|----------|-------|
| **ID** | BUG-2026-0512-MINOR-004 |
| **Severity** | 🟡 MINOR |
| **Component** | Data Operations |
| **Status** | 🟡 PARTIAL (Soft delete implemented) |
| **Priority** | LOW |
| **Effort** | LOW (1 hour) |

#### Description
Delete/archive actions not reversible from UI. Soft delete implemented (good), but admin cannot unarchive from UI.

#### Current State
- Soft delete in database ✅
- Cannot unarchive from UI ❌

#### Recommendation
- Add "Recover/Unarchive" option in Admin panel
- Show archived students list
- Allow restoration to active status

---

## ⚠️ ISSUES NEEDING CLARIFICATION

### ISSUE-2026-0512-001: Overpayment Handling Business Logic

**Status:** PENDING CLARIFICATION

Questions for Product Owner:
1. Should system prevent overpayment entirely?
2. Should system allow with warning?
3. Should overpayment create credit for student?
4. How to handle refunds?

**Recommended Approach:** Prevent overpayment with clear error message

---

### ISSUE-2026-0512-002: Billing Auto-Overdue Status

**Status:** PENDING CLARIFICATION

Questions:
1. Should billing auto-transition to OVERDUE after due date?
2. Or should it be manually marked?
3. What timezone should be used for comparison?

---

### ISSUE-2026-0512-003: New Academic Year Billing Generation

**Status:** PENDING CLARIFICATION

Questions:
1. How is new academic year triggered?
2. What happens to previous year billings?
3. Should be automatic or manual?

---

## 📋 ISSUE RESOLUTION PLAN

### Phase 1: CRITICAL ISSUES (Week 1)
- [ ] Fix overpayment validation
- [ ] Implement session timeout
- **Target:** Production ready

### Phase 2: MAJOR ISSUES (Week 2)
- [ ] Fix decimal precision
- [ ] Implement real-time updates
- [ ] Clarify new student workflow
- **Target:** Enhanced user experience

### Phase 3: MINOR ISSUES (Week 3-4)
- [ ] Localize error messages
- [ ] Add loading indicators
- [ ] Implement search highlighting
- [ ] Add recovery options
- **Target:** Polish UX

---

## 📊 Issue Statistics

| Severity | Count | % | Status | Fix Timeline |
|----------|-------|---|--------|--------------|
| Critical 🔴 | 2 | 22% | OPEN | Week 1 |
| Major 🟠 | 3 | 33% | OPEN | Week 2 |
| Minor 🟡 | 4 | 45% | OPEN | Week 3-4 |
| **TOTAL** | **9** | **100%** | | **1 Month** |

---

## 🔄 Status Legend

| Status | Meaning | Color |
|--------|---------|-------|
| 🔴 OPEN | Not yet fixed | Red |
| 🟡 IN PROGRESS | Currently being fixed | Yellow |
| 🟢 RESOLVED | Fixed and tested | Green |
| 🔵 VERIFIED | Fix verified by QA | Blue |
| ⚪ CLOSED | Deployed to production | Gray |

---

## 📝 Notes

- All issues are reproducible and documented
- No issues found are environment-specific
- All issues can be fixed without major refactoring
- Estimated total fix time: ~2-3 weeks for all issues

---

**Report Generated:** 12 Mei 2026  
**Next Review:** After each issue is resolved

