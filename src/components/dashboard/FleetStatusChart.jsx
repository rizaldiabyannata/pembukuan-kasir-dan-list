"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Car, Loader2 } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

export function FleetStatusChart({ data, loading }) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Status Armada
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
            <Car className="h-5 w-5 text-purple-600" />
            Status Armada
          </CardTitle>
          <CardDescription>Tidak ada data yang tersedia</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            Tidak ada data armada untuk periode ini
          </div>
        </CardContent>
      </Card>
    );
  }

  const statusConfig = {
    READY: {
      label: "Siap",
      description: "Siap untuk booking",
      color: "bg-green-500",
      lightColor: "bg-green-50",
      textColor: "text-green-700",
      borderColor: "border-green-200",
    },
    BOOKED: {
      label: "Dipesan",
      description: "Sudah dipesan customer",
      color: "bg-yellow-500",
      lightColor: "bg-yellow-50",
      textColor: "text-yellow-700",
      borderColor: "border-yellow-200",
    },
    ON_TRIP: {
      label: "Sedang Jalan",
      description: "Sedang dalam perjalanan",
      color: "bg-blue-500",
      lightColor: "bg-blue-50",
      textColor: "text-blue-700",
      borderColor: "border-blue-200",
    },
    MAINTENANCE: {
      label: "Perawatan",
      description: "Dalam perbaikan/service",
      color: "bg-red-500",
      lightColor: "bg-red-50",
      textColor: "text-red-700",
      borderColor: "border-red-200",
    },
  };

  // Chart configuration for shadcn charts
  const chartConfig = {
    READY: {
      label: "Siap",
      color: "#10b981", // Explicit green
    },
    BOOKED: {
      label: "Dipesan",
      color: "#f59e0b", // Explicit yellow
    },
    ON_TRIP: {
      label: "Sedang Jalan",
      color: "#3b82f6", // Explicit blue
    },
    MAINTENANCE: {
      label: "Perawatan",
      color: "#ef4444", // Explicit red
    },
  };

  const total = data.reduce((sum, item) => sum + item.count, 0);
  const activeFleets =
    (data.find((d) => d.status === "ON_TRIP")?.count || 0) +
    (data.find((d) => d.status === "BOOKED")?.count || 0);
  const availableFleets = data.find((d) => d.status === "READY")?.count || 0;
  const utilization = total > 0 ? ((activeFleets / total) * 100).toFixed(1) : 0;

  // Prepare data for pie chart
  const pieChartData = data.map((item) => ({
    name: item.status,
    value: item.count,
    label: statusConfig[item.status]?.label || item.status,
    fill: chartConfig[item.status]?.color || "hsl(var(--muted))",
  }));

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Car className="h-5 w-5 text-primary" />
          Status Armada
        </CardTitle>
        <CardDescription>Distribusi status {total} armada</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Pie Chart Visualization */}
          <div className="flex items-center justify-center">
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, value, percent }) => {
                      const config = statusConfig[name];
                      return `${config?.label || name}: ${value} (${(
                        percent * 100
                      ).toFixed(0)}%)`;
                    }}
                    labelLine={true}
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value, name) => [
                          `${value} unit`,
                          statusConfig[name]?.label || name,
                        ]}
                      />
                    }
                  />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>

          {/* Progress Bars */}
          <div className="space-y-4">
            {data.map((item) => {
              const config = statusConfig[item.status] || statusConfig.READY;
              const percentage = ((item.count / total) * 100).toFixed(1);

              return (
                <div key={item.status} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${config.color}`} />
                      <div>
                        <span className="text-sm font-medium block">
                          {config.label}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {config.description}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">
                        {percentage}%
                      </span>
                      <Badge variant="secondary" className="font-semibold">
                        {item.count} unit
                      </Badge>
                    </div>
                  </div>
                  <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`absolute top-0 left-0 h-full ${config.color} transition-all duration-500 ease-out rounded-full`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t">
            <div
              className={`p-4 rounded-lg border bg-card text-card-foreground shadow-sm`}
            >
              <div className="flex items-center justify-between mb-2 gap-2">
                <p className="text-xs font-medium text-muted-foreground">
                  Tersedia
                </p>
                <Badge
                  variant="outline"
                  className={`text-xs ${statusConfig.READY.textColor} bg-background shrink-0`}
                >
                  Ready
                </Badge>
              </div>
              <p
                className={`text-xl sm:text-2xl font-bold ${statusConfig.READY.textColor}`}
              >
                {availableFleets}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {total > 0 ? ((availableFleets / total) * 100).toFixed(1) : 0}%
                dari total armada
              </p>
            </div>

            <div
              className={`p-4 rounded-lg border bg-card text-card-foreground shadow-sm`}
            >
              <div className="flex items-center justify-between mb-2 gap-2">
                <p className="text-xs font-medium text-muted-foreground">
                  Aktif
                </p>
                <Badge
                  variant="outline"
                  className={`text-xs ${statusConfig.ON_TRIP.textColor} bg-background shrink-0`}
                >
                  Produktif
                </Badge>
              </div>
              <p
                className={`text-xl sm:text-2xl font-bold ${statusConfig.ON_TRIP.textColor}`}
              >
                {activeFleets}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Sedang beroperasi atau dipesan
              </p>
            </div>

            <div
              className={`p-4 rounded-lg border bg-card text-card-foreground shadow-sm`}
            >
              <div className="flex items-center justify-between mb-2 gap-2">
                <p className="text-xs font-medium text-muted-foreground">
                  Utilisasi
                </p>
                <Badge
                  variant="outline"
                  className={`text-xs bg-background shrink-0 ${
                    utilization >= 70
                      ? "text-green-700 border-green-300"
                      : utilization >= 50
                        ? "text-yellow-700 border-yellow-300"
                        : "text-red-700 border-red-300"
                  }`}
                >
                  {utilization >= 70
                    ? "Optimal"
                    : utilization >= 50
                      ? "Normal"
                      : "Rendah"}
                </Badge>
              </div>
              <p
                className={`text-xl sm:text-2xl font-bold ${
                  utilization >= 70
                    ? "text-green-700"
                    : utilization >= 50
                      ? "text-yellow-700"
                      : "text-red-700"
                }`}
              >
                {utilization}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {utilization >= 70
                  ? "Sangat baik"
                  : utilization >= 50
                    ? "Cukup baik"
                    : "Perlu ditingkatkan"}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
