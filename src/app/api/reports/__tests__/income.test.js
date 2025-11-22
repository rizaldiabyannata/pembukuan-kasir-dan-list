/**
 * Tests for Income Report API
 * Tests the /api/reports/income endpoint for date filtering, package grouping, and revenue calculations
 */

import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import fc from "fast-check";
import { prisma } from "@/lib/prisma";
import {
  transactionWithPackageArbitrary,
  dateRangeArbitrary,
  packageTypeArbitrary,
  approvedTransactionArbitrary,
} from "@/lib/__tests__/test-generators";
import { calculateTransactionFinancials } from "@/lib/accounting";

// Mock the middleware and audit logging
jest.mock("@/lib/middleware", () => ({
  protectedRoute: (handler) => handler,
  successResponse: (data) => ({ success: true, data }),
  errorResponse: (message, status) => ({ success: false, message, status }),
  permissions: {
    canViewReports: () => true,
  },
  rateLimitPresets: {
    reports: {},
  },
}));

jest.mock("@/lib/audit", () => ({
  logReportAccess: jest.fn().mockResolvedValue(undefined),
}));

// Import the handler after mocking
const { GET } = require("../income/route");

describe("Income Report API Tests", () => {
  // Clean up test data after each test
  afterEach(async () => {
    await prisma.transaction.deleteMany({
      where: {
        invoice_code: {
          startsWith: "TEST-",
        },
      },
    });
    await prisma.servicePackage.deleteMany({
      where: {
        name: {
          startsWith: "TEST-",
        },
      },
    });
  });

  // ============================================================================
  // PROPERTY-BASED TESTS
  // ============================================================================

  // Feature: laporan-keuangan-testing, Property 1: Date range filtering correctness
  // Validates: Requirements 1.1
  describe("Property 1: Date range filtering correctness", () => {
    it("should return only approved transactions within the date range", async () => {
      await fc.assert(
        fc.asyncProperty(
          dateRangeArbitrary(),
          fc.array(transactionWithPackageArbitrary(), {
            minLength: 5,
            maxLength: 10,
          }),
          async (dateRange, generatedTransactions) => {
            // Create test data: package, armada, and driver
            const testPackage = await prisma.servicePackage.create({
              data: {
                name: `TEST-PKG-${Date.now()}-${Math.random()}`,
                type: "CAR_RENTAL",
                price: 500000,
                durationHours: 12,
              },
            });

            const testArmada = await prisma.armada.create({
              data: {
                license_plate: `TEST-${Date.now()}-${Math.random()}`,
                brand: "Toyota",
                model: "Avanza",
                status: "READY",
              },
            });

            const testDriver = await prisma.driver.create({
              data: {
                driver_name: `TEST-DRIVER-${Date.now()}`,
                phone_number: "08123456789",
                status: "READY",
              },
            });

            // Create transactions with varying dates and approval statuses
            const transactions = await Promise.all(
              generatedTransactions.map(async (tx, idx) => {
                // Vary the booking dates: some inside, some outside the range
                let bookingDate;
                if (idx % 3 === 0) {
                  // Inside range
                  const rangeMs =
                    dateRange.end.getTime() - dateRange.start.getTime();
                  const randomOffset = Math.random() * rangeMs;
                  bookingDate = new Date(
                    dateRange.start.getTime() + randomOffset
                  );
                } else if (idx % 3 === 1) {
                  // Before range
                  bookingDate = new Date(
                    dateRange.start.getTime() - 86400000 * (idx + 1)
                  );
                } else {
                  // After range
                  bookingDate = new Date(
                    dateRange.end.getTime() + 86400000 * (idx + 1)
                  );
                }

                // Vary approval status
                const approvalStatus = idx % 2 === 0 ? "APPROVED" : "PENDING";

                return await prisma.transaction.create({
                  data: {
                    invoice_code: `TEST-${Date.now()}-${idx}-${Math.random()}`,
                    customer_name: tx.customer_name,
                    customer_phone: "08123456789",
                    booking_date: bookingDate,
                    checkout_datetime: tx.checkout_datetime,
                    checkin_datetime: tx.checkin_datetime,
                    actual_checkin_datetime: tx.actual_checkin_datetime,
                    all_in_rate: tx.all_in_rate,
                    overtime_rate_per_hour: tx.overtime_rate_per_hour,
                    custom_price: tx.custom_price,
                    approval_status: approvalStatus,
                    payment_status: "PAID",
                    dp_amount: 0,
                    packageId: testPackage.id,
                    armadaId: testArmada.id,
                    driverId: testDriver.id,
                  },
                });
              })
            );

            // Call the API
            const request = {
              url: `http://localhost:3000/api/reports/income?from=${dateRange.start.toISOString().split("T")[0]}&to=${dateRange.end.toISOString().split("T")[0]}`,
              auth: {
                user: { id: "test-user", role: "ADMIN" },
                ipAddress: "127.0.0.1",
                userAgent: "test",
              },
            };

            const response = await GET(request);
            const result = response.data;

            // Property: All returned transactions should be within date range and APPROVED
            const allTransactions = result.incomeByPackage.flatMap(
              (pkg) => pkg.transactions
            );

            for (const tx of allTransactions) {
              const txDate = new Date(tx.booking_date);
              const startDate = new Date(dateRange.start);
              startDate.setHours(0, 0, 0, 0);
              const endDate = new Date(dateRange.end);
              endDate.setHours(23, 59, 59, 999);

              // Check date is within range (inclusive)
              expect(txDate.getTime()).toBeGreaterThanOrEqual(
                startDate.getTime()
              );
              expect(txDate.getTime()).toBeLessThanOrEqual(endDate.getTime());
            }

            // Verify that non-approved transactions are excluded
            const returnedIds = new Set(allTransactions.map((tx) => tx.id));
            const nonApprovedTxs = transactions.filter(
              (tx) => tx.approval_status !== "APPROVED"
            );
            for (const tx of nonApprovedTxs) {
              expect(returnedIds.has(tx.id)).toBe(false);
            }

            // Clean up
            await prisma.transaction.deleteMany({
              where: { id: { in: transactions.map((t) => t.id) } },
            });
            await prisma.servicePackage.delete({
              where: { id: testPackage.id },
            });
            await prisma.armada.delete({ where: { id: testArmada.id } });
            await prisma.driver.delete({ where: { id: testDriver.id } });
          }
        ),
        { numRuns: 5 } // Reduced runs for API tests
      );
    }, 60000); // 60 second timeout
  });

  // Feature: laporan-keuangan-testing, Property 7: Package aggregation correctness
  // Validates: Requirements 1.7
  describe("Property 7: Package aggregation correctness", () => {
    it("should correctly aggregate transactions by package with accurate totals", async () => {
      await fc.assert(
        fc.asyncProperty(
          dateRangeArbitrary(),
          fc.array(transactionWithPackageArbitrary(), {
            minLength: 5,
            maxLength: 10,
          }),
          async (dateRange, generatedTransactions) => {
            // Create test packages
            const packages = await Promise.all([
              prisma.servicePackage.create({
                data: {
                  name: `TEST-PKG-A-${Date.now()}-${Math.random()}`,
                  type: "CAR_RENTAL",
                  price: 500000,
                  durationHours: 12,
                },
              }),
              prisma.servicePackage.create({
                data: {
                  name: `TEST-PKG-B-${Date.now()}-${Math.random()}`,
                  type: "TOUR_PACKAGE",
                  price: 1000000,
                  durationDays: 3,
                  durationNights: 2,
                },
              }),
            ]);

            const testArmada = await prisma.armada.create({
              data: {
                license_plate: `TEST-${Date.now()}-${Math.random()}`,
                brand: "Toyota",
                model: "Avanza",
                status: "READY",
              },
            });

            const testDriver = await prisma.driver.create({
              data: {
                driver_name: `TEST-DRIVER-${Date.now()}`,
                phone_number: "08123456789",
                status: "READY",
              },
            });

            // Create transactions distributed across packages
            const transactions = await Promise.all(
              generatedTransactions.map(async (tx, idx) => {
                // Distribute transactions across packages
                const packageId = packages[idx % packages.length].id;

                // All transactions within date range and approved
                const rangeMs =
                  dateRange.end.getTime() - dateRange.start.getTime();
                const randomOffset = Math.random() * rangeMs;
                const bookingDate = new Date(
                  dateRange.start.getTime() + randomOffset
                );

                // Ensure transaction meets API filter criteria:
                // Must have actual_checkin_datetime OR (payment_status = DOWN_PAYMENT AND dp_amount > 0)
                const hasActualCheckin = tx.actual_checkin_datetime !== null;
                const paymentStatus = hasActualCheckin
                  ? "PAID"
                  : "DOWN_PAYMENT";
                const dpAmount = hasActualCheckin ? 0 : 500000;

                return await prisma.transaction.create({
                  data: {
                    invoice_code: `TEST-${Date.now()}-${idx}-${Math.random()}`,
                    customer_name: tx.customer_name,
                    customer_phone: "08123456789",
                    booking_date: bookingDate,
                    checkout_datetime: tx.checkout_datetime,
                    checkin_datetime: tx.checkin_datetime,
                    actual_checkin_datetime: tx.actual_checkin_datetime,
                    all_in_rate: tx.all_in_rate,
                    overtime_rate_per_hour: tx.overtime_rate_per_hour,
                    custom_price: tx.custom_price,
                    approval_status: "APPROVED",
                    payment_status: paymentStatus,
                    dp_amount: dpAmount,
                    packageId: packageId,
                    armadaId: testArmada.id,
                    driverId: testDriver.id,
                  },
                });
              })
            );

            // Call the API
            const request = {
              url: `http://localhost:3000/api/reports/income?from=${dateRange.start.toISOString().split("T")[0]}&to=${dateRange.end.toISOString().split("T")[0]}`,
              auth: {
                user: { id: "test-user", role: "ADMIN" },
                ipAddress: "127.0.0.1",
                userAgent: "test",
              },
            };

            const response = await GET(request);
            const result = response.data;

            // Property: Package aggregation should be correct
            // For each package group, verify:
            // 1. Transaction count matches actual count
            // 2. Total revenue equals sum of individual transaction revenues

            // Only verify packages we created
            const ourPackageIds = new Set(packages.map((p) => p.id));
            const relevantPackageGroups = result.incomeByPackage.filter((pg) =>
              ourPackageIds.has(pg.packageId)
            );

            for (const packageGroup of relevantPackageGroups) {
              // Only count APPROVED transactions (API filters by approval_status)
              // Also filter by actual_checkin_datetime or down payment criteria
              const packageTransactions = transactions.filter(
                (tx) =>
                  tx.packageId === packageGroup.packageId &&
                  tx.approval_status === "APPROVED" &&
                  (tx.actual_checkin_datetime !== null ||
                    (tx.payment_status === "DOWN_PAYMENT" && tx.dp_amount > 0))
              );

              // Verify transaction count
              expect(packageGroup.transactionCount).toBe(
                packageTransactions.length
              );

              // Calculate expected total revenue from the transactions in the API response
              // The API already calculated the financials, so we just sum them up
              const apiTransactions = packageGroup.transactions;
              let expectedTotalRevenue = 0;
              let expectedOvertimeRevenue = 0;
              let expectedBaseRevenue = 0;

              for (const apiTx of apiTransactions) {
                expectedTotalRevenue += apiTx.totalRevenue;
                expectedOvertimeRevenue += apiTx.overtimeRevenue;
                expectedBaseRevenue += apiTx.baseRevenue;
              }

              // Verify totals match the sum of individual transactions
              expect(packageGroup.totalRevenue).toBe(expectedTotalRevenue);
              expect(packageGroup.totalOvertimeRevenue).toBe(
                expectedOvertimeRevenue
              );
              expect(packageGroup.totalBaseRevenue).toBe(expectedBaseRevenue);

              // Verify average revenue
              const expectedAverage =
                packageTransactions.length > 0
                  ? Math.round(
                      expectedTotalRevenue / packageTransactions.length
                    )
                  : 0;
              expect(packageGroup.averageRevenue).toBe(expectedAverage);
            }

            // Clean up
            await prisma.transaction.deleteMany({
              where: { id: { in: transactions.map((t) => t.id) } },
            });
            for (const pkg of packages) {
              await prisma.servicePackage.delete({ where: { id: pkg.id } });
            }
            await prisma.armada.delete({ where: { id: testArmada.id } });
            await prisma.driver.delete({ where: { id: testDriver.id } });
          }
        ),
        { numRuns: 5 }
      );
    }, 60000); // 60 second timeout
  });

  // Feature: laporan-keuangan-testing, Property 8: Package type filtering
  // Validates: Requirements 1.8
  describe("Property 8: Package type filtering", () => {
    it("should return only packages matching the specified type filter", async () => {
      await fc.assert(
        fc.asyncProperty(
          dateRangeArbitrary(),
          packageTypeArbitrary(),
          fc.array(transactionWithPackageArbitrary(), {
            minLength: 5,
            maxLength: 10,
          }),
          async (dateRange, filterType, generatedTransactions) => {
            // Create test packages of different types
            const packages = await Promise.all([
              prisma.servicePackage.create({
                data: {
                  name: `TEST-PKG-CAR-${Date.now()}-${Math.random()}`,
                  type: "CAR_RENTAL",
                  price: 500000,
                  durationHours: 12,
                },
              }),
              prisma.servicePackage.create({
                data: {
                  name: `TEST-PKG-TOUR-${Date.now()}-${Math.random()}`,
                  type: "TOUR_PACKAGE",
                  price: 1000000,
                  durationDays: 3,
                  durationNights: 2,
                },
              }),
              prisma.servicePackage.create({
                data: {
                  name: `TEST-PKG-FULL-${Date.now()}-${Math.random()}`,
                  type: "FULL_DAY_TRIP",
                  price: 800000,
                },
              }),
            ]);

            const testArmada = await prisma.armada.create({
              data: {
                license_plate: `TEST-${Date.now()}-${Math.random()}`,
                brand: "Toyota",
                model: "Avanza",
                status: "READY",
              },
            });

            const testDriver = await prisma.driver.create({
              data: {
                driver_name: `TEST-DRIVER-${Date.now()}`,
                phone_number: "08123456789",
                status: "READY",
              },
            });

            // Create transactions distributed across all package types
            const transactions = await Promise.all(
              generatedTransactions.map(async (tx, idx) => {
                const packageId = packages[idx % packages.length].id;

                // All transactions within date range and approved
                const rangeMs =
                  dateRange.end.getTime() - dateRange.start.getTime();
                const randomOffset = Math.random() * rangeMs;
                const bookingDate = new Date(
                  dateRange.start.getTime() + randomOffset
                );

                // Ensure transaction meets API filter criteria
                const hasActualCheckin = tx.actual_checkin_datetime !== null;
                const paymentStatus = hasActualCheckin
                  ? "PAID"
                  : "DOWN_PAYMENT";
                const dpAmount = hasActualCheckin ? 0 : 500000;

                return await prisma.transaction.create({
                  data: {
                    invoice_code: `TEST-${Date.now()}-${idx}-${Math.random()}`,
                    customer_name: tx.customer_name,
                    customer_phone: "08123456789",
                    booking_date: bookingDate,
                    checkout_datetime: tx.checkout_datetime,
                    checkin_datetime: tx.checkin_datetime,
                    actual_checkin_datetime: tx.actual_checkin_datetime,
                    all_in_rate: tx.all_in_rate,
                    overtime_rate_per_hour: tx.overtime_rate_per_hour,
                    custom_price: tx.custom_price,
                    approval_status: "APPROVED",
                    payment_status: paymentStatus,
                    dp_amount: dpAmount,
                    packageId: packageId,
                    armadaId: testArmada.id,
                    driverId: testDriver.id,
                  },
                });
              })
            );

            // Call the API with package type filter
            const request = {
              url: `http://localhost:3000/api/reports/income?from=${dateRange.start.toISOString().split("T")[0]}&to=${dateRange.end.toISOString().split("T")[0]}&packageType=${filterType}`,
              auth: {
                user: { id: "test-user", role: "ADMIN" },
                ipAddress: "127.0.0.1",
                userAgent: "test",
              },
            };

            const response = await GET(request);
            const result = response.data;

            // Property: All returned packages should match the filter type
            for (const packageGroup of result.incomeByPackage) {
              expect(packageGroup.packageType).toBe(filterType);
            }

            // Verify that packages of other types are excluded
            const returnedPackageIds = new Set(
              result.incomeByPackage.map((pg) => pg.packageId)
            );
            const packagesOfOtherTypes = packages.filter(
              (pkg) => pkg.type !== filterType
            );
            for (const pkg of packagesOfOtherTypes) {
              expect(returnedPackageIds.has(pkg.id)).toBe(false);
            }

            // Clean up
            await prisma.transaction.deleteMany({
              where: { id: { in: transactions.map((t) => t.id) } },
            });
            for (const pkg of packages) {
              await prisma.servicePackage.delete({ where: { id: pkg.id } });
            }
            await prisma.armada.delete({ where: { id: testArmada.id } });
            await prisma.driver.delete({ where: { id: testDriver.id } });
          }
        ),
        { numRuns: 5 }
      );
    }, 60000); // 60 second timeout
  });

  // ============================================================================
  // UNIT TESTS FOR EDGE CASES
  // ============================================================================

  describe("Edge Cases", () => {
    it("should return 400 error when date range is missing", async () => {
      const request = {
        url: "http://localhost:3000/api/reports/income",
        auth: {
          user: { id: "test-user", role: "ADMIN" },
          ipAddress: "127.0.0.1",
          userAgent: "test",
        },
      };

      const response = await GET(request);

      expect(response.success).toBe(false);
      expect(response.status).toBe(400);
      expect(response.message).toContain("tanggal");
    });

    it("should return 400 error when only 'from' date is provided", async () => {
      const request = {
        url: "http://localhost:3000/api/reports/income?from=2024-01-01",
        auth: {
          user: { id: "test-user", role: "ADMIN" },
          ipAddress: "127.0.0.1",
          userAgent: "test",
        },
      };

      const response = await GET(request);

      expect(response.success).toBe(false);
      expect(response.status).toBe(400);
    });

    it("should return 400 error when only 'to' date is provided", async () => {
      const request = {
        url: "http://localhost:3000/api/reports/income?to=2024-01-31",
        auth: {
          user: { id: "test-user", role: "ADMIN" },
          ipAddress: "127.0.0.1",
          userAgent: "test",
        },
      };

      const response = await GET(request);

      expect(response.success).toBe(false);
      expect(response.status).toBe(400);
    });

    it("should return empty result set when no transactions match criteria", async () => {
      // Use a date range far in the future where no transactions exist
      const request = {
        url: "http://localhost:3000/api/reports/income?from=2099-01-01&to=2099-12-31",
        auth: {
          user: { id: "test-user", role: "ADMIN" },
          ipAddress: "127.0.0.1",
          userAgent: "test",
        },
      };

      const response = await GET(request);
      const result = response.data;

      expect(response.success).toBe(true);
      expect(result.incomeByPackage).toEqual([]);
      expect(result.summary.totalPackages).toBe(0);
      expect(result.summary.totalTransactions).toBe(0);
      expect(result.summary.totalRevenue).toBe(0);
    });

    it("should handle single transaction scenario correctly", async () => {
      // Create a single test transaction
      const testPackage = await prisma.servicePackage.create({
        data: {
          name: `TEST-PKG-SINGLE-${Date.now()}`,
          type: "CAR_RENTAL",
          price: 500000,
          durationHours: 12,
        },
      });

      const testArmada = await prisma.armada.create({
        data: {
          license_plate: `TEST-SINGLE-${Date.now()}`,
          brand: "Toyota",
          model: "Avanza",
          status: "READY",
        },
      });

      const testDriver = await prisma.driver.create({
        data: {
          driver_name: `TEST-DRIVER-SINGLE-${Date.now()}`,
          phone_number: "08123456789",
          status: "READY",
        },
      });

      const transaction = await prisma.transaction.create({
        data: {
          invoice_code: `TEST-SINGLE-${Date.now()}`,
          customer_name: "Test Customer",
          customer_phone: "08123456789",
          booking_date: new Date("2024-06-15"),
          checkout_datetime: new Date("2024-06-15T08:00:00Z"),
          checkin_datetime: new Date("2024-06-15T20:00:00Z"),
          actual_checkin_datetime: new Date("2024-06-15T20:00:00Z"),
          all_in_rate: 500000,
          overtime_rate_per_hour: 50000,
          approval_status: "APPROVED",
          payment_status: "PAID",
          dp_amount: 0,
          packageId: testPackage.id,
          armadaId: testArmada.id,
          driverId: testDriver.id,
        },
      });

      const request = {
        url: "http://localhost:3000/api/reports/income?from=2024-06-01&to=2024-06-30",
        auth: {
          user: { id: "test-user", role: "ADMIN" },
          ipAddress: "127.0.0.1",
          userAgent: "test",
        },
      };

      const response = await GET(request);
      const result = response.data;

      expect(response.success).toBe(true);
      expect(result.summary.totalTransactions).toBe(1);
      expect(result.incomeByPackage).toHaveLength(1);
      expect(result.incomeByPackage[0].transactionCount).toBe(1);
      expect(result.incomeByPackage[0].packageId).toBe(testPackage.id);

      // Clean up
      await prisma.transaction.delete({ where: { id: transaction.id } });
      await prisma.servicePackage.delete({ where: { id: testPackage.id } });
      await prisma.armada.delete({ where: { id: testArmada.id } });
      await prisma.driver.delete({ where: { id: testDriver.id } });
    });
  });
});
