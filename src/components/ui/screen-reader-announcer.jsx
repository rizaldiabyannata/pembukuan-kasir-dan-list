import * as React from "react";

/**
 * ScreenReaderAnnouncer - A component for making announcements to screen readers
 * Uses aria-live regions to announce loading states, completions, and errors
 *
 * @param {string} message - Message to announce
 * @param {string} priority - Announcement priority (polite, assertive)
 * @param {string} className - Additional CSS classes
 */
function ScreenReaderAnnouncer({
  message,
  priority = "polite",
  className = "",
}) {
  if (!message) return null;

  return (
    <div
      role="status"
      aria-live={priority}
      aria-atomic="true"
      className={`sr-only ${className}`}
    >
      {message}
    </div>
  );
}

export { ScreenReaderAnnouncer };
