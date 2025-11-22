# Redirect Handling Implementation - Requirements Coverage

This document maps the redirect handling implementation to requirements 7.1-7.4.

## Requirement 7.1

**WHEN an OPERATOR is redirected from an admin-only route THEN the System SHALL display a toast notification explaining that the page requires admin privileges**

### Implementation:

- `getAccessDenialMessage()` returns "Anda tidak memiliki akses ke halaman ini" for ROLE_MISMATCH
- `getRedirectDestination()` redirects OPERATOR users to "/transaksi" (their default page)
- `createRedirectWithError()` includes the error message in the URL query parameter
- Message will be displayed as toast notification by client-side code (Task 8)

### Code Location:

- `src/lib/route-protection.js`: `getAccessDenialMessage()` (lines ~730-750)
- `src/lib/route-protection.js`: `getRedirectDestination()` (lines ~330-360)
- `middleware.js`: `createRedirectWithError()` (lines ~50-80)

## Requirement 7.2

**WHEN a user is redirected due to an expired session THEN the System SHALL display a toast notification explaining that their session has expired**

### Implementation:

- `getAccessDenialMessage()` returns "Sesi Anda telah berakhir" for SESSION_EXPIRED
- `getRedirectDestination()` redirects to "/" (login page) for SESSION_EXPIRED
- `createRedirectWithError()` includes the error message in the URL query parameter
- `shouldClearCookie` flag is set to true to clear invalid session cookies
- Message will be displayed as toast notification by client-side code (Task 8)

### Code Location:

- `src/lib/route-protection.js`: `getAccessDenialMessage()` (lines ~730-750)
- `src/lib/route-protection.js`: `getRedirectDestination()` (lines ~330-360)
- `middleware.js`: `createRedirectWithError()` (lines ~50-80)

## Requirement 7.3

**WHEN a user is redirected due to an invalid session THEN the System SHALL display a toast notification explaining that they need to log in again**

### Implementation:

- `getAccessDenialMessage()` returns "Sesi tidak valid, silakan login kembali" for INVALID_TOKEN/SESSION_NOT_FOUND
- `getRedirectDestination()` redirects to "/" (login page) for INVALID_TOKEN/SESSION_NOT_FOUND
- `createRedirectWithError()` includes the error message in the URL query parameter
- `shouldClearCookie` flag is set to true to clear invalid session cookies
- Message will be displayed as toast notification by client-side code (Task 8)

### Code Location:

- `src/lib/route-protection.js`: `getAccessDenialMessage()` (lines ~730-750)
- `src/lib/route-protection.js`: `getRedirectDestination()` (lines ~330-360)
- `middleware.js`: `createRedirectWithError()` (lines ~50-80)

## Requirement 7.4

**WHEN the redirect includes an error message THEN the System SHALL pass the message via URL query parameter**

### Implementation:

- `createRedirectWithError()` uses `url.searchParams.set("error", errorMessage)` to add error message to URL
- NextURL.searchParams.set() automatically handles URL encoding for safety
- Error message is passed as query parameter in all redirect responses
- The middleware calls this function for all unauthorized access attempts

### Code Location:

- `middleware.js`: `createRedirectWithError()` (lines ~50-80)
- `middleware.js`: `handleProtectedRoute()` (lines ~130-160)

## Error Message Encoding

All error messages are automatically URL-encoded by Next.js's `NextURL.searchParams.set()` method, ensuring:

- Special characters are properly encoded
- Indonesian characters (Anda, telah, etc.) are safely transmitted
- Messages are safe for URL transmission
- No manual encoding is required

## Redirect Destination Logic

The `getRedirectDestination()` function determines the appropriate redirect destination based on:

1. **Error Type**: Session-related errors (expired, invalid, missing) → login page
2. **User Role**: OPERATOR → transactions page, ADMIN → dashboard
3. **User Status**: Inactive users → login page
4. **Fallback**: Login page for unknown cases

## Cookie Clearing Logic

The `createRedirectInfo()` function determines when to clear session cookies:

- SESSION_EXPIRED: Clear cookies ✓
- INVALID_TOKEN: Clear cookies ✓
- SESSION_NOT_FOUND: Clear cookies ✓
- USER_INACTIVE: Clear cookies ✓
- ROLE_MISMATCH: Keep cookies (valid session, just insufficient permissions)

## Testing

All redirect handling functionality is tested in `src/lib/__tests__/redirect-handling.test.js`:

- 17 test cases covering all scenarios
- Tests for redirect destination logic
- Tests for error message generation
- Tests for cookie clearing logic
- Tests for error message encoding
