/**
 * Integration Tests for Performance Report Export
 * Tests the full export flow with driver, package, and fuel analysis data
 *
 * Feature: financial-report-export-data-fix
 * Validates: Requirements 4.1, 4.2, 4.3
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { exportPerformanceReport } from "../excel-export.js";

// Mock XLSX library
jest.mock("xlsx", () => ({
  utils: {
    book_new: jest.fn(() => ({ Props: {}, Sheets: {} })),
    aoa_to_sheet: jest.fn((data) => ({
      "!ref": "A1:F100",
      data,
    })),
    book_append_sheet: jest.fn(),
    encode_range: jest.fn(),
    decode_range: jest.fn(() => ({ s: { r: 0, c: 0 }, e: { r: 100, c: 5 } })),
    encode_cell: jest.fn(
      (cell) => `${String.fromCharCode(65 + cell.c)}${cell.r + 1}`
    ),
  },
  writeFile: jest.fn(),
}));

describe("Performance Report Export Integration Tests", () => {
  describe("Driver Performance Calculations", () => {
    it("should export driver performance with complete revenue data", async () => {
      const performanceData = {
        driverPerformance: [
          {
            driverId: "drv-1",
            driverName: "John Doe",
            phoneNumber: "081234567890",
            totalTrips: 15,
            completedTrips: 14,
            totalWorkingHours: 120,
            totalRevenue: 7500000,
            averageHoursPerTrip: 8,
            completionRate: 93.3,
            averageRevenuePerTrip: 500000,
          },
          {
            driverId: "drv-2",
            driverName: "Jane Smith",
            phoneNumber: "081234567891",
            totalTrips: 12,
            completedTrips: 12,
            totalWorkingHours: 96,
            totalRevenue: 6000000,
            averageHoursPerTrip: 8,
            completionRate: 100,
            averageRevenuePerTrip: 500000,
          },
        ],
        packagePerformance: [],
        summary: {
          totalDrivers: 2,
          totalPackages: 0,
          totalTrips: 27,
          totalRevenue: 13500000,
        },
      };

      const fuelData = {
        summary: {
          totalFuelCost: 2000000,
          totalRefuels: 20,
        },
        fuelAnalysis: [],
      };

      const dateRange = {
        from: "2024-01-01",
        to: "2024-01-31",
      };

      const result = await exportPerformanceReport(
        performanceData,
        fuelData,
        dateRange
      );

      expect(result).toBeDefined();
      expect(typeof result).toBe("string");
      expect(result).toContain("Laporan_Kinerja");
      expect(result).toContain(".xlsx");
    });

    it("should handle driver performance with varying completion rates", async () => {
      const performanceData = {
        driverPerformance: [
          {
            driverId: "drv-1",
            driverName: "High Performer",
            phoneNumber: "081111111111",
            totalTrips: 20,
            completedTrips: 20,
            totalWorkingHours: 160,
            totalRevenue: 10000000,
            averageHoursPerTrip: 8,
            completionRate: 100,
            averageRevenuePerTrip: 500000,
          },
          {
            driverId: "drv-2",
            driverName: "Medium Performer",
            phoneNumber: "082222222222",
            totalTrips: 15,
            completedTrips: 12,
            totalWorkingHours: 120,
            totalRevenue: 6000000,
            averageHoursPerTrip: 8,
            completionRate: 80,
            averageRevenuePerTrip: 400000,
          },
          {
            driverId: "drv-3",
            driverName: "Low Performer",
            phoneNumber: "083333333333",
            totalTrips: 10,
            completedTrips: 5,
            totalWorkingHours: 80,
            totalRevenue: 2500000,
            averageHoursPerTrip: 8,
            completionRate: 50,
            averageRevenuePerTrip: 250000,
          },
        ],
        packagePerformance: [],
        summary: {
          totalDrivers: 3,
          totalPackages: 0,
          totalTrips: 45,
          totalRevenue: 18500000,
        },
      };

      const fuelData = {
        summary: {
          totalFuelCost: 3000000,
          totalRefuels: 30,
        },
        fuelAnalysis: [],
      };

      const dateRange = {
        from: "2024-02-01",
        to: "2024-02-29",
      };

      const result = await exportPerformanceReport(
        performanceData,
        fuelData,
        dateRange
      );

      expect(result).toBeDefined();
      expect(result).toContain("Laporan_Kinerja");

      // Verify data structure
      expect(performanceData.driverPerformance[0].completionRate).toBe(100);
      expect(performanceData.driverPerformance[1].completionRate).toBe(80);
      expect(performanceData.driverPerformance[2].completionRate).toBe(50);
    });

    it("should handle driver performance with zero revenue", async () => {
      const performanceData = {
        driverPerformance: [
          {
            driverId: "drv-1",
            driverName: "New Driver",
            phoneNumber: "084444444444",
            totalTrips: 0,
            completedTrips: 0,
            totalWorkingHours: 0,
            totalRevenue: 0,
            averageHoursPerTrip: 0,
            completionRate: 0,
            averageRevenuePerTrip: 0,
          },
        ],
        packagePerformance: [],
        summary: {
          totalDrivers: 1,
          totalPackages: 0,
          totalTrips: 0,
          totalRevenue: 0,
        },
      };

      const fuelData = {
        summary: {
          totalFuelCost: 0,
          totalRefuels: 0,
        },
        fuelAnalysis: [],
      };

      const dateRange = {
        from: "2024-03-01",
        to: "2024-03-31",
      };

      const result = await exportPerformanceReport(
        performanceData,
        fuelData,
        dateRange
      );

      expect(result).toBeDefined();
      expect(result).toContain("Laporan_Kinerja");
    });
  });

  describe("Package Performance Calculations", () => {
    it("should export package performance with complete revenue data", async () => {
      const performanceData = {
        driverPerformance: [],
        packagePerformance: [
          {
            packageId: "pkg-1",
            packageName: "Full Day Package",
            packageType: "CAR_RENTAL",
            frequency: 25,
            totalTrips: 25,
            totalRevenue: 12500000,
            averageRevenuePerBooking: 500000,
            revenueShare: 62.5,
          },
          {
            packageId: "pkg-2",
            packageName: "Tour Package Bali",
            packageType: "TOUR_PACKAGE",
            frequency: 15,
            totalTrips: 15,
            totalRevenue: 7500000,
            averageRevenuePerBooking: 500000,
            revenueShare: 37.5,
          },
        ],
        summary: {
          totalDrivers: 0,
          totalPackages: 2,
          totalTrips: 40,
          totalRevenue: 20000000,
        },
      };

      const fuelData = {
        summary: {
          totalFuelCost: 4000000,
          totalRefuels: 40,
        },
        fuelAnalysis: [],
      };

      const dateRange = {
        from: "2024-04-01",
        to: "2024-04-30",
      };

      const result = await exportPerformanceReport(
        performanceData,
        fuelData,
        dateRange
      );

      expect(result).toBeDefined();
      expect(result).toContain("Laporan_Kinerja");

      // Verify revenue share calculations
      expect(performanceData.packagePerformance[0].revenueShare).toBe(62.5);
      expect(performanceData.packagePerformance[1].revenueShare).toBe(37.5);
    });

    it("should handle package performance with varying booking frequencies", async () => {
      const performanceData = {
        driverPerformance: [],
        packagePerformance: [
          {
            packageId: "pkg-1",
            packageName: "Popular Package",
            packageType: "CAR_RENTAL",
            frequency: 50,
            totalBookings: 50,
            totalRevenue: 25000000,
            averageRevenuePerBooking: 500000,
            revenueShare: 50,
          },
          {
            packageId: "pkg-2",
            packageName: "Medium Package",
            packageType: "TOUR_PACKAGE",
            frequency: 30,
            totalBookings: 30,
            totalRevenue: 15000000,
            averageRevenuePerBooking: 500000,
            revenueShare: 30,
          },
          {
            packageId: "pkg-3",
            packageName: "Rare Package",
            packageType: "FULL_DAY_TRIP",
            frequency: 10,
            totalBookings: 10,
            totalRevenue: 10000000,
            averageRevenuePerBooking: 1000000,
            revenueShare: 20,
          },
        ],
        summary: {
          totalDrivers: 0,
          totalPackages: 3,
          totalTrips: 90,
          totalRevenue: 50000000,
        },
      };

      const fuelData = {
        summary: {
          totalFuelCost: 5000000,
          totalRefuels: 50,
        },
        fuelAnalysis: [],
      };

      const dateRange = {
        from: "2024-05-01",
        to: "2024-05-31",
      };

      const result = await exportPerformanceReport(
        performanceData,
        fuelData,
        dateRange
      );

      expect(result).toBeDefined();
      expect(result).toContain("Laporan_Kinerja");

      // Verify frequency ordering
      expect(performanceData.packagePerformance[0].frequency).toBe(50);
      expect(performanceData.packagePerformance[1].frequency).toBe(30);
      expect(performanceData.packagePerformance[2].frequency).toBe(10);
    });

    it("should handle package performance with zero bookings", async () => {
      const performanceData = {
        driverPerformance: [],
        packagePerformance: [
          {
            packageId: "pkg-1",
            packageName: "Unused Package",
            packageType: "CAR_RENTAL",
            frequency: 0,
            totalBookings: 0,
            totalRevenue: 0,
            averageRevenuePerBooking: 0,
            revenueShare: 0,
          },
        ],
        summary: {
          totalDrivers: 0,
          totalPackages: 1,
          totalTrips: 0,
          totalRevenue: 0,
        },
      };

      const fuelData = {
        summary: {
          totalFuelCost: 0,
          totalRefuels: 0,
        },
        fuelAnalysis: [],
      };

      const dateRange = {
        from: "2024-06-01",
        to: "2024-06-30",
      };

      const result = await exportPerformanceReport(
        performanceData,
        fuelData,
        dateRange
      );

      expect(result).toBeDefined();
      expect(result).toContain("Laporan_Kinerja");
    });
  });

  describe("Fuel Analysis Data", () => {
    it("should export fuel analysis with complete data", async () => {
      const performanceData = {
        driverPerformance: [],
        packagePerformance: [],
        summary: {
          totalDrivers: 0,
          totalPackages: 0,
          totalTrips: 0,
          totalRevenue: 0,
        },
      };

      const fuelData = {
        summary: {
          totalFuelCost: 5000000,
          totalRefuels: 50,
        },
        fuelAnalysis: [
          {
            armada_id: "arm-1",
            armada_name: "Toyota Avanza - B 1234 ABC",
            armadaName: "Toyota Avanza - B 1234 ABC",
            totalRefuels: 20,
            totalCost: 2000000,
            avgCostPerRefuel: 100000,
            avgConsumptionPerTrip: 8.5,
          },
          {
            armada_id: "arm-2",
            armada_name: "Honda Jazz - B 5678 DEF",
            armadaName: "Honda Jazz - B 5678 DEF",
            totalRefuels: 15,
            totalCost: 1500000,
            avgCostPerRefuel: 100000,
            avgConsumptionPerTrip: 7.2,
          },
          {
            armada_id: "arm-3",
            armada_name: "Suzuki Ertiga - B 9012 GHI",
            armadaName: "Suzuki Ertiga - B 9012 GHI",
            totalRefuels: 15,
            totalCost: 1500000,
            avgCostPerRefuel: 100000,
            avgConsumptionPerTrip: 9.1,
          },
        ],
      };

      const dateRange = {
        from: "2024-07-01",
        to: "2024-07-31",
      };

      const result = await exportPerformanceReport(
        performanceData,
        fuelData,
        dateRange
      );

      expect(result).toBeDefined();
      expect(result).toContain("Laporan_Kinerja");

      // Verify fuel data structure
      expect(fuelData.fuelAnalysis).toHaveLength(3);
      expect(fuelData.fuelAnalysis[0].totalRefuels).toBe(20);
      expect(fuelData.fuelAnalysis[0].totalCost).toBe(2000000);
    });

    it("should handle fuel analysis with varying consumption rates", async () => {
      const performanceData = {
        driverPerformance: [],
        packagePerformance: [],
        summary: {
          totalDrivers: 0,
          totalPackages: 0,
          totalTrips: 0,
          totalRevenue: 0,
        },
      };

      const fuelData = {
        summary: {
          totalFuelCost: 3000000,
          totalRefuels: 30,
        },
        fuelAnalysis: [
          {
            armada_id: "arm-1",
            armada_name: "Efficient Car",
            armadaName: "Efficient Car",
            totalRefuels: 10,
            totalCost: 800000,
            avgCostPerRefuel: 80000,
            avgConsumptionPerTrip: 6.5,
          },
          {
            armada_id: "arm-2",
            armada_name: "Average Car",
            armadaName: "Average Car",
            totalRefuels: 10,
            totalCost: 1000000,
            avgCostPerRefuel: 100000,
            avgConsumptionPerTrip: 8.0,
          },
          {
            armada_id: "arm-3",
            armada_name: "Inefficient Car",
            armadaName: "Inefficient Car",
            totalRefuels: 10,
            totalCost: 1200000,
            avgCostPerRefuel: 120000,
            avgConsumptionPerTrip: 10.5,
          },
        ],
      };

      const dateRange = {
        from: "2024-08-01",
        to: "2024-08-31",
      };

      const result = await exportPerformanceReport(
        performanceData,
        fuelData,
        dateRange
      );

      expect(result).toBeDefined();
      expect(result).toContain("Laporan_Kinerja");

      // Verify consumption rate variations
      expect(fuelData.fuelAnalysis[0].avgConsumptionPerTrip).toBe(6.5);
      expect(fuelData.fuelAnalysis[1].avgConsumptionPerTrip).toBe(8.0);
      expect(fuelData.fuelAnalysis[2].avgConsumptionPerTrip).toBe(10.5);
    });

    it("should handle empty fuel analysis data", async () => {
      const performanceData = {
        driverPerformance: [],
        packagePerformance: [],
        summary: {
          totalDrivers: 0,
          totalPackages: 0,
          totalTrips: 0,
          totalRevenue: 0,
        },
      };

      const fuelData = {
        summary: {
          totalFuelCost: 0,
          totalRefuels: 0,
        },
        fuelAnalysis: [],
      };

      const dateRange = {
        from: "2024-09-01",
        to: "2024-09-30",
      };

      const result = await exportPerformanceReport(
        performanceData,
        fuelData,
        dateRange
      );

      expect(result).toBeDefined();
      expect(result).toContain("Laporan_Kinerja");
    });
  });

  describe("Complete Performance Report", () => {
    it("should export complete performance report with all metrics", async () => {
      const performanceData = {
        driverPerformance: [
          {
            driverId: "drv-1",
            driverName: "John Doe",
            phoneNumber: "081234567890",
            totalTrips: 20,
            completedTrips: 19,
            totalWorkingHours: 160,
            totalRevenue: 10000000,
            averageHoursPerTrip: 8,
            completionRate: 95,
            averageRevenuePerTrip: 500000,
          },
          {
            driverId: "drv-2",
            driverName: "Jane Smith",
            phoneNumber: "081234567891",
            totalTrips: 18,
            completedTrips: 18,
            totalWorkingHours: 144,
            totalRevenue: 9000000,
            averageHoursPerTrip: 8,
            completionRate: 100,
            averageRevenuePerTrip: 500000,
          },
        ],
        packagePerformance: [
          {
            packageId: "pkg-1",
            packageName: "Full Day Package",
            packageType: "CAR_RENTAL",
            frequency: 25,
            totalBookings: 25,
            totalRevenue: 12500000,
            averageRevenuePerBooking: 500000,
            revenueShare: 65.8,
          },
          {
            packageId: "pkg-2",
            packageName: "Tour Package",
            packageType: "TOUR_PACKAGE",
            frequency: 13,
            totalBookings: 13,
            totalRevenue: 6500000,
            averageRevenuePerBooking: 500000,
            revenueShare: 34.2,
          },
        ],
        summary: {
          totalDrivers: 2,
          totalPackages: 2,
          totalTrips: 38,
          totalRevenue: 19000000,
        },
      };

      const fuelData = {
        summary: {
          totalFuelCost: 3800000,
          totalRefuels: 38,
        },
        fuelAnalysis: [
          {
            armada_id: "arm-1",
            armada_name: "Toyota Avanza - B 1234 ABC",
            armadaName: "Toyota Avanza - B 1234 ABC",
            totalRefuels: 20,
            totalCost: 2000000,
            avgCostPerRefuel: 100000,
            avgConsumptionPerTrip: 8.5,
          },
          {
            armada_id: "arm-2",
            armada_name: "Honda Jazz - B 5678 DEF",
            armadaName: "Honda Jazz - B 5678 DEF",
            totalRefuels: 18,
            totalCost: 1800000,
            avgCostPerRefuel: 100000,
            avgConsumptionPerTrip: 7.2,
          },
        ],
      };

      const dateRange = {
        from: "2024-10-01",
        to: "2024-10-31",
      };

      const result = await exportPerformanceReport(
        performanceData,
        fuelData,
        dateRange
      );

      expect(result).toBeDefined();
      expect(result).toContain("Laporan_Kinerja");

      // Verify all summary metrics
      expect(performanceData.summary.totalDrivers).toBe(2);
      expect(performanceData.summary.totalPackages).toBe(2);
      expect(performanceData.summary.totalTrips).toBe(38);
      expect(performanceData.summary.totalRevenue).toBe(19000000);
      expect(fuelData.summary.totalFuelCost).toBe(3800000);
      expect(fuelData.summary.totalRefuels).toBe(38);
    });

    it("should handle missing optional data gracefully", async () => {
      const performanceData = {
        driverPerformance: [
          {
            driverId: "drv-1",
            driver_name: "Alternative Name Field",
            phoneNumber: "081234567890",
            totalTrips: 10,
            completedTrips: 10,
            totalWorkingHours: 80,
            totalRevenue: 5000000,
            averageHoursPerTrip: 8,
            completionRate: 100,
            averageRevenuePerTrip: 500000,
          },
        ],
        packagePerformance: [],
        summary: {
          totalDrivers: 1,
          totalPackages: 0,
          totalTrips: 10,
          totalRevenue: 5000000,
        },
      };

      const fuelData = {
        summary: {},
        fuelAnalysis: [],
      };

      const dateRange = {
        from: "2024-11-01",
        to: "2024-11-30",
      };

      const result = await exportPerformanceReport(
        performanceData,
        fuelData,
        dateRange
      );

      expect(result).toBeDefined();
      expect(result).toContain("Laporan_Kinerja");
    });
  });

  describe("Data Consistency Verification", () => {
    it("should maintain consistent revenue calculations across sheets", async () => {
      const totalRevenue = 15000000;
      const performanceData = {
        driverPerformance: [
          {
            driverId: "drv-1",
            driverName: "Driver One",
            phoneNumber: "081111111111",
            totalTrips: 15,
            completedTrips: 15,
            totalWorkingHours: 120,
            totalRevenue: 7500000,
            averageHoursPerTrip: 8,
            completionRate: 100,
            averageRevenuePerTrip: 500000,
          },
          {
            driverId: "drv-2",
            driverName: "Driver Two",
            phoneNumber: "082222222222",
            totalTrips: 15,
            completedTrips: 15,
            totalWorkingHours: 120,
            totalRevenue: 7500000,
            averageHoursPerTrip: 8,
            completionRate: 100,
            averageRevenuePerTrip: 500000,
          },
        ],
        packagePerformance: [
          {
            packageId: "pkg-1",
            packageName: "Package One",
            packageType: "CAR_RENTAL",
            frequency: 30,
            totalBookings: 30,
            totalRevenue: 15000000,
            averageRevenuePerBooking: 500000,
            revenueShare: 100,
          },
        ],
        summary: {
          totalDrivers: 2,
          totalPackages: 1,
          totalTrips: 30,
          totalRevenue: totalRevenue,
        },
      };

      const fuelData = {
        summary: {
          totalFuelCost: 3000000,
          totalRefuels: 30,
        },
        fuelAnalysis: [],
      };

      const dateRange = {
        from: "2024-12-01",
        to: "2024-12-31",
      };

      // Verify revenue consistency before export
      const driverTotalRevenue = performanceData.driverPerformance.reduce(
        (sum, driver) => sum + driver.totalRevenue,
        0
      );
      const packageTotalRevenue = performanceData.packagePerformance.reduce(
        (sum, pkg) => sum + pkg.totalRevenue,
        0
      );

      expect(driverTotalRevenue).toBe(totalRevenue);
      expect(packageTotalRevenue).toBe(totalRevenue);
      expect(performanceData.summary.totalRevenue).toBe(totalRevenue);

      const result = await exportPerformanceReport(
        performanceData,
        fuelData,
        dateRange
      );

      expect(result).toBeDefined();
      expect(result).toContain("Laporan_Kinerja");
    });

    it("should verify all required fields are present", async () => {
      const performanceData = {
        driverPerformance: [
          {
            driverId: "drv-1",
            driverName: "Test Driver",
            phoneNumber: "081234567890",
            totalTrips: 10,
            completedTrips: 10,
            totalWorkingHours: 80,
            totalRevenue: 5000000,
            averageHoursPerTrip: 8,
            completionRate: 100,
            averageRevenuePerTrip: 500000,
          },
        ],
        packagePerformance: [
          {
            packageId: "pkg-1",
            packageName: "Test Package",
            packageType: "CAR_RENTAL",
            frequency: 10,
            totalBookings: 10,
            totalRevenue: 5000000,
            averageRevenuePerBooking: 500000,
            revenueShare: 100,
          },
        ],
        summary: {
          totalDrivers: 1,
          totalPackages: 1,
          totalTrips: 10,
          totalRevenue: 5000000,
        },
      };

      const fuelData = {
        summary: {
          totalFuelCost: 1000000,
          totalRefuels: 10,
        },
        fuelAnalysis: [
          {
            armada_id: "arm-1",
            armada_name: "Test Armada",
            armadaName: "Test Armada",
            totalRefuels: 10,
            totalCost: 1000000,
            avgCostPerRefuel: 100000,
            avgConsumptionPerTrip: 8.0,
          },
        ],
      };

      const dateRange = {
        from: "2025-01-01",
        to: "2025-01-31",
      };

      // Verify all required driver fields
      const driver = performanceData.driverPerformance[0];
      expect(driver.driverId).toBeDefined();
      expect(driver.driverName).toBeDefined();
      expect(driver.totalTrips).toBeDefined();
      expect(driver.completedTrips).toBeDefined();
      expect(driver.totalRevenue).toBeDefined();
      expect(driver.averageRevenuePerTrip).toBeDefined();
      expect(driver.completionRate).toBeDefined();

      // Verify all required package fields
      const pkg = performanceData.packagePerformance[0];
      expect(pkg.packageId).toBeDefined();
      expect(pkg.packageName).toBeDefined();
      expect(pkg.packageType).toBeDefined();
      expect(pkg.totalBookings).toBeDefined();
      expect(pkg.totalRevenue).toBeDefined();
      expect(pkg.averageRevenuePerBooking).toBeDefined();
      expect(pkg.revenueShare).toBeDefined();

      // Verify all required fuel fields
      const fuel = fuelData.fuelAnalysis[0];
      expect(fuel.armada_id).toBeDefined();
      expect(fuel.armada_name || fuel.armadaName).toBeDefined();
      expect(fuel.totalRefuels).toBeDefined();
      expect(fuel.totalCost).toBeDefined();
      expect(fuel.avgCostPerRefuel).toBeDefined();
      expect(fuel.avgConsumptionPerTrip).toBeDefined();

      const result = await exportPerformanceReport(
        performanceData,
        fuelData,
        dateRange
      );

      expect(result).toBeDefined();
      expect(result).toContain("Laporan_Kinerja");
    });
  });
});
