import { useState, useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";

/**
 * Custom hook for managing multiple action loading states with automatic error handling
 * Designed for tracking individual item actions (delete, edit, approve, etc.)
 *
 * @returns {Object} Action loading state management functions and state
 */
export function useActionLoading() {
  const [loadingActions, setLoadingActions] = useState({});
  const isMountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  /**
   * Start loading state for a specific action
   * @param {string} actionId - Unique identifier for the action (e.g., "delete-123", "approve-456")
   */
  const startAction = useCallback((actionId) => {
    if (!isMountedRef.current) return;

    setLoadingActions((prev) => ({
      ...prev,
      [actionId]: true,
    }));
  }, []);

  /**
   * Stop loading state for a specific action
   * @param {string} actionId - Unique identifier for the action
   */
  const stopAction = useCallback((actionId) => {
    if (!isMountedRef.current) return;

    setLoadingActions((prev) => {
      const newState = { ...prev };
      delete newState[actionId];
      return newState;
    });
  }, []);

  /**
   * Check if a specific action is loading
   * @param {string} actionId - Unique identifier for the action
   * @returns {boolean} True if the action is currently loading
   */
  const isActionLoading = useCallback(
    (actionId) => {
      return loadingActions[actionId] === true;
    },
    [loadingActions]
  );

  /**
   * Execute an async action with automatic loading state and error handling
   * @param {string} actionId - Unique identifier for the action
   * @param {Function} asyncFn - Async function to execute
   * @param {Object} options - Configuration options
   * @param {string} options.successMessage - Toast message on success (optional)
   * @param {string} options.errorMessage - Toast message on error (optional, defaults to error message)
   * @param {Function} options.onSuccess - Callback on success (optional)
   * @param {Function} options.onError - Callback on error (optional)
   * @returns {Promise<any>} Result of the async function
   */
  const executeAction = useCallback(
    async (actionId, asyncFn, options = {}) => {
      const { successMessage, errorMessage, onSuccess, onError } = options;

      // Prevent concurrent actions on the same item
      if (loadingActions[actionId]) {
        toast.warning("Aksi sedang diproses, mohon tunggu");
        return;
      }

      startAction(actionId);

      try {
        const result = await asyncFn();

        if (!isMountedRef.current) return result;

        // Show success toast if message provided
        if (successMessage) {
          toast.success(successMessage);
        }

        // Call success callback if provided
        if (onSuccess) {
          onSuccess(result);
        }

        stopAction(actionId);
        return result;
      } catch (error) {
        if (!isMountedRef.current) return;

        console.error(`Error executing action ${actionId}:`, error);

        // Show error toast
        const message = errorMessage || error.message || "Terjadi kesalahan";
        toast.error(message);

        // Call error callback if provided
        if (onError) {
          onError(error);
        }

        stopAction(actionId);
        throw error;
      }
    },
    [loadingActions, startAction, stopAction]
  );

  /**
   * Reset all loading states
   */
  const resetAll = useCallback(() => {
    if (!isMountedRef.current) return;

    setLoadingActions({});
  }, []);

  return {
    loadingActions,
    startAction,
    stopAction,
    isActionLoading,
    executeAction,
    resetAll,
  };
}
