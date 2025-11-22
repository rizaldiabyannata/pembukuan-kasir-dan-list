import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * FadeInContent - Wrapper component that fades in content when it loads
 * Provides smooth transition from skeleton to actual content
 *
 * @param {boolean} isLoading - Whether content is still loading
 * @param {React.ReactNode} children - Content to fade in
 * @param {React.ReactNode} skeleton - Skeleton component to show while loading
 * @param {string} className - Additional CSS classes
 * @param {number} delay - Delay before fade-in starts (in ms)
 */
function FadeInContent({
  isLoading = false,
  children,
  skeleton = null,
  className,
  delay = 0,
  ...props
}) {
  const [shouldShowContent, setShouldShowContent] = React.useState(!isLoading);
  const [isAnimating, setIsAnimating] = React.useState(false);

  React.useEffect(() => {
    if (!isLoading) {
      // Wait for delay, then start fade-in animation
      const delayTimer = setTimeout(() => {
        setShouldShowContent(true);
        requestAnimationFrame(() => {
          setIsAnimating(true);
        });
      }, delay);

      return () => clearTimeout(delayTimer);
    } else {
      setShouldShowContent(false);
      setIsAnimating(false);
    }
  }, [isLoading, delay]);

  if (isLoading && skeleton) {
    return skeleton;
  }

  if (isLoading) {
    return null;
  }

  return (
    <div
      className={cn(
        "transition-opacity duration-200",
        isAnimating ? "opacity-100" : "opacity-0",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export { FadeInContent };
