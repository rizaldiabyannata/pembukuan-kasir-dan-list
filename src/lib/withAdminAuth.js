"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Higher-Order Component that wraps admin pages with auth protection
 * Checks authentication status on mount and redirects if unauthorized
 */
export function withAdminAuth(Component) {
  return function ProtectedComponent(props) {
    const router = useRouter();
    const [isChecking, setIsChecking] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
      const checkAuth = async () => {
        try {
          const res = await fetch("/api/auth/me", {
            credentials: "include",
          });

          if (res.status === 401 || res.status === 403) {
            if (process.env.NODE_ENV !== "production") {
              console.log("⛔ Not authenticated, redirecting to login...");
            }
            router.push("/");
            return;
          }

          if (res.ok) {
            setIsAuthenticated(true);
          } else {
            router.push("/");
          }
        } catch (error) {
          if (process.env.NODE_ENV !== "production") {
            console.error("❌ Auth check error:", error);
          }
          router.push("/");
        } finally {
          setIsChecking(false);
        }
      };

      checkAuth();
    }, [router]);

    if (isChecking) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Memuat...</p>
          </div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return null;
    }

    return <Component {...props} />;
  };
}
