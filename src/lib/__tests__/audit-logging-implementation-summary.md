# Audit Logging Implementation Summary

## Task 7: Implement audit logging for unauthorized access

### Implementation Status: ✅ COMPLETE

## Requirements Verification

### Requirement 6.1: Log OPERATOR attempts to access admin-only routes

✅ **IMPLEMENTED**

- Location: `middleware.js` lines 102-130
- Function: `logUnauthorizedAccess()`
- Logs include:
  - User ID: `userId: user?.id || null`
  - Route path: `resourceId: pathname`
  - Timestamp: Automatically added by Prisma `createdAt`
  - IP address: `ipAddress: getClientIp(request)`
  - User agent: `userAgent: getUserAgent(request)`

### Requirement 6.2: Log invalid session attempts

✅ **IMPLEMENTED**

- Location: `middleware.js` lines 102-130
- Function: `logUnauthorizedAccess()`
- Handles unauthenticated users with `userId: null`
- Logs session-related errors: `NO_TOKEN`, `SESSION_EXPIRED`, `INVALID_TOKEN`, `SESSION_NOT_FOUND`

### Requirement 6.3: Include reason for blocking in log entry

✅ **IMPLEMENTED**

- Location: `middleware.js` lines 102-130
- Reason included in:
  - Description: `Akses ditolak ke ${pathname}: ${reason}`
  - Metadata: `{ reason, userRole, pathname }`

### Requirement 6.4: Logging failures should not block redirect

✅ **IMPLEMENTED**

- Location: `middleware.js` lines 102-130
- Implementation:
  - Wrapped in try-catch block
  - Errors logged to console: `console.error("Failed to log unauthorized access:", error)`
  - Function continues with redirect even if logging fails
  - Non-blocking async operation

## Implementation Details

### 1. Audit Logging Function

**Location:** `middleware.js` lines 102-130

```javascript
async function logUnauthorizedAccess(user, pathname, reason, request) {
  try {
    const ipAddress = getClientIp(request);
    const userAgent = getUserAgent(request);

    await createAuditLog({
      userId: user?.id || null,
      action: "ACCESS_DENIED",
      resource: "Route",
      resourceId: pathname,
      description: `Akses ditolak ke ${pathname}: ${reason}`,
      metadata: {
        reason,
        userRole: user?.role || null,
        pathname,
      },
      ipAddress,
      userAgent,
    });
  } catch (error) {
    // Log to console but don't block the redirect
    console.error("Failed to log unauthorized access:", error);
  }
}
```

### 2. Integration with Middleware

**Location:** `middleware.js` lines 140-170

The function is called in `handleProtectedRoute()`:

```javascript
// Access denied - log and redirect
const { user, reason, message, redirectTo, shouldClearCookie } = evaluation;

// Log unauthorized access attempt (non-blocking)
logUnauthorizedAccess(user, pathname, reason, request);

// Redirect with error message
return createRedirectWithError(
  redirectTo || "/",
  message || "Akses ditolak",
  request,
  shouldClearCookie
);
```

### 3. Database Schema Update

**Location:** `prisma/schema.prisma`

Added `ACCESS_DENIED` to `AuditAction` enum:

```prisma
enum AuditAction {
  CREATE
  UPDATE
  DELETE
  LOGIN
  LOGOUT
  VIEW
  EXPORT
  COMPLETE
  SUBMIT_APPROVAL
  APPROVE
  REJECT
  REQUEST_EDIT
  REQUEST_DELETE
  APPROVE_EDIT
  APPROVE_DELETE
  ACCESS_DENIED  // ← Added for middleware audit logging
}
```

Migration created: `20251122023234_add_access_denied_audit_action`

### 4. Helper Functions

**Location:** `middleware.js` lines 36-56

```javascript
function getClientIp(request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0] ||
    request.headers.get("x-real-ip") ||
    request.ip ||
    "unknown"
  );
}

function getUserAgent(request) {
  return request.headers.get("user-agent") || "unknown";
}
```

## Test Coverage

### Unit Tests

**Location:** `src/lib/__tests__/audit-logging-middleware.test.js`

Tests verify:

1. ✅ Logging with all required fields (user ID, route, IP, user agent)
2. ✅ Logging for unauthenticated users (null userId)
3. ✅ Reason included in metadata
4. ✅ Graceful handling of logging failures

All tests passing: 4/4 ✅

## Audit Log Data Structure

When an unauthorized access attempt occurs, the following data is logged:

```javascript
{
  id: "uuid",                                    // Auto-generated
  userId: "user-123" | null,                     // User ID or null if unauthenticated
  action: "ACCESS_DENIED",                       // Action type
  resource: "Route",                             // Resource type
  resourceId: "/dashboard",                      // Route path
  description: "Akses ditolak ke /dashboard: ROLE_MISMATCH",  // Human-readable
  metadata: {
    reason: "ROLE_MISMATCH",                     // Denial reason code
    userRole: "OPERATOR" | null,                 // User role
    pathname: "/dashboard"                       // Route path
  },
  ipAddress: "192.168.1.1",                      // Client IP
  userAgent: "Mozilla/5.0...",                   // User agent string
  createdAt: "2024-11-22T02:32:34.000Z"         // Timestamp (auto)
}
```

## Example Scenarios

### Scenario 1: OPERATOR accessing admin-only route

```
User: { id: "user-123", role: "OPERATOR" }
Route: /dashboard
Result: ACCESS_DENIED logged with reason "ROLE_MISMATCH"
```

### Scenario 2: Unauthenticated user accessing protected route

```
User: null
Route: /transaksi
Result: ACCESS_DENIED logged with reason "NO_TOKEN"
```

### Scenario 3: Expired session

```
User: null (session expired)
Route: /pengeluaran
Result: ACCESS_DENIED logged with reason "SESSION_EXPIRED"
```

## Non-Blocking Behavior

The audit logging is designed to be non-blocking:

1. **Async operation**: Uses `async/await` but doesn't block redirect
2. **Error handling**: Wrapped in try-catch
3. **Console logging**: Errors logged to console for debugging
4. **Continues execution**: Redirect happens regardless of logging success

This ensures that:

- Users are always redirected promptly
- Logging failures don't impact user experience
- Errors are still visible for debugging

## Reuse of Existing Infrastructure

The implementation reuses existing audit logging infrastructure:

1. **`createAuditLog()` function**: From `src/lib/audit.js`
2. **Prisma AuditLog model**: Existing database schema
3. **Consistent format**: Matches existing audit log patterns

This ensures:

- Consistency across the application
- Centralized audit log management
- Easy querying and reporting

## Compliance

The implementation satisfies all requirements for:

- Security monitoring
- Compliance auditing
- Incident investigation
- Access control verification

All unauthorized access attempts are logged with sufficient detail for:

- Identifying who attempted access
- What they tried to access
- When the attempt occurred
- Where the attempt came from (IP)
- Why access was denied
