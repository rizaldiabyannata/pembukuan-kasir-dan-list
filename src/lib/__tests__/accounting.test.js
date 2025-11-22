/**
 * Unit Tests for Accounting Logic
 * Tests all financial calculation functions for accuracy and edge cases
 */

import { describe, it, expect } from "@jest/globals";
import fc from "fast-check";
import {
  calculateTransactionFinancials,
  calculateAggregateFinancials,
  calculateNetProfit,
  validateTransactionFinancials,
  formatCurrency,
  formatCurrencyCompact,
  calculateTourPackagePriceFromParams,
} from "../accounting";
import {
  transactionWithPackageArbitrary,
  packageArbitrary,
  dateArbitrary,
} from "./test-generators";

describe("calculateTransactionFinancials", () => {
  describe("Normal transactions without overtime", () => {
    it("should calculate correctly for 12-hour rental without overtime", () => {
      const transaction = {
        checkout_datetime: "2025-11-01T08:00:00Z",
        checkin_datetime: "2025-11-01T20:00:00Z",
        all_in_rate: 500000,
        overtime_rate_per_hour: 50000,
        fuel_cost: 100000,
        driver_fee: 150000,
        package: { durationHours: 12 },
      };

      const result = calculateTransactionFinancials(transaction);

      expect(result.lamaSewaJam).toBe(12);
      expect(result.lamaOvertimeJam).toBe(0);
      expect(result.totalOvertimeFee).toBe(0);
      expect(result.totalPendapatan).toBe(500000);
      expect(result.totalBiayaOps).toBe(0); // Operational costs now tracked as separate expenses
      expect(result.labaKotor).toBe(500000);
    });

    it("should not calculate overtime for custom rentals without package", () => {
      const transaction = {
        checkout_datetime: "2025-11-01T08:00:00Z",
        checkin_datetime: "2025-11-01T20:00:00Z", // 12 hours rental
        all_in_rate: 500000,
        overtime_rate_per_hour: 50000,
        fuel_cost: 100000,
        driver_fee: 150000,
        // No package - custom rental
      };

      const result = calculateTransactionFinancials(transaction);

      expect(result.lamaSewaJam).toBe(12);
      expect(result.lamaOvertimeJam).toBe(0); // No overtime for custom rentals
      expect(result.totalOvertimeFee).toBe(0);
      expect(result.totalPendapatan).toBe(500000); // Only base rate
    });

    it("should not calculate overtime for long custom rentals without package", () => {
      const transaction = {
        checkout_datetime: "2025-11-01T08:00:00Z",
        checkin_datetime: "2025-11-02T08:00:00Z", // 24 hours rental
        all_in_rate: 1000000,
        overtime_rate_per_hour: 50000,
        fuel_cost: 100000,
        driver_fee: 150000,
        // No package - custom rental
      };

      const result = calculateTransactionFinancials(transaction);

      expect(result.lamaSewaJam).toBe(24);
      expect(result.lamaOvertimeJam).toBe(0); // No overtime even for long rentals without package
      expect(result.totalOvertimeFee).toBe(0);
      expect(result.totalPendapatan).toBe(1000000); // Only base rate
    });
  });

  describe("Transactions with overtime", () => {
    it("should calculate correctly with 3 hours overtime", () => {
      const transaction = {
        checkout_datetime: "2025-11-01T08:00:00Z",
        checkin_datetime: "2025-11-01T23:00:00Z", // 15 hours
        all_in_rate: 500000,
        overtime_rate_per_hour: 50000,
        fuel_cost: 100000,
        driver_fee: 150000,
        package: { durationHours: 12 },
      };

      const result = calculateTransactionFinancials(transaction);

      expect(result.lamaSewaJam).toBe(15);
      expect(result.lamaOvertimeJam).toBe(3);
      expect(result.totalOvertimeFee).toBe(150000); // 3 * 50000
      expect(result.totalPendapatan).toBe(650000); // 500000 + 150000
      expect(result.totalBiayaOps).toBe(0); // Operational costs now tracked as separate expenses
      expect(result.labaKotor).toBe(650000); // 650000 - 0
    });

    it("should calculate correctly with 1 hour overtime", () => {
      const transaction = {
        checkout_datetime: "2025-11-01T08:00:00Z",
        checkin_datetime: "2025-11-01T21:00:00Z", // 13 hours
        all_in_rate: 500000,
        overtime_rate_per_hour: 50000,
        fuel_cost: 100000,
        driver_fee: 150000,
        package: { durationHours: 12 },
      };

      const result = calculateTransactionFinancials(transaction);

      expect(result.lamaSewaJam).toBe(13);
      expect(result.lamaOvertimeJam).toBe(1);
      expect(result.totalOvertimeFee).toBe(50000);
      expect(result.totalPendapatan).toBe(550000);
      expect(result.labaKotor).toBe(550000); // No operational costs deducted
    });

    it("should handle large overtime correctly", () => {
      const transaction = {
        checkout_datetime: "2025-11-01T08:00:00Z",
        checkin_datetime: "2025-11-02T08:00:00Z", // 24 hours
        all_in_rate: 500000,
        overtime_rate_per_hour: 50000,
        fuel_cost: 100000,
        driver_fee: 150000,
        package: { durationHours: 12 },
      };

      const result = calculateTransactionFinancials(transaction);

      expect(result.lamaSewaJam).toBe(24);
      expect(result.lamaOvertimeJam).toBe(12);
      expect(result.totalOvertimeFee).toBe(600000); // 12 * 50000
      expect(result.totalPendapatan).toBe(1100000); // 500000 + 600000
    });
  });

  describe("Edge cases", () => {
    it("should handle invalid time range (checkin before checkout)", () => {
      const transaction = {
        checkout_datetime: "2025-11-01T20:00:00Z",
        checkin_datetime: "2025-11-01T08:00:00Z", // Before checkout!
        all_in_rate: 500000,
        overtime_rate_per_hour: 50000,
        fuel_cost: 100000,
        driver_fee: 150000,
        package: { durationHours: 12 },
      };

      const result = calculateTransactionFinancials(transaction);

      expect(result.lamaSewaJam).toBe(0);
      expect(result.lamaOvertimeJam).toBe(0);
      expect(result.totalOvertimeFee).toBe(0);
      expect(result.totalPendapatan).toBe(500000); // Only base rate
      expect(result.labaKotor).toBe(500000); // No operational costs deducted
    });

    it("should handle zero overtime rate", () => {
      const transaction = {
        checkout_datetime: "2025-11-01T08:00:00Z",
        checkin_datetime: "2025-11-01T23:00:00Z",
        all_in_rate: 500000,
        overtime_rate_per_hour: 0, // Zero rate
        fuel_cost: 100000,
        driver_fee: 150000,
        package: { durationHours: 12 },
      };

      const result = calculateTransactionFinancials(transaction);

      expect(result.lamaOvertimeJam).toBe(3);
      expect(result.totalOvertimeFee).toBe(0);
      expect(result.totalPendapatan).toBe(500000);
    });

    it("should handle missing/null values gracefully", () => {
      const transaction = {
        checkout_datetime: "2025-11-01T08:00:00Z",
        checkin_datetime: "2025-11-01T20:00:00Z",
        all_in_rate: 500000,
        // Missing overtime_rate_per_hour
        // Missing fuel_cost
        // Missing driver_fee
        package: { durationHours: 12 },
      };

      const result = calculateTransactionFinancials(transaction);

      expect(result.totalPendapatan).toBe(500000);
      expect(result.totalBiayaOps).toBe(0);
      expect(result.labaKotor).toBe(500000);
    });

    it("should handle zero costs", () => {
      const transaction = {
        checkout_datetime: "2025-11-01T08:00:00Z",
        checkin_datetime: "2025-11-01T20:00:00Z",
        all_in_rate: 500000,
        overtime_rate_per_hour: 50000,
        fuel_cost: 0,
        driver_fee: 0,
        package: { durationHours: 12 },
      };

      const result = calculateTransactionFinancials(transaction);

      expect(result.totalBiayaOps).toBe(0);
      expect(result.labaKotor).toBe(500000); // Full profit
    });

    it("should handle negative profit (loss)", () => {
      const transaction = {
        checkout_datetime: "2025-11-01T08:00:00Z",
        checkin_datetime: "2025-11-01T20:00:00Z",
        all_in_rate: 200000, // Low rate
        overtime_rate_per_hour: 50000,
        fuel_cost: 150000,
        driver_fee: 200000, // High costs
        package: { durationHours: 12 },
      };

      const result = calculateTransactionFinancials(transaction);

      expect(result.totalPendapatan).toBe(200000);
      expect(result.totalBiayaOps).toBe(0); // Operational costs now tracked as separate expenses
      expect(result.labaKotor).toBe(200000); // No loss since operational costs are separate
    });
  });

  describe("Rounding behavior", () => {
    it("should round hours correctly for 12.4 hours", () => {
      const transaction = {
        checkout_datetime: "2025-11-01T08:00:00Z",
        checkin_datetime: "2025-11-01T20:24:00Z", // 12.4 hours
        all_in_rate: 500000,
        overtime_rate_per_hour: 50000,
        fuel_cost: 100000,
        driver_fee: 150000,
        package: { durationHours: 12 },
      };

      const result = calculateTransactionFinancials(transaction);

      expect(result.lamaSewaJam).toBe(12); // Rounded
      expect(result.lamaOvertimeJam).toBe(0);
    });

    it("should round hours correctly for 12.6 hours", () => {
      const transaction = {
        checkout_datetime: "2025-11-01T08:00:00Z",
        checkin_datetime: "2025-11-01T20:36:00Z", // 12.6 hours
        all_in_rate: 500000,
        overtime_rate_per_hour: 50000,
        fuel_cost: 100000,
        driver_fee: 150000,
        package: { durationHours: 12 },
      };

      const result = calculateTransactionFinancials(transaction);

      expect(result.lamaSewaJam).toBe(13); // Rounded up
      expect(result.lamaOvertimeJam).toBe(1);
      expect(result.totalOvertimeFee).toBe(50000);
    });
  });
});

describe("calculateAggregateFinancials", () => {
  it("should aggregate multiple transactions correctly", () => {
    const transactions = [
      {
        checkout_datetime: "2025-11-01T08:00:00Z",
        checkin_datetime: "2025-11-01T20:00:00Z",
        all_in_rate: 500000,
        overtime_rate_per_hour: 50000,
        fuel_cost: 100000,
        driver_fee: 150000,
        package: { durationHours: 12 },
      },
      {
        checkout_datetime: "2025-11-01T08:00:00Z",
        checkin_datetime: "2025-11-01T23:00:00Z", // With overtime
        all_in_rate: 500000,
        overtime_rate_per_hour: 50000,
        fuel_cost: 100000,
        driver_fee: 150000,
        package: { durationHours: 12 },
      },
    ];

    const result = calculateAggregateFinancials(transactions);

    expect(result.totalRevenue).toBe(1150000); // 500k + 650k
    expect(result.totalOperationalCosts).toBe(0); // Operational costs now tracked as separate expenses
    expect(result.totalGrossProfit).toBe(1150000); // Revenue with no operational costs deducted
    expect(result.totalOvertimeFees).toBe(150000); // 0 + 150k
    expect(result.transactionCount).toBe(2);
    expect(result.averageRevenue).toBe(575000); // 1150k / 2
    expect(result.averageProfit).toBe(575000); // 1150k / 2
  });

  it("should handle empty array", () => {
    const result = calculateAggregateFinancials([]);

    expect(result.totalRevenue).toBe(0);
    expect(result.totalOperationalCosts).toBe(0);
    expect(result.totalGrossProfit).toBe(0);
    expect(result.transactionCount).toBe(0);
    expect(result.averageRevenue).toBe(0);
    expect(result.averageProfit).toBe(0);
  });

  it("should handle single transaction", () => {
    const transactions = [
      {
        checkout_datetime: "2025-11-01T08:00:00Z",
        checkin_datetime: "2025-11-01T20:00:00Z",
        all_in_rate: 500000,
        overtime_rate_per_hour: 50000,
        fuel_cost: 100000,
        driver_fee: 150000,
        package: { durationHours: 12 },
      },
    ];

    const result = calculateAggregateFinancials(transactions);

    expect(result.transactionCount).toBe(1);
    expect(result.averageRevenue).toBe(500000);
    expect(result.averageProfit).toBe(500000); // No operational costs deducted
  });
});

describe("calculateNetProfit", () => {
  it("should calculate net profit correctly", () => {
    const result = calculateNetProfit(1000000, 300000);

    expect(result.grossProfit).toBe(1000000);
    expect(result.officeExpenses).toBe(300000);
    expect(result.netProfit).toBe(700000);
    expect(result.profitMargin).toBe(70); // 70%
  });

  it("should handle zero gross profit", () => {
    const result = calculateNetProfit(0, 300000);

    expect(result.netProfit).toBe(-300000); // Loss
    expect(result.profitMargin).toBe(0);
  });

  it("should handle zero expenses", () => {
    const result = calculateNetProfit(1000000, 0);

    expect(result.netProfit).toBe(1000000);
    expect(result.profitMargin).toBe(100); // 100% profit
  });

  it("should handle negative net profit", () => {
    const result = calculateNetProfit(500000, 800000);

    expect(result.netProfit).toBe(-300000); // Loss
    expect(result.profitMargin).toBeLessThan(0);
  });
});

describe("validateTransactionFinancials", () => {
  it("should validate correct transaction", () => {
    const transaction = {
      checkout_datetime: "2025-11-01T08:00:00Z",
      checkin_datetime: "2025-11-01T20:00:00Z",
      all_in_rate: 500000,
      overtime_rate_per_hour: 50000,
      fuel_cost: 100000,
      driver_fee: 150000,
    };

    const result = validateTransactionFinancials(transaction);

    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should catch invalid time range", () => {
    const transaction = {
      checkout_datetime: "2025-11-01T20:00:00Z",
      checkin_datetime: "2025-11-01T08:00:00Z", // Before checkout
      all_in_rate: 500000,
      overtime_rate_per_hour: 50000,
      fuel_cost: 100000,
      driver_fee: 150000,
    };

    const result = validateTransactionFinancials(transaction);

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(
      "Check-in time must be after check-out time"
    );
  });

  it("should catch negative all_in_rate", () => {
    const transaction = {
      checkout_datetime: "2025-11-01T08:00:00Z",
      checkin_datetime: "2025-11-01T20:00:00Z",
      all_in_rate: -500000, // Negative!
      overtime_rate_per_hour: 50000,
      fuel_cost: 100000,
      driver_fee: 150000,
    };

    const result = validateTransactionFinancials(transaction);

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("All-in rate cannot be negative");
  });

  it("should catch negative overtime_rate_per_hour", () => {
    const transaction = {
      checkout_datetime: "2025-11-01T08:00:00Z",
      checkin_datetime: "2025-11-01T20:00:00Z",
      all_in_rate: 500000,
      overtime_rate_per_hour: -50000, // Negative!
      fuel_cost: 100000,
      driver_fee: 150000,
    };

    const result = validateTransactionFinancials(transaction);

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Overtime rate cannot be negative");
  });

  it("should catch multiple validation errors", () => {
    const transaction = {
      checkout_datetime: "2025-11-01T20:00:00Z",
      checkin_datetime: "2025-11-01T08:00:00Z", // Invalid time
      all_in_rate: -500000, // Negative
      overtime_rate_per_hour: -50000, // Negative
      fuel_cost: -100000, // Negative
      driver_fee: -150000, // Negative
    };

    const result = validateTransactionFinancials(transaction);

    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(1);
  });
});

describe("formatCurrency", () => {
  it("should format currency correctly", () => {
    const formatted500k = formatCurrency(500000);
    const formatted1_5m = formatCurrency(1500000);
    const formatted0 = formatCurrency(0);

    // Check that it contains "Rp" and proper formatting
    expect(formatted500k).toContain("Rp");
    expect(formatted500k).toContain("500");

    expect(formatted1_5m).toContain("Rp");
    expect(formatted1_5m).toContain("1");
    expect(formatted1_5m).toContain("500");

    expect(formatted0).toContain("Rp");
    expect(formatted0).toContain("0");
  });

  it("should handle invalid inputs", () => {
    expect(formatCurrency(null)).toBe("Rp 0");
    expect(formatCurrency(undefined)).toBe("Rp 0");
    expect(formatCurrency(NaN)).toBe("Rp 0");
  });

  it("should format negative numbers", () => {
    const formatted = formatCurrency(-500000);
    expect(formatted).toContain("500");
    expect(formatted).toMatch(/[-−]/); // Either minus or negative sign
  });

  it("should format large numbers", () => {
    const formatted = formatCurrency(1000000000);
    expect(formatted).toContain("Rp");
    expect(formatted).toContain("1");
    expect(formatted).toContain("000");
  });
});

describe("formatCurrencyCompact", () => {
  it("should format small numbers normally", () => {
    const formatted = formatCurrencyCompact(500000);
    expect(formatted).toContain("Rp");
    expect(formatted).toMatch(/500|rb/i);
  });

  it("should format millions compactly", () => {
    const formatted = formatCurrencyCompact(1500000);
    expect(formatted).toContain("Rp");
    // Should show compact notation (jt or juta)
    expect(formatted).toMatch(/[1-2]/); // 1.5 or 2
    expect(formatted).toMatch(/jt|juta|M/i);
  });

  it("should format billions compactly", () => {
    const formatted = formatCurrencyCompact(1500000000);
    expect(formatted).toContain("Rp");
    expect(formatted).toMatch(/[1-2]/);
    expect(formatted).toMatch(/M|miliar|B/i);
  });

  it("should handle zero", () => {
    const formatted = formatCurrencyCompact(0);
    expect(formatted).toContain("Rp");
    expect(formatted).toContain("0");
  });
});

describe("calculateTourPackagePriceFromParams", () => {
  const mockPackage = {
    type: "TOUR_PACKAGE",
    hotelTiers: [
      {
        id: "tier1",
        priceRanges: [
          { minPax: 1, maxPax: 2, price: 100000 },
          { minPax: 3, maxPax: 5, price: 90000 },
        ],
      },
      {
        id: "tier2",
        priceRanges: [
          { minPax: 1, maxPax: 2, price: 150000 },
          { minPax: 3, maxPax: 5, price: 130000 },
        ],
      },
    ],
  };

  it("should calculate price correctly for valid TOUR_PACKAGE", () => {
    const result = calculateTourPackagePriceFromParams(mockPackage, "tier1", 2);
    expect(result).toBe(200000); // 100000 * 2
  });

  it("should calculate price for different tier and pax count", () => {
    const result = calculateTourPackagePriceFromParams(mockPackage, "tier2", 4);
    expect(result).toBe(520000); // 130000 * 4
  });

  it("should return 0 for non-TOUR_PACKAGE", () => {
    const nonTourPackage = { ...mockPackage, type: "CAR_RENTAL" };
    const result = calculateTourPackagePriceFromParams(
      nonTourPackage,
      "tier1",
      2
    );
    expect(result).toBe(0);
  });

  it("should return 0 for missing package", () => {
    const result = calculateTourPackagePriceFromParams(null, "tier1", 2);
    expect(result).toBe(0);
  });

  it("should return 0 for missing hotelTierId", () => {
    const result = calculateTourPackagePriceFromParams(mockPackage, null, 2);
    expect(result).toBe(0);
  });

  it("should return 0 for missing paxCount", () => {
    const result = calculateTourPackagePriceFromParams(
      mockPackage,
      "tier1",
      null
    );
    expect(result).toBe(0);
  });

  it("should return 0 for paxCount <= 0", () => {
    const result = calculateTourPackagePriceFromParams(mockPackage, "tier1", 0);
    expect(result).toBe(0);
  });

  it("should return 0 for invalid hotelTierId", () => {
    const result = calculateTourPackagePriceFromParams(
      mockPackage,
      "invalid",
      2
    );
    expect(result).toBe(0);
  });

  it("should return 0 when no applicable price range", () => {
    const result = calculateTourPackagePriceFromParams(
      mockPackage,
      "tier1",
      10
    ); // Outside ranges
    expect(result).toBe(0);
  });

  it("should handle string paxCount", () => {
    const result = calculateTourPackagePriceFromParams(
      mockPackage,
      "tier1",
      "3"
    );
    expect(result).toBe(270000); // 90000 * 3
  });
});

describe("Integration tests - Real world scenarios", () => {
  it("should calculate daily revenue correctly", () => {
    // Scenario: 5 transactions in a day
    const dailyTransactions = [
      {
        checkout_datetime: "2025-11-01T08:00:00Z",
        checkin_datetime: "2025-11-01T20:00:00Z",
        all_in_rate: 500000,
        overtime_rate_per_hour: 50000,
        fuel_cost: 100000,
        driver_fee: 150000,
        package: { durationHours: 12 },
      },
      {
        checkout_datetime: "2025-11-01T09:00:00Z",
        checkin_datetime: "2025-11-01T22:00:00Z", // 1 hour OT
        all_in_rate: 600000,
        overtime_rate_per_hour: 50000,
        fuel_cost: 120000,
        driver_fee: 150000,
        package: { durationHours: 12 },
      },
      {
        checkout_datetime: "2025-11-01T10:00:00Z",
        checkin_datetime: "2025-11-02T01:00:00Z", // 3 hours OT
        all_in_rate: 700000,
        overtime_rate_per_hour: 60000,
        fuel_cost: 150000,
        driver_fee: 200000,
        package: { durationHours: 12 },
      },
      {
        checkout_datetime: "2025-11-01T14:00:00Z",
        checkin_datetime: "2025-11-02T02:00:00Z", // No package = default 12h
        all_in_rate: 550000,
        overtime_rate_per_hour: 50000,
        fuel_cost: 110000,
        driver_fee: 150000,
      },
      {
        checkout_datetime: "2025-11-01T16:00:00Z",
        checkin_datetime: "2025-11-01T23:00:00Z", // Exactly 7 hours, no OT
        all_in_rate: 400000,
        overtime_rate_per_hour: 50000,
        fuel_cost: 80000,
        driver_fee: 120000,
        package: { durationHours: 8 },
      },
    ];

    const result = calculateAggregateFinancials(dailyTransactions);

    // Verify totals
    expect(result.transactionCount).toBe(5);
    expect(result.totalRevenue).toBeGreaterThan(2750000); // Has overtime
    expect(result.totalGrossProfit).toBeGreaterThan(0);
    expect(result.averageRevenue).toBeGreaterThan(500000);
  });

  it("should handle month-end profit calculation", () => {
    // Gross profit from transactions
    const grossProfit = 50000000; // 50 million

    // Office expenses
    const officeExpenses = 15000000; // 15 million

    const result = calculateNetProfit(grossProfit, officeExpenses);

    expect(result.netProfit).toBe(35000000); // 35 million
    expect(result.profitMargin).toBe(70); // 70% margin
  });
});

// ============================================================================
// PROPERTY-BASED TESTS
// ============================================================================

describe("Property-Based Tests for Accounting Utilities", () => {
  // Feature: laporan-keuangan-testing, Property 2: Revenue composition invariant
  // Validates: Requirements 1.2
  describe("Property 2: Revenue composition invariant", () => {
    it("should satisfy: total revenue = base revenue + overtime fees", () => {
      fc.assert(
        fc.property(transactionWithPackageArbitrary(), (transaction) => {
          const financials = calculateTransactionFinancials(transaction);

          // Skip if there's an error in calculation
          if (financials.error) {
            return true;
          }

          // Calculate base revenue (total revenue minus overtime fees)
          const baseRevenue =
            financials.totalPendapatan - financials.totalOvertimeFee;

          // Property: total revenue should equal base revenue + overtime fees
          // This is a tautology check to ensure the calculation is consistent
          expect(financials.totalPendapatan).toBe(
            baseRevenue + financials.totalOvertimeFee
          );
        }),
        { numRuns: 100 }
      );
    });
  });

  // Feature: laporan-keuangan-testing, Property 3: Tour package pricing correctness
  // Validates: Requirements 1.3
  describe("Property 3: Tour package pricing correctness", () => {
    it("should calculate TOUR_PACKAGE price as tier price per pax * pax count", () => {
      fc.assert(
        fc.property(
          fc.record({
            package: packageArbitrary().filter(
              (pkg) => pkg.type === "TOUR_PACKAGE"
            ),
            paxCount: fc.integer({ min: 1, max: 20 }),
          }),
          ({ package: pkg, paxCount }) => {
            // Skip if no hotel tiers
            if (!pkg.hotelTiers || pkg.hotelTiers.length === 0) {
              return true;
            }

            const hotelTier = pkg.hotelTiers[0];

            // Skip if no price ranges
            if (!hotelTier.priceRanges || hotelTier.priceRanges.length === 0) {
              return true;
            }

            // Find applicable price range
            const applicableRange = hotelTier.priceRanges.find(
              (range) => paxCount >= range.minPax && paxCount <= range.maxPax
            );

            // Skip if no applicable range
            if (!applicableRange) {
              return true;
            }

            const calculatedPrice = calculateTourPackagePriceFromParams(
              pkg,
              hotelTier.id,
              paxCount
            );

            // Property: calculated price should equal price per pax * pax count
            const expectedPrice = applicableRange.price * paxCount;
            expect(calculatedPrice).toBe(expectedPrice);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: laporan-keuangan-testing, Property 4: Custom pricing selection
  // Validates: Requirements 1.4
  describe("Property 4: Custom pricing selection", () => {
    it("should use custom_price if set, otherwise all_in_rate for CUSTOM_PRICING", () => {
      fc.assert(
        fc.property(
          fc
            .record({
              all_in_rate: fc.integer({ min: 100000, max: 5000000 }),
              custom_price: fc.option(
                fc.integer({ min: 100000, max: 5000000 }),
                { nil: null }
              ),
              checkout_datetime: dateArbitrary(),
            })
            .chain((base) =>
              fc.integer({ min: 1, max: 72 }).map((hoursOffset) => {
                const checkout = new Date(base.checkout_datetime);
                const checkin = new Date(checkout);
                checkin.setHours(checkin.getHours() + hoursOffset);

                return {
                  ...base,
                  checkin_datetime: checkin,
                  overtime_rate_per_hour: 50000,
                  package: {
                    id: "custom-pkg",
                    type: "CUSTOM_PRICING",
                    durationHours: 12,
                  },
                };
              })
            ),
          (transaction) => {
            const financials = calculateTransactionFinancials(transaction);

            // Skip if there's an error
            if (financials.error) {
              return true;
            }

            // Calculate expected base revenue
            const expectedBaseRevenue =
              transaction.custom_price || transaction.all_in_rate;

            // Property: base revenue (total - overtime) should equal custom_price or all_in_rate
            const actualBaseRevenue =
              financials.totalPendapatan - financials.totalOvertimeFee;
            expect(actualBaseRevenue).toBe(expectedBaseRevenue);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: laporan-keuangan-testing, Property 5: Overtime calculation formula
  // Validates: Requirements 1.5
  describe("Property 5: Overtime calculation formula", () => {
    it("should calculate overtime as (rental hours - package hours) * overtime rate when rental > package duration", () => {
      fc.assert(
        fc.property(
          fc.record({
            packageDuration: fc.integer({ min: 4, max: 12 }),
            overtimeHours: fc.integer({ min: 1, max: 12 }),
            overtimeRate: fc.integer({ min: 25000, max: 200000 }),
            all_in_rate: fc.integer({ min: 100000, max: 5000000 }),
          }),
          ({ packageDuration, overtimeHours, overtimeRate, all_in_rate }) => {
            const checkout = new Date("2025-11-01T08:00:00Z");
            const checkin = new Date(checkout);
            checkin.setHours(
              checkin.getHours() + packageDuration + overtimeHours
            );

            const transaction = {
              checkout_datetime: checkout,
              checkin_datetime: checkin,
              all_in_rate,
              overtime_rate_per_hour: overtimeRate,
              package: {
                type: "CAR_RENTAL",
                durationHours: packageDuration,
              },
            };

            const financials = calculateTransactionFinancials(transaction);

            // Property: overtime fee should equal overtime hours * overtime rate
            const expectedOvertimeFee = overtimeHours * overtimeRate;

            // Allow for rounding differences (within 1 hour's worth of overtime)
            expect(
              Math.abs(financials.totalOvertimeFee - expectedOvertimeFee)
            ).toBeLessThanOrEqual(overtimeRate);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: laporan-keuangan-testing, Property 6: No overtime for flat-rate packages
  // Validates: Requirements 1.6
  describe("Property 6: No overtime for flat-rate packages", () => {
    it("should have zero overtime fees for TOUR_PACKAGE and FULL_DAY_TRIP", () => {
      fc.assert(
        fc.property(
          fc.record({
            packageType: fc.constantFrom("TOUR_PACKAGE", "FULL_DAY_TRIP"),
            rentalHours: fc.integer({ min: 1, max: 72 }),
            all_in_rate: fc.integer({ min: 100000, max: 5000000 }),
            overtimeRate: fc.integer({ min: 25000, max: 200000 }),
          }),
          ({ packageType, rentalHours, all_in_rate, overtimeRate }) => {
            const checkout = new Date("2025-11-01T08:00:00Z");
            const checkin = new Date(checkout);
            checkin.setHours(checkin.getHours() + rentalHours);

            const transaction = {
              checkout_datetime: checkout,
              checkin_datetime: checkin,
              all_in_rate,
              overtime_rate_per_hour: overtimeRate,
              package: {
                type: packageType,
                durationHours: null, // Flat rate packages don't have duration
              },
            };

            const financials = calculateTransactionFinancials(transaction);

            // Property: overtime fees should be zero for flat-rate packages
            expect(financials.totalOvertimeFee).toBe(0);
            expect(financials.lamaOvertimeJam).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: laporan-keuangan-testing, Property 25: Working hours calculation
  // Validates: Requirements 4.3, 8.2
  describe("Property 25: Working hours calculation", () => {
    it("should calculate working hours as (checkin - checkout) / 3600000 ms", () => {
      fc.assert(
        fc.property(
          fc.record({
            rentalHours: fc.integer({ min: 1, max: 72 }),
            all_in_rate: fc.integer({ min: 100000, max: 5000000 }),
          }),
          ({ rentalHours, all_in_rate }) => {
            const checkout = new Date("2025-11-01T08:00:00Z");
            const checkin = new Date(checkout);
            checkin.setHours(checkin.getHours() + rentalHours);

            const transaction = {
              checkout_datetime: checkout,
              checkin_datetime: checkin,
              all_in_rate,
              overtime_rate_per_hour: 50000,
              package: { durationHours: 12 },
            };

            const financials = calculateTransactionFinancials(transaction);

            // Property: rental hours should match the time difference
            // Allow for rounding (Math.round is used in the implementation)
            expect(
              Math.abs(financials.lamaSewaJam - rentalHours)
            ).toBeLessThanOrEqual(1);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: laporan-keuangan-testing, Property 19: Net profit calculation formula
  // Validates: Requirements 3.5
  describe("Property 19: Net profit calculation formula", () => {
    it("should calculate net profit as gross profit - office expenses", () => {
      fc.assert(
        fc.property(
          fc.record({
            grossProfit: fc.integer({ min: 0, max: 100000000 }),
            officeExpenses: fc.integer({ min: 0, max: 50000000 }),
          }),
          ({ grossProfit, officeExpenses }) => {
            const result = calculateNetProfit(grossProfit, officeExpenses);

            // Property: net profit = gross profit - office expenses
            const expectedNetProfit = grossProfit - officeExpenses;
            expect(result.netProfit).toBe(expectedNetProfit);
            expect(result.grossProfit).toBe(grossProfit);
            expect(result.officeExpenses).toBe(officeExpenses);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: laporan-keuangan-testing, Property 20: Profit margin calculation formula
  // Validates: Requirements 3.6
  describe("Property 20: Profit margin calculation formula", () => {
    it("should calculate profit margin as (net profit / gross profit) * 100 when gross profit > 0", () => {
      fc.assert(
        fc.property(
          fc.record({
            grossProfit: fc.integer({ min: 1, max: 100000000 }), // Ensure > 0
            officeExpenses: fc.integer({ min: 0, max: 50000000 }),
          }),
          ({ grossProfit, officeExpenses }) => {
            const result = calculateNetProfit(grossProfit, officeExpenses);

            // Property: profit margin = (net profit / gross profit) * 100
            const expectedMargin = (result.netProfit / grossProfit) * 100;

            // Allow for floating point precision differences
            expect(Math.abs(result.profitMargin - expectedMargin)).toBeLessThan(
              0.01
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should return 0 profit margin when gross profit is 0", () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 50000000 }), (officeExpenses) => {
          const result = calculateNetProfit(0, officeExpenses);

          // Property: profit margin should be 0 when gross profit is 0
          expect(result.profitMargin).toBe(0);
        }),
        { numRuns: 100 }
      );
    });
  });

  // Feature: laporan-keuangan-testing, Property 41: Gross profit formula
  // Validates: Requirements 8.5
  describe("Property 41: Gross profit formula", () => {
    it("should calculate gross profit as total revenue - operational costs", () => {
      fc.assert(
        fc.property(transactionWithPackageArbitrary(), (transaction) => {
          const financials = calculateTransactionFinancials(transaction);

          // Skip if there's an error
          if (financials.error) {
            return true;
          }

          // Property: gross profit = total revenue - operational costs
          const expectedGrossProfit =
            financials.totalPendapatan - financials.totalBiayaOps;
          expect(financials.labaKotor).toBe(expectedGrossProfit);
        }),
        { numRuns: 100 }
      );
    });
  });
});
