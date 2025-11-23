"use client";

import React, { useState, useMemo } from "react";
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
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { exportExpenseReport } from "@/lib/excel-export";
import { useAlertDialog } from "@/components/ui/alert-dialog-provider";

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

  // Function to export data to Excel
  const exportToExcel = async () => {
    // Validate data before export
    if (!data || !data.data) {
      console.warn("Export warning: No expense data available");
      await showAlert({
        message: "Tidak ada data untuk diekspor",
        type: "warning",
        title: "Data Kosong",
      });
      return;
    }

    if (data.data.length === 0) {
      console.warn("Export warning: Empty expense data array");
      await showAlert({
        message: "Tidak ada data pengeluaran pada periode yang dipilih",
        type: "warning",
        title: "Data Kosong",
      });
      return;
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

      await exportExpenseReport(data, reportDateRange);

      // Show success message
      console.log("Export successful: Expense report exported");
      await showAlert({
        message: "File Excel berhasil diekspor dengan multiple sheet",
        type: "success",
        title: "Export Berhasil",
      });
    } catch (error) {
      console.error("Export failed:", error);

      // Show user-friendly error message
      const errorMessage =
        error.message || "Gagal mengekspor file Excel. Silakan coba lagi.";
      await showAlert({
        message: errorMessage,
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
        {/* Summary Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton
                  className="h-4 w-24"
                  aria-label={`Memuat statistik ${i + 1}`}
                />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Table Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" aria-label="Memuat judul laporan" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex justify-between items-center">
                  <Skeleton
                    className="h-4 w-32"
                    aria-label={`Memuat kategori ${i + 1}`}
                  />
                  <Skeleton className="h-4 w-24" />
                </div>
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

      {/* Detailed Report */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Rincian Pengeluaran per Kategori</CardTitle>
              <CardDescription>
                Breakdown pengeluaran berdasarkan kategori untuk periode{" "}
                {dateRange?.from?.toLocaleDateString("id-ID")} -{" "}
                {dateRange?.to?.toLocaleDateString("id-ID")}
              </CardDescription>
            </div>
            <LoadingButton
              onClick={exportToExcel}
              isLoading={isExporting}
              loadingText="Mengekspor..."
              disabled={!data || !data.data || data.data.length === 0}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export Excel
            </LoadingButton>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {groupedData
              .sort((a, b) => b.totalAmount - a.totalAmount) // Sort by amount descending
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
    </div>
  );
}
