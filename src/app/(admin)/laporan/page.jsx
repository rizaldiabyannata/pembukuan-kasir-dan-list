"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/ui/page-header";
import LaporanFilter from "@/components/laporan/LaporanFilter";
import LaporanTransaksiTab from "@/components/laporan/LaporanTransaksiTab";
import LaporanLabaRugiTab from "@/components/laporan/LaporanLabaRugiTab";
import LaporanPemasukanTab from "@/components/laporan/LaporanPemasukanTab";
import LaporanRekapTab from "@/components/laporan/LaporanRekapTab";
import LaporanPengeluaranTab from "@/components/laporan/LaporanPengeluaranTab";
import LaporanKinerjaTab from "@/components/laporan/LaporanKinerjaTab";

const getThisMonthRange = () => {
  const start = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const end = new Date();
  return { from: start, to: end };
};

export default function LaporanPage() {
  const [dateRange, setDateRange] = useState(getThisMonthRange);
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

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
        laporanPengeluaran: expenseData,
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

  return (
    <div className="flex w-full flex-col gap-4">
      <PageHeader
        title="Laporan Keuangan"
        description="Ringkasan kinerja bisnis, pemasukan, pengeluaran, dan laba rugi."
      />
      <LaporanFilter
        dateRange={dateRange}
        onDateChange={setDateRange}
        onRefresh={fetchReportData}
        isLoading={isLoading}
      />

      <Tabs defaultValue="laporan-transaksi" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-6 h-auto">
          <TabsTrigger value="laporan-transaksi" className="text-xs md:text-sm">
            Laporan Transaksi
          </TabsTrigger>
          <TabsTrigger value="laporan-laba-rugi" className="text-xs md:text-sm">
            Laporan Laba Rugi
          </TabsTrigger>
          <TabsTrigger value="laporan-pemasukan" className="text-xs md:text-sm">
            Laporan Pemasukan
          </TabsTrigger>
          <TabsTrigger
            value="laporan-pengeluaran"
            className="text-xs md:text-sm"
          >
            Laporan Pengeluaran
          </TabsTrigger>
          <TabsTrigger value="rekapitulasi" className="text-xs md:text-sm">
            Rekapitulasi
          </TabsTrigger>
          <TabsTrigger value="laporan-kinerja" className="text-xs md:text-sm">
            Laporan Kinerja
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
            data={reportData?.laporanPengeluaran}
            isLoading={isLoading}
            dateRange={dateRange}
          />
        </TabsContent>

        <TabsContent value="rekapitulasi" className="mt-4">
          <LaporanRekapTab
            startDate={
              dateRange.from ? dateRange.from.toISOString().split("T")[0] : null
            }
            endDate={
              dateRange.to ? dateRange.to.toISOString().split("T")[0] : null
            }
          />
        </TabsContent>

        <TabsContent value="laporan-kinerja" className="mt-4">
          <LaporanKinerjaTab dateRange={dateRange} isLoading={isLoading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
