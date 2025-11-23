"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Shield,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Activity,
  Users,
  FileText,
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";

export default function AuditLogPage() {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalCount: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });

  // Filters
  const [actionFilter, setActionFilter] = useState("ALL");
  const [resourceFilter, setResourceFilter] = useState("ALL");
  const [dateRange, setDateRange] = useState({
    from: undefined,
    to: undefined,
  });

  const fetchAuditLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      // Build query params
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
      });

      if (actionFilter !== "ALL") params.append("action", actionFilter);
      if (resourceFilter !== "ALL") params.append("resource", resourceFilter);
      if (dateRange.from) params.append("from", dateRange.from.toISOString());
      if (dateRange.to) params.append("to", dateRange.to.toISOString());

      // Fetch logs
      const logsRes = await fetch(`/api/audit-logs?${params.toString()}`);
      const logsData = await logsRes.json();

      if (logsData.success) {
        setLogs(logsData.data.logs);
        setPagination(logsData.data.pagination);
      }

      // Fetch stats (only if filters change or first load)
      const statsRes = await fetch(`/api/audit-logs/stats?${params.toString()}`);
      const statsData = await statsRes.json();

      if (statsData.success) {
        setStats(statsData.data);
      }
    } catch (error) {
      console.error("Failed to fetch audit logs:", error);
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.limit, actionFilter, resourceFilter, dateRange]);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  const handlePageChange = (newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const resetFilters = () => {
    setActionFilter("ALL");
    setResourceFilter("ALL");
    setDateRange({ from: undefined, to: undefined });
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const formatTimestamp = (timestamp) => {
    return format(new Date(timestamp), "dd MMM yyyy HH:mm:ss", { locale: id });
  };

  const ACTION_COLORS = {
    CREATE: "bg-green-100 text-green-800",
    UPDATE: "bg-blue-100 text-blue-800",
    DELETE: "bg-red-100 text-red-800",
    LOGIN: "bg-purple-100 text-purple-800",
    LOGOUT: "bg-gray-100 text-gray-800",
    COMPLETE: "bg-teal-100 text-teal-800",
  };

  const ACTION_LABELS = {
    CREATE: "Buat",
    UPDATE: "Update",
    DELETE: "Hapus",
    LOGIN: "Login",
    LOGOUT: "Logout",
    COMPLETE: "Selesai",
  };

  return (
    <div className="flex flex-col h-screen">
      <PageHeader
        title="Audit Log"
        description="Log aktivitas sistem untuk monitoring dan keamanan."
      />

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-6 space-y-6">
        {/* Statistics Cards */}
        {stats && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Log</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalLogs}</div>
                <p className="text-xs text-muted-foreground">
                  Aktivitas tercatat
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Pengguna Aktif
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.uniqueUsers}</div>
                <p className="text-xs text-muted-foreground">
                  User yang melakukan aktivitas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Operasi Terbanyak
                </CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Object.keys(stats.byAction).length > 0
                    ? Object.entries(stats.byAction).sort(
                        (a, b) => b[1] - a[1]
                      )[0][0]
                    : "-"}
                </div>
                <p className="text-xs text-muted-foreground">
                  {Object.keys(stats.byAction).length > 0
                    ? `${Object.entries(stats.byAction).sort((a, b) => b[1] - a[1])[0][1]} kali`
                    : "Tidak ada data"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Resource Terbanyak
                </CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Object.keys(stats.byResource).length > 0
                    ? Object.entries(stats.byResource).sort(
                        (a, b) => b[1] - a[1]
                      )[0][0]
                    : "-"}
                </div>
                <p className="text-xs text-muted-foreground">
                  {Object.keys(stats.byResource).length > 0
                    ? `${Object.entries(stats.byResource).sort((a, b) => b[1] - a[1])[0][1]} kali`
                    : "Tidak ada data"}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Semua Aksi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua Aksi</SelectItem>
                  <SelectItem value="CREATE">Buat</SelectItem>
                  <SelectItem value="UPDATE">Update</SelectItem>
                  <SelectItem value="DELETE">Hapus</SelectItem>
                  <SelectItem value="LOGIN">Login</SelectItem>
                  <SelectItem value="LOGOUT">Logout</SelectItem>
                  <SelectItem value="COMPLETE">Selesai</SelectItem>
                </SelectContent>
              </Select>

              <Select value={resourceFilter} onValueChange={setResourceFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Semua Resource" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua Resource</SelectItem>
                  <SelectItem value="Transaction">Transaksi</SelectItem>
                  <SelectItem value="Armada">Armada</SelectItem>
                  <SelectItem value="Driver">Sopir</SelectItem>
                  <SelectItem value="User">User</SelectItem>
                  <SelectItem value="Expense">Pengeluaran</SelectItem>
                  <SelectItem value="Staff">Staff</SelectItem>
                </SelectContent>
              </Select>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[280px] justify-start text-left font-normal",
                      !dateRange.from && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "dd MMM yyyy", {
                            locale: id,
                          })}{" "}
                          -{" "}
                          {format(dateRange.to, "dd MMM yyyy", { locale: id })}
                        </>
                      ) : (
                        format(dateRange.from, "dd MMM yyyy", { locale: id })
                      )
                    ) : (
                      <span>Pilih rentang tanggal</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                    locale={id}
                  />
                </PopoverContent>
              </Popover>

              <Button variant="outline" onClick={resetFilters}>
                Reset Filter
              </Button>

              <Button onClick={fetchAuditLogs}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Audit Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle>Log Aktivitas</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Memuat data...
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Tidak ada data audit log
              </div>
            ) : (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Waktu</TableHead>
                        <TableHead>Aksi</TableHead>
                        <TableHead>Resource</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Deskripsi</TableHead>
                        <TableHead>IP Address</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="text-xs">
                            {formatTimestamp(log.createdAt)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={`${ACTION_COLORS[log.action] || "bg-gray-100 text-gray-800"}`}
                            >
                              {ACTION_LABELS[log.action] || log.action}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{log.resource}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div className="font-medium">
                                {log.user?.name || "-"}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                @{log.user?.username || "system"}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-md">
                            <div className="text-sm truncate">
                              {log.description}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {log.ipAddress || "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Menampilkan {(pagination.page - 1) * pagination.limit + 1} -{" "}
                    {Math.min(
                      pagination.page * pagination.limit,
                      pagination.totalCount
                    )}{" "}
                    dari {pagination.totalCount} log
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={!pagination.hasPrevPage}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Sebelumnya
                    </Button>
                    <div className="text-sm">
                      Halaman {pagination.page} dari {pagination.totalPages}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={!pagination.hasNextPage}
                    >
                      Selanjutnya
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
