/**
 * Manual Verification Tests for Task 5
 * Verify financial calculations include overtime charges
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */

import { describe, it, expect } from "@jest/globals";
import { calculateTransactionFinancials } from "../accounting";

describe("Task 5: Verify financial calculations include overtime charges", () => {
  describe("Requirement 3.1: Overtime charges based on package overtime rate", () => {
    it("should calculate overtime charges correctly", () => {
      const transaction = {
        checkout_datetime: "2025-11-01T08:00:00Z",
        checkin_datetime: "2025-11-01T23:00:00Z", // 15 hours
        all_in_rate: 500000,
        overtime_rate_per_hour: 50000,
        package: { durationHours: 12 },
      };

      const result = calculateTransactionFinancials(transaction);

      // 15 hours - 12 hours = 3 hours overtime
      expect(result.lamaOvertimeJam).toBe(3);
      // 3 hours * 50000 = 150000
      expect(result.totalOvertimeFee).toBe(150000);
    });
  });

  describe("Requirement 3.2: Total revenue includes base + overtime", () => {
    it("should add overtime charges to base package price", () => {
      const transaction = {
        checkout_datetime: "2025-11-01T08:00:00Z",
        checkin_datetime: "2025-11-01T23:00:00Z", // 15 hours
        all_in_rate: 500000,
        overtime_rate_per_hour: 50000,
        package: { durationHours: 12 },
      };

      const result = calculateTransactionFinancials(transaction);

      // Base: 500000, Overtime: 150000
      expect(result.totalPendapatan).toBe(650000);
    });
  });

  describe("Requirement 3.3: Gross profit subtracts operational costs", () => {
    it("should calculate gross profit correctly", () => {
      const transaction = {
        checkout_datetime: "2025-11-01T08:00:00Z",
        checkin_datetime: "2025-11-01T23:00:00Z", // 15 hours
        all_in_rate: 500000,
        overtime_rate_per_hour: 50000,
        package: { durationHours: 12 },
      };

      const result = calculateTransactionFinancials(transaction);

      // Total revenue: 650000, Operational costs: 0 (tracked separately)
      expect(result.labaKotor).toBe(650000);
      expect(result.totalBiayaOps).toBe(0);
    });
  });

  describe("Requirement 3.4: Example - 2 hours overtime at 100k/hour", () => {
    it("should add 200k to base price for 2 hours overtime at 100k/hour", () => {
      const transaction = {
        checkout_datetime: "2025-11-01T08:00:00Z",
        checkin_datetime: "2025-11-01T22:00:00Z", // 14 hours
        all_in_rate: 800000,
        overtime_rate_per_hour: 100000,
        package: { durationHours: 12 },
      };

      const result = calculateTransactionFinancials(transaction);

      // 14 hours - 12 hours = 2 hours overtime
      expect(result.lamaOvertimeJam).toBe(2);
      // 2 hours * 100000 = 200000
      expect(result.totalOvertimeFee).toBe(200000);
      // Base: 800000 + Overtime: 200000 = 1000000
      expect(result.totalPendapatan).toBe(1000000);
    });
  });

  describe("Requirement 3.5: All financial values display correctly", () => {
    it("should return all required financial values", () => {
      const transaction = {
        checkout_datetime: "2025-11-01T08:00:00Z",
        checkin_datetime: "2025-11-01T23:00:00Z", // 15 hours
        all_in_rate: 500000,
        overtime_rate_per_hour: 50000,
        package: { durationHours: 12 },
      };

      const result = calculateTransactionFinancials(transaction);

      // Verify all required fields are present
      expect(result).toHaveProperty("lamaSewaJam");
      expect(result).toHaveProperty("lamaOvertimeJam");
      expect(result).toHaveProperty("totalOvertimeFee");
      expect(result).toHaveProperty("totalPendapatan");
      expect(result).toHaveProperty("totalBiayaOps");
      expect(result).toHaveProperty("labaKotor");

      // Verify values are correct
      expect(result.lamaSewaJam).toBe(15);
      expect(result.lamaOvertimeJam).toBe(3);
      expect(result.totalOvertimeFee).toBe(150000);
      expect(result.totalPendapatan).toBe(650000);
      expect(result.totalBiayaOps).toBe(0);
      expect(result.labaKotor).toBe(650000);
    });
  });

  describe("Various overtime scenarios", () => {
    it("should handle 5-hour package extended to 7 hours (2 hours overtime)", () => {
      const transaction = {
        checkout_datetime: "2025-11-01T08:00:00Z",
        checkin_datetime: "2025-11-01T15:00:00Z", // 7 hours
        all_in_rate: 300000,
        overtime_rate_per_hour: 40000,
        package: { durationHours: 5 },
      };

      const result = calculateTransactionFinancials(transaction);

      expect(result.lamaSewaJam).toBe(7);
      expect(result.lamaOvertimeJam).toBe(2);
      expect(result.totalOvertimeFee).toBe(80000); // 2 * 40000
      expect(result.totalPendapatan).toBe(380000); // 300000 + 80000
    });

    it("should handle no overtime when rental equals package duration", () => {
      const transaction = {
        checkout_datetime: "2025-11-01T08:00:00Z",
        checkin_datetime: "2025-11-01T20:00:00Z", // 12 hours
        all_in_rate: 500000,
        overtime_rate_per_hour: 50000,
        package: { durationHours: 12 },
      };

      const result = calculateTransactionFinancials(transaction);

      expect(result.lamaSewaJam).toBe(12);
      expect(result.lamaOvertimeJam).toBe(0);
      expect(result.totalOvertimeFee).toBe(0);
      expect(result.totalPendapatan).toBe(500000); // No overtime added
    });

    it("should handle rental shorter than package duration (no overtime)", () => {
      const transaction = {
        checkout_datetime: "2025-11-01T08:00:00Z",
        checkin_datetime: "2025-11-01T18:00:00Z", // 10 hours
        all_in_rate: 500000,
        overtime_rate_per_hour: 50000,
        package: { durationHours: 12 },
      };

      const result = calculateTransactionFinancials(transaction);

      expect(result.lamaSewaJam).toBe(10);
      expect(result.lamaOvertimeJam).toBe(0); // No negative overtime
      expect(result.totalOvertimeFee).toBe(0);
      expect(result.totalPendapatan).toBe(500000);
    });

    it("should handle large overtime (12 hours)", () => {
      const transaction = {
        checkout_datetime: "2025-11-01T08:00:00Z",
        checkin_datetime: "2025-11-02T08:00:00Z", // 24 hours
        all_in_rate: 500000,
        overtime_rate_per_hour: 50000,
        package: { durationHours: 12 },
      };

      const result = calculateTransactionFinancials(transaction);

      expect(result.lamaSewaJam).toBe(24);
      expect(result.lamaOvertimeJam).toBe(12);
      expect(result.totalOvertimeFee).toBe(600000); // 12 * 50000
      expect(result.totalPendapatan).toBe(1100000); // 500000 + 600000
    });
  });

  describe("Package types without overtime", () => {
    it("should not calculate overtime for TOUR_PACKAGE", () => {
      const transaction = {
        checkout_datetime: "2025-11-01T08:00:00Z",
        checkin_datetime: "2025-11-02T08:00:00Z", // 24 hours
        all_in_rate: 1500000,
        overtime_rate_per_hour: 50000,
        package: {
          type: "TOUR_PACKAGE",
          durationHours: null,
          hotelTiers: [
            {
              id: "tier1",
              priceRanges: [{ minPax: 1, maxPax: 5, price: 300000 }],
            },
          ],
        },
        hotel_tier_id: "tier1",
        pax_count: 5,
      };

      const result = calculateTransactionFinancials(transaction);

      expect(result.lamaSewaJam).toBe(24);
      expect(result.lamaOvertimeJam).toBe(0); // No overtime for tour packages
      expect(result.totalOvertimeFee).toBe(0);
      expect(result.totalPendapatan).toBe(1500000); // 300000 * 5 pax
    });

    it("should not calculate overtime for FULL_DAY_TRIP", () => {
      const transaction = {
        checkout_datetime: "2025-11-01T08:00:00Z",
        checkin_datetime: "2025-11-01T22:00:00Z", // 14 hours
        all_in_rate: 800000,
        overtime_rate_per_hour: 50000,
        package: { type: "FULL_DAY_TRIP", durationHours: null },
      };

      const result = calculateTransactionFinancials(transaction);

      expect(result.lamaSewaJam).toBe(14);
      expect(result.lamaOvertimeJam).toBe(0); // No overtime for full day trips
      expect(result.totalOvertimeFee).toBe(0);
      expect(result.totalPendapatan).toBe(800000); // Flat rate
    });

    it("should not calculate overtime for custom rentals without package", () => {
      const transaction = {
        checkout_datetime: "2025-11-01T08:00:00Z",
        checkin_datetime: "2025-11-01T22:00:00Z", // 14 hours
        all_in_rate: 700000,
        overtime_rate_per_hour: 50000,
        // No package - custom rental
      };

      const result = calculateTransactionFinancials(transaction);

      expect(result.lamaSewaJam).toBe(14);
      expect(result.lamaOvertimeJam).toBe(0); // No overtime without package duration
      expect(result.totalOvertimeFee).toBe(0);
      expect(result.totalPendapatan).toBe(700000);
    });
  });
});
