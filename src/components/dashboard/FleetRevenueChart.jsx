"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Loader2 } from "lucide-react";

export function FleetRevenueChart({ data, loading }) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Penghasilan per Armada
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
            <TrendingUp className="h-5 w-5 text-green-600" />
            Penghasilan per Armada
          </CardTitle>
          <CardDescription>Tidak ada data yang tersedia</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            Tidak ada data penghasilan untuk periode ini
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);
  const maxRevenue = Math.max(...data.map((item) => item.revenue));
  const minRevenue = Math.min(...data.map((item) => item.revenue));
  const avgRevenue = totalRevenue / data.length;

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(value || 0);
  };

  const formatCompact = (value) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
      notation: "compact",
    }).format(value || 0);
  };

  // Sort data by revenue descending
  const sortedData = [...data].sort((a, b) => b.revenue - a.revenue);
  const topPerformers = sortedData.slice(0, 3);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-green-600" />
          Penghasilan per Armada
        </CardTitle>
        <CardDescription>
          Total penghasilan {formatCompact(totalRevenue)} dari {data.length}{" "}
          armada
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Top 3 Performers */}
          <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="shrink-0">
              <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-green-900">
                Top Performer
              </p>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-lg font-bold text-green-700">
                  {topPerformers[0]?.licensePlate || "-"}
                </p>
                <Badge
                  variant="secondary"
                  className="bg-green-100 text-green-700 shrink-0"
                >
                  {formatCompact(topPerformers[0]?.revenue || 0)}
                </Badge>
              </div>
              <p className="text-xs text-green-700 mt-1">
                {((topPerformers[0]?.revenue / totalRevenue) * 100).toFixed(1)}%
                dari total •{" "}
                {((topPerformers[0]?.revenue / avgRevenue) * 100).toFixed(0)}%
                di atas rata-rata
              </p>
            </div>
          </div>

          {/* All Fleet Revenue Bars */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground">
              Semua Armada
            </h4>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {sortedData.map((item, index) => {
                const percentage = ((item.revenue / maxRevenue) * 100).toFixed(
                  1
                );
                const revenuePercentage = (
                  (item.revenue / totalRevenue) *
                  100
                ).toFixed(1);
                const isTopThree = index < 3;

                return (
                  <div key={item.licensePlate} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-sm font-medium ${
                            isTopThree ? "text-green-700" : "text-gray-700"
                          }`}
                        >
                          {item.licensePlate}
                        </span>
                        {isTopThree && (
                          <Badge
                            variant="outline"
                            className="h-5 px-1.5 text-xs border-green-300 text-green-700"
                          >
                            #{index + 1}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium">
                          {formatCompact(item.revenue)}
                        </span>
                        <span className="text-xs text-muted-foreground min-w-[45px] text-right">
                          {revenuePercentage}%
                        </span>
                      </div>
                    </div>
                    <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`absolute top-0 left-0 h-full transition-all duration-500 ease-out rounded-full ${
                          isTopThree ? "bg-green-600" : "bg-gray-400"
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Summary */}
          <div className="space-y-3 pt-4 border-t">
            {/* Main Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center overflow-hidden">
                <p className="text-xs text-muted-foreground mb-1">Tertinggi</p>
                <p className="text-lg sm:text-xl font-bold text-green-600">
                  {formatCompact(topPerformers[0]?.revenue || 0)}
                </p>
                <p className="text-xs text-green-700 mt-1">
                  {topPerformers[0]?.licensePlate}
                </p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center overflow-hidden">
                <p className="text-xs text-muted-foreground mb-1">Rata-rata</p>
                <p className="text-lg sm:text-xl font-bold text-blue-600">
                  {formatCompact(avgRevenue)}
                </p>
                <p className="text-xs text-blue-700 mt-1">Per armada</p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center overflow-hidden">
                <p className="text-xs text-muted-foreground mb-1">Terendah</p>
                <p className="text-lg sm:text-xl font-bold text-red-600">
                  {formatCompact(minRevenue)}
                </p>
                <p className="text-xs text-red-700 mt-1">
                  {sortedData[sortedData.length - 1]?.licensePlate}
                </p>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-center overflow-hidden">
                <p className="text-xs text-muted-foreground mb-1">Total</p>
                <p className="text-lg sm:text-xl font-bold text-purple-600">
                  {formatCompact(totalRevenue)}
                </p>
                <p className="text-xs text-purple-700 mt-1">
                  {data.length} armada
                </p>
              </div>
            </div>

            {/* Performance Gap Insight */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-xs font-semibold text-amber-700 mb-1">
                Insight Distribusi
              </p>
              <p className="text-sm text-amber-900">
                Gap performa: Armada terbaik menghasilkan{" "}
                <span className="font-bold">{formatCurrency(maxRevenue)}</span>,
                sedangkan armada terendah menghasilkan{" "}
                <span className="font-bold">{formatCurrency(minRevenue)}</span>.
              </p>
              <p className="text-xs text-amber-700 mt-2">
                Selisih: {(maxRevenue / minRevenue - 1).toFixed(1)}x lipat • Top
                3 armada berkontribusi{" "}
                {(
                  (topPerformers.reduce((sum, p) => sum + p.revenue, 0) /
                    totalRevenue) *
                  100
                ).toFixed(1)}
                % dari total pendapatan
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
