"use client";
import React, { useState } from "react";
import { LoadingButton } from "@/components/ui/loading-button";
import { Badge } from "@/components/ui/badge";
import { Download, TrendingUp, TrendingDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { exportIncomeStatement } from "@/lib/excel-export";
import { cn } from "@/lib/utils";

const formatCurrency = (amount) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount || 0);

export default function LaporanLabaRugiTab({ data, isLoading, dateRange }) {
  const [isExporting, setIsExporting] = useState(false);

  const handleDownload = async () => {
    if (!data) return;

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

      await exportIncomeStatement(data, reportDateRange);
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <Skeleton
        className="h-64 w-full"
        role="status"
        aria-busy="true"
        aria-label="Memuat laporan laba rugi"
      />
    );
  }

  if (!data) {
    return (
      <div className="p-4 text-center">
        Tidak ada data untuk rentang tanggal ini.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Alert jika rugi */}
      {data.labaRugiBersih < 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-red-600" />
            <div>
              <h4 className="font-semibold text-red-900">
                Perhatian: Bisnis Mengalami Kerugian
              </h4>
              <p className="text-sm text-red-700 mt-1">
                Total kerugian bersih:{" "}
                <span className="font-bold">
                  {formatCurrency(Math.abs(data.labaRugiBersih))}
                </span>{" "}
                ({data.profitMargin || "N/A"})
              </p>
              <p className="text-xs text-red-600 mt-2">
                Silakan evaluasi biaya operasional dan strategi pricing untuk
                meningkatkan profitabilitas.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Success alert jika profit tinggi */}
      {data.labaRugiBersih > 0 && parseFloat(data.profitMargin) > 50 && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <div>
              <h4 className="font-semibold text-green-900">
                Bisnis Berjalan Sangat Baik!
              </h4>
              <p className="text-sm text-green-700 mt-1">
                Profit margin:{" "}
                <span className="font-bold">{data.profitMargin}</span> - Target
                tercapai dengan baik.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-md border">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold">Laporan Laba/Rugi</h3>
            {data.status && (
              <Badge
                variant={data.status === "PROFIT" ? "default" : "destructive"}
                className="flex items-center gap-1"
              >
                {data.status === "PROFIT" ? (
                  <>
                    <TrendingUp className="h-3 w-3" />
                    LABA
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-3 w-3" />
                    RUGI
                  </>
                )}
              </Badge>
            )}
            {data.profitMargin && (
              <span
                className={cn(
                  "text-sm font-medium",
                  data.labaRugiBersih >= 0 ? "text-green-600" : "text-red-600"
                )}
              >
                {data.profitMargin}
              </span>
            )}
          </div>
          <LoadingButton
            onClick={handleDownload}
            size="sm"
            isLoading={isExporting}
            loadingText="Mengekspor..."
            disabled={!data}
          >
            <Download className="mr-2 h-4 w-4" />
            Download Excel
          </LoadingButton>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b">
                <td className="p-4 font-medium">PEMASUKAN</td>
                <td className="p-4"></td>
              </tr>
              <tr className="border-b">
                <td className="p-4 pl-8">Total Pendapatan Sewa</td>
                <td className="p-4 text-right font-medium">
                  {formatCurrency(data.totalPemasukanSewa)}
                </td>
              </tr>

              <tr className="border-b">
                <td className="p-4 font-medium">PENGELUARAN</td>
                <td className="p-4"></td>
              </tr>
              <tr className="border-b">
                <td className="p-4 pl-8">
                  Total Biaya Operasional (BBM & Gaji Sopir)
                </td>
                <td className="p-4 text-right font-medium text-red-600">
                  ({formatCurrency(data.totalBiayaOps)})
                </td>
              </tr>
              <tr className="border-b">
                <td className="p-4 pl-8">Total Biaya Operasional Kantor</td>
                <td className="p-4 text-right font-medium text-red-600">
                  ({formatCurrency(data.totalBiayaKantor)})
                </td>
              </tr>

              <tr className="bg-muted">
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base">
                      LABA / RUGI BERSIH
                    </span>
                    {data.labaRugiBersih >= 0 ? (
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    ) : (
                      <TrendingDown className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                  {data.profitMargin && (
                    <div
                      className={cn(
                        "text-xs mt-1",
                        data.labaRugiBersih >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      )}
                    >
                      Profit Margin: {data.profitMargin}
                    </div>
                  )}
                </td>
                <td
                  className={cn(
                    "p-4 text-right font-bold text-base",
                    data.labaRugiBersih >= 0 ? "text-green-600" : "text-red-600"
                  )}
                >
                  {formatCurrency(data.labaRugiBersih)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
