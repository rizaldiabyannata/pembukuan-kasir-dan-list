"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Car,
  Loader2,
} from "lucide-react";
import { useUser } from "@/hooks/useUser";

export function DashboardStats({ stats, loading }) {
  const { user } = useUser();
  console.log("DashboardStats - stats:", stats);
  console.log("DashboardStats - loading:", loading);
  console.log("DashboardStats - user role:", user?.role);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Loading...</CardTitle>
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(value || 0);
  };

  const formatCompact = (value) => {
    if (value >= 1000000000) {
      return `Rp ${(value / 1000000000).toFixed(1)} M`;
    } else if (value >= 1000000) {
      return `Rp ${(value / 1000000).toFixed(1)} jt`;
    } else if (value >= 1000) {
      return `Rp ${(value / 1000).toFixed(1)} rb`;
    }
    return formatCurrency(value);
  };

  // Calculate additional metrics
  const totalCosts = (stats?.totalRevenue || 0) - (stats?.grossProfit || 0);
  const profitMargin =
    stats?.totalRevenue > 0
      ? ((stats?.grossProfit / stats?.totalRevenue) * 100).toFixed(1)
      : 0;
  const avgRevenuePerTransaction =
    stats?.transactionCount > 0
      ? stats?.totalRevenue / stats?.transactionCount
      : 0;

  const statCards = [
    {
      title: "Total Pemasukan",
      value: formatCurrency(stats?.totalRevenue),
      icon: DollarSign,
      description: `${stats?.transactionCount || 0} transaksi`,
      detail: `Rata-rata ${formatCompact(avgRevenuePerTransaction)}/transaksi`,
      color: "text-green-600",
      bgColor: "bg-green-100",
      trend: stats?.totalRevenue > 0 ? "+100%" : "0%",
    },
    {
      title: "Laba Kotor",
      value: formatCurrency(stats?.grossProfit),
      icon: TrendingUp,
      description: `Margin: ${profitMargin}%`,
      detail: `Biaya operasional ${formatCompact(totalCosts)}`,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      trend: profitMargin > 0 ? `+${profitMargin}%` : "0%",
    },
    {
      title: "Total Transaksi",
      value: stats?.transactionCount || 0,
      icon: ShoppingCart,
      description: `Dari ${stats?.fleetCount || 0} armada`,
      detail:
        stats?.transactionCount > 0
          ? `${(stats?.transactionCount / (stats?.fleetCount || 1)).toFixed(
              1
            )} transaksi/armada`
          : "Belum ada transaksi",
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      trend: stats?.transactionCount > 0 ? "Aktif" : "Idle",
    },
    {
      title: "Total Armada",
      value: stats?.fleetCount || 0,
      icon: Car,
      description: `Status: ${stats?.fleetStatus?.length || 0} kategori`,
      detail: `Utilisasi ${stats?.transactionCount > 0 ? "tinggi" : "rendah"}`,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      trend: stats?.fleetCount > 0 ? "Tersedia" : "Kosong",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statCards
        .filter((stat) => {
          // Hide "Total Pemasukan" and "Laba Kotor" from OPERATOR
          if (user?.role === "OPERATOR") {
            return (
              stat.title !== "Total Pemasukan" && stat.title !== "Laba Kotor"
            );
          }
          return true;
        })
        .map((stat) => (
          <Card
            key={stat.title}
            className="hover:shadow-md transition-shadow overflow-hidden"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium pr-2">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor} shrink-0`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="text-2xl font-bold wrap-break-word">
                {stat.value}
              </div>
              <p className="text-xs text-muted-foreground wrap-break-word">
                {stat.description}
              </p>
              <p className="text-xs font-medium text-muted-foreground wrap-break-word mt-1">
                {stat.detail}
              </p>
            </CardContent>
          </Card>
        ))}
    </div>
  );
}
