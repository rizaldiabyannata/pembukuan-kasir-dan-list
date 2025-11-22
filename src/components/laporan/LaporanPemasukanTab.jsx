"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingButton } from "@/components/ui/loading-button";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChevronDown,
  ChevronRight,
  Download,
  TrendingUp,
  Package,
  DollarSign,
  BarChart3,
} from "lucide-react";
import { formatCurrency } from "@/lib/transaction-utils";
import { exportIncomeReport } from "@/lib/excel-export";

const PACKAGE_TYPE_LABELS = {
  CAR_RENTAL: "Sewa Mobil",
  TOUR_PACKAGE: "Paket Wisata",
  FULL_DAY_TRIP: "Trip Sehari Penuh",
  CUSTOM_PRICING: "Harga Custom",
};

const PACKAGE_TYPE_COLORS = {
  CAR_RENTAL: "bg-blue-100 text-blue-800",
  TOUR_PACKAGE: "bg-green-100 text-green-800",
  FULL_DAY_TRIP: "bg-purple-100 text-purple-800",
  CUSTOM_PRICING: "bg-orange-100 text-orange-800",
};

export default function LaporanPemasukanTab({
  data,
  isLoading,
  dateRange,
  onFilterChange,
}) {
  const [selectedPackageType, setSelectedPackageType] = useState("all");
  const [expandedPackages, setExpandedPackages] = useState(new Set());
  const [isExporting, setIsExporting] = useState(false);

  // Filter data based on selected package type
  const filteredData = data
    ? {
        ...data,
        incomeByPackage:
          selectedPackageType === "all"
            ? data.incomeByPackage
            : data.incomeByPackage.filter(
                (pkg) => pkg.packageType === selectedPackageType
              ),
      }
    : null;

  const handlePackageTypeChange = (value) => {
    setSelectedPackageType(value);
    if (onFilterChange) {
      onFilterChange({ packageType: value === "all" ? null : value });
    }
  };

  const togglePackageExpansion = (packageId) => {
    const newExpanded = new Set(expandedPackages);
    if (newExpanded.has(packageId)) {
      newExpanded.delete(packageId);
    } else {
      newExpanded.add(packageId);
    }
    setExpandedPackages(newExpanded);
  };

  const handleExport = async () => {
    if (!filteredData) {
      console.error("No data available for export");
      return;
    }

    setIsExporting(true);
    try {
      const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      };

      const fromStr = formatDate(dateRange.from);
      const toStr = formatDate(dateRange.to);

      const reportDateRange = { from: fromStr, to: toStr };
      const filters =
        selectedPackageType !== "all"
          ? { packageType: selectedPackageType }
          : {};

      await exportIncomeReport(filteredData, reportDateRange, filters);
    } catch (error) {
      console.error("Export failed:", error);
      // TODO: Show error toast
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4" role="status" aria-busy="true">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Laporan Pemasukan</h3>
          <div
            className="animate-pulse h-10 w-32 bg-gray-200 rounded"
            aria-label="Memuat tombol export"
          ></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse h-24 bg-gray-200 rounded"
              aria-label={`Memuat statistik ${i + 1}`}
            ></div>
          ))}
        </div>
        <div
          className="animate-pulse h-96 bg-gray-200 rounded"
          aria-label="Memuat data pemasukan"
        ></div>
      </div>
    );
  }

  if (!filteredData) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Tidak ada data laporan pemasukan</p>
      </div>
    );
  }

  const { summary, incomeByPackage } = filteredData;

  return (
    <div className="space-y-6">
      {/* Header with Filter and Export */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Laporan Pemasukan</h3>
        <div className="flex gap-2">
          <Select
            value={selectedPackageType}
            onValueChange={handlePackageTypeChange}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter Jenis Paket" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Jenis Paket</SelectItem>
              <SelectItem value="CAR_RENTAL">Sewa Mobil</SelectItem>
              <SelectItem value="TOUR_PACKAGE">Paket Wisata</SelectItem>
              <SelectItem value="FULL_DAY_TRIP">Trip Sehari Penuh</SelectItem>
              <SelectItem value="CUSTOM_PRICING">Harga Custom</SelectItem>
            </SelectContent>
          </Select>
          <LoadingButton
            onClick={handleExport}
            variant="outline"
            size="sm"
            isLoading={isExporting}
            loadingText="Mengekspor..."
            disabled={!filteredData}
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </LoadingButton>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Paket</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalPackages}</div>
            <p className="text-xs text-muted-foreground">Paket jasa aktif</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Transaksi
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary.totalTransactions}
            </div>
            <p className="text-xs text-muted-foreground">
              Transaksi dalam periode
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Pemasukan
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summary.totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">Pendapatan kotor</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Rata-rata/Paket
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summary.averageRevenuePerPackage)}
            </div>
            <p className="text-xs text-muted-foreground">
              Pendapatan rata-rata per paket
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Income Breakdown by Package */}
      <Card>
        <CardHeader>
          <CardTitle>Pemasukan per Jenis Paket Jasa</CardTitle>
          <CardDescription>
            Analisis pendapatan berdasarkan paket jasa yang ditawarkan
          </CardDescription>
        </CardHeader>
        <CardContent>
          {incomeByPackage.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">
                Tidak ada data pemasukan untuk filter yang dipilih
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {incomeByPackage.map((pkg) => (
                <div key={pkg.packageId} className="border rounded-lg p-4">
                  {/* Package Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Collapsible
                        open={expandedPackages.has(pkg.packageId)}
                        onOpenChange={() =>
                          togglePackageExpansion(pkg.packageId)
                        }
                      >
                        <CollapsibleTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-0 h-auto"
                          >
                            {expandedPackages.has(pkg.packageId) ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </Button>
                        </CollapsibleTrigger>
                      </Collapsible>
                      <div>
                        <h4 className="font-semibold">{pkg.packageName}</h4>
                        <Badge className={PACKAGE_TYPE_COLORS[pkg.packageType]}>
                          {PACKAGE_TYPE_LABELS[pkg.packageType]}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">
                        {formatCurrency(pkg.totalRevenue)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {pkg.transactionCount} transaksi
                      </div>
                    </div>
                  </div>

                  {/* Package Summary */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <div className="text-sm text-gray-500">Tarif Dasar</div>
                      <div className="font-semibold">
                        {formatCurrency(pkg.totalBaseRevenue)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Overtime</div>
                      <div className="font-semibold">
                        {formatCurrency(pkg.totalOvertimeRevenue)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">
                        Rata-rata/Transaksi
                      </div>
                      <div className="font-semibold">
                        {formatCurrency(pkg.averageRevenue)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">% dari Total</div>
                      <div className="font-semibold">
                        {summary.totalRevenue > 0
                          ? (
                              (pkg.totalRevenue / summary.totalRevenue) *
                              100
                            ).toFixed(1)
                          : 0}
                        %
                      </div>
                    </div>
                  </div>

                  {/* Transaction Details */}
                  <Collapsible
                    open={expandedPackages.has(pkg.packageId)}
                    onOpenChange={() => togglePackageExpansion(pkg.packageId)}
                  >
                    <CollapsibleContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Invoice</TableHead>
                            <TableHead>Pelanggan</TableHead>
                            <TableHead>Tanggal</TableHead>
                            <TableHead>Armada</TableHead>
                            <TableHead>Sopir</TableHead>
                            <TableHead className="text-right">
                              Tarif Dasar
                            </TableHead>
                            <TableHead className="text-right">
                              Overtime
                            </TableHead>
                            <TableHead className="text-right">Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {pkg.transactions.map((tx) => (
                            <TableRow key={tx.id}>
                              <TableCell className="font-mono text-sm">
                                {tx.invoice_code}
                              </TableCell>
                              <TableCell>{tx.customer_name}</TableCell>
                              <TableCell>
                                {new Date(tx.booking_date).toLocaleDateString(
                                  "id-ID"
                                )}
                              </TableCell>
                              <TableCell>
                                {tx.armada
                                  ? `${tx.armada.brand} ${tx.armada.model} (${tx.armada.license_plate})`
                                  : "-"}
                              </TableCell>
                              <TableCell>
                                {tx.driver?.driver_name || "-"}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(tx.baseRevenue)}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(tx.overtimeRevenue)}
                              </TableCell>
                              <TableCell className="text-right font-semibold">
                                {formatCurrency(tx.totalRevenue)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
