"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";

/**
 * Custom hook to handle API responses with auth redirect
 * Automatically redirects to login page on 401/403 errors
 */
export function useAuthFetch() {
  const router = useRouter();

  const authFetch = useCallback(
    async (url, options = {}) => {
      try {
        const res = await fetch(url, {
          ...options,
          credentials: "include",
        });

        // Handle unauthorized access
        if (res.status === 401 || res.status === 403) {
          if (process.env.NODE_ENV !== "production") {
            console.log("⛔ Unauthorized access, redirecting to login...");
          }
          router.push("/");
          return null;
        }

        return res;
      } catch (error) {
        if (process.env.NODE_ENV !== "production") {
          console.error("❌ Fetch error:", error);
        }
        throw error;
      }
    },
    [router]
  );

  return authFetch;
}

/**
 * Higher-order function to wrap fetch calls with auth handling
 * Use this for API calls that need authentication
 */
export function withAuthRedirect(router) {
  return async (url, options = {}) => {
    try {
      const res = await fetch(url, {
        ...options,
        credentials: "include",
      });

      if (res.status === 401 || res.status === 403) {
        if (process.env.NODE_ENV !== "production") {
          console.log("⛔ Unauthorized access, redirecting to login...");
        }
        router.push("/");
        return null;
      }

      return res;
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.error("❌ Fetch error:", error);
      }
      throw error;
    }
  };
}
