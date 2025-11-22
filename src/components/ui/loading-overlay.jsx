import * as React from "react";
import { Spinner } from "./spinner";
import { cn } from "@/lib/utils";

function LoadingOverlay({
  isVisible,
  message = "Memproses...",
  className = "",
  spinnerSize = "md",
  ...props
}) {
  const [shouldRender, setShouldRender] = React.useState(isVisible);
  const [isAnimating, setIsAnimating] = React.useState(false);

  React.useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
      // Small delay to trigger animation
      requestAnimationFrame(() => {
        setIsAnimating(true);
      });
    } else {
      setIsAnimating(false);
      // Wait for fade-out animation to complete (150ms)
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  if (!shouldRender) return null;

  return (
    <div
      className={cn(
        "absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm rounded-lg border",
        "transition-opacity duration-150",
        isAnimating ? "opacity-100" : "opacity-0",
        className
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={message}
      {...props}
    >
      <Spinner size={spinnerSize} className="mb-2" />
      <p
        className="text-sm text-muted-foreground font-medium"
        aria-hidden="true"
      >
        {message}
      </p>
    </div>
  );
}

export { LoadingOverlay };
