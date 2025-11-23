"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, Package, TrendingUp, Fuel } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingButton } from "@/components/ui/loading-button";
import { Download } from "lucide-react";
import { exportPerformanceReport } from "@/lib/excel-export";
import { ChartSkeleton } from "@/components/ui/chart-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

const PACKAGE_TYPE_LABELS = {
  CAR_RENTAL: "Sewa Mobil",
  TOUR_PACKAGE: "Paket Wisata",
  FULL_DAY_TRIP: "Trip Sehari Penuh",
};

const PACKAGE_TYPE_COLORS = {
  CAR_RENTAL: "bg-blue-100 text-blue-800",
  TOUR_PACKAGE: "bg-green-100 text-green-800",
  FULL_DAY_TRIP: "bg-purple-100 text-purple-800",
};

export default function LaporanKinerjaTab({ dateRange, isLoading }) {
  const [performanceData, setPerformanceData] = useState(null);
  const [fuelData, setFuelData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingFuel, setLoadingFuel] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (!dateRange?.from || !dateRange?.to) return;

    const fetchPerformanceData = async () => {
      setLoading(true);
      try {
        const formatDate = (date) => {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, "0");
          const day = String(date.getDate()).padStart(2, "0");
          return `${year}-${month}-${day}`;
        };

        const fromStr = formatDate(dateRange.from);
        const toStr = formatDate(dateRange.to);

        const res = await fetch(
          `/api/reports/performance?from=${fromStr}&to=${toStr}`,
          {
            credentials: "include",
          }
        );

        if (!res.ok) throw new Error("Gagal mengambil data kinerja");

        const result = await res.json();
        const data = result.data || result;
        setPerformanceData(data);
      } catch (err) {
        console.error("Error fetching performance data:", err);
        setPerformanceData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPerformanceData();
  }, [dateRange]);

  useEffect(() => {
    if (!dateRange?.from || !dateRange?.to) return;

    const fetchFuelAnalysis = async () => {
      setLoadingFuel(true);
      try {
        const formatDate = (date) => {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, "0");
          const day = String(date.getDate()).padStart(2, "0");
          return `${year}-${month}-${day}`;
        };

        const fromStr = formatDate(dateRange.from);
        const toStr = formatDate(dateRange.to);

        const res = await fetch(
          `/api/reports/fuel-analysis?from=${fromStr}&to=${toStr}`,
          {
            credentials: "include",
          }
        );

        if (!res.ok) throw new Error("Gagal mengambil data analisis BBM");

        const result = await res.json();
        const data = result.data || result;
        setFuelData(data);
      } catch (err) {
        console.error("Error fetching fuel analysis:", err);
        setFuelData(null);
      } finally {
        setLoadingFuel(false);
      }
    };

    fetchFuelAnalysis();
  }, [dateRange]);

  if (isLoading || loading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="flex justify-between items-center">
          <Skeleton className="h-7 w-48" aria-label="Memuat judul laporan" />
          <Skeleton className="h-10 w-32" aria-label="Memuat tombol export" />
        </div>

        {/* Stats cards skeleton */}
        <div className="grid gap-4 md:grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4 rounded" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-1" />
                <Skeleton className="h-3 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Chart skeleton */}
        <ChartSkeleton showStats={false} aria-label="Memuat data kinerja" />
      </div>
    );
  }

  if (!performanceData) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          Tidak ada data kinerja untuk periode ini
        </CardContent>
      </Card>
    );
  }

  const { driverPerformance, packagePerformance, summary } = performanceData;
  const fuelSummary = fuelData?.summary || {};
  const fuelAnalysis = fuelData?.fuelAnalysis || [];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleExport = async () => {
    // Validate data before export
    if (!performanceData) {
      console.warn("Export warning: No performance data available");
      alert(
        "Tidak ada data kinerja untuk diekspor. Silakan pilih periode yang berbeda."
      );
      return;
    }

    if (!fuelData) {
      console.warn("Export warning: No fuel data available");
      alert(
        "Tidak ada data BBM untuk diekspor. Silakan pilih periode yang berbeda."
      );
      return;
    }

    if (
      !performanceData.driverPerformance ||
      performanceData.driverPerformance.length === 0
    ) {
      console.warn("Export warning: No driver performance data");
    }

    if (
      !performanceData.packagePerformance ||
      performanceData.packagePerformance.length === 0
    ) {
      console.warn("Export warning: No package performance data");
    }

    setIsExporting(true);
    try {
      const reportDateRange = dateRange
        ? {
            from: dateRange.from.toISOString().split("T")[0],
            to: dateRange.to.toISOString().split("T")[0],
          }
        : {
            from: new Date().toISOString().split("T")[0],
            to: new Date().toISOString().split("T")[0],
          };

      await exportPerformanceReport(performanceData, fuelData, reportDateRange);

      // Show success message
      console.log("Export successful: Performance report exported");
    } catch (error) {
      console.error("Export failed:", error);

      // Show user-friendly error message
      const errorMessage =
        error.message || "Gagal mengekspor laporan. Silakan coba lagi.";
      alert(`Gagal mengekspor laporan kinerja: ${errorMessage}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Export Button */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Laporan Kinerja</h3>
        <LoadingButton
          onClick={handleExport}
          variant="outline"
          size="sm"
          isLoading={isExporting}
          loadingText="Mengekspor..."
          disabled={!performanceData || !fuelData}
        >
          <Download className="w-4 h-4 mr-2" />
          Export Excel
        </LoadingButton>
      </div>
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sopir</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalDrivers}</div>
            <p className="text-xs text-muted-foreground">Sopir aktif</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Paket</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalPackages}</div>
            <p className="text-xs text-muted-foreground">Paket digunakan</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Trip</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalTrips}</div>
            <p className="text-xs text-muted-foreground">Transaksi</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Biaya BBM
            </CardTitle>
            <Fuel className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              {fuelSummary.totalFuelCost
                ? formatCurrency(fuelSummary.totalFuelCost)
                : "-"}
            </div>
            <p className="text-xs text-muted-foreground">
              {fuelSummary.totalRefuels || 0}x pengisian
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Periode</CardTitle>
            <span className="text-xs text-muted-foreground">📅</span>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold">
              {new Date(summary.period.from).toLocaleDateString("id-ID")} -{" "}
              {new Date(summary.period.to).toLocaleDateString("id-ID")}
            </div>
            <p className="text-xs text-muted-foreground">Rentang laporan</p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Tabs */}
      <Tabs defaultValue="driver" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="driver">Kinerja Sopir</TabsTrigger>
          <TabsTrigger value="package">Kinerja Paket Jasa</TabsTrigger>
          <TabsTrigger value="fuel">Analisis BBM</TabsTrigger>
        </TabsList>

        <TabsContent value="driver" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Kinerja Sopir</CardTitle>
            </CardHeader>
            <CardContent>
              {driverPerformance.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Tidak ada data kinerja sopir
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>No</TableHead>
                      <TableHead>Nama Sopir</TableHead>
                      <TableHead>No. Telepon</TableHead>
                      <TableHead>Total Trip</TableHead>
                      <TableHead>Total Jam Kerja</TableHead>
                      <TableHead>Rata-rata Jam/Trip</TableHead>
                      <TableHead>Trip Selesai</TableHead>
                      <TableHead>Tingkat Penyelesaian</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {driverPerformance.map((driver, index) => (
                      <TableRow key={driver.driverId}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell className="font-medium">
                          {driver.driverName}
                        </TableCell>
                        <TableCell>{driver.phoneNumber || "-"}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {driver.totalTrips} trip
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {driver.totalWorkingHours
                            ? parseFloat(driver.totalWorkingHours).toFixed(1)
                            : "0.0"}{" "}
                          jam
                        </TableCell>
                        <TableCell>
                          {driver.averageHoursPerTrip
                            ? parseFloat(driver.averageHoursPerTrip).toFixed(1)
                            : "0.0"}{" "}
                          jam
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              driver.completedTrips === driver.totalTrips
                                ? "default"
                                : "outline"
                            }
                          >
                            {driver.completedTrips}/{driver.totalTrips}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              driver.completionRate &&
                              parseFloat(driver.completionRate) >= 90
                                ? "default"
                                : driver.completionRate &&
                                    parseFloat(driver.completionRate) >= 70
                                  ? "secondary"
                                  : "outline"
                            }
                          >
                            {driver.completionRate || "0.0"}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="package" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Kinerja Paket Jasa</CardTitle>
            </CardHeader>
            <CardContent>
              {packagePerformance.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Tidak ada data kinerja paket jasa
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>No</TableHead>
                      <TableHead>Nama Paket</TableHead>
                      <TableHead>Tipe Paket</TableHead>
                      <TableHead>Frekuensi</TableHead>
                      <TableHead>Total Trip</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {packagePerformance.map((pkg, index) => (
                      <TableRow key={pkg.packageId}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell className="font-medium">
                          {pkg.packageName}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`text-xs ${PACKAGE_TYPE_COLORS[pkg.packageType]}`}
                          >
                            {PACKAGE_TYPE_LABELS[pkg.packageType]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{pkg.frequency}x</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{pkg.totalTrips} trip</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fuel" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Analisis BBM per Armada</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingFuel ? (
                <div
                  className="flex items-center justify-center p-8"
                  role="status"
                  aria-busy="true"
                  aria-label="Memuat data analisis BBM"
                >
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">
                    Memuat data analisis BBM...
                  </span>
                </div>
              ) : fuelAnalysis.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Tidak ada data konsumsi BBM
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>No</TableHead>
                      <TableHead>Nama Armada</TableHead>
                      <TableHead>Plat Nomor</TableHead>
                      <TableHead>Frekuensi Isi BBM</TableHead>
                      <TableHead>Total Trip</TableHead>
                      <TableHead>Total Biaya BBM</TableHead>
                      <TableHead>Rata-rata per Trip</TableHead>
                      <TableHead>Rata-rata per Isi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fuelAnalysis.map((armada, index) => (
                      <TableRow key={armada.armadaId}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell className="font-medium">
                          {armada.armadaName}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{armada.licensePlate}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {armada.refuelCount}x
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {armada.totalTrips} trip
                          </Badge>
                        </TableCell>
                        <TableCell className="font-semibold">
                          {formatCurrency(armada.totalFuelCost)}
                        </TableCell>
                        <TableCell>
                          {armada.totalTrips > 0
                            ? formatCurrency(armada.averageCostPerTrip)
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {formatCurrency(armada.averageCostPerRefuel)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
