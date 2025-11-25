"use client";
import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { LoadingButton } from "@/components/ui/loading-button";
import { Download, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { exportTransactionReport } from "@/lib/excel-export";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const formatCurrency = (amount) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount || 0);

export default function LaporanTransaksiTab({ data, isLoading, dateRange }) {
  const [isExporting, setIsExporting] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!dateRange?.from || !dateRange?.to) return;

      setIsLoadingTransactions(true);
      try {
        const params = new URLSearchParams({
          from: dateRange.from.toISOString().split("T")[0],
          to: dateRange.to.toISOString().split("T")[0],
          limit: "1000", // Get reasonable amount of transactions
        });

        const res = await fetch(`/api/transactions?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to fetch transactions");
        
        const result = await res.json();
        const txData = result.data || [];
        setTransactions(txData);
        setFilteredTransactions(txData);
      } catch (error) {
        console.error("Error fetching transactions:", error);
        toast.error("Gagal memuat data transaksi");
      } finally {
        setIsLoadingTransactions(false);
      }
    };

    fetchTransactions();
  }, [dateRange]);

  useEffect(() => {
    if (!transactions) return;
    
    const filtered = transactions.filter(tx => 
      tx.invoice_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredTransactions(filtered);
  }, [searchTerm, transactions]);

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

      // Combine summary data with detailed transactions
      const exportData = {
        ...data,
        transactions: transactions.filter(tx => tx.approval_status === "APPROVED"),
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
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

      {/* Transaction List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Daftar Transaksi</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari invoice atau pelanggan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <LoadingButton
              onClick={handleDownload}
              size="sm"
              isLoading={isExporting}
              loadingText="Mengunduh..."
              disabled={!data}
            >
              <Download className="mr-2 h-4 w-4" />
              Export Excel
            </LoadingButton>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingTransactions ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Pelanggan</TableHead>
                    <TableHead>Paket</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Tidak ada transaksi ditemukan
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTransactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell>
                          {new Date(tx.created_at).toLocaleDateString("id-ID")}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {tx.invoice_code}
                        </TableCell>
                        <TableCell>{tx.customer_name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{tx.package_type}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(tx.total_amount)}
                        </TableCell>
                        <TableCell className="text-center">
                          <StatusBadge status={tx.payment_status} />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
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

const StatusBadge = ({ status }) => {
  const styles = {
    PAID: "bg-green-100 text-green-800 hover:bg-green-100",
    UNPAID: "bg-red-100 text-red-800 hover:bg-red-100",
    PARTIAL: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
  };

  return (
    <Badge className={cn("font-normal", styles[status] || "bg-gray-100 text-gray-800")}>
      {status}
    </Badge>
  );
};
