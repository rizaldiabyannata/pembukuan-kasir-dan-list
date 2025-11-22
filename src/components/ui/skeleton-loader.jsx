import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

function SkeletonLoader({
  variant = "default",
  className,
  ariaLabel,
  ...props
}) {
  // Generate appropriate aria-label based on variant
  const getAriaLabel = () => {
    if (ariaLabel) return ariaLabel;

    switch (variant) {
      case "card":
        return "Memuat data kartu...";
      case "table-row":
        return "Memuat baris tabel...";
      case "form":
        return "Memuat formulir...";
      case "chart":
        return "Memuat grafik...";
      default:
        return "Memuat konten...";
    }
  };

  const renderSkeleton = () => {
    switch (variant) {
      case "card":
        return (
          <div className="rounded-lg border p-4 space-y-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
            </div>
          </div>
        );

      case "table-row":
        return (
          <div className="flex items-center space-x-4 p-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-8 w-20" />
          </div>
        );

      case "form":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        );

      case "chart":
        return (
          <div className="space-y-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-64 w-full" />
          </div>
        );

      default:
        return <Skeleton className={cn("h-4 w-full", className)} {...props} />;
    }
  };

  return (
    <div
      className={cn("animate-in fade-in duration-200", className)}
      role="status"
      aria-busy="true"
      aria-label={getAriaLabel()}
    >
      {renderSkeleton()}
    </div>
  );
}

export { SkeletonLoader };
