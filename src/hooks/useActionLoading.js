import { useState, useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import { announce } from "@/components/ui/accessibility-announcer";

const DEFAULT_TIMEOUT = 30000; // 30 seconds
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second

/**
 * Custom hook for managing multiple action loading states with automatic error handling
 * Designed for tracking individual item actions (delete, edit, approve, etc.)
 * Includes accessibility features for screen reader announcements
 *
 * Features:
 * - Timeout handling (30 seconds default)
 * - Retry functionality with exponential backoff
 * - Concurrent action prevention
 * - Network error handling
 * - Automatic cleanup on unmount
 *
 * @returns {Object} Action loading state management functions and state
 */
export function useActionLoading() {
  const [loadingActions, setLoadingActions] = useState({});
  const isMountedRef = useRef(true);
  const timeoutRefs = useRef({});
  const abortControllersRef = useRef({});

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;

      // Clear all timeouts
      Object.values(timeoutRefs.current).forEach((timeoutId) => {
        if (timeoutId) clearTimeout(timeoutId);
      });

      // Abort all pending requests
      Object.values(abortControllersRef.current).forEach((controller) => {
        if (controller) controller.abort();
      });

      // Clear refs
      timeoutRefs.current = {};
      abortControllersRef.current = {};
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

    // Create abort controller for this action
    abortControllersRef.current[actionId] = new AbortController();
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

    // Clear timeout if exists
    if (timeoutRefs.current[actionId]) {
      clearTimeout(timeoutRefs.current[actionId]);
      delete timeoutRefs.current[actionId];
    }

    // Clean up abort controller
    if (abortControllersRef.current[actionId]) {
      delete abortControllersRef.current[actionId];
    }
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
   * Includes screen reader announcements for accessibility
   * Features:
   * - Timeout handling (30 seconds default)
   * - Retry with exponential backoff
   * - Concurrent action prevention
   * - Network error detection and handling
   * - Automatic cleanup
   *
   * @param {string} actionId - Unique identifier for the action
   * @param {Function} asyncFn - Async function to execute
   * @param {Object} options - Configuration options
   * @param {string} options.successMessage - Toast message on success (optional)
   * @param {string} options.errorMessage - Toast message on error (optional, defaults to error message)
   * @param {string} options.loadingAnnouncement - Screen reader announcement during loading (optional)
   * @param {Function} options.onSuccess - Callback on success (optional)
   * @param {Function} options.onError - Callback on error (optional)
   * @param {number} options.timeout - Timeout in milliseconds (default: 30000)
   * @param {boolean} options.enableRetry - Enable retry on failure (default: false)
   * @param {number} options.maxRetries - Maximum retry attempts (default: 3)
   * @param {AbortSignal} options.signal - External abort signal (optional)
   * @returns {Promise<any>} Result of the async function
   */
  const executeAction = useCallback(
    async (actionId, asyncFn, options = {}) => {
      const {
        successMessage,
        errorMessage,
        loadingAnnouncement,
        onSuccess,
        onError,
        timeout = DEFAULT_TIMEOUT,
        enableRetry = false,
        maxRetries = MAX_RETRIES,
        signal: externalSignal,
      } = options;

      // Prevent concurrent actions on the same item
      if (loadingActions[actionId]) {
        toast.warning("Aksi sedang diproses, mohon tunggu");
        announce("Aksi sedang diproses, mohon tunggu", "polite");
        return;
      }

      startAction(actionId);

      // Announce loading state to screen readers
      if (loadingAnnouncement) {
        announce(loadingAnnouncement, "polite");
      }

      // Setup timeout
      const timeoutPromise = new Promise((_, reject) => {
        timeoutRefs.current[actionId] = setTimeout(() => {
          reject(new Error("TIMEOUT"));
        }, timeout);
      });

      // Get abort controller for this action
      const abortController = abortControllersRef.current[actionId];

      // Combine internal and external abort signals
      const combinedSignal = externalSignal
        ? combineAbortSignals([abortController.signal, externalSignal])
        : abortController.signal;

      let attempt = 0;
      let lastError = null;

      while (attempt <= (enableRetry ? maxRetries : 0)) {
        try {
          // Race between the async function and timeout
          const result = await Promise.race([
            asyncFn(combinedSignal),
            timeoutPromise,
          ]);

          if (!isMountedRef.current) return result;

          // Show success toast if message provided
          if (successMessage) {
            toast.success(successMessage);
            // Announce success to screen readers
            announce(successMessage, "polite");
          }

          // Call success callback if provided
          if (onSuccess) {
            onSuccess(result);
          }

          stopAction(actionId);
          return result;
        } catch (error) {
          lastError = error;

          // Check if component is unmounted
          if (!isMountedRef.current) return;

          // Check if aborted
          if (error.name === "AbortError" || combinedSignal?.aborted) {
            stopAction(actionId);
            return;
          }

          // Handle timeout
          if (error.message === "TIMEOUT") {
            const timeoutMessage = "Operasi melebihi batas waktu (30 detik)";

            if (enableRetry && attempt < maxRetries) {
              attempt++;
              const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt - 1);

              toast.warning(
                `${timeoutMessage}. Mencoba lagi (${attempt}/${maxRetries})...`
              );
              announce(
                `Operasi timeout. Mencoba lagi percobaan ${attempt} dari ${maxRetries}`,
                "polite"
              );

              await new Promise((resolve) => setTimeout(resolve, delay));
              continue;
            } else {
              toast.error(timeoutMessage);
              announce(timeoutMessage, "assertive");

              if (onError) {
                onError(error);
              }

              stopAction(actionId);
              throw error;
            }
          }

          // Handle network errors
          if (isNetworkError(error)) {
            const networkMessage =
              "Tidak dapat terhubung ke server. Periksa koneksi internet Anda.";

            if (enableRetry && attempt < maxRetries) {
              attempt++;
              const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt - 1);

              toast.warning(
                `${networkMessage} Mencoba lagi (${attempt}/${maxRetries})...`
              );
              announce(
                `Kesalahan jaringan. Mencoba lagi percobaan ${attempt} dari ${maxRetries}`,
                "polite"
              );

              await new Promise((resolve) => setTimeout(resolve, delay));
              continue;
            } else {
              toast.error(networkMessage);
              announce(networkMessage, "assertive");

              if (onError) {
                onError(error);
              }

              stopAction(actionId);
              throw error;
            }
          }

          // Handle other errors
          if (enableRetry && attempt < maxRetries) {
            attempt++;
            const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt - 1);

            toast.warning(
              `Terjadi kesalahan. Mencoba lagi (${attempt}/${maxRetries})...`
            );
            announce(
              `Kesalahan. Mencoba lagi percobaan ${attempt} dari ${maxRetries}`,
              "polite"
            );

            await new Promise((resolve) => setTimeout(resolve, delay));
            continue;
          } else {
            console.error(`Error executing action ${actionId}:`, error);

            // Show error toast
            const message =
              errorMessage || error.message || "Terjadi kesalahan";
            toast.error(message);

            // Announce error to screen readers with assertive priority
            announce(message, "assertive");

            // Call error callback if provided
            if (onError) {
              onError(error);
            }

            stopAction(actionId);
            throw error;
          }
        }
      }

      // If we get here, all retries failed
      if (lastError) {
        stopAction(actionId);
        throw lastError;
      }
    },
    [loadingActions, startAction, stopAction]
  );

  /**
   * Reset all loading states and cleanup
   */
  const resetAll = useCallback(() => {
    if (!isMountedRef.current) return;

    // Clear all timeouts
    Object.values(timeoutRefs.current).forEach((timeoutId) => {
      if (timeoutId) clearTimeout(timeoutId);
    });

    // Abort all pending requests
    Object.values(abortControllersRef.current).forEach((controller) => {
      if (controller) controller.abort();
    });

    // Clear refs
    timeoutRefs.current = {};
    abortControllersRef.current = {};

    setLoadingActions({});
  }, []);

  /**
   * Cancel a specific action
   * @param {string} actionId - Unique identifier for the action to cancel
   */
  const cancelAction = useCallback(
    (actionId) => {
      if (abortControllersRef.current[actionId]) {
        abortControllersRef.current[actionId].abort();
      }
      stopAction(actionId);
    },
    [stopAction]
  );

  return {
    loadingActions,
    startAction,
    stopAction,
    isActionLoading,
    executeAction,
    resetAll,
    cancelAction,
  };
}

/**
 * Helper function to detect network errors
 * @param {Error} error - Error object to check
 * @returns {boolean} True if error is network-related
 */
function isNetworkError(error) {
  return (
    error.message === "Failed to fetch" ||
    error.message === "Network request failed" ||
    error.message === "NetworkError" ||
    error.name === "NetworkError" ||
    error.code === "ECONNREFUSED" ||
    error.code === "ENOTFOUND" ||
    error.code === "ETIMEDOUT" ||
    (error.response === undefined && error.request !== undefined)
  );
}

/**
 * Helper function to combine multiple abort signals
 * @param {AbortSignal[]} signals - Array of abort signals to combine
 * @returns {AbortSignal} Combined abort signal
 */
function combineAbortSignals(signals) {
  const controller = new AbortController();

  for (const signal of signals) {
    if (signal.aborted) {
      controller.abort();
      return controller.signal;
    }

    signal.addEventListener("abort", () => controller.abort(), { once: true });
  }

  return controller.signal;
}
