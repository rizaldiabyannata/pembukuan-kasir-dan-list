import * as React from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

/**
 * LoadingButton - A button component that automatically handles loading states
 * with spinner and disabled state.
 *
 * @param {boolean} isLoading - Whether the button is in loading state
 * @param {string} loadingText - Text to display when loading (optional)
 * @param {React.ReactNode} children - Button content when not loading
 * @param {boolean} disabled - Additional disabled state
 * @param {string} variant - Button variant (default, destructive, outline, etc.)
 * @param {string} size - Button size (default, sm, lg, icon)
 * @param {string} className - Additional CSS classes
 * @param {Function} onClick - Click handler
 * @param {string} type - Button type (button, submit, reset)
 */
function LoadingButton({
  isLoading = false,
  loadingText,
  children,
  disabled = false,
  variant = "default",
  size = "default",
  className,
  onClick,
  type = "button",
  ...props
}) {
  return (
    <Button
      type={type}
      variant={variant}
      size={size}
      disabled={isLoading || disabled}
      onClick={onClick}
      className={cn("transition-all duration-200", className)}
      aria-busy={isLoading}
      {...props}
    >
      <span
        className={cn(
          "inline-flex items-center gap-2 transition-opacity duration-200",
          isLoading ? "opacity-100" : "opacity-0 w-0 overflow-hidden"
        )}
      >
        <Spinner size="sm" />
      </span>
      <span
        className={cn(
          "transition-opacity duration-200",
          isLoading && loadingText ? "opacity-100" : "opacity-0 hidden"
        )}
      >
        {loadingText}
      </span>
      <span
        className={cn(
          "transition-opacity duration-200",
          !isLoading || !loadingText ? "opacity-100" : "opacity-0 hidden"
        )}
      >
        {children}
      </span>
    </Button>
  );
}

export { LoadingButton };
