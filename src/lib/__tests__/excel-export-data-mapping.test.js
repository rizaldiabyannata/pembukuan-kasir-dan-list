/**
 * Unit tests for Excel export data validation and mapping utilities
 * Tests validation functions, data mappers, and helper functions
 */

import {
  validateTransactionForExport,
  validateExpenseForExport,
  mapTransactionToExportRow,
  mapExpenseToExportRow,
  formatDateSafely,
  formatCurrencyForExcel,
  formatPercentage,
  calculatePercentage,
} from "../excel-export.js";

describe("Data Validation Functions", () => {
  describe("validateTransactionForExport", () => {
    it("should validate complete transaction data", () => {
      const transaction = {
        invoice_code: "INV-001",
        customer_name: "John Doe",
        booking_date: new Date("2024-01-15"),
        armada: {
          license_plate: "B1234XYZ",
          brand: "Toyota",
          model: "Avanza",
        },
        driver: {
          driver_name: "Driver Name",
        },
        package: {
          name: "Full Day",
        },
      };

      const result = validateTransactionForExport(transaction);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(0);
      expect(result.transaction).toBe(transaction);
    });

    it("should detect missing required fields", () => {
      const transaction = {
        // Missing invoice_code, customer_name, booking_date
      };

      const result = validateTransactionForExport(transaction);

      expect(result.isValid).toBe(false);
      expect(result.warnings).toContain("Missing invoice_code");
      expect(result.warnings).toContain("Missing customer_name");
      expect(result.warnings).toContain("Missing booking_date");
    });

    it("should detect missing nested armada fields", () => {
      const transaction = {
        invoice_code: "INV-001",
        customer_name: "John Doe",
        booking_date: new Date("2024-01-15"),
        armada: {
          // Missing license_plate, brand, model
        },
      };

      const result = validateTransactionForExport(transaction);

      expect(result.isValid).toBe(false);
      expect(result.warnings).toContain(
        "Armada exists but missing license_plate"
      );
      expect(result.warnings).toContain("Armada exists but missing brand");
      expect(result.warnings).toContain("Armada exists but missing model");
    });

    it("should detect missing driver name", () => {
      const transaction = {
        invoice_code: "INV-001",
        customer_name: "John Doe",
        booking_date: new Date("2024-01-15"),
        driver: {
          // Missing driver_name
        },
      };

      const result = validateTransactionForExport(transaction);

      expect(result.isValid).toBe(false);
      expect(result.warnings).toContain(
        "Driver exists but missing driver_name"
      );
    });

    it("should detect missing package name", () => {
      const transaction = {
        invoice_code: "INV-001",
        customer_name: "John Doe",
        booking_date: new Date("2024-01-15"),
        package: {
          // Missing name
        },
      };

      const result = validateTransactionForExport(transaction);

      expect(result.isValid).toBe(false);
      expect(result.warnings).toContain("Package exists but missing name");
    });
  });

  describe("validateExpenseForExport", () => {
    it("should validate complete expense data", () => {
      const expense = {
        date: new Date("2024-01-15"),
        category: "BBM",
        description: "Fuel refill",
        amount: 500000,
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

      const result = validateExpenseForExport(expense);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(0);
      expect(result.expense).toBe(expense);
    });

    it("should detect missing required fields", () => {
      const expense = {
        // Missing date, category, description, amount
      };

      const result = validateExpenseForExport(expense);

      expect(result.isValid).toBe(false);
      expect(result.warnings).toContain("Missing date");
      expect(result.warnings).toContain("Missing category");
      expect(result.warnings).toContain("Missing description");
      expect(result.warnings).toContain("Missing amount");
    });

    it("should detect missing nested armada license_plate", () => {
      const expense = {
        date: new Date("2024-01-15"),
        category: "BBM",
        description: "Fuel refill",
        amount: 500000,
        armada: {
          // Missing license_plate
        },
      };

      const result = validateExpenseForExport(expense);

      expect(result.isValid).toBe(false);
      expect(result.warnings).toContain(
        "Armada exists but missing license_plate"
      );
    });

    it("should detect missing driver name", () => {
      const expense = {
        date: new Date("2024-01-15"),
        category: "BBM",
        description: "Fuel refill",
        amount: 500000,
        driver: {
          // Missing driver_name
        },
      };

      const result = validateExpenseForExport(expense);

      expect(result.isValid).toBe(false);
      expect(result.warnings).toContain(
        "Driver exists but missing driver_name"
      );
    });

    it("should detect missing staff name", () => {
      const expense = {
        date: new Date("2024-01-15"),
        category: "Gaji",
        description: "Monthly salary",
        amount: 5000000,
        staff: {
          // Missing staff_name
        },
      };

      const result = validateExpenseForExport(expense);

      expect(result.isValid).toBe(false);
      expect(result.warnings).toContain("Staff exists but missing staff_name");
    });
  });
});

describe("Data Mapping Functions", () => {
  describe("mapTransactionToExportRow", () => {
    it("should map complete transaction data", () => {
      const transaction = {
        invoice_code: "INV-001",
        booking_date: new Date("2024-01-15"),
        customer_name: "John Doe",
        package: {
          name: "Full Day",
        },
        armada: {
          brand: "Toyota",
          model: "Avanza",
          license_plate: "B1234XYZ",
        },
        driver: {
          driver_name: "Driver Name",
        },
        payment_status: "PAID",
        approval_status: "APPROVED",
      };

      const financials = {
        tarifSewa: 500000,
        biayaOvertime: 100000,
        totalPendapatan: 600000,
        totalBiayaOps: 200000,
        labaKotor: 400000,
      };

      const row = mapTransactionToExportRow(transaction, financials);

      expect(row[0]).toBe("INV-001");
      expect(row[1]).toBe("15/1/2024");
      expect(row[2]).toBe("John Doe");
      expect(row[3]).toBe("Full Day");
      expect(row[4]).toBe("Toyota Avanza (B1234XYZ)");
      expect(row[5]).toBe("Driver Name");
      expect(row[6]).toBe(500000);
      expect(row[7]).toBe(100000);
      expect(row[8]).toBe(600000);
      expect(row[9]).toBe(200000);
      expect(row[10]).toBe(400000);
      expect(row[11]).toBe("PAID");
      expect(row[12]).toBe("APPROVED");
    });

    it("should handle missing armada with default value", () => {
      const transaction = {
        invoice_code: "INV-001",
        booking_date: new Date("2024-01-15"),
        customer_name: "John Doe",
        package: {
          name: "Full Day",
        },
        // No armada
        driver: {
          driver_name: "Driver Name",
        },
        payment_status: "PAID",
        approval_status: "APPROVED",
      };

      const financials = {
        tarifSewa: 500000,
        biayaOvertime: 0,
        totalPendapatan: 500000,
        totalBiayaOps: 200000,
        labaKotor: 300000,
      };

      const row = mapTransactionToExportRow(transaction, financials);

      expect(row[4]).toBe("-");
    });

    it("should handle missing driver with default value", () => {
      const transaction = {
        invoice_code: "INV-001",
        booking_date: new Date("2024-01-15"),
        customer_name: "John Doe",
        package: {
          name: "Full Day",
        },
        armada: {
          brand: "Toyota",
          model: "Avanza",
          license_plate: "B1234XYZ",
        },
        // No driver
        payment_status: "PAID",
        approval_status: "APPROVED",
      };

      const financials = {
        tarifSewa: 500000,
        biayaOvertime: 0,
        totalPendapatan: 500000,
        totalBiayaOps: 200000,
        labaKotor: 300000,
      };

      const row = mapTransactionToExportRow(transaction, financials);

      expect(row[5]).toBe("-");
    });

    it("should handle missing package with Custom default", () => {
      const transaction = {
        invoice_code: "INV-001",
        booking_date: new Date("2024-01-15"),
        customer_name: "John Doe",
        // No package
        armada: {
          brand: "Toyota",
          model: "Avanza",
          license_plate: "B1234XYZ",
        },
        driver: {
          driver_name: "Driver Name",
        },
        payment_status: "PAID",
        approval_status: "APPROVED",
      };

      const financials = {
        tarifSewa: 500000,
        biayaOvertime: 0,
        totalPendapatan: 500000,
        totalBiayaOps: 200000,
        labaKotor: 300000,
      };

      const row = mapTransactionToExportRow(transaction, financials);

      expect(row[3]).toBe("Custom");
    });
  });

  describe("mapExpenseToExportRow", () => {
    it("should map complete expense data", () => {
      const expense = {
        date: new Date("2024-01-15"),
        category: "BBM",
        description: "Fuel refill",
        amount: 500000,
        namaPenerima: "Gas Station",
        armada: {
          license_plate: "B1234XYZ",
        },
        driver: {
          driver_name: "Driver Name",
        },
        staff: {
          staff_name: "Staff Name",
        },
        attachments: [{ id: 1 }, { id: 2 }],
      };

      const row = mapExpenseToExportRow(expense);

      expect(row[0]).toBe("15/1/2024");
      expect(row[1]).toBe("BBM");
      expect(row[2]).toBe("Fuel refill");
      expect(row[3]).toBe(500000);
      expect(row[4]).toBe("Gas Station");
      expect(row[5]).toBe("B1234XYZ");
      expect(row[6]).toBe("Driver Name");
      expect(row[7]).toBe("Staff Name");
      expect(row[8]).toBe("2 file(s)");
    });

    it("should handle missing relations with default values", () => {
      const expense = {
        date: new Date("2024-01-15"),
        category: "BBM",
        description: "Fuel refill",
        amount: 500000,
        // No namaPenerima, armada, driver, staff, attachments
      };

      const row = mapExpenseToExportRow(expense);

      expect(row[4]).toBe("-");
      expect(row[5]).toBe("-");
      expect(row[6]).toBe("-");
      expect(row[7]).toBe("-");
      expect(row[8]).toBe("Tidak ada");
    });

    it("should handle empty attachments array", () => {
      const expense = {
        date: new Date("2024-01-15"),
        category: "BBM",
        description: "Fuel refill",
        amount: 500000,
        attachments: [],
      };

      const row = mapExpenseToExportRow(expense);

      expect(row[8]).toBe("Tidak ada");
    });
  });
});

describe("Helper Functions", () => {
  describe("formatDateSafely", () => {
    it("should format valid date to Indonesian locale", () => {
      const date = new Date("2024-01-15");
      const formatted = formatDateSafely(date);

      expect(formatted).toBe("15/1/2024");
    });

    it("should format date string to Indonesian locale", () => {
      const dateString = "2024-01-15";
      const formatted = formatDateSafely(dateString);

      expect(formatted).toBe("15/1/2024");
    });

    it("should return '-' for null date", () => {
      const formatted = formatDateSafely(null);

      expect(formatted).toBe("-");
    });

    it("should return '-' for undefined date", () => {
      const formatted = formatDateSafely(undefined);

      expect(formatted).toBe("-");
    });

    it("should return '-' for invalid date string", () => {
      const formatted = formatDateSafely("invalid-date");

      expect(formatted).toBe("-");
    });

    it("should return '-' for empty string", () => {
      const formatted = formatDateSafely("");

      expect(formatted).toBe("-");
    });
  });

  describe("formatCurrencyForExcel", () => {
    it("should format positive number", () => {
      const formatted = formatCurrencyForExcel(500000);

      expect(formatted).toBe(500000);
      expect(typeof formatted).toBe("number");
    });

    it("should format zero", () => {
      const formatted = formatCurrencyForExcel(0);

      expect(formatted).toBe(0);
      expect(typeof formatted).toBe("number");
    });

    it("should format negative number", () => {
      const formatted = formatCurrencyForExcel(-100000);

      expect(formatted).toBe(-100000);
      expect(typeof formatted).toBe("number");
    });

    it("should handle string numbers", () => {
      const formatted = formatCurrencyForExcel("500000");

      expect(formatted).toBe(500000);
      expect(typeof formatted).toBe("number");
    });

    it("should return 0 for null", () => {
      const formatted = formatCurrencyForExcel(null);

      expect(formatted).toBe(0);
    });

    it("should return 0 for undefined", () => {
      const formatted = formatCurrencyForExcel(undefined);

      expect(formatted).toBe(0);
    });

    it("should return 0 for invalid string", () => {
      const formatted = formatCurrencyForExcel("invalid");

      expect(formatted).toBe(0);
    });
  });

  describe("formatPercentage", () => {
    it("should format percentage with 1 decimal place by default", () => {
      const formatted = formatPercentage(45.5);

      expect(formatted).toBe("45.5%");
    });

    it("should format percentage with custom decimal places", () => {
      const formatted = formatPercentage(45.567, 2);

      expect(formatted).toBe("45.57%");
    });

    it("should format zero percentage", () => {
      const formatted = formatPercentage(0);

      expect(formatted).toBe("0.0%");
    });

    it("should format negative percentage", () => {
      const formatted = formatPercentage(-10.5);

      expect(formatted).toBe("-10.5%");
    });

    it("should format percentage with no decimal places", () => {
      const formatted = formatPercentage(45.7, 0);

      expect(formatted).toBe("46%");
    });

    it("should return '0%' for null", () => {
      const formatted = formatPercentage(null);

      expect(formatted).toBe("0%");
    });

    it("should return '0%' for undefined", () => {
      const formatted = formatPercentage(undefined);

      expect(formatted).toBe("0%");
    });

    it("should return '0%' for NaN", () => {
      const formatted = formatPercentage(NaN);

      expect(formatted).toBe("0%");
    });
  });

  describe("calculatePercentage", () => {
    it("should calculate percentage from part and total", () => {
      const formatted = calculatePercentage(45, 100);

      expect(formatted).toBe("45.0%");
    });

    it("should calculate percentage with custom decimal places", () => {
      const formatted = calculatePercentage(1, 3, 2);

      expect(formatted).toBe("33.33%");
    });

    it("should handle zero total", () => {
      const formatted = calculatePercentage(50, 0);

      expect(formatted).toBe("0%");
    });

    it("should handle null total", () => {
      const formatted = calculatePercentage(50, null);

      expect(formatted).toBe("0%");
    });

    it("should handle undefined total", () => {
      const formatted = calculatePercentage(50, undefined);

      expect(formatted).toBe("0%");
    });

    it("should calculate percentage greater than 100%", () => {
      const formatted = calculatePercentage(150, 100);

      expect(formatted).toBe("150.0%");
    });

    it("should calculate negative percentage", () => {
      const formatted = calculatePercentage(-50, 100);

      expect(formatted).toBe("-50.0%");
    });

    it("should handle decimal values", () => {
      const formatted = calculatePercentage(33.33, 100);

      expect(formatted).toBe("33.3%");
    });
  });
});
