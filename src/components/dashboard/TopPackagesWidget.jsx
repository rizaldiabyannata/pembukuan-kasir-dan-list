"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, TrendingUp, Loader2, PieChart } from "lucide-react";
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const PACKAGE_TYPE_LABELS = {
   CAR_RENTAL: "Sewa Mobil",
   TOUR_PACKAGE: "Paket Tour",
   FULL_DAY_TRIP: "Full Day Trip",
};

const PACKAGE_TYPE_COLORS = {
  CAR_RENTAL: "bg-blue-100 text-blue-800",
  TOUR_PACKAGE: "bg-green-100 text-green-800",
  FULL_DAY_TRIP: "bg-purple-100 text-purple-800",
};

export function TopPackagesWidget({ incomeData, loading }) {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(value || 0);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Paket Terlaris
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="space-y-1">
                  <div className="h-4 bg-muted animate-pulse rounded w-32"></div>
                  <div className="h-3 bg-muted animate-pulse rounded w-20"></div>
                </div>
                <div className="h-6 bg-muted animate-pulse rounded w-24"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!incomeData?.incomeByPackage || incomeData.incomeByPackage.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Paket Terlaris
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Belum ada data paket</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Get top 5 packages by revenue
  const topPackages = incomeData.incomeByPackage.slice(0, 5);
  const totalRevenue = topPackages.reduce(
    (sum, pkg) => sum + pkg.totalRevenue,
    0
  );

  // Colors for pie chart - using consistent color palette
  const chartColors = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
  ];

  // Prepare data for recharts
  const chartData = topPackages.map((pkg, index) => ({
    name: pkg.packageName,
    value: pkg.totalRevenue,
    percentage: ((pkg.totalRevenue / totalRevenue) * 100).toFixed(1),
    packageType: pkg.packageType,
    transactionCount: pkg.transactionCount,
    color: chartColors[index % chartColors.length],
  }));

  // Chart config for shadcn
  const chartConfig = chartData.reduce((config, item, index) => {
    config[`segment${index}`] = {
      label: item.name,
      color: item.color,
    };
    return config;
  }, {});

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChart className="h-5 w-5 text-primary" />
          Top 5 Paket Jasa Terlaris
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Pie Chart */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative">
              <ChartContainer
                config={chartConfig}
                className="mx-auto aspect-square max-h-[200px]"
              >
                <RechartsPieChart>
                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent
                        hideLabel
                        formatter={(value, name, props) => [
                          `${formatCurrency(value)} (${props.payload.percentage}%)`,
                          props.payload.name,
                        ]}
                      />
                    }
                  />
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </RechartsPieChart>
              </ChartContainer>

              {/* Center text */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-xs text-muted-foreground">Total</div>
                  <div className="text-lg font-bold">
                    {formatCurrency(totalRevenue)}
                  </div>
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="mt-4 space-y-2 w-full">
              {chartData.map((item, index) => (
                <div
                  key={item.name}
                  className="flex items-center gap-2 text-xs"
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="font-medium flex-1 truncate">
                    {item.name}
                  </span>
                  <span className="text-muted-foreground">
                    {item.percentage}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* List View */}
          <div className="space-y-3">
            {topPackages.map((pkg, index) => (
              <div
                key={pkg.packageId}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full shrink-0"
                    style={{
                      backgroundColor: chartColors[index % chartColors.length],
                    }}
                  />
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold shrink-0">
                    {index + 1}
                  </div>
                  <div className="space-y-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      {pkg.packageName}
                    </div>
                    <Badge
                      variant="secondary"
                      className={`text-[10px] px-1.5 py-0.5 font-normal ${
                        PACKAGE_TYPE_COLORS[pkg.packageType]
                      }`}
                    >
                      {PACKAGE_TYPE_LABELS[pkg.packageType]}
                    </Badge>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-semibold text-sm">
                    {formatCurrency(pkg.totalRevenue)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {pkg.transactionCount} transaksi
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {incomeData.summary && (
          <div className="mt-6 pt-4 border-t">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">
                  {incomeData.summary.totalPackages}
                </div>
                <div className="text-xs text-muted-foreground">Total Paket</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">
                  {formatCurrency(incomeData.summary.totalRevenue)}
                </div>
                <div className="text-xs text-muted-foreground">
                  Total Pemasukan
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
