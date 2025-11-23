/**
 * Test to verify property-based testing infrastructure is set up correctly
 */

import fc from "fast-check";
import {
  transactionArbitrary,
  expenseArbitrary,
  isPresent,
  isValidNumber,
  isValidDate,
  hasNestedProperty,
  testAccessor,
  getNestedValue,
  createCompleteTransaction,
  createTransactionWithMissingRelations,
  createCompleteExpense,
  createExpenseWithMissingRelations,
  validateExportRow,
  validateCurrencyValue,
  validateDateFormat,
  TEST_CONFIG,
} from "./excel-export-test-setup";

describe("Excel Export Test Infrastructure", () => {
  describe("Fast-check Configuration", () => {
    it("should be configured with minimum 100 runs", () => {
      // Verify fast-check is configured globally
      expect(fc.readConfigureGlobal().numRuns).toBeGreaterThanOrEqual(100);
    });

    it("should generate valid transaction data", () => {
      fc.assert(
        fc.property(transactionArbitrary, (transaction) => {
          // Verify required fields are present
          expect(transaction.id).toBeDefined();
          expect(transaction.invoice_code).toBeDefined();
          expect(transaction.customer_name).toBeDefined();
          expect(transaction.booking_date).toBeInstanceOf(Date);
          expect(transaction.all_in_rate).toBeGreaterThan(0);
          expect(transaction.overtime_rate_per_hour).toBeGreaterThan(0);

          return true;
        })
      );
    });

    it("should generate valid expense data", () => {
      fc.assert(
        fc.property(expenseArbitrary, (expense) => {
          // Verify required fields are present
          expect(expense.id).toBeDefined();
          expect(expense.date).toBeInstanceOf(Date);
          expect(expense.category).toBeDefined();
          expect(expense.description).toBeDefined();
          expect(expense.amount).toBeGreaterThan(0);

          return true;
        })
      );
    });
  });

  describe("Test Utilities", () => {
    describe("isPresent", () => {
      it("should return true for defined values", () => {
        expect(isPresent("test")).toBe(true);
        expect(isPresent(0)).toBe(true);
        expect(isPresent(false)).toBe(true);
        expect(isPresent([])).toBe(true);
        expect(isPresent({})).toBe(true);
      });

      it("should return false for null or undefined", () => {
        expect(isPresent(null)).toBe(false);
        expect(isPresent(undefined)).toBe(false);
      });
    });

    describe("isValidNumber", () => {
      it("should return true for valid numbers", () => {
        expect(isValidNumber(0)).toBe(true);
        expect(isValidNumber(123)).toBe(true);
        expect(isValidNumber(-456)).toBe(true);
        expect(isValidNumber(3.14)).toBe(true);
      });

      it("should return false for invalid numbers", () => {
        expect(isValidNumber(NaN)).toBe(false);
        expect(isValidNumber(Infinity)).toBe(false);
        expect(isValidNumber(-Infinity)).toBe(false);
        expect(isValidNumber("123")).toBe(false);
        expect(isValidNumber(null)).toBe(false);
      });
    });

    describe("isValidDate", () => {
      it("should return true for valid dates", () => {
        expect(isValidDate(new Date())).toBe(true);
        expect(isValidDate("2024-01-15")).toBe(true);
        expect(isValidDate("2024-01-15T10:00:00")).toBe(true);
      });

      it("should return false for invalid dates", () => {
        expect(isValidDate("invalid")).toBe(false);
        expect(isValidDate(null)).toBe(false);
        expect(isValidDate(undefined)).toBe(false);
        expect(isValidDate("")).toBe(false);
      });
    });

    describe("hasNestedProperty", () => {
      const testObj = {
        level1: {
          level2: {
            level3: "value",
          },
        },
      };

      it("should return true for existing nested properties", () => {
        expect(hasNestedProperty(testObj, "level1")).toBe(true);
        expect(hasNestedProperty(testObj, "level1.level2")).toBe(true);
        expect(hasNestedProperty(testObj, "level1.level2.level3")).toBe(true);
      });

      it("should return false for non-existing nested properties", () => {
        expect(hasNestedProperty(testObj, "nonexistent")).toBe(false);
        expect(hasNestedProperty(testObj, "level1.nonexistent")).toBe(false);
        expect(hasNestedProperty(testObj, "level1.level2.nonexistent")).toBe(
          false
        );
      });

      it("should handle null/undefined in path", () => {
        const objWithNull = { a: null };
        expect(hasNestedProperty(objWithNull, "a.b")).toBe(false);
      });
    });

    describe("testAccessor", () => {
      it("should correctly identify correct vs incorrect accessors", () => {
        const tx = createCompleteTransaction();
        const result = testAccessor(
          tx,
          "armada.license_plate",
          "armada_license_plate"
        );

        expect(result.correctExists).toBe(true);
        expect(result.incorrectExists).toBe(false);
        expect(result.correctValue).toBe("B 1234 XYZ");
        expect(result.incorrectValue).toBeUndefined();
      });
    });

    describe("getNestedValue", () => {
      it("should retrieve nested values correctly", () => {
        const tx = createCompleteTransaction();

        expect(getNestedValue(tx, "invoice_code")).toBe("INV-2024-001");
        expect(getNestedValue(tx, "armada.license_plate")).toBe("B 1234 XYZ");
        expect(getNestedValue(tx, "driver.driver_name")).toBe("Ahmad Sopir");
        expect(getNestedValue(tx, "package.name")).toBe("Paket Wisata Bali");
      });

      it("should return undefined for non-existing paths", () => {
        const tx = createCompleteTransaction();

        expect(getNestedValue(tx, "nonexistent")).toBeUndefined();
        expect(getNestedValue(tx, "armada.nonexistent")).toBeUndefined();
      });

      it("should handle null relations gracefully", () => {
        const tx = createTransactionWithMissingRelations();

        expect(getNestedValue(tx, "armada.license_plate")).toBeUndefined();
        expect(getNestedValue(tx, "driver.driver_name")).toBeUndefined();
        expect(getNestedValue(tx, "package.name")).toBeUndefined();
      });
    });
  });

  describe("Mock Data Generators", () => {
    describe("createCompleteTransaction", () => {
      it("should create transaction with all relations", () => {
        const tx = createCompleteTransaction();

        expect(tx.id).toBeDefined();
        expect(tx.invoice_code).toBeDefined();
        expect(tx.customer_name).toBeDefined();
        expect(tx.package).not.toBeNull();
        expect(tx.armada).not.toBeNull();
        expect(tx.driver).not.toBeNull();
        expect(tx.armada.license_plate).toBeDefined();
        expect(tx.driver.driver_name).toBeDefined();
      });

      it("should allow overrides", () => {
        const tx = createCompleteTransaction({
          customer_name: "Custom Name",
          all_in_rate: 999999,
        });

        expect(tx.customer_name).toBe("Custom Name");
        expect(tx.all_in_rate).toBe(999999);
      });
    });

    describe("createTransactionWithMissingRelations", () => {
      it("should create transaction with null relations", () => {
        const tx = createTransactionWithMissingRelations();

        expect(tx.id).toBeDefined();
        expect(tx.invoice_code).toBeDefined();
        expect(tx.package).toBeNull();
        expect(tx.armada).toBeNull();
        expect(tx.driver).toBeNull();
      });
    });

    describe("createCompleteExpense", () => {
      it("should create expense with all relations", () => {
        const expense = createCompleteExpense();

        expect(expense.id).toBeDefined();
        expect(expense.category).toBeDefined();
        expect(expense.amount).toBeGreaterThan(0);
        expect(expense.armada).not.toBeNull();
        expect(expense.driver).not.toBeNull();
        expect(expense.staff).not.toBeNull();
        expect(expense.attachments).not.toBeNull();
        expect(expense.attachments.length).toBeGreaterThan(0);
      });
    });

    describe("createExpenseWithMissingRelations", () => {
      it("should create expense with null relations", () => {
        const expense = createExpenseWithMissingRelations();

        expect(expense.id).toBeDefined();
        expect(expense.category).toBeDefined();
        expect(expense.armada).toBeNull();
        expect(expense.driver).toBeNull();
        expect(expense.staff).toBeNull();
        expect(expense.attachments).toBeNull();
      });
    });
  });

  describe("Validation Helpers", () => {
    describe("validateExportRow", () => {
      it("should validate rows with all required fields", () => {
        const row = ["INV-001", "John Doe", "2024-01-15", 500000];
        const result = validateExportRow(row, [0, 1, 2, 3]);

        expect(result.isValid).toBe(true);
        expect(result.issues).toHaveLength(0);
      });

      it("should detect missing required fields", () => {
        const row = ["INV-001", null, undefined, 500000];
        const result = validateExportRow(row, [0, 1, 2, 3]);

        expect(result.isValid).toBe(false);
        expect(result.issues.length).toBeGreaterThan(0);
      });
    });

    describe("validateCurrencyValue", () => {
      it("should validate valid currency values", () => {
        expect(validateCurrencyValue(0)).toBe(true);
        expect(validateCurrencyValue(100000)).toBe(true);
        expect(validateCurrencyValue(3.14)).toBe(true);
      });

      it("should reject invalid currency values", () => {
        expect(validateCurrencyValue(-100)).toBe(false);
        expect(validateCurrencyValue("100000")).toBe(false);
        expect(validateCurrencyValue(NaN)).toBe(false);
        expect(validateCurrencyValue(null)).toBe(false);
      });
    });

    describe("validateDateFormat", () => {
      it("should validate valid date formats", () => {
        expect(validateDateFormat("2024-01-15")).toBe(true);
        expect(validateDateFormat(new Date().toISOString())).toBe(true);
        expect(validateDateFormat("-")).toBe(true); // Placeholder
      });

      it("should reject invalid date formats", () => {
        expect(validateDateFormat("invalid-date")).toBe(false);
        expect(validateDateFormat("")).toBe(false);
      });
    });
  });

  describe("Test Configuration", () => {
    it("should have correct minimum property test runs", () => {
      expect(TEST_CONFIG.MIN_PROPERTY_TEST_RUNS).toBe(100);
    });

    it("should have default date range", () => {
      expect(TEST_CONFIG.DEFAULT_DATE_RANGE).toBeDefined();
      expect(TEST_CONFIG.DEFAULT_DATE_RANGE.from).toBeDefined();
      expect(TEST_CONFIG.DEFAULT_DATE_RANGE.to).toBeDefined();
    });

    it("should have missing data placeholder", () => {
      expect(TEST_CONFIG.MISSING_DATA_PLACEHOLDER).toBe("-");
    });

    it("should have zero amount placeholder", () => {
      expect(TEST_CONFIG.ZERO_AMOUNT_PLACEHOLDER).toBe(0);
    });
  });
});
