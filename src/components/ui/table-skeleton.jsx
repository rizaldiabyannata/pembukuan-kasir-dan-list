import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * TableSkeleton - Skeleton placeholder for table rows during data fetching
 *
 * @param {number} rows - Number of skeleton rows to display (default: 5)
 * @param {number} columns - Number of columns per row (default: 6)
 * @param {boolean} showHeader - Whether to show header skeleton (default: true)
 * @param {string} className - Additional CSS classes
 */
function TableSkeleton({
  rows = 5,
  columns = 6,
  showHeader = true,
  className,
  ...props
}) {
  return (
    <div
      className={cn("w-full", className)}
      role="status"
      aria-label="Memuat data tabel..."
      aria-busy="true"
      {...props}
    >
      {/* Header skeleton */}
      {showHeader && (
        <div className="flex items-center space-x-4 p-4 border-b bg-muted/50">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton
              key={`header-${colIndex}`}
              className={cn(
                "h-4",
                colIndex === 0
                  ? "w-24"
                  : colIndex === columns - 1
                    ? "w-20"
                    : "w-32"
              )}
            />
          ))}
        </div>
      )}

      {/* Body skeleton rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={`row-${rowIndex}`}
          className="flex items-center space-x-4 p-4 border-b"
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton
              key={`cell-${rowIndex}-${colIndex}`}
              className={cn(
                "h-4",
                colIndex === 0
                  ? "w-24"
                  : colIndex === columns - 1
                    ? "w-20"
                    : "w-32"
              )}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export { TableSkeleton };
