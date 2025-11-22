"use client";
import React, { useState, useEffect, useCallback } from "react";
import { LoadingButton } from "@/components/ui/loading-button";
import { Download } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { exportRekapReport } from "@/lib/excel-export";
import { formatCurrency } from "@/lib/transaction-utils";

export default function LaporanRekapTab({ startDate, endDate }) {
  const [rekapData, setRekapData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const fetchRekapData = useCallback(async () => {
    if (!startDate || !endDate) return;

    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        startDate: startDate,
        endDate: endDate,
      });

      const response = await fetch(`/api/reports/rekap?${params}`);
      const result = await response.json();

      if (result.success) {
        setRekapData(result.data);
      } else {
        console.error("Failed to fetch rekap:", result.message);
      }
    } catch (error) {
      console.error("Error fetching rekap:", error);
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchRekapData();
  }, [startDate, endDate, fetchRekapData]);

  const handleDownloadAll = async () => {
    if (!rekapData) return;

    setIsExporting(true);
    try {
      const reportDateRange = {
        from: startDate,
        to: endDate,
      };

      await exportRekapReport(rekapData, reportDateRange);
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <Skeleton
        className="h-96 w-full"
        role="status"
        aria-busy="true"
        aria-label="Memuat rekapitulasi pengeluaran"
      />
    );
  }

  if (!rekapData) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-muted-foreground">
          Silakan pilih rentang tanggal untuk melihat rekapitulasi pengeluaran
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards and Export Button */}
      <div className="flex justify-between items-start">
        <div className="grid gap-4 md:grid-cols-3 flex-1">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Pengeluaran
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(rekapData.summary?.totalExpenses || 0)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Jumlah Transaksi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {rekapData.summary?.totalTransactions || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Kategori
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {rekapData.summary?.categories || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="ml-4">
          <LoadingButton
            onClick={handleDownloadAll}
            isLoading={isExporting}
            loadingText="Mengekspor..."
            disabled={!rekapData}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export Excel Lengkap
          </LoadingButton>
        </div>
      </div>

      {/* Rekap by Category */}
      {rekapData.rekap.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              Tidak ada data pengeluaran pada periode ini
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {rekapData.rekap.map((categoryData) => (
            <Card key={categoryData.category}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{categoryData.category}</CardTitle>
                  <div className="text-right">
                    <div className="text-lg font-bold">
                      {formatCurrency(categoryData.totalAmount || 0)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {categoryData.totalCount || 0} transaksi
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bulan</TableHead>
                      <TableHead className="text-right">
                        Jumlah Transaksi
                      </TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Rata-rata</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categoryData.months.map((monthData) => (
                      <TableRow key={monthData.month}>
                        <TableCell className="font-medium">
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
                        <TableCell className="text-right">
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
    </div>
  );
}
