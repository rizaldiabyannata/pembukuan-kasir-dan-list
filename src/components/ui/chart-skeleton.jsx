import * as React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * ChartSkeleton - Skeleton placeholder for chart components during loading
 *
 * @param {string} variant - Chart type variant (bar, line, pie, default)
 * @param {string} className - Additional CSS classes
 * @param {boolean} showStats - Whether to show summary stats skeletons
 */
function ChartSkeleton({
  variant = "default",
  className,
  showStats = false,
  ...props
}) {
  return (
    <Card className={cn(className)} {...props}>
      <CardHeader>
        <Skeleton className="h-6 w-48 mb-2" aria-label="Memuat judul chart" />
        <Skeleton className="h-4 w-64" aria-label="Memuat deskripsi chart" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Chart area skeleton */}
          <div
            className="h-[250px] bg-muted animate-pulse rounded-lg"
            role="status"
            aria-busy="true"
            aria-label="Memuat data chart"
          />

          {/* Stats skeleton (optional) */}
          {showStats && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="border rounded-lg p-4"
                  aria-label={`Memuat statistik ${i + 1}`}
                >
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-8 w-32 mb-1" />
                  <Skeleton className="h-3 w-full" />
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export { ChartSkeleton };
