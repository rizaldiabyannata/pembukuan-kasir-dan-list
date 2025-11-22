"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Debounce utility function
 * Delays execution of a function until after a specified wait time has elapsed
 * since the last time it was invoked
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Higher-Order Component untuk protect admin pages
 * Automatically redirects ke "/" jika unauthorized dengan improved session handling
 *
 * Improvements:
 * - Debounced auth checks to prevent race conditions
 * - Serialized auth checks with in-progress flag
 * - Removed aggressive fetch interceptor
 * - Simplified visibility change handler with time-based checks
 * - Redirect state management to prevent multiple redirects
 */
export default function withAuth(WrappedComponent) {
  return function AuthenticatedComponent(props) {
    const router = useRouter();
    const [isRedirecting, setIsRedirecting] = useState(false);
    const authCheckInProgress = useRef(false);
    const lastVisibilityCheck = useRef(Date.now());
    const mountTime = useRef(Date.now());

    // Minimum time between visibility checks (30 seconds)
    const VISIBILITY_CHECK_COOLDOWN = 30000;

    // Function to handle redirect with proper cleanup
    const performRedirect = () => {
      if (isRedirecting) return;

      setIsRedirecting(true);
      console.log("Performing auth redirect to home page...");

      // Show logout message if toast library is available
      if (typeof window !== "undefined" && window.sonner) {
        window.sonner.toast.error("Sesi Berakhir", {
          description: "Sesi Anda telah berakhir. Silakan login kembali.",
          duration: 3000,
        });
      }

      // Small delay to show the message before redirect
      setTimeout(() => {
        router.push("/");
      }, 500);
    };

    // Core auth check function
    const checkAuth = async () => {
      // Prevent multiple simultaneous checks
      if (authCheckInProgress.current || isRedirecting) {
        console.log(
          "Auth check already in progress or redirecting, skipping..."
        );
        return;
      }

      authCheckInProgress.current = true;

      try {
        const response = await fetch("/api/auth/me", {
          credentials: "include",
        });

        if (!response.ok) {
          console.log("Not authenticated, redirecting to login...");
          performRedirect();
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        // Only redirect on auth errors, not network errors
        // Network errors might be transient
        if (error.message && error.message.includes("401")) {
          performRedirect();
        }
      } finally {
        authCheckInProgress.current = false;
      }
    };

    // Debounced version of checkAuth to prevent rapid-fire checks
    const debouncedAuthCheck = useRef(debounce(checkAuth, 500)).current;

    // Single auth check on mount
    useEffect(() => {
      if (!isRedirecting) {
        checkAuth();
      }
    }, []); // Empty dependency array - only run once on mount

    // Simplified visibility change handler - only check after significant time
    useEffect(() => {
      const handleVisibilityChange = () => {
        // Only check if:
        // 1. Page is now visible (not hidden)
        // 2. Not already redirecting
        // 3. Enough time has passed since last check
        // 4. Component has been mounted for at least 5 seconds (avoid initial checks)
        const now = Date.now();
        const timeSinceLastCheck = now - lastVisibilityCheck.current;
        const timeSinceMount = now - mountTime.current;

        if (
          !document.hidden &&
          !isRedirecting &&
          timeSinceLastCheck > VISIBILITY_CHECK_COOLDOWN &&
          timeSinceMount > 5000
        ) {
          console.log(
            "Tab regained focus after significant time, checking session..."
          );
          lastVisibilityCheck.current = now;
          debouncedAuthCheck();
        }
      };

      document.addEventListener("visibilitychange", handleVisibilityChange);

      return () => {
        document.removeEventListener(
          "visibilitychange",
          handleVisibilityChange
        );
      };
    }, [isRedirecting, debouncedAuthCheck]);

    return <WrappedComponent {...props} />;
  };
}
