/**
 * Integration Tests for Expense Report Export
 * Tests the full export flow with relational data
 *
 * Feature: financial-report-export-data-fix
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import {
  exportExpenseReport,
  mapExpenseToExportRow,
  validateExpenseForExport,
} from "../excel-export.js";

// Mock XLSX library
jest.mock("xlsx", () => ({
  utils: {
    book_new: jest.fn(() => ({ Props: {}, Sheets: {} })),
    aoa_to_sheet: jest.fn((data) => ({
      "!ref": "A1:I100",
      data,
    })),
    book_append_sheet: jest.fn(),
    encode_range: jest.fn(),
    decode_range: jest.fn(() => ({ s: { r: 0, c: 0 }, e: { r: 100, c: 8 } })),
    encode_cell: jest.fn(
      (cell) => `${String.fromCharCode(65 + cell.c)}${cell.r + 1}`
    ),
  },
  writeFile: jest.fn(),
}));

describe("Expense Report Export Integration Tests", () => {
  describe("Full Export Flow with Relations", () => {
    it("should export expense report with all relational data populated", () => {
      const mockData = {
        summary: {
          totalAmount: 5200000,
          totalExpenses: 4,
          categoriesCount: 3,
        },
        data: [
          {
            category: "BBM",
            totalAmount: 900000,
            count: 2,
            expenses: [],
          },
          {
            category: "GAJI_SOPIR",
            totalAmount: 2500000,
            count: 1,
            expenses: [],
          },
          {
            category: "GAJI_STAF_ADMIN",
            totalAmount: 1800000,
            count: 1,
            expenses: [],
          },
        ],
        rawExpenses: [
          {
            id: "exp-1",
            date: new Date("2025-11-01"),
            category: "BBM",
            description: "Bensin Armada Toyota Avanza",
            amount: 500000,
            namaPenerima: "SPBU Pertamina",
            armada: {
              id: "arm-1",
              license_plate: "B 1234 ABC",
              brand: "Toyota",
              model: "Avanza",
            },
            driver: {
              id: "drv-1",
              driver_name: "John Doe",
              nik: "123456789",
            },
            staff: null,
            attachments: [
              { id: "att-1", fileName: "receipt.pdf" },
              { id: "att-2", fileName: "invoice.pdf" },
            ],
          },
          {
            id: "exp-2",
            date: new Date("2025-11-05"),
            category: "GAJI_SOPIR",
            description: "Gaji Sopir Bulan November",
            amount: 2500000,
            namaPenerima: "John Doe",
            armada: null,
            driver: {
              id: "drv-1",
              driver_name: "John Doe",
              nik: "123456789",
            },
            staff: null,
            attachments: [],
          },
          {
            id: "exp-3",
            date: new Date("2025-11-10"),
            category: "BBM",
            description: "Bensin Armada Honda Jazz",
            amount: 400000,
            namaPenerima: "SPBU Shell",
            armada: {
              id: "arm-2",
              license_plate: "B 5678 DEF",
              brand: "Honda",
              model: "Jazz",
            },
            driver: null,
            staff: null,
            attachments: [{ id: "att-3", fileName: "receipt2.pdf" }],
          },
          {
            id: "exp-4",
            date: new Date("2025-11-15"),
            category: "GAJI_STAF_ADMIN",
            description: "Gaji Admin Bulan November",
            amount: 1800000,
            namaPenerima: "Jane Smith",
            armada: null,
            driver: null,
            staff: {
              id: "stf-1",
              staff_name: "Jane Smith",
              position: "Admin",
            },
            attachments: [],
          },
        ],
      };

      const dateRange = {
        from: "2025-11-01",
        to: "2025-11-30",
      };

      // Execute export
      const result = exportExpenseReport(mockData, dateRange);

      // Verify export completed successfully
      expect(result).toBeDefined();
      expect(typeof result).toBe("string");
      expect(result).toContain("Laporan_Pengeluaran");
    });

    it("should correctly map expense with all relations to export row", () => {
      const expense = {
        id: "exp-1",
        date: new Date("2025-11-01"),
        category: "BBM",
        description: "Bensin Armada Toyota Avanza",
        amount: 500000,
        namaPenerima: "SPBU Pertamina",
        armada: {
          id: "arm-1",
          license_plate: "B 1234 ABC",
          brand: "Toyota",
          model: "Avanza",
        },
        driver: {
          id: "drv-1",
          driver_name: "John Doe",
          nik: "123456789",
        },
        staff: {
          id: "stf-1",
          staff_name: "Jane Smith",
          position: "Admin",
        },
        attachments: [
          { id: "att-1", fileName: "receipt.pdf" },
          { id: "att-2", fileName: "invoice.pdf" },
        ],
      };

      const row = mapExpenseToExportRow(expense);

      // Verify all fields are correctly mapped
      expect(row).toHaveLength(9);
      expect(row[0]).toBe("1/11/2025"); // date
      expect(row[1]).toBe("BBM"); // category
      expect(row[2]).toBe("Bensin Armada Toyota Avanza"); // description
      expect(row[3]).toBe(500000); // amount
      expect(row[4]).toBe("SPBU Pertamina"); // namaPenerima
      expect(row[5]).toBe("B 1234 ABC"); // armada.license_plate
      expect(row[6]).toBe("John Doe"); // driver.driver_name
      expect(row[7]).toBe("Jane Smith"); // staff.staff_name
      expect(row[8]).toBe("2 file(s)"); // attachments count
    });

    it("should correctly map expense with missing relations to export row", () => {
      const expense = {
        id: "exp-2",
        date: new Date("2025-11-05"),
        category: "GAJI_SOPIR",
        description: "Gaji Sopir Bulan November",
        amount: 2500000,
        namaPenerima: null,
        armada: null,
        driver: null,
        staff: null,
        attachments: null,
      };

      const row = mapExpenseToExportRow(expense);

      // Verify default values are used for missing relations
      expect(row).toHaveLength(9);
      expect(row[0]).toBe("5/11/2025"); // date
      expect(row[1]).toBe("GAJI_SOPIR"); // category
      expect(row[2]).toBe("Gaji Sopir Bulan November"); // description
      expect(row[3]).toBe(2500000); // amount
      expect(row[4]).toBe("-"); // namaPenerima (null)
      expect(row[5]).toBe("-"); // armada (null)
      expect(row[6]).toBe("-"); // driver (null)
      expect(row[7]).toBe("-"); // staff (null)
      expect(row[8]).toBe("Tidak ada"); // attachments (null)
    });

    it("should correctly map expense with partial relations to export row", () => {
      const expense = {
        id: "exp-3",
        date: new Date("2025-11-10"),
        category: "BBM",
        description: "Bensin Armada Honda Jazz",
        amount: 400000,
        namaPenerima: "SPBU Shell",
        armada: {
          id: "arm-2",
          license_plate: "B 5678 DEF",
          brand: "Honda",
          model: "Jazz",
        },
        driver: null,
        staff: null,
        attachments: [{ id: "att-3", fileName: "receipt2.pdf" }],
      };

      const row = mapExpenseToExportRow(expense);

      // Verify partial relations are handled correctly
      expect(row).toHaveLength(9);
      expect(row[0]).toBe("10/11/2025"); // date
      expect(row[1]).toBe("BBM"); // category
      expect(row[2]).toBe("Bensin Armada Honda Jazz"); // description
      expect(row[3]).toBe(400000); // amount
      expect(row[4]).toBe("SPBU Shell"); // namaPenerima
      expect(row[5]).toBe("B 5678 DEF"); // armada.license_plate
      expect(row[6]).toBe("-"); // driver (null)
      expect(row[7]).toBe("-"); // staff (null)
      expect(row[8]).toBe("1 file(s)"); // attachments count
    });
  });

  describe("Validation with Relations", () => {
    it("should validate expense with all relations without warnings", () => {
      const expense = {
        id: "exp-1",
        date: new Date("2025-11-01"),
        category: "BBM",
        description: "Bensin Armada Toyota Avanza",
        amount: 500000,
        armada: {
          id: "arm-1",
          license_plate: "B 1234 ABC",
          brand: "Toyota",
          model: "Avanza",
        },
        driver: {
          id: "drv-1",
          driver_name: "John Doe",
          nik: "123456789",
        },
        staff: {
          id: "stf-1",
          staff_name: "Jane Smith",
          position: "Admin",
        },
      };

      const result = validateExpenseForExport(expense);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });

    it("should warn when armada exists but license_plate is missing", () => {
      const expense = {
        id: "exp-1",
        date: new Date("2025-11-01"),
        category: "BBM",
        description: "Bensin Armada",
        amount: 500000,
        armada: {
          id: "arm-1",
          license_plate: null,
          brand: "Toyota",
          model: "Avanza",
        },
        driver: null,
        staff: null,
      };

      const result = validateExpenseForExport(expense);

      expect(result.isValid).toBe(false);
      expect(result.warnings).toContain(
        "Armada exists but missing license_plate"
      );
    });

    it("should warn when driver exists but driver_name is missing", () => {
      const expense = {
        id: "exp-1",
        date: new Date("2025-11-01"),
        category: "GAJI_SOPIR",
        description: "Gaji Sopir",
        amount: 2500000,
        armada: null,
        driver: {
          id: "drv-1",
          driver_name: null,
          nik: "123456789",
        },
        staff: null,
      };

      const result = validateExpenseForExport(expense);

      expect(result.isValid).toBe(false);
      expect(result.warnings).toContain(
        "Driver exists but missing driver_name"
      );
    });

    it("should warn when staff exists but staff_name is missing", () => {
      const expense = {
        id: "exp-1",
        date: new Date("2025-11-01"),
        category: "GAJI_STAF_ADMIN",
        description: "Gaji Admin",
        amount: 1800000,
        armada: null,
        driver: null,
        staff: {
          id: "stf-1",
          staff_name: null,
          position: "Admin",
        },
      };

      const result = validateExpenseForExport(expense);

      expect(result.isValid).toBe(false);
      expect(result.warnings).toContain("Staff exists but missing staff_name");
    });

    it("should warn for multiple missing fields", () => {
      const expense = {
        id: "exp-1",
        date: null,
        category: null,
        description: null,
        amount: null,
        armada: {
          id: "arm-1",
          license_plate: null,
        },
        driver: {
          id: "drv-1",
          driver_name: null,
        },
        staff: {
          id: "stf-1",
          staff_name: null,
        },
      };

      const result = validateExpenseForExport(expense);

      expect(result.isValid).toBe(false);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings).toContain("Missing date");
      expect(result.warnings).toContain("Missing category");
      expect(result.warnings).toContain("Missing description");
      expect(result.warnings).toContain("Missing amount");
      expect(result.warnings).toContain(
        "Armada exists but missing license_plate"
      );
      expect(result.warnings).toContain(
        "Driver exists but missing driver_name"
      );
      expect(result.warnings).toContain("Staff exists but missing staff_name");
    });
  });

  describe("Data Consistency", () => {
    it("should maintain data consistency across multiple exports", () => {
      const expense = {
        id: "exp-1",
        date: new Date("2025-11-01"),
        category: "BBM",
        description: "Bensin Armada Toyota Avanza",
        amount: 500000,
        namaPenerima: "SPBU Pertamina",
        armada: {
          id: "arm-1",
          license_plate: "B 1234 ABC",
          brand: "Toyota",
          model: "Avanza",
        },
        driver: {
          id: "drv-1",
          driver_name: "John Doe",
          nik: "123456789",
        },
        staff: null,
        attachments: [{ id: "att-1", fileName: "receipt.pdf" }],
      };

      // Export the same expense multiple times
      const row1 = mapExpenseToExportRow(expense);
      const row2 = mapExpenseToExportRow(expense);
      const row3 = mapExpenseToExportRow(expense);

      // All exports should be identical
      expect(row1).toEqual(row2);
      expect(row2).toEqual(row3);

      // Verify specific fields
      expect(row1[5]).toBe("B 1234 ABC"); // armada
      expect(row1[6]).toBe("John Doe"); // driver
      expect(row1[8]).toBe("1 file(s)"); // attachments
    });

    it("should handle empty attachments array correctly", () => {
      const expense = {
        id: "exp-1",
        date: new Date("2025-11-01"),
        category: "BBM",
        description: "Bensin",
        amount: 500000,
        namaPenerima: "SPBU",
        armada: null,
        driver: null,
        staff: null,
        attachments: [],
      };

      const row = mapExpenseToExportRow(expense);

      // Empty array should show "Tidak ada"
      expect(row[8]).toBe("Tidak ada");
    });

    it("should handle undefined vs null attachments consistently", () => {
      const expenseWithNull = {
        id: "exp-1",
        date: new Date("2025-11-01"),
        category: "BBM",
        description: "Bensin",
        amount: 500000,
        namaPenerima: "SPBU",
        armada: null,
        driver: null,
        staff: null,
        attachments: null,
      };

      const expenseWithUndefined = {
        id: "exp-2",
        date: new Date("2025-11-01"),
        category: "BBM",
        description: "Bensin",
        amount: 500000,
        namaPenerima: "SPBU",
        armada: null,
        driver: null,
        staff: null,
        attachments: undefined,
      };

      const rowNull = mapExpenseToExportRow(expenseWithNull);
      const rowUndefined = mapExpenseToExportRow(expenseWithUndefined);

      // Both should show "Tidak ada"
      expect(rowNull[8]).toBe("Tidak ada");
      expect(rowUndefined[8]).toBe("Tidak ada");
    });
  });

  describe("Edge Cases", () => {
    it("should handle expense with very long description", () => {
      const expense = {
        id: "exp-1",
        date: new Date("2025-11-01"),
        category: "BBM",
        description: "A".repeat(500), // Very long description
        amount: 500000,
        namaPenerima: "SPBU",
        armada: null,
        driver: null,
        staff: null,
        attachments: null,
      };

      const row = mapExpenseToExportRow(expense);

      expect(row[2]).toBe("A".repeat(500));
      expect(row[2].length).toBe(500);
    });

    it("should handle expense with zero amount", () => {
      const expense = {
        id: "exp-1",
        date: new Date("2025-11-01"),
        category: "BBM",
        description: "Bensin",
        amount: 0,
        namaPenerima: "SPBU",
        armada: null,
        driver: null,
        staff: null,
        attachments: null,
      };

      const row = mapExpenseToExportRow(expense);

      expect(row[3]).toBe(0);
      expect(typeof row[3]).toBe("number");
    });

    it("should handle expense with special characters in fields", () => {
      const expense = {
        id: "exp-1",
        date: new Date("2025-11-01"),
        category: "BBM",
        description: 'Bensin "Premium" & Solar',
        amount: 500000,
        namaPenerima: "SPBU <Pertamina>",
        armada: {
          id: "arm-1",
          license_plate: "B 1234 ABC",
        },
        driver: {
          id: "drv-1",
          driver_name: "John O'Doe",
        },
        staff: null,
        attachments: null,
      };

      const row = mapExpenseToExportRow(expense);

      expect(row[2]).toBe('Bensin "Premium" & Solar');
      expect(row[4]).toBe("SPBU <Pertamina>");
      expect(row[6]).toBe("John O'Doe");
    });

    it("should handle expense with many attachments", () => {
      const attachments = Array.from({ length: 50 }, (_, i) => ({
        id: `att-${i}`,
        fileName: `file${i}.pdf`,
      }));

      const expense = {
        id: "exp-1",
        date: new Date("2025-11-01"),
        category: "BBM",
        description: "Bensin",
        amount: 500000,
        namaPenerima: "SPBU",
        armada: null,
        driver: null,
        staff: null,
        attachments,
      };

      const row = mapExpenseToExportRow(expense);

      expect(row[8]).toBe("50 file(s)");
    });
  });
});
