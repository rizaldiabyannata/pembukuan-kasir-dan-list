# Route to Permission Mapping

This document shows the mapping between routes and permission functions from `src/lib/middleware.js`.

## Admin-Only Routes

These routes require ADMIN role and specific permissions:

| Route        | Permission Function | Description                   |
| ------------ | ------------------- | ----------------------------- |
| `/dashboard` | `canViewDashboard`  | Dashboard with financial data |
| `/laporan`   | `canViewReports`    | Financial reports             |
| `/users`     | `canViewUsers`      | User management               |
| `/audit`     | `canViewAuditLogs`  | Audit logs                    |

## Operator-Allowed Routes

These routes are accessible by both ADMIN and OPERATOR roles:

| Route          | Permission Function   | Description            |
| -------------- | --------------------- | ---------------------- |
| `/transaksi`   | `canViewTransactions` | Transaction management |
| `/pengeluaran` | `canViewExpenses`     | Expense management     |
| `/armada`      | `canViewFleet`        | Fleet/vehicle viewing  |
| `/sopir`       | `canViewDrivers`      | Driver viewing         |
| `/paket`       | `canViewPackages`     | Package viewing        |
| `/staff`       | `canViewStaff`        | Staff viewing          |

## Public Routes

These routes don't require authentication:

| Route                    | Permission Function | Description                 |
| ------------------------ | ------------------- | --------------------------- |
| `/`                      | None                | Login page                  |
| `/reset-password`        | None                | Password reset request      |
| `/reset-password/verify` | None                | Password reset verification |
| `/reset-password/new`    | None                | New password entry          |

## Excluded Routes

These routes bypass middleware processing:

- `/_next/*` - Next.js static assets
- `/api/*` - API routes (handled by API middleware)
- `/favicon.ico` - Favicon
- `/manifest.json` - PWA manifest

## Usage

The route configuration is used by the middleware to:

1. **Classify routes** - Determine if a route is public, admin-only, operator-allowed, or excluded
2. **Check permissions** - Verify user has required permissions using functions from `src/lib/middleware.js`
3. **Enforce access control** - Redirect unauthorized users with appropriate error messages

## Adding New Routes

To add a new protected route:

1. Add the route to the appropriate category in `ROUTE_RULES`
2. Specify the permission function(s) required
3. The middleware will automatically enforce the permissions

Example:

```javascript
{
  pattern: "/new-admin-page",
  description: "New admin feature",
  permissions: ["canViewNewFeature"]
}
```

## Changing Permissions

To change a route's permission requirements:

1. Update the `permissions` array in the route configuration
2. No code changes needed - middleware uses the configuration dynamically

Example:

```javascript
// Before
{
  pattern: "/armada",
  permissions: ["canViewFleet"]
}

// After - require both view and manage permissions
{
  pattern: "/armada",
  permissions: ["canViewFleet", "canManageFleet"]
}
```
