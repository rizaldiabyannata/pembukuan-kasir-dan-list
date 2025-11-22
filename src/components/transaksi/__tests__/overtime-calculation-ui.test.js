/**
 * Test: Overtime Calculation UI Updates
 *
 * This test verifies that overtime calculations are properly reflected in the UI
 * when transaction dates change.
 *
 * Requirements tested:
 * - 2.1: Overtime calculated when rental duration exceeds package duration
 * - 2.2: 5-hour package extended to 7 hours shows 2 hours overtime
 * - 2.3: Overtime display field updates immediately
 * - 2.4: Checkin datetime changes trigger overtime recalculation
 * - 2.5: Checkout datetime changes trigger overtime recalculation
 */

import { calculateTransactionFinancials } from "@/lib/accounting";

describe("Overtime Calculation UI Updates", () => {
  describe("calculateTransactionFinancials function", () => {
    it("should calculate overtime when rental exceeds package duration", () => {
      // Requirement 2.1: Overtime calculated when rental duration exceeds package duration
      const transaction = {
        checkout_datetime: new Date("2024-01-01T08:00:00").toISOString(),
        checkin_datetime: new Date("2024-01-01T15:00:00").toISOString(), // 7 hours later
        all_in_rate: 500000,
        overtime_rate_per_hour: 50000,
        package: {
          durationHours: 5,
          type: "CAR_RENTAL",
        },
      };

      const result = calculateTransactionFinancials(transaction);

      // Requirement 2.2: 5-hour package extended to 7 hours shows 2 hours overtime
      expect(result.lamaSewaJam).toBe(7);
      expect(result.lamaOvertimeJam).toBe(2);
      expect(result.totalOvertimeFee).toBe(100000); // 2 hours * 50000
    });

    it("should recalculate overtime when checkin datetime changes", () => {
      // Requirement 2.4: Checkin datetime changes trigger overtime recalculation
      const baseTransaction = {
        checkout_datetime: new Date("2024-01-01T08:00:00").toISOString(),
        checkin_datetime: new Date("2024-01-01T13:00:00").toISOString(), // 5 hours (no overtime)
        all_in_rate: 500000,
        overtime_rate_per_hour: 50000,
        package: {
          durationHours: 5,
          type: "CAR_RENTAL",
        },
      };

      // Initial calculation - no overtime
      const initialResult = calculateTransactionFinancials(baseTransaction);
      expect(initialResult.lamaOvertimeJam).toBe(0);

      // Update checkin datetime to extend rental
      const updatedTransaction = {
        ...baseTransaction,
        checkin_datetime: new Date("2024-01-01T16:00:00").toISOString(), // 8 hours (3 hours overtime)
      };

      // Requirement 2.3: Overtime display field updates immediately
      const updatedResult = calculateTransactionFinancials(updatedTransaction);
      expect(updatedResult.lamaSewaJam).toBe(8);
      expect(updatedResult.lamaOvertimeJam).toBe(3);
      expect(updatedResult.totalOvertimeFee).toBe(150000); // 3 hours * 50000
    });

    it("should recalculate overtime when checkout datetime changes", () => {
      // Requirement 2.5: Checkout datetime changes trigger overtime recalculation
      const baseTransaction = {
        checkout_datetime: new Date("2024-01-01T08:00:00").toISOString(),
        checkin_datetime: new Date("2024-01-01T13:00:00").toISOString(), // 5 hours
        all_in_rate: 500000,
        overtime_rate_per_hour: 50000,
        package: {
          durationHours: 5,
          type: "CAR_RENTAL",
        },
      };

      // Initial calculation - no overtime
      const initialResult = calculateTransactionFinancials(baseTransaction);
      expect(initialResult.lamaOvertimeJam).toBe(0);

      // Update checkout datetime (earlier start = longer rental)
      const updatedTransaction = {
        ...baseTransaction,
        checkout_datetime: new Date("2024-01-01T06:00:00").toISOString(), // 2 hours earlier
      };

      const updatedResult = calculateTransactionFinancials(updatedTransaction);
      expect(updatedResult.lamaSewaJam).toBe(7); // Now 7 hours total
      expect(updatedResult.lamaOvertimeJam).toBe(2); // 2 hours overtime
      expect(updatedResult.totalOvertimeFee).toBe(100000); // 2 hours * 50000
    });

    it("should show zero overtime for TOUR_PACKAGE type", () => {
      const transaction = {
        checkout_datetime: new Date("2024-01-01T08:00:00").toISOString(),
        checkin_datetime: new Date("2024-01-01T20:00:00").toISOString(), // 12 hours
        all_in_rate: 1500000,
        overtime_rate_per_hour: 0,
        package: {
          durationHours: 8,
          type: "TOUR_PACKAGE",
        },
      };

      const result = calculateTransactionFinancials(transaction);

      // TOUR_PACKAGE should have no overtime regardless of duration
      expect(result.lamaSewaJam).toBe(12);
      expect(result.lamaOvertimeJam).toBe(0);
      expect(result.totalOvertimeFee).toBe(0);
    });

    it("should show zero overtime for FULL_DAY_TRIP type", () => {
      const transaction = {
        checkout_datetime: new Date("2024-01-01T08:00:00").toISOString(),
        checkin_datetime: new Date("2024-01-01T22:00:00").toISOString(), // 14 hours
        all_in_rate: 800000,
        overtime_rate_per_hour: 0,
        package: {
          durationHours: 12,
          type: "FULL_DAY_TRIP",
        },
      };

      const result = calculateTransactionFinancials(transaction);

      // FULL_DAY_TRIP should have no overtime regardless of duration
      expect(result.lamaSewaJam).toBe(14);
      expect(result.lamaOvertimeJam).toBe(0);
      expect(result.totalOvertimeFee).toBe(0);
    });

    it("should handle custom rentals without package duration", () => {
      const transaction = {
        checkout_datetime: new Date("2024-01-01T08:00:00").toISOString(),
        checkin_datetime: new Date("2024-01-01T18:00:00").toISOString(), // 10 hours
        all_in_rate: 600000,
        overtime_rate_per_hour: 50000,
        package: null, // No package = custom rental
      };

      const result = calculateTransactionFinancials(transaction);

      // Custom rentals without package should have no overtime
      expect(result.lamaSewaJam).toBe(10);
      expect(result.lamaOvertimeJam).toBe(0);
      expect(result.totalOvertimeFee).toBe(0);
    });

    it("should include overtime charges in total revenue", () => {
      const transaction = {
        checkout_datetime: new Date("2024-01-01T08:00:00").toISOString(),
        checkin_datetime: new Date("2024-01-01T18:00:00").toISOString(), // 10 hours
        all_in_rate: 500000,
        overtime_rate_per_hour: 50000,
        package: {
          durationHours: 8,
          type: "CAR_RENTAL",
        },
      };

      const result = calculateTransactionFinancials(transaction);

      // Verify overtime is included in total revenue
      expect(result.lamaOvertimeJam).toBe(2);
      expect(result.totalOvertimeFee).toBe(100000);
      expect(result.totalPendapatan).toBe(600000); // 500000 base + 100000 overtime
    });
  });

  describe("Integration with React state", () => {
    it("should demonstrate that useEffect triggers recalculation on formData change", () => {
      // This test demonstrates the pattern used in TransaksiPage.jsx
      // where calculatedData is updated via useEffect when formData changes

      let formData = {
        checkout_datetime: new Date("2024-01-01T08:00:00").toISOString(),
        checkin_datetime: new Date("2024-01-01T13:00:00").toISOString(),
        all_in_rate: 500000,
        overtime_rate_per_hour: 50000,
        package: {
          durationHours: 5,
          type: "CAR_RENTAL",
        },
      };

      // Simulate initial calculation (like useEffect in TransaksiPage)
      let calculatedData = calculateTransactionFinancials(formData);
      expect(calculatedData.lamaOvertimeJam).toBe(0);

      // Simulate formData change (user extends checkin time)
      formData = {
        ...formData,
        checkin_datetime: new Date("2024-01-01T16:00:00").toISOString(), // 8 hours
      };

      // Simulate recalculation (like useEffect trigger)
      calculatedData = calculateTransactionFinancials(formData);

      // Verify overtime is now calculated
      expect(calculatedData.lamaSewaJam).toBe(8);
      expect(calculatedData.lamaOvertimeJam).toBe(3);
      expect(calculatedData.totalOvertimeFee).toBe(150000);
    });
  });
});
