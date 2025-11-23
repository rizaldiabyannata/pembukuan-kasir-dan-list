/* eslint-disable react-hooks/preserve-manual-memoization */
import { useState, useCallback, useRef, useEffect } from "react";

const DEFAULT_TIMEOUT = 30000; // 30 seconds

/**
 * Custom hook for managing loading states with error handling
 * Features:
 * - Timeout handling (30 seconds default)
 * - Abort controller for cancellation
 * - Automatic cleanup on unmount
 *
 * @param {Object} options - Configuration options
 * @param {Function} options.onSuccess - Callback for successful operations
 * @param {Function} options.onError - Callback for error handling
 * @param {number} options.timeout - Timeout in milliseconds (default: 30000)
 * @returns {Object} Loading state management functions and state
 */
export function useLoadingState({
  onSuccess,
  onError,
  timeout = DEFAULT_TIMEOUT,
} = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);
  const timeoutRef = useRef(null);
  const isMountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;

      // Abort any pending operation
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Clear timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const startLoading = useCallback(() => {
    // Cancel any previous operation
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setError(null);
  }, []);

  const stopLoading = useCallback(() => {
    if (!isMountedRef.current) return;

    setIsLoading(false);

    // Clear timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current = null;
    }
  }, []);

  const handleSuccess = useCallback(
    (result) => {
      if (!isMountedRef.current) return;

      stopLoading();
      setError(null);
      if (onSuccess) {
        onSuccess(result);
      }
    },
    [stopLoading, onSuccess]
  );

  const handleError = useCallback(
    (err) => {
      if (!isMountedRef.current) return;

      stopLoading();
      const errorMessage = err.message || "Terjadi kesalahan";
      setError(errorMessage);
      if (onError) {
        onError(err);
      }
    },
    [stopLoading, onError]
  );

  const executeAsync = useCallback(
    async (asyncFn, options = {}) => {
      const { timeout: customTimeout = timeout } = options;

      startLoading();

      // Setup timeout
      const timeoutPromise = new Promise((_, reject) => {
        timeoutRef.current = setTimeout(() => {
          reject(new Error("TIMEOUT"));
        }, customTimeout);
      });

      try {
        // Race between the async function and timeout
        const result = await Promise.race([
          asyncFn(abortControllerRef.current?.signal),
          timeoutPromise,
        ]);

        if (!isMountedRef.current) return result;

        handleSuccess(result);
        return result;
      } catch (err) {
        if (!isMountedRef.current) return;

        // Don't handle abort errors
        if (err.name === "AbortError") {
          stopLoading();
          return;
        }

        // Handle timeout
        if (err.message === "TIMEOUT") {
          const timeoutError = new Error(
            "Operasi melebihi batas waktu (30 detik)"
          );
          handleError(timeoutError);
          throw timeoutError;
        }

        handleError(err);
        throw err;
      }
    },
    [startLoading, handleSuccess, handleError, timeout]
  );

  const reset = useCallback(() => {
    if (!isMountedRef.current) return;

    stopLoading();
    setError(null);
  }, [stopLoading]);

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    stopLoading();
  }, [stopLoading]);

  // Create a getter function for abortController to avoid accessing ref during render
  const getAbortController = useCallback(() => {
    return abortControllerRef.current;
  }, []);

  return {
    isLoading,
    error,
    startLoading,
    stopLoading,
    handleSuccess,
    handleError,
    executeAsync,
    reset,
    cancel,
    getAbortController,
  };
}

/**
 * Hook for managing multiple loading states
 * Features:
 * - Timeout handling per operation
 * - Abort controllers for cancellation
 * - Automatic cleanup on unmount
 *
 * @param {string[]} keys - Array of loading state keys
 * @param {Object} options - Configuration options
 * @param {number} options.timeout - Timeout in milliseconds (default: 30000)
 * @returns {Object} Loading state management for multiple operations
 */
export function useMultipleLoadingStates(keys = [], options = {}) {
  const { timeout = DEFAULT_TIMEOUT } = options;

  const [loadingStates, setLoadingStates] = useState(
    keys.reduce((acc, key) => ({ ...acc, [key]: false }), {})
  );

  const [errors, setErrors] = useState(
    keys.reduce((acc, key) => ({ ...acc, [key]: null }), {})
  );

  const abortControllersRef = useRef({});
  const timeoutRefsRef = useRef({});
  const isMountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;

      // Abort all pending operations
      Object.values(abortControllersRef.current).forEach((controller) => {
        if (controller) controller.abort();
      });

      // Clear all timeouts
      Object.values(timeoutRefsRef.current).forEach((timeoutId) => {
        if (timeoutId) clearTimeout(timeoutId);
      });

      abortControllersRef.current = {};
      timeoutRefsRef.current = {};
    };
  }, []);

  const setLoading = useCallback((key, loading) => {
    if (!isMountedRef.current) return;

    setLoadingStates((prev) => ({ ...prev, [key]: loading }));
    if (loading) {
      setErrors((prev) => ({ ...prev, [key]: null }));
      // Create abort controller for this operation
      abortControllersRef.current[key] = new AbortController();
    } else {
      // Clean up when loading stops
      if (timeoutRefsRef.current[key]) {
        clearTimeout(timeoutRefsRef.current[key]);
        delete timeoutRefsRef.current[key];
      }
      if (abortControllersRef.current[key]) {
        delete abortControllersRef.current[key];
      }
    }
  }, []);

  const setError = useCallback((key, error) => {
    if (!isMountedRef.current) return;

    setErrors((prev) => ({ ...prev, [key]: error }));
    setLoadingStates((prev) => ({ ...prev, [key]: false }));

    // Clean up
    if (timeoutRefsRef.current[key]) {
      clearTimeout(timeoutRefsRef.current[key]);
      delete timeoutRefsRef.current[key];
    }
    if (abortControllersRef.current[key]) {
      delete abortControllersRef.current[key];
    }
  }, []);

  const executeAsync = useCallback(
    async (key, asyncFn, customOptions = {}) => {
      const { timeout: customTimeout = timeout } = customOptions;

      setLoading(key, true);

      // Setup timeout
      const timeoutPromise = new Promise((_, reject) => {
        timeoutRefsRef.current[key] = setTimeout(() => {
          reject(new Error("TIMEOUT"));
        }, customTimeout);
      });

      try {
        // Race between the async function and timeout
        const result = await Promise.race([
          asyncFn(abortControllersRef.current[key]?.signal),
          timeoutPromise,
        ]);

        if (!isMountedRef.current) return result;

        setLoading(key, false);
        return result;
      } catch (err) {
        if (!isMountedRef.current) return;

        // Don't handle abort errors
        if (err.name === "AbortError") {
          setLoading(key, false);
          return;
        }

        // Handle timeout
        if (err.message === "TIMEOUT") {
          setError(key, "Operasi melebihi batas waktu (30 detik)");
          throw new Error("Operasi melebihi batas waktu (30 detik)");
        }

        setError(key, err.message || "Terjadi kesalahan");
        throw err;
      }
    },
    [setLoading, setError, timeout]
  );

  const reset = useCallback((key) => {
    if (!isMountedRef.current) return;

    setLoadingStates((prev) => ({ ...prev, [key]: false }));
    setErrors((prev) => ({ ...prev, [key]: null }));

    // Clean up
    if (timeoutRefsRef.current[key]) {
      clearTimeout(timeoutRefsRef.current[key]);
      delete timeoutRefsRef.current[key];
    }
    if (abortControllersRef.current[key]) {
      delete abortControllersRef.current[key];
    }
  }, []);

  const resetAll = useCallback(() => {
    if (!isMountedRef.current) return;

    // Abort all operations
    Object.values(abortControllersRef.current).forEach((controller) => {
      if (controller) controller.abort();
    });

    // Clear all timeouts
    Object.values(timeoutRefsRef.current).forEach((timeoutId) => {
      if (timeoutId) clearTimeout(timeoutId);
    });

    abortControllersRef.current = {};
    timeoutRefsRef.current = {};

    setLoadingStates(keys.reduce((acc, key) => ({ ...acc, [key]: false }), {}));
    setErrors(keys.reduce((acc, key) => ({ ...acc, [key]: null }), {}));
  }, [keys]);

  const cancel = useCallback(
    (key) => {
      if (abortControllersRef.current[key]) {
        abortControllersRef.current[key].abort();
      }
      setLoading(key, false);
    },
    [setLoading]
  );

  const cancelAll = useCallback(() => {
    Object.values(abortControllersRef.current).forEach((controller) => {
      if (controller) controller.abort();
    });

    Object.keys(loadingStates).forEach((key) => {
      setLoading(key, false);
    });
  }, [loadingStates, setLoading]);

  return {
    loadingStates,
    errors,
    setLoading,
    setError,
    executeAsync,
    reset,
    resetAll,
    cancel,
    cancelAll,
    isAnyLoading: Object.values(loadingStates).some(Boolean),
  };
}
