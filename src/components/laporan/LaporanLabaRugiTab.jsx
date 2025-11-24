"use client";
import React from "react";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const formatCurrency = (amount) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount || 0);

export default function LaporanLabaRugiTab({ data, isLoading }) {
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

  // Helper to safely access nested properties
  const revenue = data.revenue || {};
  const cogs = data.cogs || {};
  const opex = data.opex || {};
  const margins = data.margins || {};

  return (
    <div className="space-y-4">
      {/* Alert jika rugi */}
      {data.netProfit < 0 && (
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
                  {formatCurrency(Math.abs(data.netProfit))}
                </span>{" "}
                ({margins.net || "N/A"})
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
      {data.netProfit > 0 && parseFloat(margins.net) > 20 && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <div>
              <h4 className="font-semibold text-green-900">
                Bisnis Berjalan Sangat Baik!
              </h4>
              <p className="text-sm text-green-700 mt-1">
                Net Profit Margin:{" "}
                <span className="font-bold">{margins.net}</span> - Kinerja
                keuangan yang sehat.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-md border">
        <div className="p-4 flex items-center justify-between bg-muted/30">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold">Laporan Laba/Rugi</h3>
            <Badge
              variant={data.netProfit >= 0 ? "default" : "destructive"}
              className="flex items-center gap-1"
            >
              {data.netProfit >= 0 ? (
                <>
                  <TrendingUp className="h-3 w-3" />
                  PROFIT
                </>
              ) : (
                <>
                  <TrendingDown className="h-3 w-3" />
                  LOSS
                </>
              )}
            </Badge>
            {margins.net && (
              <span
                className={cn(
                  "text-sm font-medium",
                  data.netProfit >= 0 ? "text-green-600" : "text-red-600"
                )}
              >
                Margin: {margins.net}
              </span>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <tbody>
              {/* REVENUE SECTION */}
              <tr className="bg-slate-50">
                <td className="p-3 font-bold text-slate-700" colSpan={2}>PENDAPATAN (REVENUE)</td>
              </tr>
              <tr className="border-b hover:bg-slate-50/50">
                <td className="p-3 pl-8">Pendapatan Sewa</td>
                <td className="p-3 text-right font-medium">
                  {formatCurrency(revenue.rental)}
                </td>
              </tr>
              <tr className="border-b hover:bg-slate-50/50">
                <td className="p-3 pl-8">Pendapatan Overtime</td>
                <td className="p-3 text-right font-medium">
                  {formatCurrency(revenue.overtime)}
                </td>
              </tr>
              <tr className="border-b bg-slate-100/50 font-semibold">
                <td className="p-3 pl-8">TOTAL PENDAPATAN</td>
                <td className="p-3 text-right text-slate-900">
                  {formatCurrency(revenue.total)}
                </td>
              </tr>

              {/* COGS SECTION */}
              <tr className="bg-slate-50">
                <td className="p-3 font-bold text-slate-700" colSpan={2}>HARGA POKOK PENJUALAN (COGS)</td>
              </tr>
              <tr className="border-b hover:bg-slate-50/50">
                <td className="p-3 pl-8">BBM</td>
                <td className="p-3 text-right text-red-600">
                  ({formatCurrency(cogs.fuel)})
                </td>
              </tr>
              <tr className="border-b hover:bg-slate-50/50">
                <td className="p-3 pl-8">Gaji Sopir</td>
                <td className="p-3 text-right text-red-600">
                  ({formatCurrency(cogs.driverSalary)})
                </td>
              </tr>
              <tr className="border-b hover:bg-slate-50/50">
                <td className="p-3 pl-8">Perawatan Armada</td>
                <td className="p-3 text-right text-red-600">
                  ({formatCurrency(cogs.maintenance)})
                </td>
              </tr>
              <tr className="border-b hover:bg-slate-50/50">
                <td className="p-3 pl-8">Konsumsi</td>
                <td className="p-3 text-right text-red-600">
                  ({formatCurrency(cogs.consumption)})
                </td>
              </tr>
              <tr className="border-b hover:bg-slate-50/50">
                <td className="p-3 pl-8">Lainnya (COGS)</td>
                <td className="p-3 text-right text-red-600">
                  ({formatCurrency(cogs.other)})
                </td>
              </tr>
              <tr className="border-b bg-slate-100/50 font-semibold">
                <td className="p-3 pl-8">TOTAL COGS</td>
                <td className="p-3 text-right text-red-700">
                  ({formatCurrency(cogs.total)})
                </td>
              </tr>

              {/* GROSS PROFIT */}
              <tr className="bg-blue-50/50 border-y-2 border-blue-100">
                <td className="p-4 font-bold text-blue-900">LABA KOTOR (GROSS PROFIT)</td>
                <td className="p-4 text-right font-bold text-blue-900 text-base">
                  {formatCurrency(data.grossProfit)}
                  <div className="text-xs font-normal text-blue-600 mt-1">
                    Margin: {margins.gross}%
                  </div>
                </td>
              </tr>

              {/* OPEX SECTION */}
              <tr className="bg-slate-50">
                <td className="p-3 font-bold text-slate-700" colSpan={2}>BIAYA OPERASIONAL (OPEX)</td>
              </tr>
              <tr className="border-b hover:bg-slate-50/50">
                <td className="p-3 pl-8">Gaji Staff Kantor</td>
                <td className="p-3 text-right text-red-600">
                  ({formatCurrency(opex.officeSalaries)})
                </td>
              </tr>
              <tr className="border-b hover:bg-slate-50/50">
                <td className="p-3 pl-8">Listrik, Air, Internet</td>
                <td className="p-3 text-right text-red-600">
                  ({formatCurrency(opex.utilities)})
                </td>
              </tr>
              <tr className="border-b hover:bg-slate-50/50">
                <td className="p-3 pl-8">ATK & Komputer</td>
                <td className="p-3 text-right text-red-600">
                  ({formatCurrency(opex.supplies)})
                </td>
              </tr>
              <tr className="border-b hover:bg-slate-50/50">
                <td className="p-3 pl-8">Lainnya (OpEx)</td>
                <td className="p-3 text-right text-red-600">
                  ({formatCurrency(opex.other)})
                </td>
              </tr>
              <tr className="border-b bg-slate-100/50 font-semibold">
                <td className="p-3 pl-8">TOTAL OPEX</td>
                <td className="p-3 text-right text-red-700">
                  ({formatCurrency(opex.total)})
                </td>
              </tr>

              {/* NET PROFIT */}
              <tr className={cn(
                "border-t-2",
                data.netProfit >= 0 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
              )}>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "font-bold text-lg",
                      data.netProfit >= 0 ? "text-green-900" : "text-red-900"
                    )}>
                      LABA BERSIH (NET PROFIT)
                    </span>
                  </div>
                </td>
                <td className={cn(
                  "p-4 text-right font-bold text-lg",
                  data.netProfit >= 0 ? "text-green-700" : "text-red-700"
                )}>
                  {formatCurrency(data.netProfit)}
                  <div className={cn(
                    "text-xs font-normal mt-1",
                    data.netProfit >= 0 ? "text-green-600" : "text-red-600"
                  )}>
                    Net Margin: {margins.net}%
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
