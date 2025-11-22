import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * CardSkeleton - Skeleton placeholder for card grids (armada, sopir, staff)
 *
 * @param {number} count - Number of skeleton cards to display (default: 6)
 * @param {string} variant - Card variant (default, compact, detailed)
 * @param {string} className - Additional CSS classes
 */
function CardSkeleton({ count = 6, variant = "default", className, ...props }) {
  const renderCardContent = () => {
    switch (variant) {
      case "compact":
        return (
          <div className="space-y-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <div className="flex gap-2 mt-4">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
        );

      case "detailed":
        return (
          <div className="space-y-3">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
            <div className="space-y-2 mt-4">
              <Skeleton className="h-3 w-2/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <div className="flex gap-2 mt-4">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-24" />
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
            </div>
            <div className="flex gap-2 mt-4">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
        );
    }
  };

  return (
    <div
      className={cn(
        "grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 animate-in fade-in duration-200",
        className
      )}
      role="status"
      aria-label="Memuat data kartu..."
      aria-busy="true"
      {...props}
    >
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={`card-skeleton-${index}`}
          className="rounded-lg border p-4 bg-card animate-in fade-in duration-200"
          style={{
            animationDelay: `${index * 50}ms`,
          }}
        >
          {renderCardContent()}
        </div>
      ))}
    </div>
  );
}

export { CardSkeleton };
