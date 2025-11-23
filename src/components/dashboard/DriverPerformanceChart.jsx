"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TrendingUp, Users, Clock, DollarSign, Loader2 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export function DriverPerformanceChart({ data, loading, period }) {
  console.log("DriverPerformanceChart - data:", data);
  console.log("DriverPerformanceChart - period:", period);
  console.log("DriverPerformanceChart - loading:", loading);

  const [selectedMetric, setSelectedMetric] = React.useState("tripCount");
  const [selectedDrivers, setSelectedDrivers] = React.useState([]);

  React.useEffect(() => {
    // Auto-select all drivers if none selected
    if (data?.driverPerformance && selectedDrivers.length === 0) {
      setSelectedDrivers(data.driverPerformance.map((d) => d.driverId));
    }
  }, [data, selectedDrivers.length]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Performa Sopir
          </CardTitle>
          <CardDescription>Memuat data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] bg-muted animate-pulse rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  if (!data || !data.driverPerformance || data.driverPerformance.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Performa Sopir
          </CardTitle>
          <CardDescription>
            Tidak ada data performa sopir yang tersedia
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] flex items-center justify-center text-muted-foreground">
            Tidak ada data performa sopir untuk periode ini
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(value || 0);
  };

  const formatPercentage = (value) => {
    return `${(value || 0).toFixed(1)}%`;
  };

  // Filter data based on selected drivers
  const filteredData = data.driverPerformance.filter((driver) =>
    selectedDrivers.includes(driver.driverId)
  );

  // Prepare chart data based on selected metric
  const chartData = filteredData.map((driver) => ({
    name:
      driver.driverName.length > 15
        ? driver.driverName.substring(0, 15) + "..."
        : driver.driverName,
    fullName: driver.driverName,
    tripCount: driver.tripCount,
    onTimeRate: Math.round(driver.onTimeRate),
    totalIncome: driver.totalIncome,
  }));

  // Sort by selected metric
  chartData.sort((a, b) => {
    if (selectedMetric === "onTimeRate") {
      return b[selectedMetric] - a[selectedMetric];
    }
    return b[selectedMetric] - a[selectedMetric];
  });

  const getMetricLabel = (metric) => {
    switch (metric) {
      case "tripCount":
        return "Jumlah Perjalanan";
      case "onTimeRate":
        return "Tepat Waktu (%)";
      case "totalIncome":
        return "Pendapatan Total";
      default:
        return metric;
    }
  };

  const getMetricIcon = (metric) => {
    switch (metric) {
      case "tripCount":
        return <TrendingUp className="h-4 w-4" />;
      case "onTimeRate":
        return <Clock className="h-4 w-4" />;
      case "totalIncome":
        return <DollarSign className="h-4 w-4" />;
      default:
        return <TrendingUp className="h-4 w-4" />;
    }
  };

  const getMetricColor = (metric) => {
    switch (metric) {
      case "tripCount":
        return "#3b82f6"; // blue
      case "onTimeRate":
        return "#10b981"; // green
      case "totalIncome":
        return "#f59e0b"; // amber
      default:
        return "#3b82f6";
    }
  };

  // Calculate summary stats
  const totalTrips = filteredData.reduce((sum, d) => sum + d.tripCount, 0);
  const avgOnTimeRate =
    filteredData.length > 0
      ? filteredData.reduce((sum, d) => sum + d.onTimeRate, 0) /
        filteredData.length
      : 0;
  const totalIncome = filteredData.reduce((sum, d) => sum + d.totalIncome, 0);

  const topPerformer = filteredData.reduce(
    (max, driver) => (driver.tripCount > max.tripCount ? driver : max),
    filteredData[0] || {}
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Performa Sopir
        </CardTitle>
        <CardDescription className="flex items-center gap-4">
          <span>Analisis performa {filteredData.length} sopir</span>
          <div className="flex items-center gap-2">
            <Select value={selectedMetric} onValueChange={setSelectedMetric}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Pilih metrik" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tripCount">Jumlah Perjalanan</SelectItem>
                <SelectItem value="onTimeRate">Tepat Waktu (%)</SelectItem>
                <SelectItem value="totalIncome">Pendapatan Total</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Chart */}
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => {
                    if (selectedMetric === "totalIncome") {
                      return formatCurrency(value).replace("Rp", "").trim();
                    } else if (selectedMetric === "onTimeRate") {
                      return `${value}%`;
                    }
                    return value;
                  }}
                />
                <Tooltip
                  cursor={{ fill: "rgba(0,0,0,0.05)" }}
                  formatter={(value, name) => {
                    if (selectedMetric === "totalIncome") {
                      return [
                        formatCurrency(value),
                        getMetricLabel(selectedMetric),
                      ];
                    } else if (selectedMetric === "onTimeRate") {
                      return [`${value}%`, getMetricLabel(selectedMetric)];
                    }
                    return [value, getMetricLabel(selectedMetric)];
                  }}
                  labelFormatter={(label) => {
                    const driver = chartData.find((d) => d.name === label);
                    return driver ? driver.fullName : label;
                  }}
                />
                <Bar
                  dataKey={selectedMetric}
                  fill={getMetricColor(selectedMetric)}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={50}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-card border rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Total Perjalanan
                </p>
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <p className="text-2xl font-bold text-primary">{totalTrips}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {filteredData.length} sopir • Rata-rata{" "}
                {(totalTrips / Math.max(filteredData.length, 1)).toFixed(1)}{" "}
                perjalanan
              </p>
            </div>

            <div className="bg-card border rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Tepat Waktu Rata-rata
                </p>
                <Clock className="h-4 w-4 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-green-600">
                {formatPercentage(avgOnTimeRate)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Target: ≥ 90% untuk performa optimal
              </p>
            </div>

            <div className="bg-card border rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Total Pendapatan
                </p>
                <DollarSign className="h-4 w-4 text-amber-600" />
              </div>
              <p className="text-2xl font-bold text-amber-600">
                {formatCurrency(totalIncome)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Rata-rata{" "}
                {formatCurrency(totalIncome / Math.max(filteredData.length, 1))}{" "}
                per sopir
              </p>
            </div>
          </div>

          {/* Top Performer Highlight */}
          {topPerformer && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="shrink-0">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                    <Users className="h-6 w-6 text-primary-foreground" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-primary">
                    Top Performer
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-lg font-bold text-foreground">
                      {topPerformer.driverName}
                    </p>
                    <Badge variant="secondary">
                      {topPerformer.tripCount} perjalanan
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatPercentage(topPerformer.onTimeRate)} tepat waktu •{" "}
                    {formatCurrency(topPerformer.totalIncome)} pendapatan
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Performance Insights */}
          <div className="bg-muted/50 border rounded-lg p-4">
            <p className="text-sm font-semibold mb-2">💡 Insight Performa</p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                <span className="font-medium text-foreground">
                  Distribusi Perjalanan:
                </span>{" "}
                {filteredData.filter((d) => d.tripCount > 0).length} dari{" "}
                {filteredData.length} sopir aktif dalam periode ini.
              </p>
              <p>
                <span className="font-medium text-foreground">
                  Tingkat Ketepatan:
                </span>{" "}
                {avgOnTimeRate >= 90
                  ? "Baik"
                  : avgOnTimeRate >= 75
                    ? "Cukup"
                    : "Perlu Perbaikan"}{" "}
                ({formatPercentage(avgOnTimeRate)})
              </p>
              <p>
                <span className="font-medium text-foreground">
                  Rekomendasi:
                </span>{" "}
                Fokus pada sopir dengan performa di bawah rata-rata untuk
                meningkatkan efisiensi operasional.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
