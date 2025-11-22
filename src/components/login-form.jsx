"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertCircle, Wifi, Lock, UserX } from "lucide-react";
import { toast } from "sonner";

export function LoginForm({ className, ...props }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState(null); // Change to object: { message, icon, title }
  const [isLoading, setIsLoading] = useState(false);

  // Display error message from query parameters
  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam) {
      // Decode the error message
      const decodedError = decodeURIComponent(errorParam);

      // Display toast notification
      toast.error("Akses Ditolak", {
        description: decodedError,
        duration: 5000,
      });

      // Remove error parameter from URL
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("error");
      window.history.replaceState({}, "", newUrl.toString());
    }
  }, [searchParams]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Clear error when user types
    if (error) setError(null);
  };

  const getErrorDetails = (error) => {
    // Handle network errors
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      return {
        title: "Koneksi Bermasalah",
        message:
          "Tidak dapat terhubung ke server. Periksa koneksi internet Anda dan coba lagi.",
        icon: Wifi,
      };
    }

    const message = error.message || "Terjadi kesalahan saat login";

    // Handle account lock messages with remaining time
    if (message.includes("Account is locked")) {
      const minutesMatch = message.match(/Try again in (\d+) minutes/);
      if (minutesMatch) {
        const minutes = minutesMatch[1];
        return {
          title: "Akun Terkunci",
          message: `Akun Anda terkunci karena terlalu banyak percobaan login gagal. Coba lagi dalam ${minutes} menit.`,
          icon: Lock,
        };
      }
      return {
        title: "Akun Terkunci",
        message:
          "Akun Anda terkunci karena terlalu banyak percobaan login gagal. Coba lagi nanti.",
        icon: Lock,
      };
    }

    // Handle failed attempts with remaining tries
    if (message.includes("attempts remaining")) {
      const attemptsMatch = message.match(/(\d+) attempts remaining/);
      if (attemptsMatch) {
        const attempts = attemptsMatch[1];
        return {
          title: "Login Gagal",
          message: `Email atau password salah. Sisa percobaan: ${attempts}.`,
          icon: AlertCircle,
        };
      }
    }

    // Handle locked after too many attempts
    if (message.includes("Too many failed login attempts")) {
      return {
        title: "Akun Terkunci",
        message:
          "Terlalu banyak percobaan login gagal. Akun terkunci selama 30 menit.",
        icon: Lock,
      };
    }

    // Map API error messages to user-friendly Indonesian messages
    const errorMap = {
      "Invalid username or password": {
        title: "Kredensial Salah",
        message:
          "Email atau password yang Anda masukkan salah. Silakan periksa dan coba lagi.",
        icon: AlertCircle,
      },
      "Account is deactivated": {
        title: "Akun Dinonaktifkan",
        message:
          "Akun Anda telah dinonaktifkan. Silakan hubungi administrator untuk bantuan.",
        icon: UserX,
      },
      "An error occurred during login": {
        title: "Kesalahan Server",
        message:
          "Terjadi kesalahan server. Silakan coba lagi dalam beberapa saat.",
        icon: AlertCircle,
      },
    };

    // Return mapped error or default
    return (
      errorMap[message] || {
        title: "Kesalahan Login",
        message: message,
        icon: AlertCircle,
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Validate input
      if (!formData.email || !formData.password) {
        setError({
          title: "Data Tidak Lengkap",
          message: "Email dan password wajib diisi untuk melanjutkan login.",
          icon: AlertCircle,
        });
        setIsLoading(false);
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError({
          title: "Format Email Salah",
          message: "Format email tidak valid. Pastikan email Anda benar.",
          icon: AlertCircle,
        });
        setIsLoading(false);
        return;
      }

      // Call login API
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Important: include cookies in request
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Login gagal");
      }

      // Debug: Check if cookie is set
      if (process.env.NODE_ENV !== "production") {
        console.log("✅ Login successful!");
        console.log("📦 Response headers:", {
          setCookie: res.headers.get("set-cookie"),
          contentType: res.headers.get("content-type"),
        });
        console.log("🍪 All cookies:", document.cookie);
      }

      // Success - redirect to dashboard
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        console.error("Login error:", err);
      }
      setError(getErrorDetails(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Selamat Datang</CardTitle>
          <CardDescription>Login ke sistem pembukuan kasir</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              {/* Error Alert */}
              {error && (
                <Alert variant="destructive">
                  <error.icon className="h-4 w-4" />
                  <div className="flex flex-col gap-1">
                    <AlertTitle className="text-sm font-medium">
                      {error.title}
                    </AlertTitle>
                    <AlertDescription>{error.message}</AlertDescription>
                  </div>
                </Alert>
              )}

              {/* Email Field */}
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isLoading}
                  required
                  autoComplete="email"
                />
              </Field>

              {/* Password Field */}
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <a
                    href="/reset-password"
                    className="ml-auto text-sm underline-offset-4 hover:underline"
                  >
                    Lupa password?
                  </a>
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isLoading}
                  required
                  autoComplete="current-password"
                />
              </Field>

              {/* Submit Button */}
              <Field>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Login"
                  )}
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>

      <FieldDescription className="px-6 text-center text-xs text-muted-foreground">
        Sistem Pembukuan Kasir & List - Rental Mobil
      </FieldDescription>
    </div>
  );
}
