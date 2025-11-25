"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { 
  Download, 
  FileText, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  BarChart3 
} from "lucide-react";
import LaporanFilter from "@/components/laporan/LaporanFilter";
import LaporanTransaksiTab from "@/components/laporan/LaporanTransaksiTab";
import LaporanLabaRugiTab from "@/components/laporan/LaporanLabaRugiTab";
import LaporanPemasukanTab from "@/components/laporan/LaporanPemasukanTab";
import LaporanPengeluaranTab from "@/components/laporan/LaporanPengeluaranTab";
import LaporanKinerjaTab from "@/components/laporan/LaporanKinerjaTab";
import { toast } from "sonner";

const getThisMonthRange = () => {
  const start = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const end = new Date();
  return { from: start, to: end };
};

export default function LaporanPage() {
  const [dateRange, setDateRange] = useState(getThisMonthRange);
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const fetchReportData = useCallback(async () => {
    if (!dateRange.from || !dateRange.to) return;

    setIsLoading(true);
    try {
      // Format date tanpa konversi timezone (YYYY-MM-DD)
      const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      };

      const fromStr = formatDate(dateRange.from);
      const toStr = formatDate(dateRange.to);

      console.log("📅 Fetching report data:", { from: fromStr, to: toStr });

      const params = new URLSearchParams({
        from: fromStr,
        to: toStr,
      });

      const res = await fetch(`/api/reports/summary?${params.toString()}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Gagal mengambil data laporan ringkasan");

      const summaryResult = await res.json();
      const summaryData = summaryResult.data || summaryResult;

      // Fetch income report
      const incomeRes = await fetch(
        `/api/reports/income?${params.toString()}`,
        {
          credentials: "include",
        }
      );
      if (!incomeRes.ok)
        throw new Error("Gagal mengambil data laporan pemasukan");

      const incomeResult = await incomeRes.json();
      const incomeData = incomeResult.data || incomeResult;

      // Fetch expense report
      const expenseRes = await fetch(
        `/api/reports/expenses?${params.toString()}`,
        {
          credentials: "include",
        }
      );
      if (!expenseRes.ok)
        throw new Error("Gagal mengambil data laporan pengeluaran");

      const expenseResult = await expenseRes.json();
      const expenseData = expenseResult.data || expenseResult;

      // Combine data
      const combinedData = {
        ...summaryData,
        laporanPemasukan: incomeData,
        laporanPengeluaran: expenseData.rawExpenses || expenseData.data.flatMap(c => c.expenses) || [],
        expenseData: expenseData, // Store full expense data for the tab
      };

      console.log("📊 Combined report data received:", combinedData);
      setReportData(combinedData);
    } catch (err) {
      console.error("❌ Error fetching report:", err);
      setReportData(null);
    } finally {
      setIsLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchReportData();
  }, [dateRange, fetchReportData]);

  const handleExport = async () => {
    if (!reportData) return;
    setIsExporting(true);
    try {
      const { exportFinancialReport } = await import("@/lib/excel-export");
      const formatDate = (date) => {
        if (!date) return "-";
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${day}/${month}/${year}`;
      };

      await exportFinancialReport(reportData, {
        from: formatDate(dateRange.from),
        to: formatDate(dateRange.to),
      });
      toast.success("Laporan berhasil diekspor");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Gagal mengekspor laporan");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <PageHeader
          title="Laporan Keuangan"
          description="Ringkasan kinerja bisnis, pemasukan, pengeluaran, dan laba rugi."
        />
        <Button onClick={handleExport} disabled={isLoading || isExporting || !reportData}>
          <Download className="mr-2 h-4 w-4" />
          {isExporting ? "Mengekspor..." : "Export Excel"}
        </Button>
      </div>
      
      <LaporanFilter
        dateRange={dateRange}
        onDateChange={setDateRange}
        onRefresh={fetchReportData}
        isLoading={isLoading}
      />

      <Tabs defaultValue="laporan-transaksi" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 h-auto">
          <TabsTrigger value="laporan-transaksi" className="text-xs md:text-sm py-2">
            <FileText className="w-4 h-4 mr-2 hidden md:inline" />
            Transaksi
          </TabsTrigger>
          <TabsTrigger value="laporan-laba-rugi" className="text-xs md:text-sm py-2">
            <Wallet className="w-4 h-4 mr-2 hidden md:inline" />
            Laba Rugi
          </TabsTrigger>
          <TabsTrigger value="laporan-pemasukan" className="text-xs md:text-sm py-2">
            <TrendingUp className="w-4 h-4 mr-2 hidden md:inline" />
            Pemasukan
          </TabsTrigger>
          <TabsTrigger
            value="laporan-pengeluaran"
            className="text-xs md:text-sm py-2"
          >
            <TrendingDown className="w-4 h-4 mr-2 hidden md:inline" />
            Pengeluaran
          </TabsTrigger>
          <TabsTrigger value="laporan-kinerja" className="text-xs md:text-sm py-2">
            <BarChart3 className="w-4 h-4 mr-2 hidden md:inline" />
            Kinerja
          </TabsTrigger>
        </TabsList>

        <TabsContent value="laporan-transaksi" className="mt-4">
          <LaporanTransaksiTab
            data={reportData?.laporanTransaksi}
            isLoading={isLoading}
            dateRange={dateRange}
          />
        </TabsContent>

        <TabsContent value="laporan-laba-rugi" className="mt-4">
          <LaporanLabaRugiTab
            data={reportData?.laporanLabaRugi}
            isLoading={isLoading}
            dateRange={dateRange}
          />
        </TabsContent>

        <TabsContent value="laporan-pemasukan" className="mt-4">
          <LaporanPemasukanTab
            data={reportData?.laporanPemasukan}
            isLoading={isLoading}
            dateRange={dateRange}
          />
        </TabsContent>

        <TabsContent value="laporan-pengeluaran" className="mt-4">
          <LaporanPengeluaranTab
            data={reportData?.expenseData}
            isLoading={isLoading}
            dateRange={dateRange}
          />
        </TabsContent>

        <TabsContent value="laporan-kinerja" className="mt-4">
          <LaporanKinerjaTab dateRange={dateRange} isLoading={isLoading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
