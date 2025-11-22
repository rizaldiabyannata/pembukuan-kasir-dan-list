"use client";

import * as React from "react";

/**
 * AccessibilityAnnouncer - A global component for screen reader announcements
 * Provides aria-live regions for polite and assertive announcements
 * Should be placed once at the app level
 */
function AccessibilityAnnouncer() {
  return (
    <>
      {/* Polite announcements for loading completions and general updates */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        id="polite-announcer"
      />

      {/* Assertive announcements for errors and critical updates */}
      <div
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
        id="assertive-announcer"
      />
    </>
  );
}

/**
 * Utility function to announce messages to screen readers
 * @param {string} message - Message to announce
 * @param {string} priority - Priority level (polite or assertive)
 */
function announce(message, priority = "polite") {
  if (typeof window === "undefined") return;

  const announcerId =
    priority === "assertive" ? "assertive-announcer" : "polite-announcer";
  const announcer = document.getElementById(announcerId);

  if (announcer) {
    // Clear previous message
    announcer.textContent = "";

    // Set new message after a brief delay to ensure screen readers pick it up
    setTimeout(() => {
      announcer.textContent = message;
    }, 100);

    // Clear message after it's been announced
    setTimeout(() => {
      announcer.textContent = "";
    }, 3000);
  }
}

export { AccessibilityAnnouncer, announce };
