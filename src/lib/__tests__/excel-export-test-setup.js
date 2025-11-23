/**
 * Test Setup for Excel Export Tests
 * Provides utilities, generators, and helpers for property-based testing of export functions
 */

import fc from "fast-check";

/**
 * Fast-check generators for test data
 */

// Generate valid transaction data
export const transactionArbitrary = fc.record({
  id: fc.uuid(),
  invoice_code: fc.string({ minLength: 5, maxLength: 20 }),
  customer_name: fc.string({ minLength: 3, maxLength: 50 }),
  booking_date: fc.date({ min: new Date("2020-01-01"), max: new Date() }),
  checkout_datetime: fc.date({ min: new Date("2020-01-01"), max: new Date() }),
  checkin_datetime: fc.date({ min: new Date("2020-01-01"), max: new Date() }),
  actual_checkin_datetime: fc.option(
    fc.date({ min: new Date("2020-01-01"), max: new Date() }),
    { nil: null }
  ),
  all_in_rate: fc.integer({ min: 100000, max: 5000000 }),
  overtime_rate_per_hour: fc.integer({ min: 50000, max: 500000 }),
  payment_status: fc.constantFrom("PAID", "UNPAID", "DOWN_PAYMENT"),
  approval_status: fc.constantFrom("DRAFT", "PENDING", "APPROVED", "REJECTED"),
  created_at: fc.date({ min: new Date("2020-01-01"), max: new Date() }),
  updated_at: fc.date({ min: new Date("2020-01-01"), max: new Date() }),
  // Nested relations
  package: fc.option(
    fc.record({
      id: fc.uuid(),
      name: fc.string({ minLength: 5, maxLength: 30 }),
      type: fc.constantFrom(
        "TOUR_PACKAGE",
        "CAR_RENTAL",
        "FULL_DAY_TRIP",
        "CUSTOM"
      ),
      price: fc.integer({ min: 100000, max: 5000000 }),
      durationHours: fc.integer({ min: 1, max: 72 }),
    }),
    { nil: null }
  ),
  armada: fc.option(
    fc.record({
      id: fc.uuid(),
      license_plate: fc.string({ minLength: 5, maxLength: 15 }),
      brand: fc.string({ minLength: 3, maxLength: 20 }),
      model: fc.string({ minLength: 3, maxLength: 30 }),
    }),
    { nil: null }
  ),
  driver: fc.option(
    fc.record({
      id: fc.uuid(),
      driver_name: fc.string({ minLength: 3, maxLength: 50 }),
      phone_number: fc.string({ minLength: 10, maxLength: 15 }),
    }),
    { nil: null }
  ),
});

// Generate valid expense data
export const expenseArbitrary = fc.record({
  id: fc.uuid(),
  date: fc.date({ min: new Date("2020-01-01"), max: new Date() }),
  category: fc.constantFrom(
    "BBM",
    "Gaji Sopir",
    "Gaji Staff",
    "Maintenance",
    "Operasional Kantor",
    "Lainnya"
  ),
  description: fc.string({ minLength: 5, maxLength: 100 }),
  amount: fc.integer({ min: 10000, max: 10000000 }),
  namaPenerima: fc.option(fc.string({ minLength: 3, maxLength: 50 }), {
    nil: null,
  }),
  approval_status: fc.constantFrom("DRAFT", "PENDING", "APPROVED", "REJECTED"),
  created_at: fc.date({ min: new Date("2020-01-01"), max: new Date() }),
  updated_at: fc.date({ min: new Date("2020-01-01"), max: new Date() }),
  // Nested relations
  armada: fc.option(
    fc.record({
      id: fc.uuid(),
      license_plate: fc.string({ minLength: 5, maxLength: 15 }),
      brand: fc.string({ minLength: 3, maxLength: 20 }),
      model: fc.string({ minLength: 3, maxLength: 30 }),
    }),
    { nil: null }
  ),
  driver: fc.option(
    fc.record({
      id: fc.uuid(),
      driver_name: fc.string({ minLength: 3, maxLength: 50 }),
      phone_number: fc.string({ minLength: 10, maxLength: 15 }),
    }),
    { nil: null }
  ),
  staff: fc.option(
    fc.record({
      id: fc.uuid(),
      staff_name: fc.string({ minLength: 3, maxLength: 50 }),
      position: fc.string({ minLength: 3, maxLength: 30 }),
    }),
    { nil: null }
  ),
  attachments: fc.option(
    fc.array(
      fc.record({
        id: fc.uuid(),
        fileName: fc.string({ minLength: 5, maxLength: 50 }),
        fileSize: fc.integer({ min: 1000, max: 10000000 }),
        mimeType: fc.constantFrom("image/jpeg", "image/png", "application/pdf"),
      }),
      { minLength: 0, maxLength: 5 }
    ),
    { nil: null }
  ),
});

/**
 * Test utilities for validation
 */

// Validate that a value is not null or undefined
export function isPresent(value) {
  return value !== null && value !== undefined;
}

// Validate that a value is a valid number
export function isValidNumber(value) {
  return typeof value === "number" && !isNaN(value) && isFinite(value);
}

// Validate that a value is a valid date string or Date object
export function isValidDate(value) {
  if (!value) return false;
  const date = new Date(value);
  return !isNaN(date.getTime());
}

// Validate that a nested property exists
export function hasNestedProperty(obj, path) {
  const parts = path.split(".");
  let current = obj;

  for (const part of parts) {
    if (current === null || current === undefined) {
      return false;
    }
    current = current[part];
  }

  return current !== null && current !== undefined;
}

// Check if accessor returns correct value
export function testAccessor(obj, correctPath, incorrectPath) {
  const correctValue = getNestedValue(obj, correctPath);
  const incorrectValue = getNestedValue(obj, incorrectPath);

  return {
    correctExists: correctValue !== undefined,
    incorrectExists: incorrectValue !== undefined,
    correctValue,
    incorrectValue,
  };
}

// Get nested value safely
export function getNestedValue(obj, path) {
  const parts = path.split(".");
  let current = obj;

  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }
    current = current[part];
  }

  return current;
}

/**
 * Mock data generators for specific test scenarios
 */

// Generate transaction with complete data
export function createCompleteTransaction(overrides = {}) {
  return {
    id: "tx-123",
    invoice_code: "INV-2024-001",
    customer_name: "John Doe",
    booking_date: new Date("2024-01-15"),
    checkout_datetime: new Date("2024-01-16T10:00:00"),
    checkin_datetime: new Date("2024-01-15T08:00:00"),
    actual_checkin_datetime: new Date("2024-01-15T08:30:00"),
    all_in_rate: 500000,
    overtime_rate_per_hour: 100000,
    payment_status: "PAID",
    approval_status: "APPROVED",
    created_at: new Date("2024-01-10"),
    updated_at: new Date("2024-01-15"),
    package: {
      id: "pkg-1",
      name: "Paket Wisata Bali",
      type: "TOUR_PACKAGE",
      price: 500000,
      durationHours: 24,
    },
    armada: {
      id: "arm-1",
      license_plate: "B 1234 XYZ",
      brand: "Toyota",
      model: "Avanza",
    },
    driver: {
      id: "drv-1",
      driver_name: "Ahmad Sopir",
      phone_number: "081234567890",
    },
    ...overrides,
  };
}

// Generate transaction with missing relations
export function createTransactionWithMissingRelations(overrides = {}) {
  return {
    id: "tx-456",
    invoice_code: "INV-2024-002",
    customer_name: "Jane Smith",
    booking_date: new Date("2024-01-20"),
    checkout_datetime: new Date("2024-01-21T10:00:00"),
    checkin_datetime: new Date("2024-01-20T08:00:00"),
    actual_checkin_datetime: null,
    all_in_rate: 300000,
    overtime_rate_per_hour: 75000,
    payment_status: "UNPAID",
    approval_status: "PENDING",
    created_at: new Date("2024-01-18"),
    updated_at: new Date("2024-01-20"),
    package: null,
    armada: null,
    driver: null,
    ...overrides,
  };
}

// Generate expense with complete data
export function createCompleteExpense(overrides = {}) {
  return {
    id: "exp-123",
    date: new Date("2024-01-15"),
    category: "BBM",
    description: "Pengisian BBM untuk Avanza B 1234 XYZ",
    amount: 250000,
    namaPenerima: "SPBU Pertamina",
    approval_status: "APPROVED",
    created_at: new Date("2024-01-15"),
    updated_at: new Date("2024-01-15"),
    armada: {
      id: "arm-1",
      license_plate: "B 1234 XYZ",
      brand: "Toyota",
      model: "Avanza",
    },
    driver: {
      id: "drv-1",
      driver_name: "Ahmad Sopir",
      phone_number: "081234567890",
    },
    staff: {
      id: "stf-1",
      staff_name: "Budi Admin",
      position: "Admin",
    },
    attachments: [
      {
        id: "att-1",
        fileName: "receipt.jpg",
        fileSize: 150000,
        mimeType: "image/jpeg",
      },
    ],
    ...overrides,
  };
}

// Generate expense with missing relations
export function createExpenseWithMissingRelations(overrides = {}) {
  return {
    id: "exp-456",
    date: new Date("2024-01-20"),
    category: "Operasional Kantor",
    description: "Biaya listrik kantor",
    amount: 500000,
    namaPenerima: null,
    approval_status: "PENDING",
    created_at: new Date("2024-01-20"),
    updated_at: new Date("2024-01-20"),
    armada: null,
    driver: null,
    staff: null,
    attachments: null,
    ...overrides,
  };
}

/**
 * Validation helpers for export data
 */

// Validate that export row has no empty required fields
export function validateExportRow(row, requiredIndices = []) {
  const issues = [];

  requiredIndices.forEach((index) => {
    if (row[index] === undefined || row[index] === null || row[index] === "") {
      issues.push(`Missing value at index ${index}`);
    }
  });

  return {
    isValid: issues.length === 0,
    issues,
  };
}

// Validate currency format
export function validateCurrencyValue(value) {
  if (typeof value === "number") {
    return isValidNumber(value) && value >= 0;
  }
  return false;
}

// Validate date format
export function validateDateFormat(dateString, locale = "id-ID") {
  if (dateString === "-") return true; // Allow placeholder
  if (!dateString || dateString === "") return false; // Reject empty strings
  return isValidDate(dateString);
}

/**
 * Export test configuration
 */
export const TEST_CONFIG = {
  // Minimum number of property test iterations (as per design doc)
  MIN_PROPERTY_TEST_RUNS: 100,

  // Default date range for tests
  DEFAULT_DATE_RANGE: {
    from: "2024-01-01",
    to: "2024-12-31",
  },

  // Expected placeholder for missing data
  MISSING_DATA_PLACEHOLDER: "-",

  // Expected placeholder for zero amounts
  ZERO_AMOUNT_PLACEHOLDER: 0,
};
