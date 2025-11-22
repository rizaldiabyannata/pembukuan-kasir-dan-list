import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

function Spinner({
  size = "default",
  className,
  ariaLabel = "Memuat...",
  ...props
}) {
  const sizeClasses = {
    sm: "h-4 w-4",
    default: "h-5 w-5",
    lg: "h-6 w-6",
    xl: "h-8 w-8",
  };

  return (
    <Loader2
      className={cn(
        "animate-spin",
        sizeClasses[size] || sizeClasses.default,
        className
      )}
      role="status"
      aria-label={ariaLabel}
      {...props}
    />
  );
}

export { Spinner };
