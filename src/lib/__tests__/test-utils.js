/**
 * Test Utilities for Property-Based Testing
 *
 * Common helper functions and assertions used across test files
 */

/**
 * Check if a date is within a range (inclusive)
 */
export function isDateInRange(date, startDate, endDate) {
  const d = new Date(date);
  const start = new Date(startDate);
  const end = new Date(endDate);

  return d >= start && d <= end;
}

/**
 * Normalize date to start of day (00:00:00.000)
 */
export function normalizeStartDate(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Normalize date to end of day (23:59:59.999)
 */
export function normalizeEndDate(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * Format date to YYYY-MM-DD
 */
export function formatDateYYYYMMDD(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Format date to YYYY-MM (for month grouping)
 */
export function formatDateYYYYMM(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

/**
 * Calculate hours between two dates
 */
export function calculateHoursBetween(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffMs = end - start;

  if (diffMs < 0) return 0;

  return Math.round(diffMs / 3600000); // Convert ms to hours and round
}

/**
 * Check if a transaction is approved
 */
export function isApproved(item) {
  return item.approval_status === "APPROVED";
}

/**
 * Check if a transaction should be included in revenue calculation
 * (has actual checkin OR has down payment)
 */
export function shouldIncludeInRevenue(transaction) {
  return (
    transaction.actual_checkin_datetime !== null ||
    (transaction.payment_status === "DOWN_PAYMENT" && transaction.dp_amount > 0)
  );
}

/**
 * Sum an array of numbers
 */
export function sum(numbers) {
  return numbers.reduce((acc, n) => acc + n, 0);
}

/**
 * Calculate average of an array of numbers
 */
export function average(numbers) {
  if (numbers.length === 0) return 0;
  return sum(numbers) / numbers.length;
}

/**
 * Group array by a key function
 */
export function groupBy(array, keyFn) {
  return array.reduce((groups, item) => {
    const key = keyFn(item);
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
    return groups;
  }, {});
}

/**
 * Check if two numbers are approximately equal (within tolerance)
 */
export function approximatelyEqual(a, b, tolerance = 0.01) {
  return Math.abs(a - b) <= tolerance;
}

/**
 * Check if an array is sorted in ascending order
 */
export function isSortedAscending(array, keyFn = (x) => x) {
  for (let i = 1; i < array.length; i++) {
    if (keyFn(array[i]) < keyFn(array[i - 1])) {
      return false;
    }
  }
  return true;
}

/**
 * Check if an array is sorted in descending order
 */
export function isSortedDescending(array, keyFn = (x) => x) {
  for (let i = 1; i < array.length; i++) {
    if (keyFn(array[i]) > keyFn(array[i - 1])) {
      return false;
    }
  }
  return true;
}

/**
 * Create a mock Prisma client for testing
 */
export function createMockPrisma(data = {}) {
  return {
    transaction: {
      findMany: jest.fn().mockResolvedValue(data.transactions || []),
      findUnique: jest.fn().mockResolvedValue(data.transaction || null),
      create: jest.fn().mockResolvedValue(data.transaction || {}),
      update: jest.fn().mockResolvedValue(data.transaction || {}),
      delete: jest.fn().mockResolvedValue(data.transaction || {}),
    },
    expense: {
      findMany: jest.fn().mockResolvedValue(data.expenses || []),
      findUnique: jest.fn().mockResolvedValue(data.expense || null),
      create: jest.fn().mockResolvedValue(data.expense || {}),
      update: jest.fn().mockResolvedValue(data.expense || {}),
      delete: jest.fn().mockResolvedValue(data.expense || {}),
    },
    package: {
      findMany: jest.fn().mockResolvedValue(data.packages || []),
      findUnique: jest.fn().mockResolvedValue(data.package || null),
    },
    driver: {
      findMany: jest.fn().mockResolvedValue(data.drivers || []),
      findUnique: jest.fn().mockResolvedValue(data.driver || null),
    },
    armada: {
      findMany: jest.fn().mockResolvedValue(data.vehicles || []),
      findUnique: jest.fn().mockResolvedValue(data.vehicle || null),
    },
    auditLog: {
      create: jest.fn().mockResolvedValue(data.auditLog || {}),
      findMany: jest.fn().mockResolvedValue(data.auditLogs || []),
    },
  };
}

/**
 * Create a mock request object for API testing
 */
export function createMockRequest(options = {}) {
  return {
    method: options.method || "GET",
    url: options.url || "/",
    headers: new Headers(options.headers || {}),
    json: jest.fn().mockResolvedValue(options.body || {}),
    nextUrl: {
      searchParams: new URLSearchParams(options.query || {}),
    },
  };
}

/**
 * Create a mock response object for API testing
 */
export function createMockResponse() {
  const response = {
    status: 200,
    headers: {},
    body: null,
  };

  return {
    json: jest.fn((data) => {
      response.body = data;
      return Promise.resolve(
        new Response(JSON.stringify(data), {
          status: response.status,
          headers: response.headers,
        })
      );
    }),
    status: jest.fn((code) => {
      response.status = code;
      return response;
    }),
  };
}

/**
 * Validate that a transaction object has all required fields
 */
export function isValidTransaction(transaction) {
  return (
    transaction &&
    typeof transaction.id === "string" &&
    transaction.checkout_datetime instanceof Date &&
    transaction.checkin_datetime instanceof Date &&
    typeof transaction.all_in_rate === "number" &&
    transaction.all_in_rate >= 0 &&
    typeof transaction.overtime_rate_per_hour === "number" &&
    transaction.overtime_rate_per_hour >= 0 &&
    typeof transaction.approval_status === "string" &&
    typeof transaction.payment_status === "string"
  );
}

/**
 * Validate that an expense object has all required fields
 */
export function isValidExpense(expense) {
  return (
    expense &&
    typeof expense.id === "string" &&
    expense.date instanceof Date &&
    typeof expense.category === "string" &&
    typeof expense.amount === "number" &&
    expense.amount >= 0 &&
    typeof expense.approval_status === "string"
  );
}

/**
 * Validate that a package object has all required fields
 */
export function isValidPackage(pkg) {
  return (
    pkg &&
    typeof pkg.id === "string" &&
    typeof pkg.name === "string" &&
    typeof pkg.type === "string" &&
    typeof pkg.price === "number" &&
    pkg.price >= 0
  );
}

/**
 * Assert that all items in array satisfy a predicate
 */
export function assertAll(array, predicate, message) {
  const failures = array.filter((item) => !predicate(item));
  if (failures.length > 0) {
    throw new Error(
      `${message}\nFailed items: ${JSON.stringify(failures, null, 2)}`
    );
  }
}

/**
 * Assert that at least one item in array satisfies a predicate
 */
export function assertSome(array, predicate, message) {
  const hasMatch = array.some(predicate);
  if (!hasMatch) {
    throw new Error(`${message}\nNo items matched the predicate`);
  }
}

/**
 * Deep clone an object (for test data manipulation)
 */
export function deepClone(obj) {
  return JSON.parse(
    JSON.stringify(obj, (key, value) => {
      // Handle Date objects
      if (value instanceof Date) {
        return value.toISOString();
      }
      return value;
    }),
    (key, value) => {
      // Restore Date objects
      if (
        typeof value === "string" &&
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)
      ) {
        return new Date(value);
      }
      return value;
    }
  );
}

/**
 * Generate a random subset of an array
 */
export function randomSubset(array, minSize = 0, maxSize = null) {
  const size =
    Math.floor(Math.random() * ((maxSize || array.length) - minSize + 1)) +
    minSize;
  const shuffled = [...array].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, size);
}

/**
 * Filter transactions by date range
 */
export function filterTransactionsByDateRange(
  transactions,
  startDate,
  endDate
) {
  const start = normalizeStartDate(startDate);
  const end = normalizeEndDate(endDate);

  return transactions.filter((t) => {
    const bookingDate = new Date(t.booking_date);
    return bookingDate >= start && bookingDate <= end;
  });
}

/**
 * Filter expenses by date range
 */
export function filterExpensesByDateRange(expenses, startDate, endDate) {
  const start = normalizeStartDate(startDate);
  const end = normalizeEndDate(endDate);

  return expenses.filter((e) => {
    const expenseDate = new Date(e.date);
    return expenseDate >= start && expenseDate <= end;
  });
}
