/**
 * Test suite for Excel export error handling
 * Validates Requirements: 7.1, 7.2, 7.3, 7.4
 */

import {
  exportIncomeReport,
  exportExpenseReport,
  exportRekapReport,
  exportPerformanceReport,
  validateTransactionForExport,
  validateExpenseForExport,
} from "../excel-export";

// Mock XLSX
jest.mock("xlsx", () => ({
  utils: {
    book_new: jest.fn(() => ({})),
    aoa_to_sheet: jest.fn(() => ({})),
    book_append_sheet: jest.fn(),
    encode_cell: jest.fn(() => "A1"),
    decode_range: jest.fn(() => ({ s: { r: 0, c: 0 }, e: { r: 10, c: 10 } })),
  },
  writeFile: jest.fn(),
}));

describe("Excel Export Error Handling", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock console methods
    jest.spyOn(console, "error").mockImplementation(() => {});
    jest.spyOn(console, "warn").mockImplementation(() => {});
    jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
    console.warn.mockRestore();
    console.log.mockRestore();
  });

  describe("exportIncomeReport error handling", () => {
    test("should warn but not throw when data is null", async () => {
      const result = await exportIncomeReport(null, {
        from: "2024-01-01",
        to: "2024-01-31",
      });

      expect(console.warn).toHaveBeenCalledWith(
        "Export warning: No income data available"
      );
      expect(result).toBeDefined(); // Should still return a filename
    });

    test("should warn but not throw when incomeByPackage is empty", async () => {
      const emptyData = {
        summary: { totalPackages: 0, totalTransactions: 0 },
        incomeByPackage: [],
      };

      const result = await exportIncomeReport(emptyData, {
        from: "2024-01-01",
        to: "2024-01-31",
      });

      expect(console.warn).toHaveBeenCalledWith(
        "Export warning: No income data available"
      );
      expect(result).toBeDefined(); // Should still return a filename
    });

    test("should warn but not throw when incomeByPackage is missing", async () => {
      const invalidData = {
        summary: { totalPackages: 0, totalTransactions: 0 },
      };

      const result = await exportIncomeReport(invalidData, {
        from: "2024-01-01",
        to: "2024-01-31",
      });

      expect(console.warn).toHaveBeenCalledWith(
        "Export warning: No income data available"
      );
      expect(result).toBeDefined(); // Should still return a filename
    });
  });

  describe("exportExpenseReport error handling", () => {
    test("should throw error with user-friendly message when data is null", () => {
      expect(() =>
        exportExpenseReport(null, { from: "2024-01-01", to: "2024-01-31" })
      ).toThrow("Tidak ada data pengeluaran untuk diekspor");

      expect(console.warn).toHaveBeenCalledWith(
        "Export warning: No expense data available"
      );
    });

    test("should throw error when data.data is empty", () => {
      const emptyData = {
        summary: { totalAmount: 0, totalExpenses: 0 },
        data: [],
      };

      expect(() =>
        exportExpenseReport(emptyData, { from: "2024-01-01", to: "2024-01-31" })
      ).toThrow("Tidak ada data pengeluaran untuk diekspor");
    });

    test("should throw error when data.data is missing", () => {
      const invalidData = {
        summary: { totalAmount: 0, totalExpenses: 0 },
      };

      expect(() =>
        exportExpenseReport(invalidData, {
          from: "2024-01-01",
          to: "2024-01-31",
        })
      ).toThrow("Tidak ada data pengeluaran untuk diekspor");
    });
  });

  describe("exportRekapReport error handling", () => {
    test("should warn but not throw when data is null", () => {
      const result = exportRekapReport(null, {
        from: "2024-01-01",
        to: "2024-01-31",
      });

      expect(console.warn).toHaveBeenCalledWith(
        "Export warning: No rekap data available"
      );
      expect(result).toBeDefined(); // Should still return a filename
    });

    test("should warn but not throw when rekap array is empty", () => {
      const emptyData = {
        summary: { totalExpenses: 0, totalTransactions: 0 },
        rekap: [],
      };

      const result = exportRekapReport(emptyData, {
        from: "2024-01-01",
        to: "2024-01-31",
      });

      expect(console.warn).toHaveBeenCalledWith(
        "Export warning: No rekap data available"
      );
      expect(result).toBeDefined(); // Should still return a filename
    });

    test("should warn but not throw when rekap is missing", () => {
      const invalidData = {
        summary: { totalExpenses: 0, totalTransactions: 0 },
      };

      const result = exportRekapReport(invalidData, {
        from: "2024-01-01",
        to: "2024-01-31",
      });

      expect(console.warn).toHaveBeenCalledWith(
        "Export warning: No rekap data available"
      );
      expect(result).toBeDefined(); // Should still return a filename
    });
  });

  describe("exportPerformanceReport error handling", () => {
    test("should throw error when performanceData is null", async () => {
      const fuelData = { fuelAnalysis: [] };

      await expect(
        exportPerformanceReport(null, fuelData, {
          from: "2024-01-01",
          to: "2024-01-31",
        })
      ).rejects.toThrow("Tidak ada data kinerja untuk diekspor");

      expect(console.warn).toHaveBeenCalledWith(
        "Export warning: No performance data available"
      );
    });

    test("should throw error when fuelData is null", async () => {
      const performanceData = {
        driverPerformance: [],
        packagePerformance: [],
        summary: {},
      };

      await expect(
        exportPerformanceReport(performanceData, null, {
          from: "2024-01-01",
          to: "2024-01-31",
        })
      ).rejects.toThrow("Tidak ada data BBM untuk diekspor");

      expect(console.warn).toHaveBeenCalledWith(
        "Export warning: No fuel data available"
      );
    });

    test("should throw error when driverPerformance is missing", async () => {
      const invalidPerformanceData = {
        packagePerformance: [],
        summary: {},
      };
      const fuelData = { fuelAnalysis: [] };

      await expect(
        exportPerformanceReport(invalidPerformanceData, fuelData, {
          from: "2024-01-01",
          to: "2024-01-31",
        })
      ).rejects.toThrow("Tidak ada data kinerja untuk diekspor");
    });

    test("should throw error when fuelAnalysis is missing", async () => {
      const performanceData = {
        driverPerformance: [],
        packagePerformance: [],
        summary: {},
      };
      const invalidFuelData = { summary: {} };

      await expect(
        exportPerformanceReport(performanceData, invalidFuelData, {
          from: "2024-01-01",
          to: "2024-01-31",
        })
      ).rejects.toThrow("Tidak ada data BBM untuk diekspor");
    });
  });

  describe("validateTransactionForExport", () => {
    test("should return valid for complete transaction data", () => {
      const validTransaction = {
        invoice_code: "INV-001",
        customer_name: "John Doe",
        booking_date: new Date(),
        armada: {
          license_plate: "B1234XYZ",
          brand: "Toyota",
          model: "Avanza",
        },
        driver: {
          driver_name: "Driver Name",
        },
        package: {
          name: "Package Name",
        },
      };

      const result = validateTransactionForExport(validTransaction);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });

    test("should return warnings for missing required fields", () => {
      const incompleteTransaction = {
        armada: {
          license_plate: "B1234XYZ",
        },
      };

      const result = validateTransactionForExport(incompleteTransaction);

      expect(result.isValid).toBe(false);
      expect(result.warnings).toContain("Missing invoice_code");
      expect(result.warnings).toContain("Missing customer_name");
      expect(result.warnings).toContain("Missing booking_date");
    });

    test("should return warnings for incomplete nested objects", () => {
      const transactionWithIncompleteArmada = {
        invoice_code: "INV-001",
        customer_name: "John Doe",
        booking_date: new Date(),
        armada: {
          // Missing license_plate, brand, model
        },
        driver: {
          // Missing driver_name
        },
        package: {
          // Missing name
        },
      };

      const result = validateTransactionForExport(
        transactionWithIncompleteArmada
      );

      expect(result.isValid).toBe(false);
      expect(result.warnings).toContain(
        "Armada exists but missing license_plate"
      );
      expect(result.warnings).toContain("Armada exists but missing brand");
      expect(result.warnings).toContain("Armada exists but missing model");
      expect(result.warnings).toContain(
        "Driver exists but missing driver_name"
      );
      expect(result.warnings).toContain("Package exists but missing name");
    });
  });

  describe("validateExpenseForExport", () => {
    test("should return valid for complete expense data", () => {
      const validExpense = {
        date: new Date(),
        category: "BBM",
        description: "Fuel expense",
        amount: 100000,
        armada: {
          license_plate: "B1234XYZ",
        },
        driver: {
          driver_name: "Driver Name",
        },
        staff: {
          staff_name: "Staff Name",
        },
      };

      const result = validateExpenseForExport(validExpense);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });

    test("should return warnings for missing required fields", () => {
      const incompleteExpense = {
        armada: {
          license_plate: "B1234XYZ",
        },
      };

      const result = validateExpenseForExport(incompleteExpense);

      expect(result.isValid).toBe(false);
      expect(result.warnings).toContain("Missing date");
      expect(result.warnings).toContain("Missing category");
      expect(result.warnings).toContain("Missing description");
      expect(result.warnings).toContain("Missing amount");
    });

    test("should return warnings for incomplete nested objects", () => {
      const expenseWithIncompleteRelations = {
        date: new Date(),
        category: "BBM",
        description: "Fuel expense",
        amount: 100000,
        armada: {
          // Missing license_plate
        },
        driver: {
          // Missing driver_name
        },
        staff: {
          // Missing staff_name
        },
      };

      const result = validateExpenseForExport(expenseWithIncompleteRelations);

      expect(result.isValid).toBe(false);
      expect(result.warnings).toContain(
        "Armada exists but missing license_plate"
      );
      expect(result.warnings).toContain(
        "Driver exists but missing driver_name"
      );
      expect(result.warnings).toContain("Staff exists but missing staff_name");
    });

    test("should handle null or undefined amount", () => {
      const expenseWithNullAmount = {
        date: new Date(),
        category: "BBM",
        description: "Fuel expense",
        amount: null,
      };

      const result = validateExpenseForExport(expenseWithNullAmount);

      expect(result.isValid).toBe(false);
      expect(result.warnings).toContain("Missing amount");
    });
  });

  describe("Warning messages are user-friendly", () => {
    test("income export warning message is in Indonesian", async () => {
      await exportIncomeReport(null, {
        from: "2024-01-01",
        to: "2024-01-31",
      });

      expect(console.warn).toHaveBeenCalledWith(
        "Export warning: No income data available"
      );
    });

    test("expense export warning message is in Indonesian", () => {
      exportExpenseReport(null, { from: "2024-01-01", to: "2024-01-31" });

      expect(console.warn).toHaveBeenCalledWith(
        "Export warning: No expense data available"
      );
    });

    test("rekap export warning message is in Indonesian", () => {
      exportRekapReport(null, { from: "2024-01-01", to: "2024-01-31" });

      expect(console.warn).toHaveBeenCalledWith(
        "Export warning: No rekap data available"
      );
    });

    test("performance export warning message is in Indonesian", async () => {
      await exportPerformanceReport(null, null, {
        from: "2024-01-01",
        to: "2024-01-31",
      });

      expect(console.warn).toHaveBeenCalledWith(
        "Export warning: No performance data available"
      );
    });
  });
});
