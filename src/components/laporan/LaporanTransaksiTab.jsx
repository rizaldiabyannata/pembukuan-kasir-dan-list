"use client";
import React from "react";
import { toast } from "sonner";
import { LoadingButton } from "@/components/ui/loading-button";
import { Download } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { exportTransactionReport } from "@/lib/excel-export";
import { cn } from "@/lib/utils";

const formatCurrency = (amount) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount || 0);

export default function LaporanTransaksiTab({ data, isLoading, dateRange }) {
  const [isExporting, setIsExporting] = React.useState(false);

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

      // Fetch detailed transaction data (without pagination for export)
      const params = new URLSearchParams({
        from: reportDateRange.from,
        to: reportDateRange.to,
        limit: "10000", // Large limit to get all transactions
      });

      const res = await fetch(`/api/transactions?${params.toString()}`, {
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Gagal mengambil data transaksi detail");
      }

      const result = await res.json();
      const transactions = result.data || [];

      // Filter only approved transactions
      const approvedTransactions = transactions.filter(
        (tx) => tx.approval_status === "APPROVED"
      );

      // Combine summary data with detailed transactions
      const exportData = {
        ...data,
        transactions: approvedTransactions,
      };

      await exportTransactionReport(exportData, reportDateRange);
      toast.success("Laporan berhasil diunduh!", {
        description: "File Excel dengan multiple sheet telah tersimpan",
      });
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Gagal mengunduh laporan", {
        description: error.message,
      });
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
        aria-label="Memuat laporan transaksi"
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
    <div className="rounded-md border">
      <div className="p-4">
        <LoadingButton
          onClick={handleDownload}
          size="sm"
          className="mb-4"
          isLoading={isExporting}
          loadingText="Mengunduh..."
          disabled={!data}
        >
          <Download className="mr-2 h-4 w-4" />
          Download Laporan (Excel)
        </LoadingButton>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 pt-0">
        <StatCard
          title="Total Transaksi"
          value={data.totalTransaksi || 0}
          unit="Order"
        />
        <StatCard
          title="Total Pemasukan"
          value={formatCurrency(data.totalPemasukan)}
          isCurrency
        />
        <StatCard
          title="Total Pengeluaran (Ops)"
          value={formatCurrency(data.totalPengeluaranOps)}
          isCurrency
        />
        <StatCard
          title="Total Laba Kotor"
          value={formatCurrency(data.totalLabaKotor)}
          isCurrency
          isPositive={data.totalLabaKotor > 0}
        />
      </div>
    </div>
  );
}

const StatCard = ({ title, value, unit, isCurrency, isPositive }) => (
  <div className="rounded-md border bg-card p-4">
    <div className="text-sm font-medium text-muted-foreground">{title}</div>
    <div
      className={cn(
        "text-2xl font-bold",
        isCurrency && (isPositive ? "text-green-600" : "text-red-600"),
        isCurrency && !isPositive && "text-inherit"
      )}
    >
      {value} {!isCurrency && unit}
    </div>
  </div>
);
