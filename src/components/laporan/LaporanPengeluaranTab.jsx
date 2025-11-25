"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChevronDown,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  DollarSign,
  FileText,
  Download,
  Calendar,
  Layers
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { exportExpenseReport, exportRekapReport } from "@/lib/excel-export";
import { useAlertDialog } from "@/components/ui/alert-dialog-provider";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Helper function untuk format mata uang
function formatCurrency(amount) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

// Helper function untuk format kategori
function formatCategory(category) {
  const categoryMap = {
    LISTRIK: "Listrik",
    INTERNET: "Internet",
    PAKET_DATA: "Paket Data",
    KONSUMSI: "Konsumsi",
    GAJI_STAF_OPERASIONAL: "Gaji Staf Operasional",
    GAJI_STAF_ADMIN: "Gaji Staf Admin",
    INSENTIF_BONUS: "Insentif Bonus",
    PAJAK: "Pajak",
    ALAT_TULIS_KANTOR: "Alat Tulis Kantor (ATK)",
    KOMPUTER_SUPPLIES: "Komputer Supplies",
    OPERASIONAL_LAINNYA: "Operasional Lainnya",
    BBM: "BBM (Armada)",
    PERAWATAN_ARMADA: "Perawatan Armada",
    GAJI_SOPIR: "Gaji Sopir",
  };
  return categoryMap[category] || category;
}

// Helper function untuk mendapatkan warna badge berdasarkan kategori
function getCategoryColor(category) {
  const colorMap = {
    LISTRIK: "bg-blue-100 text-blue-800",
    INTERNET: "bg-green-100 text-green-800",
    PAKET_DATA: "bg-purple-100 text-purple-800",
    KONSUMSI: "bg-orange-100 text-orange-800",
    GAJI_STAF_OPERASIONAL: "bg-red-100 text-red-800",
    GAJI_STAF_ADMIN: "bg-pink-100 text-pink-800",
    INSENTIF_BONUS: "bg-yellow-100 text-yellow-800",
    PAJAK: "bg-gray-100 text-gray-800",
    ALAT_TULIS_KANTOR: "bg-indigo-100 text-indigo-800",
    KOMPUTER_SUPPLIES: "bg-cyan-100 text-cyan-800",
    OPERASIONAL_LAINNYA: "bg-slate-100 text-slate-800",
    BBM: "bg-emerald-100 text-emerald-800",
    PERAWATAN_ARMADA: "bg-violet-100 text-violet-800",
    GAJI_SOPIR: "bg-rose-100 text-rose-800",
  };
  return colorMap[category] || "bg-gray-100 text-gray-800";
}

export default function LaporanPengeluaranTab({ data, isLoading, dateRange }) {
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [isExporting, setIsExporting] = useState(false);
  const { showAlert } = useAlertDialog();
  const [viewMode, setViewMode] = useState("category"); // "category" or "monthly"
  const [monthlyData, setMonthlyData] = useState(null);
  const [isLoadingMonthly, setIsLoadingMonthly] = useState(false);

  // Fetch monthly data when view mode changes to monthly
  useEffect(() => {
    if (viewMode === "monthly" && !monthlyData && dateRange?.from && dateRange?.to) {
      const fetchMonthlyData = async () => {
        setIsLoadingMonthly(true);
        try {
          const params = new URLSearchParams({
            startDate: dateRange.from.toISOString().split("T")[0],
            endDate: dateRange.to.toISOString().split("T")[0],
          });
          
          const res = await fetch(`/api/reports/rekap?${params}`);
          const result = await res.json();
          
          if (result.success) {
            setMonthlyData(result.data);
          }
        } catch (error) {
          console.error("Error fetching monthly data:", error);
        } finally {
          setIsLoadingMonthly(false);
        }
      };
      
      fetchMonthlyData();
    }
  }, [viewMode, dateRange, monthlyData]);

  // Reset monthly data when date range changes
  useEffect(() => {
    setMonthlyData(null);
  }, [dateRange]);

  // Function to export data to Excel
  const exportToExcel = async () => {
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

      if (viewMode === "category") {
        if (!data || !data.data || data.data.length === 0) {
          await showAlert({
            message: "Tidak ada data untuk diekspor",
            type: "warning",
            title: "Data Kosong",
          });
          return;
        }
        await exportExpenseReport(data, reportDateRange);
      } else {
        if (!monthlyData || !monthlyData.rekap || monthlyData.rekap.length === 0) {
           await showAlert({
            message: "Tidak ada data rekap untuk diekspor",
            type: "warning",
            title: "Data Kosong",
          });
          return;
        }
        await exportRekapReport(monthlyData, reportDateRange);
      }

      await showAlert({
        message: "File Excel berhasil diekspor",
        type: "success",
        title: "Export Berhasil",
      });
    } catch (error) {
      console.error("Export failed:", error);
      await showAlert({
        message: error.message || "Gagal mengekspor file Excel",
        type: "error",
        title: "Export Gagal",
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    if (!data?.summary) return null;

    const { summary, data: groupedData } = data;

    return {
      totalExpenses: summary.totalExpenses,
      totalAmount: summary.totalAmount,
      categoriesCount: summary.categoriesCount,
      topCategory: groupedData?.reduce(
        (max, cat) => (cat.totalAmount > max.totalAmount ? cat : max),
        groupedData[0] || {}
      ),
      averageExpense:
        summary.totalExpenses > 0
          ? summary.totalAmount / summary.totalExpenses
          : 0,
    };
  }, [data]);

  const toggleCategory = (category) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  if (isLoading) {
    return (
      <div className="space-y-6" role="status" aria-busy="true">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data || !data.data || data.data.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground mb-2">
            Tidak ada data pengeluaran
          </h3>
          <p className="text-sm text-muted-foreground text-center">
            Belum ada pengeluaran yang tercatat dalam periode waktu yang
            dipilih.
          </p>
        </CardContent>
      </Card>
    );
  }

  const { summary, data: groupedData } = data;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Pengeluaran
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summaryStats?.totalAmount || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {summaryStats?.totalExpenses || 0} transaksi
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Kategori Terbesar
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCategory(summaryStats?.topCategory?.category || "")}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(summaryStats?.topCategory?.totalAmount || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Rata-rata per Transaksi
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summaryStats?.averageExpense || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Per pengeluaran</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Jumlah Kategori
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summaryStats?.categoriesCount || 0}
            </div>
            <p className="text-xs text-muted-foreground">Kategori aktif</p>
          </CardContent>
        </Card>
      </div>

      {/* View Toggle */}
      <div className="flex justify-between items-center">
        <Tabs value={viewMode} onValueChange={setViewMode} className="w-[400px]">
          <TabsList>
            <TabsTrigger value="category">
              <Layers className="w-4 h-4 mr-2" />
              Per Kategori
            </TabsTrigger>
            <TabsTrigger value="monthly">
              <Calendar className="w-4 h-4 mr-2" />
              Per Bulan
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <LoadingButton
          onClick={exportToExcel}
          isLoading={isExporting}
          loadingText="Mengekspor..."
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Export Excel
        </LoadingButton>
      </div>

      {/* Detailed Report */}
      {viewMode === "category" ? (
        <Card>
          <CardHeader>
            <CardTitle>Rincian Pengeluaran per Kategori</CardTitle>
            <CardDescription>
              Breakdown pengeluaran berdasarkan kategori
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {groupedData
                .sort((a, b) => b.totalAmount - a.totalAmount)
                .map((categoryGroup) => {
                  const isExpanded = expandedCategories.has(
                    categoryGroup.category
                  );
                  const percentage =
                    summary.totalAmount > 0
                      ? (
                          (categoryGroup.totalAmount / summary.totalAmount) *
                          100
                        ).toFixed(1)
                      : 0;

                  return (
                    <Collapsible
                      key={categoryGroup.category}
                      open={isExpanded}
                      onOpenChange={() => toggleCategory(categoryGroup.category)}
                    >
                      <div className="border rounded-lg p-4">
                        <CollapsibleTrigger asChild>
                          <Button
                            variant="ghost"
                            className="w-full justify-between p-0 h-auto hover:bg-transparent"
                          >
                            <div className="flex items-center space-x-4 flex-1">
                              <div className="flex items-center space-x-2">
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                                <Badge
                                  variant="secondary"
                                  className={getCategoryColor(
                                    categoryGroup.category
                                  )}
                                >
                                  {formatCategory(categoryGroup.category)}
                                </Badge>
                              </div>
                              <div className="flex-1">
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-blue-600 h-2 rounded-full"
                                    style={{ width: `${percentage}%` }}
                                  ></div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-semibold">
                                  {formatCurrency(categoryGroup.totalAmount)}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {categoryGroup.count} transaksi • {percentage}%
                                </div>
                              </div>
                            </div>
                          </Button>
                        </CollapsibleTrigger>

                        <CollapsibleContent className="mt-4">
                          <div className="border-t pt-4">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Tanggal</TableHead>
                                  <TableHead>Deskripsi</TableHead>
                                  <TableHead>Jumlah</TableHead>
                                  <TableHead>Penerima</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {categoryGroup.expenses.map((expense) => (
                                  <TableRow key={expense.id}>
                                    <TableCell>
                                      {new Date(expense.date).toLocaleDateString(
                                        "id-ID"
                                      )}
                                    </TableCell>
                                    <TableCell className="max-w-xs truncate">
                                      {expense.description}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                      {formatCurrency(expense.amount)}
                                    </TableCell>
                                    <TableCell>
                                      {expense.namaPenerima ||
                                        expense.staff?.name ||
                                        expense.driver?.driver_name ||
                                        "-"}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Rincian Pengeluaran Bulanan</CardTitle>
            <CardDescription>
              Breakdown pengeluaran per kategori setiap bulan
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingMonthly ? (
              <div className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : !monthlyData || monthlyData.rekap.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Tidak ada data bulanan tersedia
              </div>
            ) : (
              <div className="space-y-6">
                {monthlyData.rekap.map((categoryData) => (
                  <Card key={categoryData.category} className="border shadow-sm">
                    <CardHeader className="py-3 bg-muted/30">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge className={getCategoryColor(categoryData.category)}>
                            {formatCategory(categoryData.category)}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold">
                            {formatCurrency(categoryData.totalAmount || 0)}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="pl-4">Bulan</TableHead>
                            <TableHead className="text-right">Transaksi</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead className="text-right pr-4">Rata-rata</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {categoryData.months.map((monthData) => (
                            <TableRow key={monthData.month}>
                              <TableCell className="font-medium pl-4">
                                {new Date(monthData.month + "-01").toLocaleDateString(
                                  "id-ID",
                                  {
                                    year: "numeric",
                                    month: "long",
                                  }
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                {monthData.count || 0}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(monthData.total || 0)}
                              </TableCell>
                              <TableCell className="text-right pr-4">
                                {formatCurrency(
                                  monthData.count > 0
                                    ? Math.round(monthData.total / monthData.count)
                                    : 0
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
