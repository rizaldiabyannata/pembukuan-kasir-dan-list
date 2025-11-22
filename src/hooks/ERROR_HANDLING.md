# Error Handling and Edge Cases

This document describes the comprehensive error handling and edge case management implemented in the loading state hooks.

## Features

### 1. Timeout Handling

All loading operations have a default timeout of **30 seconds**. If an operation exceeds this timeout:

- The operation is automatically cancelled
- A user-friendly error message is displayed: "Operasi melebihi batas waktu (30 detik)"
- Screen readers announce the timeout
- The loading state is cleaned up

**Usage:**

```javascript
const { executeAction } = useActionLoading();

// Use default 30-second timeout
await executeAction("action-id", asyncFunction);

// Custom timeout (e.g., 60 seconds)
await executeAction("action-id", asyncFunction, {
  timeout: 60000,
});
```

### 2. Retry Functionality

Operations can be configured to automatically retry on failure with exponential backoff:

- Default: 3 retry attempts
- Exponential backoff: 1s, 2s, 4s delays
- User is notified of retry attempts
- Works for timeouts, network errors, and general errors

**Usage:**

```javascript
await executeAction("action-id", asyncFunction, {
  enableRetry: true,
  maxRetries: 3, // optional, defaults to 3
});
```

### 3. Concurrent Action Prevention

The system prevents multiple simultaneous actions on the same item:

- If an action is already in progress, subsequent attempts are blocked
- User receives a warning: "Aksi sedang diproses, mohon tunggu"
- Screen readers announce the warning
- No duplicate API calls are made

**Automatic behavior** - no configuration needed.

### 4. Network Error Detection

The system intelligently detects network-related errors:

- Failed fetch requests
- Connection refused
- DNS resolution failures
- Timeout errors

When detected, users see: "Tidak dapat terhubung ke server. Periksa koneksi internet Anda."

### 5. Cleanup on Component Unmount

All loading operations are automatically cleaned up when components unmount:

- Pending requests are aborted
- Timeouts are cleared
- Loading states are reset
- No memory leaks or state updates on unmounted components

**Automatic behavior** - no configuration needed.

### 6. Abort Controller Support

Operations can be cancelled programmatically:

```javascript
const { executeAction, cancelAction } = useActionLoading();

// Start an operation
executeAction("action-id", asyncFunction);

// Cancel it if needed
cancelAction("action-id");
```

External abort signals can also be provided:

```javascript
const controller = new AbortController();

await executeAction("action-id", asyncFunction, {
  signal: controller.signal,
});

// Cancel from outside
controller.abort();
```

## Hook APIs

### useActionLoading

Enhanced hook for managing multiple action loading states.

```javascript
const {
  loadingActions, // Object with loading states by action ID
  startAction, // Manually start loading for an action
  stopAction, // Manually stop loading for an action
  isActionLoading, // Check if specific action is loading
  executeAction, // Execute async action with error handling
  resetAll, // Reset all loading states
  cancelAction, // Cancel a specific action
} = useActionLoading();
```

**executeAction options:**

```javascript
{
  successMessage: string,        // Toast message on success
  errorMessage: string,          // Toast message on error
  loadingAnnouncement: string,   // Screen reader announcement
  onSuccess: (result) => void,   // Success callback
  onError: (error) => void,      // Error callback
  timeout: number,               // Timeout in ms (default: 30000)
  enableRetry: boolean,          // Enable retry (default: false)
  maxRetries: number,            // Max retry attempts (default: 3)
  signal: AbortSignal,           // External abort signal
}
```

### useLoadingState

Enhanced hook for managing single loading state.

```javascript
const {
  isLoading,           // Boolean loading state
  error,               // Error message if any
  startLoading,        // Start loading
  stopLoading,         // Stop loading
  handleSuccess,       // Handle success
  handleError,         // Handle error
  executeAsync,        // Execute async function
  reset,               // Reset state
  cancel,              // Cancel operation
  abortController,     // Access to abort controller
} = useLoadingState({
  onSuccess: (result) => void,
  onError: (error) => void,
  timeout: 30000,
});
```

### useMultipleLoadingStates

Enhanced hook for managing multiple named loading states.

```javascript
const {
  loadingStates, // Object with loading states by key
  errors, // Object with errors by key
  setLoading, // Set loading for a key
  setError, // Set error for a key
  executeAsync, // Execute async function for a key
  reset, // Reset a specific key
  resetAll, // Reset all keys
  cancel, // Cancel a specific operation
  cancelAll, // Cancel all operations
  isAnyLoading, // Boolean if any operation is loading
} = useMultipleLoadingStates(["key1", "key2"], {
  timeout: 30000,
});
```

## Error Types Handled

### 1. Timeout Errors

- Message: "TIMEOUT"
- User message: "Operasi melebihi batas waktu (30 detik)"
- Can trigger retry if enabled

### 2. Network Errors

Detected by checking for:

- `error.message === "Failed to fetch"`
- `error.message === "Network request failed"`
- `error.name === "NetworkError"`
- `error.code === "ECONNREFUSED"`
- `error.code === "ENOTFOUND"`
- `error.code === "ETIMEDOUT"`

User message: "Tidak dapat terhubung ke server. Periksa koneksi internet Anda."

### 3. Abort Errors

- `error.name === "AbortError"`
- Silently handled (no error message shown)
- Loading state is cleaned up

### 4. General Errors

- Any other error type
- Uses error.message or custom errorMessage
- Falls back to "Terjadi kesalahan"

## Best Practices

### 1. Use Appropriate Timeouts

```javascript
// Quick operations (e.g., form validation)
executeAction("validate", asyncFn, { timeout: 5000 });

// Standard operations (default)
executeAction("save", asyncFn); // 30 seconds

// Long operations (e.g., file upload)
executeAction("upload", asyncFn, { timeout: 120000 });
```

### 2. Enable Retry for Network Operations

```javascript
// Good for API calls that might fail due to network
executeAction("fetch-data", fetchData, {
  enableRetry: true,
  maxRetries: 3,
});

// Don't retry for user actions (e.g., delete)
executeAction("delete-item", deleteItem, {
  enableRetry: false,
});
```

### 3. Provide User-Friendly Messages

```javascript
executeAction("save-transaction", saveTransaction, {
  successMessage: "Transaksi berhasil disimpan",
  errorMessage: "Gagal menyimpan transaksi",
  loadingAnnouncement: "Menyimpan transaksi",
});
```

### 4. Handle Cleanup in Long-Running Components

```javascript
useEffect(() => {
  // Component will auto-cleanup on unmount
  return () => {
    // Additional cleanup if needed
  };
}, []);
```

## Testing

All error handling features are covered by unit tests:

```bash
npm test -- useActionLoading
npm test -- useLoadingState
```

Tests cover:

- Timeout handling
- Concurrent action prevention
- Cleanup on unmount
- Error message handling
- Retry functionality
- Network error detection

## Accessibility

All error states are announced to screen readers:

- Loading states: `aria-busy="true"` and polite announcements
- Errors: Assertive announcements with `aria-live="assertive"`
- Timeouts: Clear error messages announced assertively
- Retry attempts: Polite announcements of retry progress

## Performance Considerations

- Abort controllers prevent unnecessary network requests
- Timeouts prevent indefinite waiting
- Cleanup prevents memory leaks
- Exponential backoff prevents server overload during retries

## Migration Guide

If you're using the old hooks without error handling:

### Before:

```javascript
const [loading, setLoading] = useState(false);

const handleDelete = async () => {
  setLoading(true);
  try {
    await deleteItem();
    toast.success("Deleted");
  } catch (error) {
    toast.error(error.message);
  } finally {
    setLoading(false);
  }
};
```

### After:

```javascript
const { executeAction, isActionLoading } = useActionLoading();

const handleDelete = () => {
  executeAction("delete-item", deleteItem, {
    successMessage: "Deleted",
    errorMessage: "Failed to delete",
    enableRetry: false,
  });
};
```

Benefits:

- Automatic timeout handling
- Concurrent action prevention
- Proper cleanup
- Accessibility support
- Less boilerplate code
