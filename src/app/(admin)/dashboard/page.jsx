"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { TransactionChart } from "@/components/dashboard/TransactionChart";
import { FleetStatusChart } from "@/components/dashboard/FleetStatusChart";
import { FleetRevenueChart } from "@/components/dashboard/FleetRevenueChart";
import { TopPackagesWidget } from "@/components/dashboard/TopPackagesWidget";
import { DriverPerformanceChart } from "@/components/dashboard/DriverPerformanceChart";
import { AdminOnly } from "@/components/PermissionGuard";
import { Calendar, Clock, TrendingUp } from "lucide-react";
import { useAuthFetch } from "@/lib/useAuthFetch";
import { useUser } from "@/hooks/useUser";
import { ErrorDisplay } from "@/components/ui/error-display";
import { useRetry } from "@/hooks/useRetry";
import { toast } from "sonner";

function DashboardPage() {
  const searchParams = useSearchParams();
  const [period, setPeriod] = useState("month");
  const [stats, setStats] = useState(null);
  const [driverPerformance, setDriverPerformance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [driverLoading, setDriverLoading] = useState(true);
  const [error, setError] = useState(null);
  const [driverError, setDriverError] = useState(null);
  const router = useRouter();
  const authFetch = useAuthFetch();
  const { user, loading: userLoading } = useUser();
  const { retry: retryDashboard, isRetrying: isRetryingDashboard } = useRetry(
    3,
    1000
  );
  const { retry: retryDriver, isRetrying: isRetryingDriver } = useRetry(
    3,
    1000
  );

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

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null); // Reset error on each fetch
    console.log("Fetching dashboard data for period:", period);

    try {
      await retryDashboard(
        async () => {
          const res = await authFetch(`/api/dashboard/stats?period=${period}`);

          if (!res) return; // authFetch returns null on 401/403 and redirects

          if (!res.ok) {
            throw new Error(
              `Gagal mengambil data: ${res.statusText || res.status}`
            );
          }
          const result = await res.json();

          // API returns { success, data, message }
          const data = result.data || result;
          console.log("Dashboard data received:", data);
          setStats(data);
          setError(null); // Clear any previous errors
        },
        (attempt, maxRetries, delay) => {
          toast.info(
            `Mencoba lagi mengambil data dashboard (${attempt}/${maxRetries})...`,
            {
              description: `Menunggu ${delay}ms`,
            }
          );
        }
      );
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError(err);
      setStats(null);
      toast.error("Gagal Memuat Dashboard", {
        description:
          "Tidak dapat mengambil data dashboard setelah beberapa percobaan.",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchDriverPerformanceData = async () => {
    setDriverLoading(true);
    setDriverError(null);
    console.log("Fetching driver performance data for period:", period);

    try {
      await retryDriver(
        async () => {
          const res = await authFetch(
            `/api/dashboard/driver-performance?period=${period}`
          );

          if (!res) return; // authFetch returns null on 401/403 and redirects

          if (!res.ok) {
            throw new Error(
              `Gagal mengambil data performa sopir: ${res.statusText || res.status}`
            );
          }
          const result = await res.json();

          // API returns { success, data, message }
          const data = result.data || result;
          console.log("Driver performance data received:", data);
          setDriverPerformance(data);
          setDriverError(null);
        },
        (attempt, maxRetries, delay) => {
          toast.info(
            `Mencoba lagi mengambil data performa sopir (${attempt}/${maxRetries})...`,
            {
              description: `Menunggu ${delay}ms`,
            }
          );
        }
      );
    } catch (err) {
      console.error("Error fetching driver performance data:", err);
      setDriverError(err);
      setDriverPerformance(null);
      toast.error("Gagal Memuat Performa Sopir", {
        description:
          "Tidak dapat mengambil data performa sopir setelah beberapa percobaan.",
      });
    } finally {
      setDriverLoading(false);
    }
  };

  useEffect(() => {
    console.log("Period changed to:", period);
    fetchDashboardData();
    fetchDriverPerformanceData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  const getPeriodLabel = () => {
    if (period === "today") return "Hari Ini";
    if (period === "month") return "Bulan Ini";
    return "Tahun Ini";
  };

  const getPeriodDateRange = () => {
    const now = new Date();
    const options = { day: "numeric", month: "long", year: "numeric" };

    if (period === "today") {
      return now.toLocaleDateString("id-ID", options);
    } else if (period === "month") {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return `${startOfMonth.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
      })} - ${now.toLocaleDateString("id-ID", options)}`;
    } else {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      return `${startOfYear.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
      })} - ${now.toLocaleDateString("id-ID", options)}`;
    }
  };

  // Show loading message while user data is being fetched
  if (userLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <>
      <header className="flex items-center gap-4 p-4">
        <SidebarTrigger className="-ml-1" />
        <div className="flex-1">
          <h1 className="text-xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gambaran umum bisnis Anda — statistik, grafik, dan insight keuangan.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-2">
            <Button
              variant={period === "today" ? "default" : "outline"}
              size="sm"
              onClick={() => setPeriod("today")}
            >
              <Clock className="mr-2 h-4 w-4" />
              Hari Ini
            </Button>
            <Button
              variant={period === "month" ? "default" : "outline"}
              size="sm"
              onClick={() => setPeriod("month")}
            >
              <Calendar className="mr-2 h-4 w-4" />
              Bulan Ini
            </Button>
            <Button
              variant={period === "year" ? "default" : "outline"}
              size="sm"
              onClick={() => setPeriod("year")}
            >
              <TrendingUp className="mr-2 h-4 w-4" />
              Tahun Ini
            </Button>
          </div>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-6 p-6 pt-0">
        {error ? (
          <ErrorDisplay
            error={error}
            onRetry={fetchDashboardData}
            title="Gagal Memuat Dashboard"
            description="Tidak dapat mengambil data dashboard. Periksa koneksi internet Anda."
            className="mb-6"
          />
        ) : (
          <>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold tracking-tight">
                  Ringkasan {getPeriodLabel()}
                </h2>
                <span className="px-3 py-1 text-sm font-medium bg-blue-100 text-blue-700 rounded-full">
                  {getPeriodDateRange()}
                </span>
              </div>
            </div>

            {/* Stats Cards */}
            <DashboardStats stats={stats} loading={loading} />

            {/* Charts Row 1 */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              {/* Transaction Chart (Analisis Tren) - Admin Only */}
              <AdminOnly>
                <div className="lg:col-span-4">
                  <TransactionChart
                    data={stats?.transactionTrend}
                    period={period}
                    loading={loading}
                  />
                </div>
              </AdminOnly>
              <div className="lg:col-span-3">
                <FleetStatusChart data={stats?.fleetStatus} loading={loading} />
              </div>
            </div>

            {/* Fleet Revenue Chart - Admin Only */}
            <AdminOnly>
              <FleetRevenueChart data={stats?.fleetRevenue} loading={loading} />
            </AdminOnly>

            {/* Top Packages Widget - Admin Only */}
            <AdminOnly>
              <TopPackagesWidget
                incomeData={{
                  incomeByPackage: stats?.topPackages || [],
                  summary: stats?.packageSummary,
                }}
                loading={loading}
              />
            </AdminOnly>

            {/* Driver Performance Chart - Admin Only */}
            <AdminOnly>
              {driverError ? (
                <ErrorDisplay
                  error={driverError}
                  onRetry={fetchDriverPerformanceData}
                  title="Gagal Memuat Performa Sopir"
                  description="Tidak dapat mengambil data performa sopir."
                  className="mb-6"
                />
              ) : (
                <DriverPerformanceChart
                  data={driverPerformance}
                  period={period}
                  loading={driverLoading}
                />
              )}
            </AdminOnly>
          </>
        )}
      </div>
    </>
  );
}

export default DashboardPage;
