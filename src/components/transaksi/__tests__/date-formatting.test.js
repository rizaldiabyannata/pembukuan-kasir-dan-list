/**
 * Tests for date formatting without timezone conversion
 * Validates Requirements 1.1, 1.2, 1.3, 1.4
 */

describe("Date Formatting Without Timezone Conversion", () => {
  // Helper functions from TransaksiDialog
  function formatLocalDateTime(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  function formatLocalDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  test("formatLocalDateTime preserves local time without timezone conversion", () => {
    // Create a date with specific local time
    const date = new Date(2024, 0, 23, 14, 30); // Jan 23, 2024, 14:30 local time

    const formatted = formatLocalDateTime(date);

    // Should preserve the exact local time
    expect(formatted).toBe("2024-01-23T14:30");
  });

  test("formatLocalDate preserves date without timezone conversion", () => {
    // Create a date
    const date = new Date(2024, 0, 23); // Jan 23, 2024

    const formatted = formatLocalDate(date);

    // Should preserve the exact date
    expect(formatted).toBe("2024-01-23");
  });

  test("date 23 formats as date 23, not date 22", () => {
    // This tests the bug where date 23 was being stored as date 22
    const date = new Date(2024, 0, 23, 23, 59); // Jan 23, 2024, 23:59

    const formatted = formatLocalDateTime(date);

    // Should still be Jan 23, not Jan 22
    expect(formatted).toContain("2024-01-23");
  });

  test("formatLocalDateTime handles single-digit months and days", () => {
    const date = new Date(2024, 0, 5, 9, 5); // Jan 5, 2024, 09:05

    const formatted = formatLocalDateTime(date);

    // Should pad with zeros
    expect(formatted).toBe("2024-01-05T09:05");
  });

  test("formatLocalDate handles single-digit months and days", () => {
    const date = new Date(2024, 0, 5); // Jan 5, 2024

    const formatted = formatLocalDate(date);

    // Should pad with zeros
    expect(formatted).toBe("2024-01-05");
  });

  test("formatLocalDateTime handles midnight correctly", () => {
    const date = new Date(2024, 0, 23, 0, 0); // Jan 23, 2024, 00:00

    const formatted = formatLocalDateTime(date);

    expect(formatted).toBe("2024-01-23T00:00");
  });

  test("formatLocalDateTime handles end of day correctly", () => {
    const date = new Date(2024, 0, 23, 23, 59); // Jan 23, 2024, 23:59

    const formatted = formatLocalDateTime(date);

    expect(formatted).toBe("2024-01-23T23:59");
  });
});
