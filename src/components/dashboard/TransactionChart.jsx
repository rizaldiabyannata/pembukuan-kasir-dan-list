"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TrendingUp, Loader2 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export function TransactionChart({ data, period, loading }) {
  console.log("TransactionChart - data:", data);
  console.log("TransactionChart - period:", period);
  console.log("TransactionChart - loading:", loading);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Tren Transaksi
          </CardTitle>
          <CardDescription>Memuat data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] bg-muted animate-pulse rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Tren Transaksi
          </CardTitle>
          <CardDescription>Tidak ada data yang tersedia</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            Tidak ada data transaksi untuk periode ini
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
      notation: "compact",
    }).format(value || 0);
  };

  const getPeriodLabel = () => {
    if (period === "today") return "per Jam";
    if (period === "month") return "per Hari";
    return "per Bulan";
  };

  const totalTransactions = data.reduce((sum, d) => sum + d.count, 0);
  const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);
  const avgTransaction = totalRevenue / totalTransactions;
  const avgPerPeriod = totalTransactions / data.length;

  // Find peak performance
  const peakDay = data.reduce(
    (max, d) => (d.count > max.count ? d : max),
    data[0]
  );
  const lowestDay = data.reduce(
    (min, d) => (d.count < min.count ? d : min),
    data[0]
  );

  // Calculate trend (comparing first half vs second half)
  const midpoint = Math.floor(data.length / 2);
  const firstHalf = data.slice(0, midpoint);
  const secondHalf = data.slice(midpoint);

  const firstHalfAvg =
    firstHalf.length > 0
      ? firstHalf.reduce((sum, d) => sum + d.count, 0) / firstHalf.length
      : 0;
  const secondHalfAvg =
    secondHalf.length > 0
      ? secondHalf.reduce((sum, d) => sum + d.count, 0) / secondHalf.length
      : 0;

  const trendPercentage =
    firstHalfAvg > 0
      ? (((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100).toFixed(1)
      : secondHalfAvg > 0
      ? "100.0"
      : "0.0";

  const isGrowing = secondHalfAvg > firstHalfAvg;

  // Prepare data for Recharts
  const chartData = data.map((item) => ({
    ...item,
    dateLabel:
      period === "today"
        ? item.date.split(":")[0] + ":00"
        : period === "month"
        ? item.date.split("-").pop()
        : item.date,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          Tren Transaksi
        </CardTitle>
        <CardDescription className="flex items-center gap-2">
          <span>Statistik transaksi {getPeriodLabel().toLowerCase()}</span>
          {data.length > 3 && (
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                isGrowing
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {isGrowing ? "↑" : "↓"} {Math.abs(parseFloat(trendPercentage))}%
              trend
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Recharts Bar Chart */}
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="dateLabel"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                />
                <YAxis
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => value}
                />
                <Tooltip
                  cursor={{ fill: "rgba(0,0,0,0.05)" }}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-popover border rounded-lg shadow-lg p-3 text-sm">
                          <div className="font-semibold mb-1">{data.date}</div>
                          <div className="flex justify-between gap-4">
                            <span className="text-muted-foreground">
                              Transaksi:
                            </span>
                            <span className="font-medium">{data.count}</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-muted-foreground">
                              Pendapatan:
                            </span>
                            <span className="font-medium">
                              {formatCurrency(data.revenue)}
                            </span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="count"
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={50}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Summary Stats */}
          <div className="space-y-4">
            {/* Main Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 overflow-hidden">
                <div className="flex items-center justify-between mb-2 gap-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    Total Transaksi
                  </p>
                  <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium shrink-0">
                    {getPeriodLabel()}
                  </span>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-blue-600">
                  {totalTransactions}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Rata-rata {avgPerPeriod.toFixed(1)} transaksi{" "}
                  {getPeriodLabel().toLowerCase()}
                </p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4 overflow-hidden">
                <div className="flex items-center justify-between mb-2 gap-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    Total Pendapatan
                  </p>
                  <TrendingUp className="h-4 w-4 text-green-600 shrink-0" />
                </div>
                <p className="text-xl sm:text-2xl font-bold text-green-600">
                  {formatCurrency(totalRevenue)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Rata-rata {formatCurrency(avgTransaction)} per transaksi
                </p>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 overflow-hidden">
                <div className="flex items-center justify-between mb-2 gap-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    Puncak Transaksi
                  </p>
                  <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full font-medium shrink-0">
                    Tertinggi
                  </span>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-purple-600">
                  {peakDay.count}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Pada {peakDay.date} • {formatCurrency(peakDay.revenue)}
                </p>
              </div>
            </div>

            {/* Performance Insight */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-xs font-semibold text-amber-700">
                      📊 Analisis Trend
                    </p>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        isGrowing
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {isGrowing ? "↑ Naik" : "↓ Turun"}{" "}
                      {Math.abs(parseFloat(trendPercentage))}%
                    </span>
                  </div>
                  <p className="text-sm text-amber-900 mb-2">
                    <span className="font-bold">
                      Performa {isGrowing ? "meningkat" : "menurun"}
                    </span>
                    : Rata-rata paruh pertama periode{" "}
                    <span className="font-bold">
                      {firstHalfAvg.toFixed(1)} transaksi
                    </span>
                    , paruh kedua{" "}
                    <span className="font-bold">
                      {secondHalfAvg.toFixed(1)} transaksi
                    </span>
                    ({isGrowing ? "+" : ""}
                    {trendPercentage}%).
                  </p>
                  <p className="text-sm text-amber-900">
                    <span className="font-bold">Peak & Low</span>: Tertinggi
                    pada <span className="font-bold">{peakDay.date}</span>{" "}
                    dengan {peakDay.count} transaksi (
                    {formatCurrency(peakDay.revenue)}). Terendah pada{" "}
                    <span className="font-bold">{lowestDay.date}</span> dengan{" "}
                    {lowestDay.count} transaksi.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
