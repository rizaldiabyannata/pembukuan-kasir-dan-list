# useActionLoading Hook

A custom React hook for managing multiple action loading states with automatic error handling and toast notifications.

## Features

- ✅ Track multiple action loading states independently
- ✅ Automatic error handling with toast notifications
- ✅ Cleanup on component unmount
- ✅ Prevent concurrent actions on the same item
- ✅ Integration with Sonner toast library
- ✅ TypeScript-friendly API

## Installation

The hook is already installed in `src/hooks/useActionLoading.js`.

## Basic Usage

```javascript
import { useActionLoading } from "@/hooks/useActionLoading";

function MyComponent() {
  const { isActionLoading, executeAction } = useActionLoading();

  const handleDelete = async (itemId) => {
    await executeAction(
      `delete-${itemId}`, // Unique action ID
      async () => {
        // Your async operation
        const response = await fetch(`/api/items/${itemId}`, {
          method: "DELETE",
        });
        if (!response.ok) throw new Error("Failed to delete");
        return response.json();
      },
      {
        successMessage: "Item berhasil dihapus",
        errorMessage: "Gagal menghapus item",
        onSuccess: (result) => {
          // Handle success
        },
      }
    );
  };

  return (
    <button
      onClick={() => handleDelete(123)}
      disabled={isActionLoading("delete-123")}
    >
      {isActionLoading("delete-123") ? "Menghapus..." : "Hapus"}
    </button>
  );
}
```

## API Reference

### Return Values

#### `loadingActions`

- Type: `Record<string, boolean>`
- Description: Object containing all active loading states

#### `startAction(actionId: string)`

- Description: Manually start loading state for an action
- Parameters:
  - `actionId`: Unique identifier for the action

#### `stopAction(actionId: string)`

- Description: Manually stop loading state for an action
- Parameters:
  - `actionId`: Unique identifier for the action

#### `isActionLoading(actionId: string): boolean`

- Description: Check if a specific action is loading
- Parameters:
  - `actionId`: Unique identifier for the action
- Returns: `true` if the action is loading, `false` otherwise

#### `executeAction(actionId, asyncFn, options)`

- Description: Execute an async action with automatic loading state and error handling
- Parameters:
  - `actionId` (string): Unique identifier for the action
  - `asyncFn` (Function): Async function to execute
  - `options` (Object, optional):
    - `successMessage` (string): Toast message on success
    - `errorMessage` (string): Toast message on error
    - `onSuccess` (Function): Callback on success
    - `onError` (Function): Callback on error
- Returns: Promise with the result of asyncFn

#### `resetAll()`

- Description: Reset all loading states

## Action ID Naming Convention

Use descriptive action IDs that combine the action type and item identifier:

```javascript
`delete-${itemId}` // For delete actions
`approve-${itemId}` // For approval actions
`edit-${itemId}` // For edit actions
`submit-${formId}`; // For form submissions
```

## Requirements Satisfied

This hook satisfies the following requirements from the loading-states-enhancement spec:

- **Requirement 5.1**: Track loading state per item using unique identifiers
- **Requirement 5.2**: Only show loading state for specific item being acted upon
- **Requirement 5.4**: Remove loading state from only that item when action completes
- **Requirement 5.5**: Show error indicator on specific item when action fails

## Integration with LoadingButton

```javascript
import { LoadingButton } from "@/components/ui/loading-button";
import { useActionLoading } from "@/hooks/useActionLoading";

function MyComponent({ itemId }) {
  const { isActionLoading, executeAction } = useActionLoading();

  const handleAction = async () => {
    await executeAction(`action-${itemId}`, async () => {
      // Your async operation
    });
  };

  return (
    <LoadingButton
      isLoading={isActionLoading(`action-${itemId}`)}
      onClick={handleAction}
      loadingText="Memproses..."
    >
      Submit
    </LoadingButton>
  );
}
```

## Error Handling

The hook automatically:

1. Catches errors from async functions
2. Displays error toast with custom or default message
3. Calls `onError` callback if provided
4. Re-throws the error for additional handling
5. Stops the loading state

## Concurrent Action Prevention

The hook prevents multiple simultaneous actions on the same item:

```javascript
// If action is already loading, shows warning toast
await executeAction("delete-123", asyncFn); // First call starts
await executeAction("delete-123", asyncFn); // Second call shows warning
```

## Cleanup on Unmount

The hook automatically cleans up when the component unmounts, preventing memory leaks and state updates on unmounted components.

## Testing

Tests are located in `src/hooks/__tests__/useActionLoading.test.js`.

Run tests with:

```bash
npm test -- src/hooks/__tests__/useActionLoading.test.js
```

## Examples

See `src/hooks/useActionLoading.example.js` for comprehensive usage examples.
