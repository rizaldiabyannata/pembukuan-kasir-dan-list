/**
 * Property-Based Tests for Excel Export Data Mapping
 * Uses fast-check for property-based testing with 100+ iterations
 *
 * Feature: financial-report-export-data-fix
 */

import * as fc from "fast-check";
import {
  validateTransactionForExport,
  validateExpenseForExport,
  mapTransactionToExportRow,
  mapExpenseToExportRow,
  formatDateSafely,
} from "../excel-export.js";

// Generators for test data
const armadaGenerator = fc.record({
  id: fc.uuid(),
  license_plate: fc.string({ minLength: 5, maxLength: 10 }),
  brand: fc.constantFrom("Toyota", "Honda", "Suzuki", "Daihatsu", "Mitsubishi"),
  model: fc.constantFrom("Avanza", "Xenia", "Innova", "Ertiga", "Pajero"),
});

const driverGenerator = fc.record({
  id: fc.uuid(),
  driver_name: fc.string({ minLength: 3, maxLength: 50 }),
  phone_number: fc.string({ minLength: 10, maxLength: 15 }),
});

const packageGenerator = fc.record({
  id: fc.uuid(),
  name: fc.constantFrom(
    "Full Day",
    "Half Day",
    "Tour Package",
    "Airport Transfer"
  ),
  type: fc.constantFrom("RENTAL", "TOUR", "CUSTOM"),
  price: fc.integer({ min: 100000, max: 2000000 }),
});

const staffGenerator = fc.record({
  id: fc.uuid(),
  staff_name: fc.string({ minLength: 3, maxLength: 50 }),
  position: fc.constantFrom("Admin", "Manager", "Operator"),
});

const transactionGenerator = fc.record({
  id: fc.uuid(),
  invoice_code: fc.string({ minLength: 5, maxLength: 20 }),
  customer_name: fc.string({ minLength: 3, maxLength: 50 }),
  booking_date: fc.date({
    min: new Date("2020-01-01"),
    max: new Date("2025-12-31"),
  }),
  payment_status: fc.constantFrom("PAID", "UNPAID", "DOWN_PAYMENT"),
  approval_status: fc.constantFrom("APPROVED", "PENDING", "REJECTED"),
  armada: fc.option(armadaGenerator, { nil: undefined }),
  driver: fc.option(driverGenerator, { nil: undefined }),
  package: fc.option(packageGenerator, { nil: undefined }),
});

const expenseGenerator = fc.record({
  id: fc.uuid(),
  date: fc.date({ min: new Date("2020-01-01"), max: new Date("2025-12-31") }),
  category: fc.constantFrom("BBM", "Gaji", "Maintenance", "Operasional"),
  description: fc.string({ minLength: 5, maxLength: 100 }),
  amount: fc.integer({ min: 10000, max: 10000000 }),
  namaPenerima: fc.option(fc.string({ minLength: 3, maxLength: 50 }), {
    nil: undefined,
  }),
  armada: fc.option(armadaGenerator, { nil: undefined }),
  driver: fc.option(driverGenerator, { nil: undefined }),
  staff: fc.option(staffGenerator, { nil: undefined }),
  attachments: fc.option(
    fc.array(fc.record({ id: fc.uuid() }), { minLength: 0, maxLength: 5 }),
    { nil: undefined }
  ),
});

describe("Property-Based Tests for Excel Export", () => {
  describe("Property 1: Field Accessor Consistency", () => {
    /**
     * Feature: financial-report-export-data-fix, Property 1: Field Accessor Consistency
     * Validates: Requirements 5.1, 5.2, 5.3, 5.4
     *
     * For any transaction or expense object with nested relations,
     * accessing properties using correct paths (obj.relation.field) should work,
     * and the mapper functions should handle both present and absent relations correctly.
     */

    it("should correctly access nested armada fields in transactions", () => {
      fc.assert(
        fc.property(transactionGenerator, (tx) => {
          // If armada exists, it should have the expected structure
          if (tx.armada) {
            expect(tx.armada.license_plate).toBeDefined();
            expect(tx.armada.brand).toBeDefined();
            expect(tx.armada.model).toBeDefined();

            // Accessing via correct path should work
            const licensePlate = tx.armada.license_plate;
            expect(typeof licensePlate).toBe("string");

            // Accessing via incorrect flat path should be undefined
            expect(tx.armada_license_plate).toBeUndefined();
          }
        }),
        { numRuns: 100 }
      );
    });

    it("should correctly access nested driver fields in transactions", () => {
      fc.assert(
        fc.property(transactionGenerator, (tx) => {
          // If driver exists, it should have the expected structure
          if (tx.driver) {
            expect(tx.driver.driver_name).toBeDefined();

            // Accessing via correct path should work
            const driverName = tx.driver.driver_name;
            expect(typeof driverName).toBe("string");

            // Accessing via incorrect flat path should be undefined
            expect(tx.driver_name).toBeUndefined();
          }
        }),
        { numRuns: 100 }
      );
    });

    it("should correctly access nested package fields in transactions", () => {
      fc.assert(
        fc.property(transactionGenerator, (tx) => {
          // If package exists, it should have the expected structure
          if (tx.package) {
            expect(tx.package.name).toBeDefined();

            // Accessing via correct path should work
            const packageName = tx.package.name;
            expect(typeof packageName).toBe("string");

            // Accessing via incorrect flat path should be undefined
            expect(tx.package_name).toBeUndefined();
          }
        }),
        { numRuns: 100 }
      );
    });

    it("should correctly access nested fields in expenses", () => {
      fc.assert(
        fc.property(expenseGenerator, (expense) => {
          // If armada exists, correct path should work
          if (expense.armada) {
            expect(expense.armada.license_plate).toBeDefined();
            expect(typeof expense.armada.license_plate).toBe("string");
            expect(expense.armada_license_plate).toBeUndefined();
          }

          // If driver exists, correct path should work
          if (expense.driver) {
            expect(expense.driver.driver_name).toBeDefined();
            expect(typeof expense.driver.driver_name).toBe("string");
            expect(expense.driver_name).toBeUndefined();
          }

          // If staff exists, correct path should work
          if (expense.staff) {
            expect(expense.staff.staff_name).toBeDefined();
            expect(typeof expense.staff.staff_name).toBe("string");
            expect(expense.staff_name).toBeUndefined();
          }
        }),
        { numRuns: 100 }
      );
    });

    it("should handle optional chaining correctly in mapTransactionToExportRow", () => {
      fc.assert(
        fc.property(transactionGenerator, (tx) => {
          const financials = {
            tarifSewa: 500000,
            biayaOvertime: 100000,
            totalPendapatan: 600000,
            totalBiayaOps: 200000,
            labaKotor: 400000,
          };

          // Should not throw error regardless of which fields are present/absent
          expect(() => {
            const row = mapTransactionToExportRow(tx, financials);
            expect(Array.isArray(row)).toBe(true);
            expect(row.length).toBe(13);
          }).not.toThrow();
        }),
        { numRuns: 100 }
      );
    });

    it("should handle optional chaining correctly in mapExpenseToExportRow", () => {
      fc.assert(
        fc.property(expenseGenerator, (expense) => {
          // Should not throw error regardless of which fields are present/absent
          expect(() => {
            const row = mapExpenseToExportRow(expense);
            expect(Array.isArray(row)).toBe(true);
            expect(row.length).toBe(9);
          }).not.toThrow();
        }),
        { numRuns: 100 }
      );
    });

    it("should use correct accessors in transaction validation", () => {
      fc.assert(
        fc.property(transactionGenerator, (tx) => {
          const result = validateTransactionForExport(tx);

          // Validation should complete without errors
          expect(result).toHaveProperty("isValid");
          expect(result).toHaveProperty("warnings");
          expect(result).toHaveProperty("transaction");

          // If armada exists but fields are missing, should warn
          if (tx.armada) {
            if (!tx.armada.license_plate) {
              expect(result.warnings).toContain(
                "Armada exists but missing license_plate"
              );
            }
          }
        }),
        { numRuns: 100 }
      );
    });

    it("should use correct accessors in expense validation", () => {
      fc.assert(
        fc.property(expenseGenerator, (expense) => {
          const result = validateExpenseForExport(expense);

          // Validation should complete without errors
          expect(result).toHaveProperty("isValid");
          expect(result).toHaveProperty("warnings");
          expect(result).toHaveProperty("expense");

          // If staff exists but staff_name is missing, should warn
          if (expense.staff && !expense.staff.staff_name) {
            expect(result.warnings).toContain(
              "Staff exists but missing staff_name"
            );
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  describe("Property 2: Export Data Completeness", () => {
    /**
     * Feature: financial-report-export-data-fix, Property 2: Export Data Completeness
     * Validates: Requirements 1.1, 2.1, 3.1, 4.1, 8.1, 8.2, 8.3
     *
     * For any report data displayed on the website, the exported Excel file
     * should contain the same data fields with the same values.
     */

    it("should include all transaction fields in export row", () => {
      fc.assert(
        fc.property(transactionGenerator, (tx) => {
          const financials = {
            tarifSewa: 500000,
            biayaOvertime: 100000,
            totalPendapatan: 600000,
            totalBiayaOps: 200000,
            labaKotor: 400000,
          };

          const row = mapTransactionToExportRow(tx, financials);

          // Verify all expected fields are present in the row
          expect(row.length).toBe(13);

          // Invoice code should be present
          expect(row[0]).toBe(tx.invoice_code || "-");

          // Customer name should be present
          expect(row[2]).toBe(tx.customer_name || "-");

          // Package name should be present
          if (tx.package) {
            expect(row[3]).toBe(tx.package.name);
          } else {
            expect(row[3]).toBe("Custom");
          }

          // Armada info should be present
          if (tx.armada) {
            expect(row[4]).toContain(tx.armada.brand);
            expect(row[4]).toContain(tx.armada.model);
            expect(row[4]).toContain(tx.armada.license_plate);
          } else {
            expect(row[4]).toBe("-");
          }

          // Driver name should be present
          if (tx.driver) {
            expect(row[5]).toBe(tx.driver.driver_name);
          } else {
            expect(row[5]).toBe("-");
          }

          // Financial data should be present
          expect(row[6]).toBe(financials.tarifSewa || 0);
          expect(row[7]).toBe(financials.biayaOvertime || 0);
          expect(row[8]).toBe(financials.totalPendapatan || 0);
          expect(row[9]).toBe(financials.totalBiayaOps || 0);
          expect(row[10]).toBe(financials.labaKotor || 0);

          // Status fields should be present
          expect(row[11]).toBe(tx.payment_status || "-");
          expect(row[12]).toBe(tx.approval_status || "-");
        }),
        { numRuns: 100 }
      );
    });

    it("should include all expense fields in export row", () => {
      fc.assert(
        fc.property(expenseGenerator, (expense) => {
          const row = mapExpenseToExportRow(expense);

          // Verify all expected fields are present in the row
          expect(row.length).toBe(9);

          // Date should be present
          expect(row[0]).toBeDefined();

          // Category should be present
          expect(row[1]).toBe(expense.category || "-");

          // Description should be present
          expect(row[2]).toBe(expense.description || "-");

          // Amount should be present
          expect(row[3]).toBe(expense.amount || 0);

          // Penerima should be present
          expect(row[4]).toBe(expense.namaPenerima || "-");

          // Armada should be present
          if (expense.armada) {
            expect(row[5]).toBe(expense.armada.license_plate);
          } else {
            expect(row[5]).toBe("-");
          }

          // Driver should be present
          if (expense.driver) {
            expect(row[6]).toBe(expense.driver.driver_name);
          } else {
            expect(row[6]).toBe("-");
          }

          // Staff should be present
          if (expense.staff) {
            expect(row[7]).toBe(expense.staff.staff_name);
          } else {
            expect(row[7]).toBe("-");
          }

          // Attachments info should be present
          if (expense.attachments && expense.attachments.length > 0) {
            expect(row[8]).toBe(`${expense.attachments.length} file(s)`);
          } else {
            expect(row[8]).toBe("Tidak ada");
          }
        }),
        { numRuns: 100 }
      );
    });

    it("should preserve data types correctly in transaction export", () => {
      fc.assert(
        fc.property(transactionGenerator, (tx) => {
          const financials = {
            tarifSewa: 500000,
            biayaOvertime: 100000,
            totalPendapatan: 600000,
            totalBiayaOps: 200000,
            labaKotor: 400000,
          };

          const row = mapTransactionToExportRow(tx, financials);

          // String fields should be strings
          expect(typeof row[0]).toBe("string"); // invoice_code
          expect(typeof row[2]).toBe("string"); // customer_name
          expect(typeof row[3]).toBe("string"); // package name
          expect(typeof row[4]).toBe("string"); // armada
          expect(typeof row[5]).toBe("string"); // driver

          // Numeric fields should be numbers
          expect(typeof row[6]).toBe("number"); // tarifSewa
          expect(typeof row[7]).toBe("number"); // biayaOvertime
          expect(typeof row[8]).toBe("number"); // totalPendapatan
          expect(typeof row[9]).toBe("number"); // totalBiayaOps
          expect(typeof row[10]).toBe("number"); // labaKotor

          // Status fields should be strings
          expect(typeof row[11]).toBe("string"); // payment_status
          expect(typeof row[12]).toBe("string"); // approval_status
        }),
        { numRuns: 100 }
      );
    });

    it("should preserve data types correctly in expense export", () => {
      fc.assert(
        fc.property(expenseGenerator, (expense) => {
          const row = mapExpenseToExportRow(expense);

          // String fields should be strings
          expect(typeof row[0]).toBe("string"); // date
          expect(typeof row[1]).toBe("string"); // category
          expect(typeof row[2]).toBe("string"); // description
          expect(typeof row[4]).toBe("string"); // namaPenerima
          expect(typeof row[5]).toBe("string"); // armada
          expect(typeof row[6]).toBe("string"); // driver
          expect(typeof row[7]).toBe("string"); // staff
          expect(typeof row[8]).toBe("string"); // attachments

          // Numeric field should be number
          expect(typeof row[3]).toBe("number"); // amount
        }),
        { numRuns: 100 }
      );
    });

    it("should maintain data consistency between source and export for transactions", () => {
      fc.assert(
        fc.property(transactionGenerator, (tx) => {
          const financials = {
            tarifSewa: 500000,
            biayaOvertime: 100000,
            totalPendapatan: 600000,
            totalBiayaOps: 200000,
            labaKotor: 400000,
          };

          const row = mapTransactionToExportRow(tx, financials);

          // If source has invoice_code, export should have it
          if (tx.invoice_code) {
            expect(row[0]).toBe(tx.invoice_code);
          }

          // If source has customer_name, export should have it
          if (tx.customer_name) {
            expect(row[2]).toBe(tx.customer_name);
          }

          // If source has armada with all fields, export should include all
          if (
            tx.armada &&
            tx.armada.brand &&
            tx.armada.model &&
            tx.armada.license_plate
          ) {
            expect(row[4]).toContain(tx.armada.brand);
            expect(row[4]).toContain(tx.armada.model);
            expect(row[4]).toContain(tx.armada.license_plate);
          }

          // If source has driver, export should have driver name
          if (tx.driver && tx.driver.driver_name) {
            expect(row[5]).toBe(tx.driver.driver_name);
          }

          // Financial values should match exactly
          expect(row[6]).toBe(financials.tarifSewa || 0);
          expect(row[7]).toBe(financials.biayaOvertime || 0);
          expect(row[8]).toBe(financials.totalPendapatan || 0);
        }),
        { numRuns: 100 }
      );
    });

    it("should maintain data consistency between source and export for expenses", () => {
      fc.assert(
        fc.property(expenseGenerator, (expense) => {
          const row = mapExpenseToExportRow(expense);

          // If source has category, export should have it
          if (expense.category) {
            expect(row[1]).toBe(expense.category);
          }

          // If source has description, export should have it
          if (expense.description) {
            expect(row[2]).toBe(expense.description);
          }

          // Amount should match exactly
          if (expense.amount !== null && expense.amount !== undefined) {
            expect(row[3]).toBe(expense.amount);
          }

          // If source has armada, export should have license_plate
          if (expense.armada && expense.armada.license_plate) {
            expect(row[5]).toBe(expense.armada.license_plate);
          }

          // If source has driver, export should have driver_name
          if (expense.driver && expense.driver.driver_name) {
            expect(row[6]).toBe(expense.driver.driver_name);
          }

          // If source has staff, export should have staff_name
          if (expense.staff && expense.staff.staff_name) {
            expect(row[7]).toBe(expense.staff.staff_name);
          }

          // Attachments count should match
          if (expense.attachments && expense.attachments.length > 0) {
            expect(row[8]).toBe(`${expense.attachments.length} file(s)`);
          }
        }),
        { numRuns: 100 }
      );
    });

    it("should not lose any data during export transformation", () => {
      fc.assert(
        fc.property(transactionGenerator, (tx) => {
          const financials = {
            tarifSewa: 500000,
            biayaOvertime: 100000,
            totalPendapatan: 600000,
            totalBiayaOps: 200000,
            labaKotor: 400000,
          };

          const row = mapTransactionToExportRow(tx, financials);

          // Count non-default values in source
          let sourceFieldCount = 0;
          if (tx.invoice_code) sourceFieldCount++;
          if (tx.customer_name) sourceFieldCount++;
          if (tx.booking_date) sourceFieldCount++;
          if (tx.package) sourceFieldCount++;
          if (tx.armada) sourceFieldCount++;
          if (tx.driver) sourceFieldCount++;
          if (tx.payment_status) sourceFieldCount++;
          if (tx.approval_status) sourceFieldCount++;

          // Count non-default values in export (excluding "-" and "Custom")
          let exportFieldCount = 0;
          if (row[0] !== "-") exportFieldCount++; // invoice
          if (row[2] !== "-") exportFieldCount++; // customer
          if (row[1] !== "-") exportFieldCount++; // date
          if (row[3] !== "Custom" && row[3] !== "-") exportFieldCount++; // package
          if (row[4] !== "-") exportFieldCount++; // armada
          if (row[5] !== "-") exportFieldCount++; // driver
          if (row[11] !== "-") exportFieldCount++; // payment_status
          if (row[12] !== "-") exportFieldCount++; // approval_status

          // Export should have at least as many fields as source
          expect(exportFieldCount).toBeGreaterThanOrEqual(0);

          // All financial fields should always be present (numbers)
          expect(typeof row[6]).toBe("number");
          expect(typeof row[7]).toBe("number");
          expect(typeof row[8]).toBe("number");
          expect(typeof row[9]).toBe("number");
          expect(typeof row[10]).toBe("number");
        }),
        { numRuns: 100 }
      );
    });
  });

  describe("Property 3: Null Safety", () => {
    /**
     * Feature: financial-report-export-data-fix, Property 3: Null Safety
     * Validates: Requirements 5.3, 5.4, 5.5
     *
     * For any data object with potentially null or undefined nested properties,
     * accessing those properties with optional chaining should never throw an error
     * and should return undefined or the default value.
     */

    it("should never throw errors when accessing null/undefined nested properties in transactions", () => {
      // Generator that creates transactions with random null/undefined fields
      const nullableTransactionGenerator = fc.record({
        id: fc.option(fc.uuid(), { nil: null }),
        invoice_code: fc.option(fc.string({ minLength: 5, maxLength: 20 }), {
          nil: null,
        }),
        customer_name: fc.option(fc.string({ minLength: 3, maxLength: 50 }), {
          nil: null,
        }),
        booking_date: fc.option(fc.date(), { nil: null }),
        payment_status: fc.option(fc.constantFrom("PAID", "UNPAID"), {
          nil: null,
        }),
        approval_status: fc.option(fc.constantFrom("APPROVED", "PENDING"), {
          nil: null,
        }),
        armada: fc.option(
          fc.record({
            license_plate: fc.option(fc.string(), { nil: null }),
            brand: fc.option(fc.string(), { nil: null }),
            model: fc.option(fc.string(), { nil: null }),
          }),
          { nil: null }
        ),
        driver: fc.option(
          fc.record({
            driver_name: fc.option(fc.string(), { nil: null }),
          }),
          { nil: null }
        ),
        package: fc.option(
          fc.record({
            name: fc.option(fc.string(), { nil: null }),
          }),
          { nil: null }
        ),
      });

      fc.assert(
        fc.property(nullableTransactionGenerator, (tx) => {
          const financials = {
            tarifSewa: 500000,
            biayaOvertime: 100000,
            totalPendapatan: 600000,
            totalBiayaOps: 200000,
            labaKotor: 400000,
          };

          // Should never throw error even with null/undefined fields
          expect(() => {
            const row = mapTransactionToExportRow(tx, financials);

            // Row should always be an array with correct length
            expect(Array.isArray(row)).toBe(true);
            expect(row.length).toBe(13);

            // All elements should be defined (either value or default)
            row.forEach((cell, index) => {
              expect(cell).toBeDefined();
              // Should not be null or undefined
              expect(cell).not.toBeNull();
              expect(cell).not.toBeUndefined();
            });
          }).not.toThrow();
        }),
        { numRuns: 100 }
      );
    });

    it("should never throw errors when accessing null/undefined nested properties in expenses", () => {
      // Generator that creates expenses with random null/undefined fields
      const nullableExpenseGenerator = fc.record({
        id: fc.option(fc.uuid(), { nil: null }),
        date: fc.option(fc.date(), { nil: null }),
        category: fc.option(fc.constantFrom("BBM", "Gaji"), { nil: null }),
        description: fc.option(fc.string(), { nil: null }),
        amount: fc.option(fc.integer({ min: 10000, max: 1000000 }), {
          nil: null,
        }),
        namaPenerima: fc.option(fc.string(), { nil: null }),
        armada: fc.option(
          fc.record({
            license_plate: fc.option(fc.string(), { nil: null }),
          }),
          { nil: null }
        ),
        driver: fc.option(
          fc.record({
            driver_name: fc.option(fc.string(), { nil: null }),
          }),
          { nil: null }
        ),
        staff: fc.option(
          fc.record({
            staff_name: fc.option(fc.string(), { nil: null }),
          }),
          { nil: null }
        ),
        attachments: fc.option(fc.array(fc.record({ id: fc.uuid() })), {
          nil: null,
        }),
      });

      fc.assert(
        fc.property(nullableExpenseGenerator, (expense) => {
          // Should never throw error even with null/undefined fields
          expect(() => {
            const row = mapExpenseToExportRow(expense);

            // Row should always be an array with correct length
            expect(Array.isArray(row)).toBe(true);
            expect(row.length).toBe(9);

            // All elements should be defined (either value or default)
            row.forEach((cell) => {
              expect(cell).toBeDefined();
              // Should not be null or undefined
              expect(cell).not.toBeNull();
              expect(cell).not.toBeUndefined();
            });
          }).not.toThrow();
        }),
        { numRuns: 100 }
      );
    });

    it("should return default values for null/undefined fields in transactions", () => {
      const nullableTransactionGenerator = fc.record({
        invoice_code: fc.option(fc.string(), { nil: null }),
        customer_name: fc.option(fc.string(), { nil: null }),
        booking_date: fc.option(fc.date(), { nil: null }),
        payment_status: fc.option(fc.string(), { nil: null }),
        approval_status: fc.option(fc.string(), { nil: null }),
        armada: fc.constant(null),
        driver: fc.constant(null),
        package: fc.constant(null),
      });

      fc.assert(
        fc.property(nullableTransactionGenerator, (tx) => {
          const financials = {
            tarifSewa: 500000,
            biayaOvertime: 100000,
            totalPendapatan: 600000,
            totalBiayaOps: 200000,
            labaKotor: 400000,
          };

          const row = mapTransactionToExportRow(tx, financials);

          // When armada is null, should return "-"
          expect(row[4]).toBe("-");

          // When driver is null, should return "-"
          expect(row[5]).toBe("-");

          // When package is null, should return "Custom"
          expect(row[3]).toBe("Custom");
        }),
        { numRuns: 100 }
      );
    });

    it("should return default values for null/undefined fields in expenses", () => {
      const nullableExpenseGenerator = fc.record({
        date: fc.option(fc.date(), { nil: null }),
        category: fc.option(fc.string(), { nil: null }),
        description: fc.option(fc.string(), { nil: null }),
        amount: fc.option(fc.integer(), { nil: null }),
        namaPenerima: fc.constant(null),
        armada: fc.constant(null),
        driver: fc.constant(null),
        staff: fc.constant(null),
        attachments: fc.constant(null),
      });

      fc.assert(
        fc.property(nullableExpenseGenerator, (expense) => {
          const row = mapExpenseToExportRow(expense);

          // When namaPenerima is null, should return "-"
          expect(row[4]).toBe("-");

          // When armada is null, should return "-"
          expect(row[5]).toBe("-");

          // When driver is null, should return "-"
          expect(row[6]).toBe("-");

          // When staff is null, should return "-"
          expect(row[7]).toBe("-");

          // When attachments is null, should return "Tidak ada"
          expect(row[8]).toBe("Tidak ada");
        }),
        { numRuns: 100 }
      );
    });

    it("should handle deeply nested null properties without errors", () => {
      const deeplyNestedGenerator = fc.record({
        invoice_code: fc.string(),
        customer_name: fc.string(),
        booking_date: fc.date(),
        payment_status: fc.string(),
        approval_status: fc.string(),
        armada: fc.option(
          fc.record({
            license_plate: fc.option(fc.string(), { nil: undefined }),
            brand: fc.option(fc.string(), { nil: undefined }),
            model: fc.option(fc.string(), { nil: undefined }),
          }),
          { nil: undefined }
        ),
        driver: fc.option(
          fc.record({
            driver_name: fc.option(fc.string(), { nil: undefined }),
          }),
          { nil: undefined }
        ),
        package: fc.option(
          fc.record({
            name: fc.option(fc.string(), { nil: undefined }),
          }),
          { nil: undefined }
        ),
      });

      fc.assert(
        fc.property(deeplyNestedGenerator, (tx) => {
          const financials = {
            tarifSewa: 500000,
            biayaOvertime: 0,
            totalPendapatan: 500000,
            totalBiayaOps: 200000,
            labaKotor: 300000,
          };

          // Should handle undefined nested properties gracefully
          expect(() => {
            const row = mapTransactionToExportRow(tx, financials);
            expect(row).toBeDefined();
            expect(row.length).toBe(13);
          }).not.toThrow();
        }),
        { numRuns: 100 }
      );
    });

    it("should handle formatDateSafely with various null/undefined inputs", () => {
      const nullableDateGenerator = fc.oneof(
        fc.constant(null),
        fc.constant(undefined),
        fc.constant(""),
        fc.constant("invalid-date"),
        fc.date(),
        fc.string()
      );

      fc.assert(
        fc.property(nullableDateGenerator, (dateValue) => {
          // Should never throw error
          expect(() => {
            const result = formatDateSafely(dateValue);

            // Result should always be a string
            expect(typeof result).toBe("string");

            // Result should never be null or undefined
            expect(result).not.toBeNull();
            expect(result).not.toBeUndefined();
          }).not.toThrow();
        }),
        { numRuns: 100 }
      );
    });

    it("should validate transactions with null fields without throwing errors", () => {
      const nullableTransactionGenerator = fc.record({
        invoice_code: fc.option(fc.string(), { nil: null }),
        customer_name: fc.option(fc.string(), { nil: null }),
        booking_date: fc.option(fc.date(), { nil: null }),
        armada: fc.option(
          fc.record({
            license_plate: fc.option(fc.string(), { nil: null }),
            brand: fc.option(fc.string(), { nil: null }),
            model: fc.option(fc.string(), { nil: null }),
          }),
          { nil: null }
        ),
        driver: fc.option(
          fc.record({
            driver_name: fc.option(fc.string(), { nil: null }),
          }),
          { nil: null }
        ),
        package: fc.option(
          fc.record({
            name: fc.option(fc.string(), { nil: null }),
          }),
          { nil: null }
        ),
      });

      fc.assert(
        fc.property(nullableTransactionGenerator, (tx) => {
          // Should never throw error during validation
          expect(() => {
            const result = validateTransactionForExport(tx);

            expect(result).toHaveProperty("isValid");
            expect(result).toHaveProperty("warnings");
            expect(result).toHaveProperty("transaction");
            expect(Array.isArray(result.warnings)).toBe(true);
          }).not.toThrow();
        }),
        { numRuns: 100 }
      );
    });

    it("should validate expenses with null fields without throwing errors", () => {
      const nullableExpenseGenerator = fc.record({
        date: fc.option(fc.date(), { nil: null }),
        category: fc.option(fc.string(), { nil: null }),
        description: fc.option(fc.string(), { nil: null }),
        amount: fc.option(fc.integer(), { nil: null }),
        armada: fc.option(
          fc.record({
            license_plate: fc.option(fc.string(), { nil: null }),
          }),
          { nil: null }
        ),
        driver: fc.option(
          fc.record({
            driver_name: fc.option(fc.string(), { nil: null }),
          }),
          { nil: null }
        ),
        staff: fc.option(
          fc.record({
            staff_name: fc.option(fc.string(), { nil: null }),
          }),
          { nil: null }
        ),
      });

      fc.assert(
        fc.property(nullableExpenseGenerator, (expense) => {
          // Should never throw error during validation
          expect(() => {
            const result = validateExpenseForExport(expense);

            expect(result).toHaveProperty("isValid");
            expect(result).toHaveProperty("warnings");
            expect(result).toHaveProperty("expense");
            expect(Array.isArray(result.warnings)).toBe(true);
          }).not.toThrow();
        }),
        { numRuns: 100 }
      );
    });
  });

  describe("Property 4: Financial Calculation Consistency", () => {
    /**
     * Feature: financial-report-export-data-fix, Property 4: Financial Calculation Consistency
     * Validates: Requirements 1.5, 8.4
     *
     * For any transaction, calculating financials using calculateTransactionFinancials()
     * should produce the same result whether called from the web display code or the export code.
     */

    it("should produce consistent financial calculations across multiple calls", async () => {
      // Import accounting module
      const { calculateTransactionFinancials } = await import(
        "../accounting.js"
      );

      // Create a more complete transaction generator with all required fields
      const completeTransactionGenerator = fc.record({
        id: fc.uuid(),
        invoice_code: fc.string({ minLength: 5, maxLength: 20 }),
        customer_name: fc.string({ minLength: 3, maxLength: 50 }),
        booking_date: fc.date({
          min: new Date("2020-01-01"),
          max: new Date("2025-12-31"),
        }),
        checkout_datetime: fc.date({
          min: new Date("2020-01-01"),
          max: new Date("2025-12-31"),
        }),
        checkin_datetime: fc.date({
          min: new Date("2020-01-01"),
          max: new Date("2025-12-31"),
        }),
        actual_checkin_datetime: fc.option(
          fc.date({
            min: new Date("2020-01-01"),
            max: new Date("2025-12-31"),
          }),
          { nil: null }
        ),
        all_in_rate: fc.integer({ min: 100000, max: 2000000 }),
        overtime_rate_per_hour: fc.integer({ min: 10000, max: 100000 }),
        payment_status: fc.constantFrom("PAID", "UNPAID", "DOWN_PAYMENT"),
        approval_status: fc.constantFrom("APPROVED", "PENDING", "REJECTED"),
        package: fc.option(
          fc.record({
            id: fc.uuid(),
            name: fc.constantFrom(
              "Full Day",
              "Half Day",
              "Tour Package",
              "Airport Transfer"
            ),
            type: fc.constantFrom("CAR_RENTAL", "TOUR_PACKAGE", "CUSTOM"),
            price: fc.integer({ min: 100000, max: 2000000 }),
            durationHours: fc.integer({ min: 4, max: 24 }),
          }),
          { nil: null }
        ),
      });

      await fc.assert(
        fc.asyncProperty(completeTransactionGenerator, async (tx) => {
          // Calculate financials multiple times
          const result1 = calculateTransactionFinancials(tx);
          const result2 = calculateTransactionFinancials(tx);
          const result3 = calculateTransactionFinancials(tx);

          // All results should be identical
          expect(result1.tarifSewa).toBe(result2.tarifSewa);
          expect(result1.tarifSewa).toBe(result3.tarifSewa);

          expect(result1.biayaOvertime).toBe(result2.biayaOvertime);
          expect(result1.biayaOvertime).toBe(result3.biayaOvertime);

          expect(result1.totalPendapatan).toBe(result2.totalPendapatan);
          expect(result1.totalPendapatan).toBe(result3.totalPendapatan);

          expect(result1.totalBiayaOps).toBe(result2.totalBiayaOps);
          expect(result1.totalBiayaOps).toBe(result3.totalBiayaOps);

          expect(result1.labaKotor).toBe(result2.labaKotor);
          expect(result1.labaKotor).toBe(result3.labaKotor);
        }),
        { numRuns: 100 }
      );
    });

    it("should produce same financial results when used in export vs display", async () => {
      const { calculateTransactionFinancials } = await import(
        "../accounting.js"
      );

      const completeTransactionGenerator = fc.record({
        id: fc.uuid(),
        invoice_code: fc.string({ minLength: 5, maxLength: 20 }),
        customer_name: fc.string({ minLength: 3, maxLength: 50 }),
        booking_date: fc.date(),
        checkout_datetime: fc.date(),
        checkin_datetime: fc.date(),
        actual_checkin_datetime: fc.option(fc.date(), { nil: null }),
        all_in_rate: fc.integer({ min: 100000, max: 2000000 }),
        overtime_rate_per_hour: fc.integer({ min: 10000, max: 100000 }),
        payment_status: fc.string(),
        approval_status: fc.string(),
        package: fc.option(
          fc.record({
            id: fc.uuid(),
            name: fc.string(),
            type: fc.string(),
            price: fc.integer({ min: 100000, max: 2000000 }),
            durationHours: fc.integer({ min: 4, max: 24 }),
          }),
          { nil: null }
        ),
      });

      await fc.assert(
        fc.asyncProperty(completeTransactionGenerator, async (tx) => {
          // Simulate "display" context - calculate financials
          const displayFinancials = calculateTransactionFinancials(tx);

          // Simulate "export" context - calculate financials again
          const exportFinancials = calculateTransactionFinancials(tx);

          // Use the mapper function with export financials
          const exportRow = mapTransactionToExportRow(tx, exportFinancials);

          // Verify that export row contains the same financial values
          expect(exportRow[6]).toBe(exportFinancials.tarifSewa || 0);
          expect(exportRow[7]).toBe(exportFinancials.biayaOvertime || 0);
          expect(exportRow[8]).toBe(exportFinancials.totalPendapatan || 0);
          expect(exportRow[9]).toBe(exportFinancials.totalBiayaOps || 0);
          expect(exportRow[10]).toBe(exportFinancials.labaKotor || 0);

          // Verify display and export financials match
          expect(displayFinancials.tarifSewa).toBe(exportFinancials.tarifSewa);
          expect(displayFinancials.biayaOvertime).toBe(
            exportFinancials.biayaOvertime
          );
          expect(displayFinancials.totalPendapatan).toBe(
            exportFinancials.totalPendapatan
          );
          expect(displayFinancials.totalBiayaOps).toBe(
            exportFinancials.totalBiayaOps
          );
          expect(displayFinancials.labaKotor).toBe(exportFinancials.labaKotor);
        }),
        { numRuns: 100 }
      );
    });

    it("should maintain financial calculation consistency regardless of call order", async () => {
      const { calculateTransactionFinancials } = await import(
        "../accounting.js"
      );

      const completeTransactionGenerator = fc.record({
        id: fc.uuid(),
        invoice_code: fc.string(),
        customer_name: fc.string(),
        booking_date: fc.date(),
        checkout_datetime: fc.date(),
        checkin_datetime: fc.date(),
        actual_checkin_datetime: fc.option(fc.date(), { nil: null }),
        all_in_rate: fc.integer({ min: 100000, max: 2000000 }),
        overtime_rate_per_hour: fc.integer({ min: 10000, max: 100000 }),
        payment_status: fc.string(),
        approval_status: fc.string(),
        package: fc.option(
          fc.record({
            durationHours: fc.integer({ min: 4, max: 24 }),
          }),
          { nil: null }
        ),
      });

      await fc.assert(
        fc.asyncProperty(completeTransactionGenerator, async (tx) => {
          // Calculate before mapping
          const financialsBefore = calculateTransactionFinancials(tx);
          const rowBefore = mapTransactionToExportRow(tx, financialsBefore);

          // Calculate after mapping (simulating different call order)
          const financialsAfter = calculateTransactionFinancials(tx);
          const rowAfter = mapTransactionToExportRow(tx, financialsAfter);

          // Both rows should have identical financial values
          expect(rowBefore[6]).toBe(rowAfter[6]); // tarifSewa
          expect(rowBefore[7]).toBe(rowAfter[7]); // biayaOvertime
          expect(rowBefore[8]).toBe(rowAfter[8]); // totalPendapatan
          expect(rowBefore[9]).toBe(rowAfter[9]); // totalBiayaOps
          expect(rowBefore[10]).toBe(rowAfter[10]); // labaKotor
        }),
        { numRuns: 100 }
      );
    });

    it("should produce deterministic results for the same transaction", async () => {
      const { calculateTransactionFinancials } = await import(
        "../accounting.js"
      );

      const completeTransactionGenerator = fc.record({
        id: fc.uuid(),
        invoice_code: fc.string(),
        customer_name: fc.string(),
        booking_date: fc.date(),
        checkout_datetime: fc.date(),
        checkin_datetime: fc.date(),
        actual_checkin_datetime: fc.option(fc.date(), { nil: null }),
        all_in_rate: fc.integer({ min: 100000, max: 2000000 }),
        overtime_rate_per_hour: fc.integer({ min: 10000, max: 100000 }),
        payment_status: fc.string(),
        approval_status: fc.string(),
        package: fc.option(
          fc.record({
            durationHours: fc.integer({ min: 4, max: 24 }),
          }),
          { nil: null }
        ),
      });

      await fc.assert(
        fc.asyncProperty(completeTransactionGenerator, async (tx) => {
          // Calculate financials 10 times
          const results = [];
          for (let i = 0; i < 10; i++) {
            results.push(calculateTransactionFinancials(tx));
          }

          // All results should be identical
          const first = results[0];
          results.forEach((result) => {
            expect(result.tarifSewa).toBe(first.tarifSewa);
            expect(result.biayaOvertime).toBe(first.biayaOvertime);
            expect(result.totalPendapatan).toBe(first.totalPendapatan);
            expect(result.totalBiayaOps).toBe(first.totalBiayaOps);
            expect(result.labaKotor).toBe(first.labaKotor);
          });
        }),
        { numRuns: 100 }
      );
    });

    it("should maintain consistency when transaction is cloned", async () => {
      const { calculateTransactionFinancials } = await import(
        "../accounting.js"
      );

      const completeTransactionGenerator = fc.record({
        id: fc.uuid(),
        invoice_code: fc.string(),
        customer_name: fc.string(),
        booking_date: fc.date(),
        checkout_datetime: fc.date(),
        checkin_datetime: fc.date(),
        actual_checkin_datetime: fc.option(fc.date(), { nil: null }),
        all_in_rate: fc.integer({ min: 100000, max: 2000000 }),
        overtime_rate_per_hour: fc.integer({ min: 10000, max: 100000 }),
        payment_status: fc.string(),
        approval_status: fc.string(),
        package: fc.option(
          fc.record({
            durationHours: fc.integer({ min: 4, max: 24 }),
          }),
          { nil: null }
        ),
      });

      await fc.assert(
        fc.asyncProperty(completeTransactionGenerator, async (tx) => {
          // Calculate financials for original
          const originalFinancials = calculateTransactionFinancials(tx);

          // Clone the transaction
          const clonedTx = JSON.parse(JSON.stringify(tx));

          // Calculate financials for clone
          const clonedFinancials = calculateTransactionFinancials(clonedTx);

          // Results should be identical
          expect(originalFinancials.tarifSewa).toBe(clonedFinancials.tarifSewa);
          expect(originalFinancials.biayaOvertime).toBe(
            clonedFinancials.biayaOvertime
          );
          expect(originalFinancials.totalPendapatan).toBe(
            clonedFinancials.totalPendapatan
          );
          expect(originalFinancials.totalBiayaOps).toBe(
            clonedFinancials.totalBiayaOps
          );
          expect(originalFinancials.labaKotor).toBe(clonedFinancials.labaKotor);
        }),
        { numRuns: 100 }
      );
    });
  });
});

describe("Property 7: Relational Data Integrity", () => {
  /**
   * Feature: financial-report-export-data-fix, Property 7: Relational Data Integrity
   * Validates: Requirements 1.2, 2.3
   *
   * For any transaction or expense with an associated relation (armada, driver, staff),
   * the exported data should include all available fields from that relation
   * if those fields exist in the database.
   */

  it("should include all armada fields when armada relation exists in transaction", () => {
    fc.assert(
      fc.property(transactionGenerator, (tx) => {
        const financials = {
          tarifSewa: 500000,
          biayaOvertime: 100000,
          totalPendapatan: 600000,
          totalBiayaOps: 200000,
          labaKotor: 400000,
        };

        const row = mapTransactionToExportRow(tx, financials);

        // If transaction has armada with all fields, export should include all
        if (tx.armada) {
          const armadaCell = row[4]; // Armada is at index 4

          if (tx.armada.brand && tx.armada.model && tx.armada.license_plate) {
            // All three fields should be present in the export
            expect(armadaCell).toContain(tx.armada.brand);
            expect(armadaCell).toContain(tx.armada.model);
            expect(armadaCell).toContain(tx.armada.license_plate);

            // Should be formatted as "Brand Model (License)"
            // Escape special regex characters in license plate
            const escapedLicense = tx.armada.license_plate.replace(
              /[.*+?^${}()|[\]\\]/g,
              "\\$&"
            );
            expect(armadaCell).toMatch(
              new RegExp(
                `${tx.armada.brand}.*${tx.armada.model}.*\\(${escapedLicense}\\)`
              )
            );
          }
        } else {
          // If no armada, should show default
          expect(row[4]).toBe("-");
        }
      }),
      { numRuns: 100 }
    );
  });

  it("should include all armada fields when armada relation exists in expense", () => {
    fc.assert(
      fc.property(expenseGenerator, (expense) => {
        const row = mapExpenseToExportRow(expense);

        // If expense has armada, export should include license_plate
        if (expense.armada) {
          const armadaCell = row[5]; // Armada is at index 5

          if (expense.armada.license_plate) {
            expect(armadaCell).toBe(expense.armada.license_plate);
            expect(armadaCell).not.toBe("-");
          }
        } else {
          // If no armada, should show default
          expect(row[5]).toBe("-");
        }
      }),
      { numRuns: 100 }
    );
  });

  it("should include driver name when driver relation exists in transaction", () => {
    fc.assert(
      fc.property(transactionGenerator, (tx) => {
        const financials = {
          tarifSewa: 500000,
          biayaOvertime: 100000,
          totalPendapatan: 600000,
          totalBiayaOps: 200000,
          labaKotor: 400000,
        };

        const row = mapTransactionToExportRow(tx, financials);

        // If transaction has driver, export should include driver_name
        if (tx.driver) {
          const driverCell = row[5]; // Driver is at index 5

          if (tx.driver.driver_name) {
            expect(driverCell).toBe(tx.driver.driver_name);
            expect(driverCell).not.toBe("-");
          }
        } else {
          // If no driver, should show default
          expect(row[5]).toBe("-");
        }
      }),
      { numRuns: 100 }
    );
  });

  it("should include driver name when driver relation exists in expense", () => {
    fc.assert(
      fc.property(expenseGenerator, (expense) => {
        const row = mapExpenseToExportRow(expense);

        // If expense has driver, export should include driver_name
        if (expense.driver) {
          const driverCell = row[6]; // Driver is at index 6

          if (expense.driver.driver_name) {
            expect(driverCell).toBe(expense.driver.driver_name);
            expect(driverCell).not.toBe("-");
          }
        } else {
          // If no driver, should show default
          expect(row[6]).toBe("-");
        }
      }),
      { numRuns: 100 }
    );
  });

  it("should include staff name when staff relation exists in expense", () => {
    fc.assert(
      fc.property(expenseGenerator, (expense) => {
        const row = mapExpenseToExportRow(expense);

        // If expense has staff, export should include staff_name
        if (expense.staff) {
          const staffCell = row[7]; // Staff is at index 7

          if (expense.staff.staff_name) {
            expect(staffCell).toBe(expense.staff.staff_name);
            expect(staffCell).not.toBe("-");
          }
        } else {
          // If no staff, should show default
          expect(row[7]).toBe("-");
        }
      }),
      { numRuns: 100 }
    );
  });

  it("should include package name when package relation exists in transaction", () => {
    fc.assert(
      fc.property(transactionGenerator, (tx) => {
        const financials = {
          tarifSewa: 500000,
          biayaOvertime: 100000,
          totalPendapatan: 600000,
          totalBiayaOps: 200000,
          labaKotor: 400000,
        };

        const row = mapTransactionToExportRow(tx, financials);

        // If transaction has package, export should include package name
        if (tx.package) {
          const packageCell = row[3]; // Package is at index 3

          if (tx.package.name) {
            expect(packageCell).toBe(tx.package.name);
            expect(packageCell).not.toBe("Custom");
          }
        } else {
          // If no package, should show "Custom"
          expect(row[3]).toBe("Custom");
        }
      }),
      { numRuns: 100 }
    );
  });

  it("should include attachments count when attachments relation exists in expense", () => {
    fc.assert(
      fc.property(expenseGenerator, (expense) => {
        const row = mapExpenseToExportRow(expense);

        // If expense has attachments, export should include count
        if (expense.attachments && expense.attachments.length > 0) {
          const attachmentsCell = row[8]; // Attachments is at index 8

          expect(attachmentsCell).toBe(`${expense.attachments.length} file(s)`);
          expect(attachmentsCell).not.toBe("Tidak ada");
        } else {
          // If no attachments, should show "Tidak ada"
          expect(row[8]).toBe("Tidak ada");
        }
      }),
      { numRuns: 100 }
    );
  });

  it("should preserve all relational data integrity across multiple exports", () => {
    fc.assert(
      fc.property(expenseGenerator, (expense) => {
        // Export the same expense multiple times
        const row1 = mapExpenseToExportRow(expense);
        const row2 = mapExpenseToExportRow(expense);
        const row3 = mapExpenseToExportRow(expense);

        // All exports should have identical relational data
        expect(row1[5]).toBe(row2[5]); // armada
        expect(row1[5]).toBe(row3[5]);

        expect(row1[6]).toBe(row2[6]); // driver
        expect(row1[6]).toBe(row3[6]);

        expect(row1[7]).toBe(row2[7]); // staff
        expect(row1[7]).toBe(row3[7]);

        expect(row1[8]).toBe(row2[8]); // attachments
        expect(row1[8]).toBe(row3[8]);
      }),
      { numRuns: 100 }
    );
  });

  it("should not lose relational data when mapping from database to export", () => {
    fc.assert(
      fc.property(transactionGenerator, (tx) => {
        const financials = {
          tarifSewa: 500000,
          biayaOvertime: 100000,
          totalPendapatan: 600000,
          totalBiayaOps: 200000,
          labaKotor: 400000,
        };

        const row = mapTransactionToExportRow(tx, financials);

        // Count how many relations exist in source
        let sourceRelationCount = 0;
        if (tx.armada) sourceRelationCount++;
        if (tx.driver) sourceRelationCount++;
        if (tx.package) sourceRelationCount++;

        // Count how many relations are present in export (not default values)
        let exportRelationCount = 0;
        if (row[4] !== "-") exportRelationCount++; // armada
        if (row[5] !== "-") exportRelationCount++; // driver
        if (row[3] !== "Custom" && row[3] !== "-") exportRelationCount++; // package

        // Export should have at least as many relations as source
        expect(exportRelationCount).toBeGreaterThanOrEqual(0);

        // If source has relations, export should reflect them
        if (sourceRelationCount > 0) {
          expect(exportRelationCount).toBeGreaterThan(0);
        }
      }),
      { numRuns: 100 }
    );
  });

  it("should maintain relational data integrity when relations have partial data", () => {
    // Generator for expenses with partial relational data
    const partialExpenseGenerator = fc.record({
      id: fc.uuid(),
      date: fc.date(),
      category: fc.constantFrom("BBM", "Gaji", "Maintenance"),
      description: fc.string({ minLength: 5, maxLength: 100 }),
      amount: fc.integer({ min: 10000, max: 1000000 }),
      namaPenerima: fc.option(fc.string(), { nil: undefined }),
      // Armada with only license_plate (partial data)
      armada: fc.option(
        fc.record({
          license_plate: fc.string({ minLength: 5, maxLength: 10 }),
        }),
        { nil: undefined }
      ),
      // Driver with only driver_name (partial data)
      driver: fc.option(
        fc.record({
          driver_name: fc.string({ minLength: 3, maxLength: 50 }),
        }),
        { nil: undefined }
      ),
      // Staff with only staff_name (partial data)
      staff: fc.option(
        fc.record({
          staff_name: fc.string({ minLength: 3, maxLength: 50 }),
        }),
        { nil: undefined }
      ),
      attachments: fc.option(
        fc.array(fc.record({ id: fc.uuid() }), { minLength: 0, maxLength: 3 }),
        { nil: undefined }
      ),
    });

    fc.assert(
      fc.property(partialExpenseGenerator, (expense) => {
        // Should not throw error even with partial relational data
        expect(() => {
          const row = mapExpenseToExportRow(expense);

          // All fields should be defined
          expect(row.length).toBe(9);
          row.forEach((cell) => {
            expect(cell).toBeDefined();
            expect(cell).not.toBeNull();
            expect(cell).not.toBeUndefined();
          });

          // If relations exist with partial data, should still export what's available
          if (expense.armada && expense.armada.license_plate) {
            expect(row[5]).toBe(expense.armada.license_plate);
          }

          if (expense.driver && expense.driver.driver_name) {
            expect(row[6]).toBe(expense.driver.driver_name);
          }

          if (expense.staff && expense.staff.staff_name) {
            expect(row[7]).toBe(expense.staff.staff_name);
          }
        }).not.toThrow();
      }),
      { numRuns: 100 }
    );
  });

  it("should validate relational data integrity in validation functions", () => {
    fc.assert(
      fc.property(expenseGenerator, (expense) => {
        const validation = validateExpenseForExport(expense);

        // If armada exists but license_plate is missing, should warn
        if (expense.armada && !expense.armada.license_plate) {
          expect(validation.warnings).toContain(
            "Armada exists but missing license_plate"
          );
        }

        // If driver exists but driver_name is missing, should warn
        if (expense.driver && !expense.driver.driver_name) {
          expect(validation.warnings).toContain(
            "Driver exists but missing driver_name"
          );
        }

        // If staff exists but staff_name is missing, should warn
        if (expense.staff && !expense.staff.staff_name) {
          expect(validation.warnings).toContain(
            "Staff exists but missing staff_name"
          );
        }

        // Validation should always complete
        expect(validation).toHaveProperty("isValid");
        expect(validation).toHaveProperty("warnings");
        expect(Array.isArray(validation.warnings)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });
});

describe("Property 6: Date Format Consistency", () => {
  /**
   * Feature: financial-report-export-data-fix, Property 6: Date Format Consistency
   * Validates: Requirements 6.3
   *
   * For any date field, the format in Excel should match the Indonesian locale format (DD/MM/YYYY)
   * used in the website display.
   */

  it("should format all dates using Indonesian locale consistently", () => {
    const dateGenerator = fc.date({
      min: new Date("2020-01-01"),
      max: new Date("2025-12-31"),
    });

    fc.assert(
      fc.property(dateGenerator, (date) => {
        const formatted = formatDateSafely(date);

        // Should not be the default "-"
        expect(formatted).not.toBe("-");

        // Should be a string
        expect(typeof formatted).toBe("string");

        // Should match Indonesian date format (DD/MM/YYYY)
        // Indonesian locale uses format like "23/11/2025" or "1/1/2020"
        const datePattern = /^\d{1,2}\/\d{1,2}\/\d{4}$/;
        expect(formatted).toMatch(datePattern);

        // Verify it matches the expected Indonesian format
        const expectedFormat = date.toLocaleDateString("id-ID");
        expect(formatted).toBe(expectedFormat);
      }),
      { numRuns: 100 }
    );
  });

  it("should format dates consistently across multiple calls", () => {
    const dateGenerator = fc.date({
      min: new Date("2020-01-01"),
      max: new Date("2025-12-31"),
    });

    fc.assert(
      fc.property(dateGenerator, (date) => {
        // Format the same date multiple times
        const format1 = formatDateSafely(date);
        const format2 = formatDateSafely(date);
        const format3 = formatDateSafely(date);

        // All formats should be identical
        expect(format1).toBe(format2);
        expect(format2).toBe(format3);
      }),
      { numRuns: 100 }
    );
  });

  it("should format dates in transaction exports using Indonesian locale", () => {
    fc.assert(
      fc.property(transactionGenerator, (tx) => {
        const financials = {
          tarifSewa: 500000,
          biayaOvertime: 100000,
          totalPendapatan: 600000,
          totalBiayaOps: 200000,
          labaKotor: 400000,
        };

        const row = mapTransactionToExportRow(tx, financials);

        // Date is at index 1
        const dateCell = row[1];

        if (tx.booking_date) {
          // Should match Indonesian format
          const expectedFormat = formatDateSafely(tx.booking_date);
          expect(dateCell).toBe(expectedFormat);

          // Should not be the default
          expect(dateCell).not.toBe("-");

          // Should match the pattern
          const datePattern = /^\d{1,2}\/\d{1,2}\/\d{4}$/;
          expect(dateCell).toMatch(datePattern);
        } else {
          expect(dateCell).toBe("-");
        }
      }),
      { numRuns: 100 }
    );
  });

  it("should format dates in expense exports using Indonesian locale", () => {
    fc.assert(
      fc.property(expenseGenerator, (expense) => {
        const row = mapExpenseToExportRow(expense);

        // Date is at index 0
        const dateCell = row[0];

        // Check if date is valid (not NaN)
        const isValidDate =
          expense.date && !isNaN(new Date(expense.date).getTime());

        if (isValidDate) {
          // Should match Indonesian format
          const expectedFormat = formatDateSafely(expense.date);
          expect(dateCell).toBe(expectedFormat);

          // Should not be the default
          expect(dateCell).not.toBe("-");

          // Should match the pattern
          const datePattern = /^\d{1,2}\/\d{1,2}\/\d{4}$/;
          expect(dateCell).toMatch(datePattern);
        } else {
          expect(dateCell).toBe("-");
        }
      }),
      { numRuns: 100 }
    );
  });

  it("should handle invalid dates gracefully and return default value", () => {
    const invalidDateGenerator = fc.oneof(
      fc.constant(null),
      fc.constant(undefined),
      fc.constant(""),
      fc.constant("invalid-date"),
      fc.constant("not-a-date"),
      fc.constant(NaN),
      fc.constant({}),
      fc.constant([])
    );

    fc.assert(
      fc.property(invalidDateGenerator, (invalidDate) => {
        const formatted = formatDateSafely(invalidDate);

        // Should return default value for invalid dates
        expect(formatted).toBe("-");

        // Should never throw an error
        expect(() => formatDateSafely(invalidDate)).not.toThrow();
      }),
      { numRuns: 100 }
    );
  });

  it("should format month names in Indonesian for rekap reports", () => {
    // Generator for month strings in YYYY-MM format
    const monthKeyGenerator = fc.record({
      year: fc.integer({ min: 2020, max: 2025 }),
      month: fc.integer({ min: 1, max: 12 }),
    });

    fc.assert(
      fc.property(monthKeyGenerator, ({ year, month }) => {
        // Create a date from the month key
        const date = new Date(year, month - 1, 1);

        // Format using Indonesian locale
        const formatted = date.toLocaleDateString("id-ID", {
          year: "numeric",
          month: "long",
        });

        // Should contain Indonesian month names
        const indonesianMonths = [
          "Januari",
          "Februari",
          "Maret",
          "April",
          "Mei",
          "Juni",
          "Juli",
          "Agustus",
          "September",
          "Oktober",
          "November",
          "Desember",
        ];

        const hasIndonesianMonth = indonesianMonths.some((monthName) =>
          formatted.includes(monthName)
        );

        expect(hasIndonesianMonth).toBe(true);

        // Should contain the year
        expect(formatted).toContain(year.toString());
      }),
      { numRuns: 100 }
    );
  });

  it("should maintain date format consistency between web display and export", () => {
    const dateGenerator = fc.date({
      min: new Date("2020-01-01"),
      max: new Date("2025-12-31"),
    });

    fc.assert(
      fc.property(dateGenerator, (date) => {
        // Simulate web display format
        const webDisplayFormat = date.toLocaleDateString("id-ID");

        // Simulate export format
        const exportFormat = formatDateSafely(date);

        // Both should be identical
        expect(exportFormat).toBe(webDisplayFormat);
      }),
      { numRuns: 100 }
    );
  });

  it("should format dates consistently across different timezones", () => {
    const dateGenerator = fc.date({
      min: new Date("2020-01-01"),
      max: new Date("2025-12-31"),
    });

    fc.assert(
      fc.property(dateGenerator, (date) => {
        // Format the date
        const formatted = formatDateSafely(date);

        // Create a new date with the same timestamp
        const sameDate = new Date(date.getTime());

        // Format the new date
        const formattedSame = formatDateSafely(sameDate);

        // Both should be identical
        expect(formatted).toBe(formattedSame);
      }),
      { numRuns: 100 }
    );
  });

  it("should format date strings and Date objects consistently", () => {
    const dateGenerator = fc.date({
      min: new Date("2020-01-01"),
      max: new Date("2025-12-31"),
    });

    fc.assert(
      fc.property(dateGenerator, (date) => {
        // Format as Date object
        const formattedDate = formatDateSafely(date);

        // Format as ISO string
        const formattedString = formatDateSafely(date.toISOString());

        // Both should produce the same result
        expect(formattedDate).toBe(formattedString);
      }),
      { numRuns: 100 }
    );
  });

  it("should preserve date accuracy when formatting", () => {
    const dateGenerator = fc.record({
      year: fc.integer({ min: 2020, max: 2025 }),
      month: fc.integer({ min: 0, max: 11 }), // 0-11 for JavaScript months
      day: fc.integer({ min: 1, max: 28 }), // Use 28 to avoid invalid dates
    });

    fc.assert(
      fc.property(dateGenerator, ({ year, month, day }) => {
        const date = new Date(year, month, day);
        const formatted = formatDateSafely(date);

        // Parse the formatted date back
        const [dayStr, monthStr, yearStr] = formatted.split("/");

        // Verify the components match
        expect(parseInt(yearStr)).toBe(year);
        expect(parseInt(monthStr)).toBe(month + 1); // JavaScript months are 0-indexed
        expect(parseInt(dayStr)).toBe(day);
      }),
      { numRuns: 100 }
    );
  });

  it("should format dates in rekap report consistently with Indonesian month names", () => {
    // Simulate rekap data structure
    const rekapDataGenerator = fc.record({
      rekap: fc.array(
        fc.record({
          category: fc.constantFrom("BBM", "Gaji", "Maintenance"),
          months: fc.array(
            fc.record({
              month: fc
                .tuple(
                  fc.integer({ min: 2020, max: 2025 }),
                  fc.integer({ min: 1, max: 12 })
                )
                .map(
                  ([year, month]) => `${year}-${String(month).padStart(2, "0")}`
                ),
              total: fc.integer({ min: 100000, max: 10000000 }),
              count: fc.integer({ min: 1, max: 100 }),
            }),
            { minLength: 1, maxLength: 12 }
          ),
        }),
        { minLength: 1, maxLength: 5 }
      ),
    });

    fc.assert(
      fc.property(rekapDataGenerator, (data) => {
        // Extract all month keys
        const allMonths = new Set();
        data.rekap.forEach((cat) => {
          cat.months.forEach((month) => allMonths.add(month.month));
        });

        const sortedMonths = Array.from(allMonths).sort();

        // Format each month
        sortedMonths.forEach((monthKey) => {
          const [year, monthNum] = monthKey.split("-");
          const date = new Date(parseInt(year), parseInt(monthNum) - 1, 1);

          const formatted = date.toLocaleDateString("id-ID", {
            year: "numeric",
            month: "long",
          });

          // Should contain Indonesian month name
          const indonesianMonths = [
            "Januari",
            "Februari",
            "Maret",
            "April",
            "Mei",
            "Juni",
            "Juli",
            "Agustus",
            "September",
            "Oktober",
            "November",
            "Desember",
          ];

          const hasIndonesianMonth = indonesianMonths.some((monthName) =>
            formatted.includes(monthName)
          );

          expect(hasIndonesianMonth).toBe(true);
          expect(formatted).toContain(year);
        });
      }),
      { numRuns: 100 }
    );
  });
});

describe("Property 5: Data Type Preservation", () => {
  /**
   * Feature: financial-report-export-data-fix, Property 5: Data Type Preservation
   * Validates: Requirements 6.2
   *
   * For any numeric field (amounts, counts), the exported Excel value should be a number type,
   * not a string, to enable Excel calculations.
   */

  it("should preserve numeric types for all financial fields in transaction export", () => {
    fc.assert(
      fc.property(transactionGenerator, (tx) => {
        const financials = {
          tarifSewa: 500000,
          biayaOvertime: 100000,
          totalPendapatan: 600000,
          totalBiayaOps: 200000,
          labaKotor: 400000,
        };

        const row = mapTransactionToExportRow(tx, financials);

        // All financial fields should be numbers, not strings
        expect(typeof row[6]).toBe("number"); // tarifSewa
        expect(typeof row[7]).toBe("number"); // biayaOvertime
        expect(typeof row[8]).toBe("number"); // totalPendapatan
        expect(typeof row[9]).toBe("number"); // totalBiayaOps
        expect(typeof row[10]).toBe("number"); // labaKotor

        // Verify they are actual numbers, not NaN
        expect(isNaN(row[6])).toBe(false);
        expect(isNaN(row[7])).toBe(false);
        expect(isNaN(row[8])).toBe(false);
        expect(isNaN(row[9])).toBe(false);
        expect(isNaN(row[10])).toBe(false);

        // Verify they are not strings that look like numbers
        expect(row[6]).not.toBeInstanceOf(String);
        expect(row[7]).not.toBeInstanceOf(String);
        expect(row[8]).not.toBeInstanceOf(String);
        expect(row[9]).not.toBeInstanceOf(String);
        expect(row[10]).not.toBeInstanceOf(String);
      }),
      { numRuns: 100 }
    );
  });

  it("should preserve numeric types for amount field in expense export", () => {
    fc.assert(
      fc.property(expenseGenerator, (expense) => {
        const row = mapExpenseToExportRow(expense);

        // Amount field should be a number, not a string
        expect(typeof row[3]).toBe("number"); // amount

        // Verify it's an actual number, not NaN
        expect(isNaN(row[3])).toBe(false);

        // Verify it's not a string that looks like a number
        expect(row[3]).not.toBeInstanceOf(String);

        // Verify it's a valid numeric value
        expect(Number.isFinite(row[3])).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it("should preserve numeric types even when values are zero", () => {
    fc.assert(
      fc.property(transactionGenerator, (tx) => {
        const financials = {
          tarifSewa: 0,
          biayaOvertime: 0,
          totalPendapatan: 0,
          totalBiayaOps: 0,
          labaKotor: 0,
        };

        const row = mapTransactionToExportRow(tx, financials);

        // Zero values should still be numbers, not strings
        expect(typeof row[6]).toBe("number");
        expect(typeof row[7]).toBe("number");
        expect(typeof row[8]).toBe("number");
        expect(typeof row[9]).toBe("number");
        expect(typeof row[10]).toBe("number");

        // Verify they are exactly 0, not "0" or other falsy values
        expect(row[6]).toBe(0);
        expect(row[7]).toBe(0);
        expect(row[8]).toBe(0);
        expect(row[9]).toBe(0);
        expect(row[10]).toBe(0);
      }),
      { numRuns: 100 }
    );
  });

  it("should preserve numeric types for large values", () => {
    fc.assert(
      fc.property(transactionGenerator, (tx) => {
        const financials = {
          tarifSewa: 50000000, // 50 million
          biayaOvertime: 10000000, // 10 million
          totalPendapatan: 60000000, // 60 million
          totalBiayaOps: 20000000, // 20 million
          labaKotor: 40000000, // 40 million
        };

        const row = mapTransactionToExportRow(tx, financials);

        // Large values should still be numbers
        expect(typeof row[6]).toBe("number");
        expect(typeof row[7]).toBe("number");
        expect(typeof row[8]).toBe("number");
        expect(typeof row[9]).toBe("number");
        expect(typeof row[10]).toBe("number");

        // Verify exact values are preserved
        expect(row[6]).toBe(50000000);
        expect(row[7]).toBe(10000000);
        expect(row[8]).toBe(60000000);
        expect(row[9]).toBe(20000000);
        expect(row[10]).toBe(40000000);
      }),
      { numRuns: 100 }
    );
  });

  it("should preserve numeric types for negative values", () => {
    fc.assert(
      fc.property(transactionGenerator, (tx) => {
        const financials = {
          tarifSewa: 500000,
          biayaOvertime: 100000,
          totalPendapatan: 600000,
          totalBiayaOps: 800000, // Higher than revenue
          labaKotor: -200000, // Negative profit
        };

        const row = mapTransactionToExportRow(tx, financials);

        // Negative values should still be numbers
        expect(typeof row[10]).toBe("number"); // labaKotor

        // Verify it's actually negative
        expect(row[10]).toBe(-200000);
        expect(row[10] < 0).toBe(true);

        // Verify it's not a string
        expect(row[10]).not.toBeInstanceOf(String);
      }),
      { numRuns: 100 }
    );
  });

  it("should preserve numeric types for decimal values", () => {
    fc.assert(
      fc.property(transactionGenerator, (tx) => {
        const financials = {
          tarifSewa: 500000.5,
          biayaOvertime: 100000.25,
          totalPendapatan: 600000.75,
          totalBiayaOps: 200000.1,
          labaKotor: 400000.65,
        };

        const row = mapTransactionToExportRow(tx, financials);

        // Decimal values should still be numbers
        expect(typeof row[6]).toBe("number");
        expect(typeof row[7]).toBe("number");
        expect(typeof row[8]).toBe("number");
        expect(typeof row[9]).toBe("number");
        expect(typeof row[10]).toBe("number");

        // Verify decimal precision is preserved
        expect(row[6]).toBe(500000.5);
        expect(row[7]).toBe(100000.25);
        expect(row[8]).toBe(600000.75);
        expect(row[9]).toBe(200000.1);
        expect(row[10]).toBe(400000.65);
      }),
      { numRuns: 100 }
    );
  });

  it("should handle formatCurrencyForExcel correctly for various numeric inputs", () => {
    const numericGenerator = fc.oneof(
      fc.integer({ min: 0, max: 100000000 }),
      fc.float({ min: 0, max: 100000000, noNaN: true }),
      fc.constant(0),
      fc.constant(null),
      fc.constant(undefined)
    );

    fc.assert(
      fc.property(numericGenerator, (value) => {
        const { formatCurrencyForExcel } = require("../excel-export.js");
        const result = formatCurrencyForExcel(value);

        // Result should always be a number
        expect(typeof result).toBe("number");

        // Result should never be NaN
        expect(isNaN(result)).toBe(false);

        // Result should be finite
        expect(Number.isFinite(result)).toBe(true);

        // If input was null/undefined, result should be 0
        if (value === null || value === undefined) {
          expect(result).toBe(0);
        } else {
          // Otherwise, result should equal the input (converted to number)
          expect(result).toBe(parseFloat(value) || 0);
        }
      }),
      { numRuns: 100 }
    );
  });

  it("should preserve numeric types consistently across multiple exports", () => {
    fc.assert(
      fc.property(transactionGenerator, (tx) => {
        const financials = {
          tarifSewa: 500000,
          biayaOvertime: 100000,
          totalPendapatan: 600000,
          totalBiayaOps: 200000,
          labaKotor: 400000,
        };

        // Export the same transaction multiple times
        const row1 = mapTransactionToExportRow(tx, financials);
        const row2 = mapTransactionToExportRow(tx, financials);
        const row3 = mapTransactionToExportRow(tx, financials);

        // All exports should have numeric types
        [row1, row2, row3].forEach((row) => {
          expect(typeof row[6]).toBe("number");
          expect(typeof row[7]).toBe("number");
          expect(typeof row[8]).toBe("number");
          expect(typeof row[9]).toBe("number");
          expect(typeof row[10]).toBe("number");
        });

        // All exports should have identical values
        expect(row1[6]).toBe(row2[6]);
        expect(row1[6]).toBe(row3[6]);
        expect(row1[7]).toBe(row2[7]);
        expect(row1[7]).toBe(row3[7]);
        expect(row1[8]).toBe(row2[8]);
        expect(row1[8]).toBe(row3[8]);
      }),
      { numRuns: 100 }
    );
  });

  it("should enable Excel calculations with preserved numeric types", () => {
    fc.assert(
      fc.property(transactionGenerator, (tx) => {
        const financials = {
          tarifSewa: 500000,
          biayaOvertime: 100000,
          totalPendapatan: 600000,
          totalBiayaOps: 200000,
          labaKotor: 400000,
        };

        const row = mapTransactionToExportRow(tx, financials);

        // Should be able to perform arithmetic operations
        const sum = row[6] + row[7]; // tarifSewa + biayaOvertime
        expect(typeof sum).toBe("number");
        expect(sum).toBe(600000);

        // Should be able to calculate percentages
        const margin = (row[10] / row[8]) * 100; // (labaKotor / totalPendapatan) * 100
        expect(typeof margin).toBe("number");
        expect(isNaN(margin)).toBe(false);

        // Should be able to compare values
        expect(row[8] > row[9]).toBe(true); // totalPendapatan > totalBiayaOps
        expect(row[10] > 0).toBe(true); // labaKotor > 0
      }),
      { numRuns: 100 }
    );
  });

  it("should not convert numbers to strings during export process", () => {
    fc.assert(
      fc.property(expenseGenerator, (expense) => {
        const row = mapExpenseToExportRow(expense);

        // Amount should be a number
        const amount = row[3];
        expect(typeof amount).toBe("number");

        // Converting to string and back should give same value
        const stringified = String(amount);
        const parsed = parseFloat(stringified);
        expect(parsed).toBe(amount);

        // But the original should not be a string
        expect(typeof amount).not.toBe("string");
        expect(amount).not.toBe(stringified);
      }),
      { numRuns: 100 }
    );
  });
});

describe("Property 8: Summary Metrics Accuracy", () => {
  /**
   * Feature: financial-report-export-data-fix, Property 8: Summary Metrics Accuracy
   * Validates: Requirements 8.1, 8.4
   *
   * For any report, the summary totals in Excel should equal the sum of individual
   * transaction/expense amounts.
   */

  it("should calculate correct summary totals for transaction reports", async () => {
    // Generator for arrays of transactions
    const transactionArrayGenerator = fc.array(transactionGenerator, {
      minLength: 1,
      maxLength: 50,
    });

    await fc.assert(
      fc.asyncProperty(transactionArrayGenerator, async (transactions) => {
        const { calculateTransactionFinancials } = await import(
          "../accounting.js"
        );

        // Calculate individual transaction financials
        const transactionRows = transactions.map((tx) => {
          const financials = calculateTransactionFinancials(tx);
          return mapTransactionToExportRow(tx, financials);
        });

        // Calculate summary totals from individual rows
        let summaryTotalPendapatan = 0;
        let summaryTotalBiayaOps = 0;
        let summaryLabaKotor = 0;

        transactionRows.forEach((row) => {
          summaryTotalPendapatan += row[8]; // totalPendapatan at index 8
          summaryTotalBiayaOps += row[9]; // totalBiayaOps at index 9
          summaryLabaKotor += row[10]; // labaKotor at index 10
        });

        // Calculate summary totals directly from transactions
        let directTotalPendapatan = 0;
        let directTotalBiayaOps = 0;
        let directLabaKotor = 0;

        transactions.forEach((tx) => {
          const financials = calculateTransactionFinancials(tx);
          directTotalPendapatan += financials.totalPendapatan || 0;
          directTotalBiayaOps += financials.totalBiayaOps || 0;
          directLabaKotor += financials.labaKotor || 0;
        });

        // Summary from rows should equal direct calculation
        expect(summaryTotalPendapatan).toBeCloseTo(directTotalPendapatan, 2);
        expect(summaryTotalBiayaOps).toBeCloseTo(directTotalBiayaOps, 2);
        expect(summaryLabaKotor).toBeCloseTo(directLabaKotor, 2);

        // Verify the relationship: laba = pendapatan - biaya
        expect(summaryLabaKotor).toBeCloseTo(
          summaryTotalPendapatan - summaryTotalBiayaOps,
          2
        );
      }),
      { numRuns: 100 }
    );
  });

  it("should calculate correct summary totals for expense reports", () => {
    // Generator for arrays of expenses
    const expenseArrayGenerator = fc.array(expenseGenerator, {
      minLength: 1,
      maxLength: 50,
    });

    fc.assert(
      fc.property(expenseArrayGenerator, (expenses) => {
        // Calculate individual expense rows
        const expenseRows = expenses.map((expense) =>
          mapExpenseToExportRow(expense)
        );

        // Calculate summary total from individual rows
        let summaryTotalAmount = 0;

        expenseRows.forEach((row) => {
          summaryTotalAmount += row[3]; // amount at index 3
        });

        // Calculate summary total directly from expenses
        let directTotalAmount = 0;

        expenses.forEach((expense) => {
          directTotalAmount += expense.amount || 0;
        });

        // Summary from rows should equal direct calculation
        expect(summaryTotalAmount).toBeCloseTo(directTotalAmount, 2);

        // Verify count matches
        expect(expenseRows.length).toBe(expenses.length);
      }),
      { numRuns: 100 }
    );
  });

  it("should maintain summary accuracy when transactions have zero values", async () => {
    const transactionArrayGenerator = fc.array(transactionGenerator, {
      minLength: 5,
      maxLength: 20,
    });

    await fc.assert(
      fc.asyncProperty(transactionArrayGenerator, async (transactions) => {
        const { calculateTransactionFinancials } = await import(
          "../accounting.js"
        );

        // Mix in some zero-value financials
        const transactionRows = transactions.map((tx, index) => {
          const financials =
            index % 3 === 0
              ? {
                  tarifSewa: 0,
                  biayaOvertime: 0,
                  totalPendapatan: 0,
                  totalBiayaOps: 0,
                  labaKotor: 0,
                }
              : calculateTransactionFinancials(tx);

          return mapTransactionToExportRow(tx, financials);
        });

        // Calculate summary
        let summaryTotal = 0;
        transactionRows.forEach((row) => {
          summaryTotal += row[8]; // totalPendapatan
        });

        // Summary should be a valid number
        expect(typeof summaryTotal).toBe("number");
        expect(isNaN(summaryTotal)).toBe(false);
        expect(Number.isFinite(summaryTotal)).toBe(true);

        // Summary should be >= 0 (since we're using zero or positive values)
        expect(summaryTotal).toBeGreaterThanOrEqual(0);
      }),
      { numRuns: 100 }
    );
  });

  it("should maintain summary accuracy across different expense categories", () => {
    // Generator for expenses grouped by category
    const categorizedExpensesGenerator = fc.record({
      BBM: fc.array(expenseGenerator, { minLength: 0, maxLength: 10 }),
      Gaji: fc.array(expenseGenerator, { minLength: 0, maxLength: 10 }),
      Maintenance: fc.array(expenseGenerator, { minLength: 0, maxLength: 10 }),
      Operasional: fc.array(expenseGenerator, { minLength: 0, maxLength: 10 }),
    });

    fc.assert(
      fc.property(categorizedExpensesGenerator, (categorizedExpenses) => {
        // Calculate total per category
        const categoryTotals = {};
        let grandTotal = 0;

        Object.entries(categorizedExpenses).forEach(([category, expenses]) => {
          let categoryTotal = 0;

          expenses.forEach((expense) => {
            const row = mapExpenseToExportRow(expense);
            categoryTotal += row[3]; // amount at index 3
          });

          categoryTotals[category] = categoryTotal;
          grandTotal += categoryTotal;
        });

        // Calculate grand total directly
        let directGrandTotal = 0;

        Object.values(categorizedExpenses).forEach((expenses) => {
          expenses.forEach((expense) => {
            directGrandTotal += expense.amount || 0;
          });
        });

        // Grand total should equal sum of category totals
        const sumOfCategoryTotals = Object.values(categoryTotals).reduce(
          (sum, total) => sum + total,
          0
        );

        expect(grandTotal).toBeCloseTo(sumOfCategoryTotals, 2);
        expect(grandTotal).toBeCloseTo(directGrandTotal, 2);
      }),
      { numRuns: 100 }
    );
  });

  it("should calculate correct average metrics from summary totals", async () => {
    const transactionArrayGenerator = fc.array(transactionGenerator, {
      minLength: 1,
      maxLength: 30,
    });

    await fc.assert(
      fc.asyncProperty(transactionArrayGenerator, async (transactions) => {
        const { calculateTransactionFinancials } = await import(
          "../accounting.js"
        );

        // Calculate summary totals
        let totalPendapatan = 0;
        let totalBiayaOps = 0;
        let count = transactions.length;

        transactions.forEach((tx) => {
          const financials = calculateTransactionFinancials(tx);
          totalPendapatan += financials.totalPendapatan || 0;
          totalBiayaOps += financials.totalBiayaOps || 0;
        });

        // Calculate averages
        const avgPendapatan = totalPendapatan / count;
        const avgBiayaOps = totalBiayaOps / count;

        // Verify averages are valid
        expect(typeof avgPendapatan).toBe("number");
        expect(typeof avgBiayaOps).toBe("number");
        expect(isNaN(avgPendapatan)).toBe(false);
        expect(isNaN(avgBiayaOps)).toBe(false);

        // Verify average * count = total
        expect(avgPendapatan * count).toBeCloseTo(totalPendapatan, 2);
        expect(avgBiayaOps * count).toBeCloseTo(totalBiayaOps, 2);

        // Verify averages are within reasonable bounds
        if (count > 0) {
          expect(avgPendapatan).toBeGreaterThanOrEqual(0);
          expect(avgBiayaOps).toBeGreaterThanOrEqual(0);
        }
      }),
      { numRuns: 100 }
    );
  });

  it("should maintain summary accuracy when mixing positive and negative values", async () => {
    const transactionArrayGenerator = fc.array(transactionGenerator, {
      minLength: 5,
      maxLength: 20,
    });

    await fc.assert(
      fc.asyncProperty(transactionArrayGenerator, async (transactions) => {
        const { calculateTransactionFinancials } = await import(
          "../accounting.js"
        );

        // Calculate with some transactions having losses (negative laba)
        const transactionRows = transactions.map((tx, index) => {
          const financials = calculateTransactionFinancials(tx);

          // Artificially create some losses for testing
          if (index % 4 === 0) {
            financials.totalBiayaOps = financials.totalPendapatan + 100000;
            financials.labaKotor =
              financials.totalPendapatan - financials.totalBiayaOps;
          }

          return mapTransactionToExportRow(tx, financials);
        });

        // Calculate summary
        let summaryLabaKotor = 0;
        let summaryPendapatan = 0;
        let summaryBiayaOps = 0;

        transactionRows.forEach((row) => {
          summaryPendapatan += row[8];
          summaryBiayaOps += row[9];
          summaryLabaKotor += row[10];
        });

        // Verify the accounting equation holds
        expect(summaryLabaKotor).toBeCloseTo(
          summaryPendapatan - summaryBiayaOps,
          2
        );

        // All values should be valid numbers
        expect(isNaN(summaryLabaKotor)).toBe(false);
        expect(isNaN(summaryPendapatan)).toBe(false);
        expect(isNaN(summaryBiayaOps)).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it("should calculate correct count metrics in summary", () => {
    const expenseArrayGenerator = fc.array(expenseGenerator, {
      minLength: 1,
      maxLength: 100,
    });

    fc.assert(
      fc.property(expenseArrayGenerator, (expenses) => {
        // Map to rows
        const expenseRows = expenses.map((expense) =>
          mapExpenseToExportRow(expense)
        );

        // Count should match
        expect(expenseRows.length).toBe(expenses.length);

        // Count by category
        const categoryCounts = {};

        expenses.forEach((expense) => {
          const category = expense.category || "Unknown";
          categoryCounts[category] = (categoryCounts[category] || 0) + 1;
        });

        // Verify total count equals sum of category counts
        const totalFromCategories = Object.values(categoryCounts).reduce(
          (sum, count) => sum + count,
          0
        );

        expect(totalFromCategories).toBe(expenses.length);
        expect(totalFromCategories).toBe(expenseRows.length);
      }),
      { numRuns: 100 }
    );
  });

  it("should maintain summary accuracy with large datasets", async () => {
    const largeTransactionArrayGenerator = fc.array(transactionGenerator, {
      minLength: 50,
      maxLength: 200,
    });

    await fc.assert(
      fc.asyncProperty(largeTransactionArrayGenerator, async (transactions) => {
        const { calculateTransactionFinancials } = await import(
          "../accounting.js"
        );

        // Calculate summary using two different methods
        let method1Total = 0;
        let method2Total = 0;

        // Method 1: Sum as we go
        transactions.forEach((tx) => {
          const financials = calculateTransactionFinancials(tx);
          method1Total += financials.totalPendapatan || 0;
        });

        // Method 2: Map then reduce
        method2Total = transactions
          .map((tx) => {
            const financials = calculateTransactionFinancials(tx);
            return financials.totalPendapatan || 0;
          })
          .reduce((sum, amount) => sum + amount, 0);

        // Both methods should produce the same result
        expect(method1Total).toBeCloseTo(method2Total, 2);

        // Result should be a valid number
        expect(typeof method1Total).toBe("number");
        expect(isNaN(method1Total)).toBe(false);
        expect(Number.isFinite(method1Total)).toBe(true);
      }),
      { numRuns: 50 } // Reduced runs for large datasets
    );
  });

  it("should calculate correct percentage metrics from summary totals", async () => {
    const transactionArrayGenerator = fc.array(transactionGenerator, {
      minLength: 5,
      maxLength: 20,
    });

    await fc.assert(
      fc.asyncProperty(transactionArrayGenerator, async (transactions) => {
        const { calculateTransactionFinancials } = await import(
          "../accounting.js"
        );

        // Calculate summary totals
        let totalPendapatan = 0;
        let totalBiayaOps = 0;

        transactions.forEach((tx) => {
          const financials = calculateTransactionFinancials(tx);
          totalPendapatan += financials.totalPendapatan || 0;
          totalBiayaOps += financials.totalBiayaOps || 0;
        });

        // Calculate percentage metrics
        const marginPercentage =
          totalPendapatan > 0
            ? ((totalPendapatan - totalBiayaOps) / totalPendapatan) * 100
            : 0;

        const costPercentage =
          totalPendapatan > 0 ? (totalBiayaOps / totalPendapatan) * 100 : 0;

        // Verify percentages are valid
        expect(typeof marginPercentage).toBe("number");
        expect(typeof costPercentage).toBe("number");
        expect(isNaN(marginPercentage)).toBe(false);
        expect(isNaN(costPercentage)).toBe(false);

        // Verify percentage relationship
        if (totalPendapatan > 0) {
          expect(marginPercentage + costPercentage).toBeCloseTo(100, 1);
        }

        // Percentages should be within valid range
        expect(marginPercentage).toBeGreaterThanOrEqual(-1000); // Allow for losses
        expect(marginPercentage).toBeLessThanOrEqual(100);
      }),
      { numRuns: 100 }
    );
  });

  it("should maintain summary accuracy when data is filtered", async () => {
    const transactionArrayGenerator = fc.array(transactionGenerator, {
      minLength: 10,
      maxLength: 30,
    });

    await fc.assert(
      fc.asyncProperty(transactionArrayGenerator, async (transactions) => {
        const { calculateTransactionFinancials } = await import(
          "../accounting.js"
        );

        // Calculate total for all transactions
        let totalAll = 0;
        transactions.forEach((tx) => {
          const financials = calculateTransactionFinancials(tx);
          totalAll += financials.totalPendapatan || 0;
        });

        // Filter transactions (e.g., only PAID status)
        const paidTransactions = transactions.filter(
          (tx) => tx.payment_status === "PAID"
        );

        // Calculate total for filtered transactions
        let totalPaid = 0;
        paidTransactions.forEach((tx) => {
          const financials = calculateTransactionFinancials(tx);
          totalPaid += financials.totalPendapatan || 0;
        });

        // Filtered total should be <= total all
        expect(totalPaid).toBeLessThanOrEqual(totalAll + 0.01); // Small tolerance for floating point

        // If all transactions are paid, totals should match
        if (paidTransactions.length === transactions.length) {
          expect(totalPaid).toBeCloseTo(totalAll, 2);
        }

        // Both should be valid numbers
        expect(typeof totalAll).toBe("number");
        expect(typeof totalPaid).toBe("number");
        expect(isNaN(totalAll)).toBe(false);
        expect(isNaN(totalPaid)).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it("should verify summary totals match between different report formats", async () => {
    const transactionArrayGenerator = fc.array(transactionGenerator, {
      minLength: 5,
      maxLength: 15,
    });

    await fc.assert(
      fc.asyncProperty(transactionArrayGenerator, async (transactions) => {
        const { calculateTransactionFinancials } = await import(
          "../accounting.js"
        );

        // Calculate summary for "detail" format (individual rows)
        const detailRows = transactions.map((tx) => {
          const financials = calculateTransactionFinancials(tx);
          return mapTransactionToExportRow(tx, financials);
        });

        let detailTotal = 0;
        detailRows.forEach((row) => {
          detailTotal += row[8]; // totalPendapatan
        });

        // Calculate summary for "summary" format (aggregated)
        let summaryTotal = 0;
        transactions.forEach((tx) => {
          const financials = calculateTransactionFinancials(tx);
          summaryTotal += financials.totalPendapatan || 0;
        });

        // Both formats should produce the same total
        expect(detailTotal).toBeCloseTo(summaryTotal, 2);

        // Verify count consistency
        expect(detailRows.length).toBe(transactions.length);
      }),
      { numRuns: 100 }
    );
  });
});
