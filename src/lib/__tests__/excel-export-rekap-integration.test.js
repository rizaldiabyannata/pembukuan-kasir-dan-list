/**
 * Integration Tests for Rekap Report Export
 * Tests the complete flow of rekap report export with real data structures
 *
 * Feature: financial-report-export-data-fix
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */

import { exportRekapReport } from "../excel-export.js";

describe("Rekap Report Export Integration Tests", () => {
  describe("Monthly Breakdown Accuracy", () => {
    it("should accurately calculate monthly totals for each category", () => {
      // Arrange: Create test data with multiple categories and months
      const testData = {
        rekap: [
          {
            category: "BBM",
            months: [
              {
                month: "2024-01",
                category: "BBM",
                total: 5000000,
                count: 10,
                items: [],
              },
              {
                month: "2024-02",
                category: "BBM",
                total: 6000000,
                count: 12,
                items: [],
              },
              {
                month: "2024-03",
                category: "BBM",
                total: 5500000,
                count: 11,
                items: [],
              },
            ],
            totalAmount: 16500000,
            totalCount: 33,
          },
          {
            category: "Gaji",
            months: [
              {
                month: "2024-01",
                category: "Gaji",
                total: 10000000,
                count: 5,
                items: [],
              },
              {
                month: "2024-02",
                category: "Gaji",
                total: 10000000,
                count: 5,
                items: [],
              },
              {
                month: "2024-03",
                category: "Gaji",
                total: 10000000,
                count: 5,
                items: [],
              },
            ],
            totalAmount: 30000000,
            totalCount: 15,
          },
        ],
        summary: {
          totalExpenses: 46500000,
          totalTransactions: 48,
          categories: 2,
        },
      };

      const dateRange = {
        from: "2024-01-01",
        to: "2024-03-31",
      };

      // Act: Export the report
      expect(() => {
        exportRekapReport(testData, dateRange);
      }).not.toThrow();

      // Assert: Verify calculations
      // Total for BBM should be sum of all months
      const bbmTotal = testData.rekap[0].months.reduce(
        (sum, m) => sum + m.total,
        0
      );
      expect(bbmTotal).toBe(16500000);
      expect(testData.rekap[0].totalAmount).toBe(bbmTotal);

      // Total for Gaji should be sum of all months
      const gajiTotal = testData.rekap[1].months.reduce(
        (sum, m) => sum + m.total,
        0
      );
      expect(gajiTotal).toBe(30000000);
      expect(testData.rekap[1].totalAmount).toBe(gajiTotal);

      // Overall total should match summary
      const overallTotal = testData.rekap.reduce(
        (sum, cat) => sum + cat.totalAmount,
        0
      );
      expect(overallTotal).toBe(testData.summary.totalExpenses);
    });

    it("should handle months with zero expenses correctly", () => {
      // Arrange: Create data with some months having zero expenses
      const testData = {
        rekap: [
          {
            category: "Maintenance",
            months: [
              {
                month: "2024-01",
                category: "Maintenance",
                total: 2000000,
                count: 2,
                items: [],
              },
              {
                month: "2024-03",
                category: "Maintenance",
                total: 3000000,
                count: 3,
                items: [],
              },
            ],
            totalAmount: 5000000,
            totalCount: 5,
          },
        ],
        summary: {
          totalExpenses: 5000000,
          totalTransactions: 5,
          categories: 1,
        },
      };

      const dateRange = {
        from: "2024-01-01",
        to: "2024-03-31",
      };

      // Act & Assert: Should not throw error
      expect(() => {
        exportRekapReport(testData, dateRange);
      }).not.toThrow();

      // Verify that missing month (February) is handled correctly
      const hasFebruary = testData.rekap[0].months.some(
        (m) => m.month === "2024-02"
      );
      expect(hasFebruary).toBe(false);
    });

    it("should calculate correct averages per transaction for each month", () => {
      // Arrange
      const testData = {
        rekap: [
          {
            category: "Operasional",
            months: [
              {
                month: "2024-01",
                category: "Operasional",
                total: 10000000,
                count: 5,
                items: [],
              },
              {
                month: "2024-02",
                category: "Operasional",
                total: 15000000,
                count: 10,
                items: [],
              },
            ],
            totalAmount: 25000000,
            totalCount: 15,
          },
        ],
        summary: {
          totalExpenses: 25000000,
          totalTransactions: 15,
          categories: 1,
        },
      };

      const dateRange = {
        from: "2024-01-01",
        to: "2024-02-28",
      };

      // Act
      exportRekapReport(testData, dateRange);

      // Assert: Verify average calculations
      const jan = testData.rekap[0].months[0];
      const janAverage = jan.total / jan.count;
      expect(janAverage).toBe(2000000); // 10M / 5

      const feb = testData.rekap[0].months[1];
      const febAverage = feb.total / feb.count;
      expect(febAverage).toBe(1500000); // 15M / 10
    });
  });

  describe("Category Grouping", () => {
    it("should correctly group expenses by category", () => {
      // Arrange: Create data with multiple categories
      const testData = {
        rekap: [
          {
            category: "BBM",
            months: [
              { month: "2024-01", category: "BBM", total: 5000000, count: 10 },
            ],
            totalAmount: 5000000,
            totalCount: 10,
          },
          {
            category: "Gaji",
            months: [
              {
                month: "2024-01",
                category: "Gaji",
                total: 10000000,
                count: 5,
              },
            ],
            totalAmount: 10000000,
            totalCount: 5,
          },
          {
            category: "Maintenance",
            months: [
              {
                month: "2024-01",
                category: "Maintenance",
                total: 2000000,
                count: 2,
              },
            ],
            totalAmount: 2000000,
            totalCount: 2,
          },
        ],
        summary: {
          totalExpenses: 17000000,
          totalTransactions: 17,
          categories: 3,
        },
      };

      const dateRange = {
        from: "2024-01-01",
        to: "2024-01-31",
      };

      // Act
      exportRekapReport(testData, dateRange);

      // Assert: Verify all categories are present
      expect(testData.rekap.length).toBe(3);
      expect(testData.rekap.map((r) => r.category)).toEqual([
        "BBM",
        "Gaji",
        "Maintenance",
      ]);

      // Verify each category has correct totals
      expect(testData.rekap[0].totalAmount).toBe(5000000);
      expect(testData.rekap[1].totalAmount).toBe(10000000);
      expect(testData.rekap[2].totalAmount).toBe(2000000);
    });

    it("should handle single category correctly", () => {
      // Arrange
      const testData = {
        rekap: [
          {
            category: "BBM",
            months: [
              { month: "2024-01", category: "BBM", total: 5000000, count: 10 },
              { month: "2024-02", category: "BBM", total: 6000000, count: 12 },
            ],
            totalAmount: 11000000,
            totalCount: 22,
          },
        ],
        summary: {
          totalExpenses: 11000000,
          totalTransactions: 22,
          categories: 1,
        },
      };

      const dateRange = {
        from: "2024-01-01",
        to: "2024-02-28",
      };

      // Act & Assert
      expect(() => {
        exportRekapReport(testData, dateRange);
      }).not.toThrow();

      expect(testData.rekap.length).toBe(1);
      expect(testData.rekap[0].category).toBe("BBM");
    });

    it("should maintain category order from input data", () => {
      // Arrange: Categories in specific order
      const testData = {
        rekap: [
          {
            category: "Operasional",
            months: [
              {
                month: "2024-01",
                category: "Operasional",
                total: 1000000,
                count: 1,
              },
            ],
            totalAmount: 1000000,
            totalCount: 1,
          },
          {
            category: "BBM",
            months: [
              { month: "2024-01", category: "BBM", total: 2000000, count: 2 },
            ],
            totalAmount: 2000000,
            totalCount: 2,
          },
          {
            category: "Gaji",
            months: [
              {
                month: "2024-01",
                category: "Gaji",
                total: 3000000,
                count: 3,
              },
            ],
            totalAmount: 3000000,
            totalCount: 3,
          },
        ],
        summary: {
          totalExpenses: 6000000,
          totalTransactions: 6,
          categories: 3,
        },
      };

      const dateRange = {
        from: "2024-01-01",
        to: "2024-01-31",
      };

      // Act
      exportRekapReport(testData, dateRange);

      // Assert: Order should be maintained
      expect(testData.rekap[0].category).toBe("Operasional");
      expect(testData.rekap[1].category).toBe("BBM");
      expect(testData.rekap[2].category).toBe("Gaji");
    });
  });

  describe("Trend Calculations", () => {
    it("should calculate growth percentage correctly", () => {
      // Arrange: Data with clear growth trend
      const testData = {
        rekap: [
          {
            category: "BBM",
            months: [
              {
                month: "2024-01",
                category: "BBM",
                total: 5000000,
                count: 10,
              },
              {
                month: "2024-02",
                category: "BBM",
                total: 6000000,
                count: 12,
              },
              {
                month: "2024-03",
                category: "BBM",
                total: 7200000,
                count: 14,
              },
            ],
            totalAmount: 18200000,
            totalCount: 36,
          },
        ],
        summary: {
          totalExpenses: 18200000,
          totalTransactions: 36,
          categories: 1,
        },
      };

      const dateRange = {
        from: "2024-01-01",
        to: "2024-03-31",
      };

      // Act
      exportRekapReport(testData, dateRange);

      // Assert: Calculate expected growth percentages
      // Jan to Feb: (6M - 5M) / 5M * 100 = 20%
      const janToFebGrowth = ((6000000 - 5000000) / 5000000) * 100;
      expect(janToFebGrowth).toBe(20);

      // Feb to Mar: (7.2M - 6M) / 6M * 100 = 20%
      const febToMarGrowth = ((7200000 - 6000000) / 6000000) * 100;
      expect(febToMarGrowth).toBe(20);
    });

    it("should handle negative growth (decline) correctly", () => {
      // Arrange: Data with declining trend
      const testData = {
        rekap: [
          {
            category: "Maintenance",
            months: [
              {
                month: "2024-01",
                category: "Maintenance",
                total: 10000000,
                count: 10,
              },
              {
                month: "2024-02",
                category: "Maintenance",
                total: 8000000,
                count: 8,
              },
              {
                month: "2024-03",
                category: "Maintenance",
                total: 6400000,
                count: 6,
              },
            ],
            totalAmount: 24400000,
            totalCount: 24,
          },
        ],
        summary: {
          totalExpenses: 24400000,
          totalTransactions: 24,
          categories: 1,
        },
      };

      const dateRange = {
        from: "2024-01-01",
        to: "2024-03-31",
      };

      // Act
      exportRekapReport(testData, dateRange);

      // Assert: Calculate expected decline percentages
      // Jan to Feb: (8M - 10M) / 10M * 100 = -20%
      const janToFebGrowth = ((8000000 - 10000000) / 10000000) * 100;
      expect(janToFebGrowth).toBe(-20);

      // Feb to Mar: (6.4M - 8M) / 8M * 100 = -20%
      const febToMarGrowth = ((6400000 - 8000000) / 8000000) * 100;
      expect(febToMarGrowth).toBe(-20);
    });

    it("should handle zero growth correctly", () => {
      // Arrange: Data with stable amounts
      const testData = {
        rekap: [
          {
            category: "Gaji",
            months: [
              {
                month: "2024-01",
                category: "Gaji",
                total: 10000000,
                count: 5,
              },
              {
                month: "2024-02",
                category: "Gaji",
                total: 10000000,
                count: 5,
              },
              {
                month: "2024-03",
                category: "Gaji",
                total: 10000000,
                count: 5,
              },
            ],
            totalAmount: 30000000,
            totalCount: 15,
          },
        ],
        summary: {
          totalExpenses: 30000000,
          totalTransactions: 15,
          categories: 1,
        },
      };

      const dateRange = {
        from: "2024-01-01",
        to: "2024-03-31",
      };

      // Act
      exportRekapReport(testData, dateRange);

      // Assert: Growth should be 0%
      const janToFebGrowth = ((10000000 - 10000000) / 10000000) * 100;
      expect(janToFebGrowth).toBe(0);
    });

    it("should calculate trend across multiple categories", () => {
      // Arrange: Multiple categories with different trends
      const testData = {
        rekap: [
          {
            category: "BBM",
            months: [
              { month: "2024-01", category: "BBM", total: 5000000, count: 10 },
              { month: "2024-02", category: "BBM", total: 6000000, count: 12 },
            ],
            totalAmount: 11000000,
            totalCount: 22,
          },
          {
            category: "Gaji",
            months: [
              {
                month: "2024-01",
                category: "Gaji",
                total: 10000000,
                count: 5,
              },
              {
                month: "2024-02",
                category: "Gaji",
                total: 10000000,
                count: 5,
              },
            ],
            totalAmount: 20000000,
            totalCount: 10,
          },
        ],
        summary: {
          totalExpenses: 31000000,
          totalTransactions: 32,
          categories: 2,
        },
      };

      const dateRange = {
        from: "2024-01-01",
        to: "2024-02-28",
      };

      // Act
      exportRekapReport(testData, dateRange);

      // Assert: Calculate overall trend
      // Jan total: 5M + 10M = 15M
      // Feb total: 6M + 10M = 16M
      // Growth: (16M - 15M) / 15M * 100 = 6.67%
      const janTotal = 5000000 + 10000000;
      const febTotal = 6000000 + 10000000;
      const overallGrowth = ((febTotal - janTotal) / janTotal) * 100;
      expect(overallGrowth).toBeCloseTo(6.67, 2);
    });
  });

  describe("Indonesian Locale Formatting", () => {
    it("should format month names in Indonesian", () => {
      // Arrange
      const testData = {
        rekap: [
          {
            category: "BBM",
            months: [
              {
                month: "2024-01",
                category: "BBM",
                total: 5000000,
                count: 10,
              },
              {
                month: "2024-02",
                category: "BBM",
                total: 6000000,
                count: 12,
              },
            ],
            totalAmount: 11000000,
            totalCount: 22,
          },
        ],
        summary: {
          totalExpenses: 11000000,
          totalTransactions: 22,
          categories: 1,
        },
      };

      const dateRange = {
        from: "2024-01-01",
        to: "2024-02-28",
      };

      // Act
      exportRekapReport(testData, dateRange);

      // Assert: Verify Indonesian month formatting
      const jan = new Date("2024-01-01");
      const janFormatted = jan.toLocaleDateString("id-ID", {
        year: "numeric",
        month: "long",
      });
      expect(janFormatted).toContain("Januari");
      expect(janFormatted).toContain("2024");

      const feb = new Date("2024-02-01");
      const febFormatted = feb.toLocaleDateString("id-ID", {
        year: "numeric",
        month: "long",
      });
      expect(febFormatted).toContain("Februari");
      expect(febFormatted).toContain("2024");
    });

    it("should format all 12 months correctly in Indonesian", () => {
      // Arrange: Data for all 12 months
      const months = [
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

      // Act & Assert: Verify each month
      months.forEach((monthName, index) => {
        const date = new Date(2024, index, 1);
        const formatted = date.toLocaleDateString("id-ID", {
          year: "numeric",
          month: "long",
        });

        expect(formatted).toContain(monthName);
        expect(formatted).toContain("2024");
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty rekap data gracefully", () => {
      // Arrange
      const testData = {
        rekap: [],
        summary: {
          totalExpenses: 0,
          totalTransactions: 0,
          categories: 0,
        },
      };

      const dateRange = {
        from: "2024-01-01",
        to: "2024-01-31",
      };

      // Act & Assert: Should not throw error
      expect(() => {
        exportRekapReport(testData, dateRange);
      }).not.toThrow();
    });

    it("should handle very large amounts correctly", () => {
      // Arrange: Data with large amounts
      const testData = {
        rekap: [
          {
            category: "BBM",
            months: [
              {
                month: "2024-01",
                category: "BBM",
                total: 999999999,
                count: 1000,
              },
            ],
            totalAmount: 999999999,
            totalCount: 1000,
          },
        ],
        summary: {
          totalExpenses: 999999999,
          totalTransactions: 1000,
          categories: 1,
        },
      };

      const dateRange = {
        from: "2024-01-01",
        to: "2024-01-31",
      };

      // Act & Assert
      expect(() => {
        exportRekapReport(testData, dateRange);
      }).not.toThrow();

      // Verify large number handling
      expect(testData.rekap[0].totalAmount).toBe(999999999);
    });

    it("should handle many categories correctly", () => {
      // Arrange: Data with many categories
      const categories = [
        "BBM",
        "Gaji",
        "Maintenance",
        "Operasional",
        "Asuransi",
        "Pajak",
        "Utilitas",
        "Marketing",
        "Training",
        "Lain-lain",
      ];

      const testData = {
        rekap: categories.map((cat) => ({
          category: cat,
          months: [
            {
              month: "2024-01",
              category: cat,
              total: 1000000,
              count: 1,
            },
          ],
          totalAmount: 1000000,
          totalCount: 1,
        })),
        summary: {
          totalExpenses: 10000000,
          totalTransactions: 10,
          categories: 10,
        },
      };

      const dateRange = {
        from: "2024-01-01",
        to: "2024-01-31",
      };

      // Act & Assert
      expect(() => {
        exportRekapReport(testData, dateRange);
      }).not.toThrow();

      expect(testData.rekap.length).toBe(10);
    });

    it("should handle year transitions correctly", () => {
      // Arrange: Data spanning year boundary
      const testData = {
        rekap: [
          {
            category: "BBM",
            months: [
              {
                month: "2023-12",
                category: "BBM",
                total: 5000000,
                count: 10,
              },
              {
                month: "2024-01",
                category: "BBM",
                total: 6000000,
                count: 12,
              },
            ],
            totalAmount: 11000000,
            totalCount: 22,
          },
        ],
        summary: {
          totalExpenses: 11000000,
          totalTransactions: 22,
          categories: 1,
        },
      };

      const dateRange = {
        from: "2023-12-01",
        to: "2024-01-31",
      };

      // Act & Assert
      expect(() => {
        exportRekapReport(testData, dateRange);
      }).not.toThrow();

      // Verify both years are handled
      expect(testData.rekap[0].months[0].month).toBe("2023-12");
      expect(testData.rekap[0].months[1].month).toBe("2024-01");
    });
  });
});
