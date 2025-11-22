import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * StaggeredList - Component that renders children with staggered fade-in animations
 * Each child appears with a 50ms delay after the previous one
 *
 * @param {React.ReactNode} children - List items to animate
 * @param {string} className - Additional CSS classes for container
 * @param {number} staggerDelay - Delay between each item in ms (default: 50)
 * @param {boolean} isLoading - Whether list is loading (disables animation)
 */
function StaggeredList({
  children,
  className,
  staggerDelay = 50,
  isLoading = false,
  ...props
}) {
  const childArray = React.Children.toArray(children);

  if (isLoading) {
    return (
      <div className={className} {...props}>
        {children}
      </div>
    );
  }

  return (
    <div className={className} {...props}>
      {childArray.map((child, index) => (
        <div
          key={index}
          className="animate-in fade-in duration-200"
          style={{
            animationDelay: `${index * staggerDelay}ms`,
          }}
        >
          {child}
        </div>
      ))}
    </div>
  );
}

/**
 * StaggeredListItem - Individual item wrapper for use with StaggeredList
 * Can be used when you need more control over individual items
 *
 * @param {React.ReactNode} children - Item content
 * @param {number} index - Item index for stagger calculation
 * @param {number} staggerDelay - Delay multiplier in ms (default: 50)
 * @param {string} className - Additional CSS classes
 */
function StaggeredListItem({
  children,
  index = 0,
  staggerDelay = 50,
  className,
  ...props
}) {
  return (
    <div
      className={cn("animate-in fade-in duration-200", className)}
      style={{
        animationDelay: `${index * staggerDelay}ms`,
      }}
      {...props}
    >
      {children}
    </div>
  );
}

export { StaggeredList, StaggeredListItem };
