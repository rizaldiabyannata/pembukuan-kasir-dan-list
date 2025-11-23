/**
 * Property-Based Tests for Incentive Recipients API
 * Tests the filtering logic for incentive expenses
 *
 * Feature: incentive-recipients-dashboard-widget
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import fc from "fast-check";
import { prisma } from "@/lib/prisma";
import {
  expenseArbitrary,
  incentiveExpenseArbitrary,
  approvedIncentiveExpenseArbitrary,
} from "@/lib/__tests__/test-generators";

// Mock dependencies
jest.mock("@/lib/prisma", () => ({
  prisma: {
    expense: {
      findMany: jest.fn(),
    },
  },
}));

jest.mock("@/lib/middleware", () => ({
  protectedRoute: (handler) => handler,
  successResponse: (data, message) => ({
    json: async () => ({
      success: true,
      data,
      message,
      timestamp: new Date().toISOString(),
    }),
  }),
  errorResponse: (error, status, details) => ({
    json: async () => ({
      error,
      details,
      timestamp: new Date().toISOString(),
    }),
  }),
}));

describe("Incentive Recipients API - Property-Based Tests", () => {
  let GET;

  beforeEach(async () => {
    jest.clearAllMocks();
    // Dynamically import the route handler after mocks are set up
    const routeModule = await import("../route.js");
    GET = routeModule.GET;
  });

  /**
   * Feature: incentive-recipients-dashboard-widget, Property 1: Incentive data filtering by category and approval status
   * Validates: Requirements 1.2
   *
   * For any period parameter (today, month, year), the API should return only expenses
   * where category equals INSENTIF_BONUS and approval_status equals APPROVED.
   */
  it("should filter expenses by INSENTIF_BONUS category and APPROVED status", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom("today", "month", "year"),
        fc.array(approvedIncentiveExpenseArbitrary(), {
          minLength: 1,
          maxLength: 10,
        }),
        async (period, incentiveExpenses) => {
          // Mock Prisma to return only approved incentive expenses
          prisma.expense.findMany.mockResolvedValue(
            incentiveExpenses.map((e) => ({
              ...e,
              driver: null,
              staff: null,
              armada: null,
            }))
          );

          // Create mock request with query parameter
          const mockRequest = {
            url: `http://localhost:3000/api/dashboard/incentive-recipients?period=${period}`,
          };

          // Call the API handler
          const response = await GET(mockRequest);
          const data = await response.json();

          // Verify the API was called with correct filters
          expect(prisma.expense.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
              where: expect.objectContaining({
                category: "INSENTIF_BONUS",
                approval_status: "APPROVED",
              }),
            })
          );

          // Verify that only INSENTIF_BONUS + APPROVED expenses are in the result
          if (data.success && data.data) {
            // The total number of incentives should match what we provided
            expect(data.data.summary.totalIncentives).toBe(
              incentiveExpenses.length
            );

            // Verify the total amount matches
            const expectedTotalAmount = incentiveExpenses.reduce(
              (sum, e) => sum + e.amount,
              0
            );
            expect(data.data.summary.totalAmount).toBe(expectedTotalAmount);

            // Verify all recipients have valid data
            data.data.recipients.forEach((recipient) => {
              expect(recipient.recipientName).toBeDefined();
              expect(recipient.totalAmount).toBeGreaterThan(0);
              expect(recipient.incentiveCount).toBeGreaterThan(0);
            });
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property test: Verify the filter is applied at database level
   */
  it("should apply INSENTIF_BONUS and APPROVED filters in database query", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom("today", "month", "year"),
        async (period) => {
          // Mock Prisma to return empty array
          prisma.expense.findMany.mockResolvedValue([]);

          // Create mock request with query parameter
          const mockRequest = {
            url: `http://localhost:3000/api/dashboard/incentive-recipients?period=${period}`,
          };

          // Call the API handler
          await GET(mockRequest);

          // Verify the correct filters were applied in the database query
          expect(prisma.expense.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
              where: expect.objectContaining({
                category: "INSENTIF_BONUS",
                approval_status: "APPROVED",
                date: expect.objectContaining({
                  gte: expect.any(Date),
                  lte: expect.any(Date),
                }),
              }),
            })
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: incentive-recipients-dashboard-widget, Property 3: Recipient aggregation correctness
   * Validates: Requirements 1.4
   *
   * For any set of expenses with duplicate namaPenerima values, the aggregated recipient
   * should have totalAmount equal to the sum of all expense amounts and incentiveCount
   * equal to the count of expenses for that recipient.
   */
  it("should correctly aggregate expenses by recipient name", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom("today", "month", "year"),
        fc.array(approvedIncentiveExpenseArbitrary(), {
          minLength: 2,
          maxLength: 20,
        }),
        async (period, baseExpenses) => {
          // Create expenses with some duplicate recipient names
          // We'll take the first few expenses and duplicate their namaPenerima
          const expenses = baseExpenses.map((expense, idx) => {
            // Create groups of recipients by reusing names
            const recipientIndex =
              idx % Math.max(1, Math.floor(baseExpenses.length / 3));
            return {
              ...expense,
              namaPenerima: `Recipient_${recipientIndex}`,
              driver: null,
              staff: null,
              armada: null,
            };
          });

          // Calculate expected aggregation manually
          const expectedAggregation = new Map();
          expenses.forEach((expense) => {
            const name = expense.namaPenerima;
            if (!expectedAggregation.has(name)) {
              expectedAggregation.set(name, {
                totalAmount: 0,
                incentiveCount: 0,
              });
            }
            const agg = expectedAggregation.get(name);
            agg.totalAmount += expense.amount;
            agg.incentiveCount += 1;
          });

          // Mock Prisma to return our test expenses
          prisma.expense.findMany.mockResolvedValue(expenses);

          // Create mock request
          const mockRequest = {
            url: `http://localhost:3000/api/dashboard/incentive-recipients?period=${period}`,
          };

          // Call the API handler
          const response = await GET(mockRequest);
          const data = await response.json();

          // Verify successful response
          expect(data.success).toBe(true);
          expect(data.data).toBeDefined();

          // Verify each recipient's aggregation is correct
          data.data.recipients.forEach((recipient) => {
            const expected = expectedAggregation.get(recipient.recipientName);
            expect(expected).toBeDefined();

            // Verify totalAmount matches the sum of all expenses for this recipient
            expect(recipient.totalAmount).toBe(expected.totalAmount);

            // Verify incentiveCount matches the count of expenses for this recipient
            expect(recipient.incentiveCount).toBe(expected.incentiveCount);

            // Verify the recipient has positive values
            expect(recipient.totalAmount).toBeGreaterThan(0);
            expect(recipient.incentiveCount).toBeGreaterThan(0);
          });

          // Verify the number of unique recipients matches
          expect(data.data.recipients.length).toBe(expectedAggregation.size);

          // Verify summary statistics match the aggregation
          const totalExpectedAmount = Array.from(
            expectedAggregation.values()
          ).reduce((sum, agg) => sum + agg.totalAmount, 0);
          const totalExpectedCount = Array.from(
            expectedAggregation.values()
          ).reduce((sum, agg) => sum + agg.incentiveCount, 0);

          expect(data.data.summary.totalAmount).toBe(totalExpectedAmount);
          expect(data.data.summary.totalIncentives).toBe(totalExpectedCount);
          expect(data.data.summary.totalRecipients).toBe(
            expectedAggregation.size
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: incentive-recipients-dashboard-widget, Property 2: Recipient data completeness
   * Validates: Requirements 1.3
   *
   * For any recipient in the returned data, the recipient object should contain
   * recipientName, totalAmount, and incentiveCount fields.
   */
  it("should return complete recipient data with all required fields", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom("today", "month", "year"),
        fc.array(approvedIncentiveExpenseArbitrary(), {
          minLength: 1,
          maxLength: 20,
        }),
        async (period, incentiveExpenses) => {
          // Mock Prisma to return incentive expenses
          prisma.expense.findMany.mockResolvedValue(
            incentiveExpenses.map((e) => ({
              ...e,
              driver: null,
              staff: null,
              armada: null,
            }))
          );

          // Create mock request with query parameter
          const mockRequest = {
            url: `http://localhost:3000/api/dashboard/incentive-recipients?period=${period}`,
          };

          // Call the API handler
          const response = await GET(mockRequest);
          const data = await response.json();

          // Verify successful response
          expect(data.success).toBe(true);
          expect(data.data).toBeDefined();
          expect(data.data.recipients).toBeDefined();
          expect(Array.isArray(data.data.recipients)).toBe(true);

          // For any recipient in the returned data, verify all required fields are present
          data.data.recipients.forEach((recipient) => {
            // Verify recipientName field exists and is a string
            expect(recipient).toHaveProperty("recipientName");
            expect(typeof recipient.recipientName).toBe("string");
            expect(recipient.recipientName.length).toBeGreaterThan(0);

            // Verify totalAmount field exists and is a number
            expect(recipient).toHaveProperty("totalAmount");
            expect(typeof recipient.totalAmount).toBe("number");
            expect(recipient.totalAmount).toBeGreaterThan(0);

            // Verify incentiveCount field exists and is a number
            expect(recipient).toHaveProperty("incentiveCount");
            expect(typeof recipient.incentiveCount).toBe("number");
            expect(recipient.incentiveCount).toBeGreaterThan(0);

            // Verify relatedEntities field exists and is an array
            expect(recipient).toHaveProperty("relatedEntities");
            expect(Array.isArray(recipient.relatedEntities)).toBe(true);

            // Verify the recipient object has exactly these expected fields
            const expectedFields = [
              "recipientName",
              "totalAmount",
              "incentiveCount",
              "relatedEntities",
            ];
            const actualFields = Object.keys(recipient);
            expectedFields.forEach((field) => {
              expect(actualFields).toContain(field);
            });
          });

          // Verify that the number of recipients matches the number of unique namaPenerima values
          const uniqueRecipients = new Set(
            incentiveExpenses.map((e) => e.namaPenerima)
          );
          expect(data.data.recipients.length).toBe(uniqueRecipients.size);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: incentive-recipients-dashboard-widget, Property 8: Related entity display
   * Validates: Requirements 4.1, 4.2, 4.3
   *
   * For any expense with a non-null driverId, staffId, or armadaId, the corresponding
   * entity information (name or license plate) should be included in the relatedEntities array.
   */
  it("should include related entity information for expenses with linked entities", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom("today", "month", "year"),
        fc.array(approvedIncentiveExpenseArbitrary(), {
          minLength: 1,
          maxLength: 10,
        }),
        async (period, baseExpenses) => {
          // Create expenses with related entities
          const expenses = baseExpenses.map((expense, idx) => {
            // Create a mix of expenses with different entity types
            const hasDriver = idx % 3 === 0;
            const hasStaff = idx % 3 === 1;
            const hasArmada = idx % 3 === 2;

            return {
              ...expense,
              // Ensure all expenses have the same recipient name for easier testing
              namaPenerima: "Test Recipient",
              driver: hasDriver
                ? {
                    id: `driver-${idx}`,
                    driver_name: `Driver ${idx}`,
                  }
                : null,
              staff: hasStaff
                ? {
                    id: `staff-${idx}`,
                    staff_name: `Staff ${idx}`,
                  }
                : null,
              armada: hasArmada
                ? {
                    id: `armada-${idx}`,
                    license_plate: `PLATE-${idx}`,
                  }
                : null,
              driverId: hasDriver ? `driver-${idx}` : null,
              staffId: hasStaff ? `staff-${idx}` : null,
              armadaId: hasArmada ? `armada-${idx}` : null,
            };
          });

          // Mock Prisma to return expenses with related entities
          prisma.expense.findMany.mockResolvedValue(expenses);

          // Create mock request
          const mockRequest = {
            url: `http://localhost:3000/api/dashboard/incentive-recipients?period=${period}`,
          };

          // Call the API handler
          const response = await GET(mockRequest);
          const data = await response.json();

          // Verify successful response
          expect(data.success).toBe(true);
          expect(data.data).toBeDefined();
          expect(data.data.recipients).toBeDefined();

          // Since all expenses have the same recipient name, there should be exactly 1 recipient
          expect(data.data.recipients.length).toBe(1);
          const recipient = data.data.recipients[0];

          // Verify relatedEntities array exists
          expect(recipient.relatedEntities).toBeDefined();
          expect(Array.isArray(recipient.relatedEntities)).toBe(true);

          // Count expected entities from the expenses
          const expectedDrivers = new Set();
          const expectedStaff = new Set();
          const expectedArmada = new Set();

          expenses.forEach((expense) => {
            if (expense.driver) {
              expectedDrivers.add(expense.driver.id);
            }
            if (expense.staff) {
              expectedStaff.add(expense.staff.id);
            }
            if (expense.armada) {
              expectedArmada.add(expense.armada.id);
            }
          });

          // Verify that all expected entities are present in relatedEntities
          const actualDrivers = recipient.relatedEntities.filter(
            (e) => e.type === "driver"
          );
          const actualStaff = recipient.relatedEntities.filter(
            (e) => e.type === "staff"
          );
          const actualArmada = recipient.relatedEntities.filter(
            (e) => e.type === "armada"
          );

          // Verify counts match
          expect(actualDrivers.length).toBe(expectedDrivers.size);
          expect(actualStaff.length).toBe(expectedStaff.size);
          expect(actualArmada.length).toBe(expectedArmada.size);

          // Verify each entity has the correct structure and data
          actualDrivers.forEach((entity) => {
            expect(entity.type).toBe("driver");
            expect(entity.id).toBeDefined();
            expect(entity.name).toBeDefined();
            expect(typeof entity.name).toBe("string");
            expect(entity.name.length).toBeGreaterThan(0);
            // Verify the ID is in our expected set
            expect(expectedDrivers.has(entity.id)).toBe(true);
          });

          actualStaff.forEach((entity) => {
            expect(entity.type).toBe("staff");
            expect(entity.id).toBeDefined();
            expect(entity.name).toBeDefined();
            expect(typeof entity.name).toBe("string");
            expect(entity.name.length).toBeGreaterThan(0);
            // Verify the ID is in our expected set
            expect(expectedStaff.has(entity.id)).toBe(true);
          });

          actualArmada.forEach((entity) => {
            expect(entity.type).toBe("armada");
            expect(entity.id).toBeDefined();
            expect(entity.name).toBeDefined();
            expect(typeof entity.name).toBe("string");
            expect(entity.name.length).toBeGreaterThan(0);
            // Verify the ID is in our expected set
            expect(expectedArmada.has(entity.id)).toBe(true);
          });

          // Verify that the total number of entities matches
          const totalExpectedEntities =
            expectedDrivers.size + expectedStaff.size + expectedArmada.size;
          expect(recipient.relatedEntities.length).toBe(totalExpectedEntities);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: incentive-recipients-dashboard-widget, Property 6: Recipient sorting by amount
   * Validates: Requirements 3.1
   *
   * For any list of recipients, the returned array should be sorted in descending order
   * by totalAmount, where each recipient's totalAmount is greater than or equal to the
   * next recipient's totalAmount.
   */
  it("should sort recipients by total amount in descending order", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom("today", "month", "year"),
        fc.array(approvedIncentiveExpenseArbitrary(), {
          minLength: 2,
          maxLength: 20,
        }),
        async (period, baseExpenses) => {
          // Create expenses with different recipient names and varying amounts
          // to ensure we have multiple recipients with different totals
          const expenses = baseExpenses.map((expense, idx) => {
            // Create multiple recipients with different amounts
            const recipientIndex =
              idx % Math.max(2, Math.floor(baseExpenses.length / 2));
            return {
              ...expense,
              namaPenerima: `Recipient_${recipientIndex}`,
              // Vary the amounts to ensure different totals
              amount: expense.amount + recipientIndex * 1000,
              driver: null,
              staff: null,
              armada: null,
            };
          });

          // Mock Prisma to return our test expenses
          prisma.expense.findMany.mockResolvedValue(expenses);

          // Create mock request
          const mockRequest = {
            url: `http://localhost:3000/api/dashboard/incentive-recipients?period=${period}`,
          };

          // Call the API handler
          const response = await GET(mockRequest);
          const data = await response.json();

          // Verify successful response
          expect(data.success).toBe(true);
          expect(data.data).toBeDefined();
          expect(data.data.recipients).toBeDefined();
          expect(Array.isArray(data.data.recipients)).toBe(true);

          // If we have at least 2 recipients, verify sorting
          if (data.data.recipients.length >= 2) {
            // Verify that each recipient's totalAmount is >= the next recipient's totalAmount
            for (let i = 0; i < data.data.recipients.length - 1; i++) {
              const currentRecipient = data.data.recipients[i];
              const nextRecipient = data.data.recipients[i + 1];

              // Current recipient should have >= amount than next recipient (descending order)
              expect(currentRecipient.totalAmount).toBeGreaterThanOrEqual(
                nextRecipient.totalAmount
              );
            }

            // Verify the first recipient has the highest total amount
            const maxAmount = Math.max(
              ...data.data.recipients.map((r) => r.totalAmount)
            );
            expect(data.data.recipients[0].totalAmount).toBe(maxAmount);

            // Verify the last recipient has the lowest total amount
            const minAmount = Math.min(
              ...data.data.recipients.map((r) => r.totalAmount)
            );
            expect(
              data.data.recipients[data.data.recipients.length - 1].totalAmount
            ).toBe(minAmount);
          }

          // Verify that the array is sorted in descending order
          const amounts = data.data.recipients.map((r) => r.totalAmount);
          const sortedAmounts = [...amounts].sort((a, b) => b - a);
          expect(amounts).toEqual(sortedAmounts);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: incentive-recipients-dashboard-widget, Property 10: API response format consistency
   * Validates: Requirements 7.4
   *
   * For any successful API response, the response should have a success field set to true,
   * a data field containing the result, a message field, and a timestamp field.
   */
  it("should return consistent success response format for all successful requests", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom("today", "month", "year"),
        fc.array(approvedIncentiveExpenseArbitrary(), {
          minLength: 0,
          maxLength: 20,
        }),
        async (period, incentiveExpenses) => {
          // Mock Prisma to return incentive expenses
          prisma.expense.findMany.mockResolvedValue(
            incentiveExpenses.map((e) => ({
              ...e,
              driver: null,
              staff: null,
              armada: null,
            }))
          );

          // Create mock request with query parameter
          const mockRequest = {
            url: `http://localhost:3000/api/dashboard/incentive-recipients?period=${period}`,
          };

          // Call the API handler
          const response = await GET(mockRequest);
          const responseData = await response.json();

          // Verify the response has the success field set to true
          expect(responseData).toHaveProperty("success");
          expect(responseData.success).toBe(true);

          // Verify the response has a data field
          expect(responseData).toHaveProperty("data");
          expect(responseData.data).toBeDefined();
          expect(typeof responseData.data).toBe("object");

          // Verify the data field contains the expected structure
          expect(responseData.data).toHaveProperty("recipients");
          expect(Array.isArray(responseData.data.recipients)).toBe(true);
          expect(responseData.data).toHaveProperty("summary");
          expect(typeof responseData.data.summary).toBe("object");
          expect(responseData.data).toHaveProperty("period");
          expect(responseData.data.period).toBe(period);

          // Verify the response has a message field
          expect(responseData).toHaveProperty("message");
          expect(typeof responseData.message).toBe("string");
          expect(responseData.message.length).toBeGreaterThan(0);

          // Verify the response has a timestamp field
          expect(responseData).toHaveProperty("timestamp");
          expect(typeof responseData.timestamp).toBe("string");

          // Verify the timestamp is a valid ISO 8601 date string
          const timestamp = new Date(responseData.timestamp);
          expect(timestamp.toString()).not.toBe("Invalid Date");

          // Verify the timestamp is recent (within the last 5 seconds)
          const now = new Date();
          const timeDiff = Math.abs(now.getTime() - timestamp.getTime());
          expect(timeDiff).toBeLessThan(5000);

          // Verify the response has exactly these top-level fields
          const expectedTopLevelFields = [
            "success",
            "message",
            "data",
            "timestamp",
          ];
          const actualTopLevelFields = Object.keys(responseData);

          // Check that all expected fields are present
          expectedTopLevelFields.forEach((field) => {
            expect(actualTopLevelFields).toContain(field);
          });

          // Verify no unexpected fields (allow 'meta' as it's optional in successResponse)
          actualTopLevelFields.forEach((field) => {
            expect([...expectedTopLevelFields, "meta"]).toContain(field);
          });

          // Verify the summary object has the correct structure
          expect(responseData.data.summary).toHaveProperty("totalRecipients");
          expect(typeof responseData.data.summary.totalRecipients).toBe(
            "number"
          );
          expect(
            responseData.data.summary.totalRecipients
          ).toBeGreaterThanOrEqual(0);

          expect(responseData.data.summary).toHaveProperty("totalAmount");
          expect(typeof responseData.data.summary.totalAmount).toBe("number");
          expect(responseData.data.summary.totalAmount).toBeGreaterThanOrEqual(
            0
          );

          expect(responseData.data.summary).toHaveProperty("totalIncentives");
          expect(typeof responseData.data.summary.totalIncentives).toBe(
            "number"
          );
          expect(
            responseData.data.summary.totalIncentives
          ).toBeGreaterThanOrEqual(0);

          // Verify consistency between data and summary
          expect(responseData.data.summary.totalRecipients).toBe(
            responseData.data.recipients.length
          );
          expect(responseData.data.summary.totalIncentives).toBe(
            incentiveExpenses.length
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: incentive-recipients-dashboard-widget, Property 4: Period filtering correctness
   * Validates: Requirements 2.1, 2.2, 2.3
   *
   * For any period parameter value (today, month, year), all returned expenses should have
   * a date field that falls within the calculated date range for that period.
   */
  it("should filter expenses by the correct date range for each period", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom("today", "month", "year"),
        async (period) => {
          // Mock Prisma to return empty array (we're only testing the query parameters)
          prisma.expense.findMany.mockResolvedValue([]);

          // Create mock request with query parameter
          const mockRequest = {
            url: `http://localhost:3000/api/dashboard/incentive-recipients?period=${period}`,
          };

          // Call the API handler
          await GET(mockRequest);

          // Verify the API was called with a date range
          expect(prisma.expense.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
              where: expect.objectContaining({
                category: "INSENTIF_BONUS",
                approval_status: "APPROVED",
                date: expect.objectContaining({
                  gte: expect.any(Date),
                  lte: expect.any(Date),
                }),
              }),
            })
          );

          // Extract the actual date range used in the query
          const callArgs =
            prisma.expense.findMany.mock.calls[
              prisma.expense.findMany.mock.calls.length - 1
            ][0];
          const actualStartDate = callArgs.where.date.gte;
          const actualEndDate = callArgs.where.date.lte;

          // Verify the date range is reasonable for the period
          const timeDiff = actualEndDate.getTime() - actualStartDate.getTime();

          if (period === "today") {
            // For "today", the range should be less than or equal to 24 hours
            const oneDayMs = 24 * 60 * 60 * 1000;
            expect(timeDiff).toBeLessThanOrEqual(oneDayMs);
            expect(timeDiff).toBeGreaterThan(0);

            // Start date should have hours/minutes/seconds set to 0
            expect(actualStartDate.getHours()).toBe(0);
            expect(actualStartDate.getMinutes()).toBe(0);
            expect(actualStartDate.getSeconds()).toBe(0);
            expect(actualStartDate.getMilliseconds()).toBe(0);
          } else if (period === "month") {
            // For "month", start should be the 1st of the current month
            // Range can be anywhere from 0 to 31 days depending on current date
            const maxMonthMs = 31 * 24 * 60 * 60 * 1000;
            expect(timeDiff).toBeGreaterThanOrEqual(0);
            expect(timeDiff).toBeLessThanOrEqual(maxMonthMs);

            // Start date should be the 1st of the month
            expect(actualStartDate.getDate()).toBe(1);

            // Start and end should be in the same month and year
            expect(actualStartDate.getMonth()).toBe(actualEndDate.getMonth());
            expect(actualStartDate.getFullYear()).toBe(
              actualEndDate.getFullYear()
            );
          } else if (period === "year") {
            // For "year", start should be January 1st of the current year
            // Range can be anywhere from 0 to 366 days depending on current date
            const maxYearMs = 366 * 24 * 60 * 60 * 1000;
            expect(timeDiff).toBeGreaterThanOrEqual(0);
            expect(timeDiff).toBeLessThanOrEqual(maxYearMs);

            // Start date should be January 1st
            expect(actualStartDate.getMonth()).toBe(0);
            expect(actualStartDate.getDate()).toBe(1);

            // Start and end should be in the same year
            expect(actualStartDate.getFullYear()).toBe(
              actualEndDate.getFullYear()
            );
          }

          // Verify the end date is reasonable (should be close to when the test runs)
          const testRunTime = new Date();
          const endTimeDifference = Math.abs(
            actualEndDate.getTime() - testRunTime.getTime()
          );
          expect(endTimeDifference).toBeLessThan(5000); // Within 5 seconds
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: incentive-recipients-dashboard-widget, Property 11: Error response format consistency
   * Validates: Requirements 7.5
   *
   * For any error response, the response should have an error field with an error message,
   * a details field, and a timestamp field, along with an appropriate HTTP status code.
   */
  it("should return consistent error response format for all error scenarios", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(
          // Invalid period parameters (note: empty string defaults to "month", so it's not invalid)
          { period: "invalid", expectedStatus: 400 },
          { period: "week", expectedStatus: 400 },
          { period: "quarter", expectedStatus: 400 },
          { period: "123", expectedStatus: 400 },
          { period: "daily", expectedStatus: 400 }
        ),
        async (testCase) => {
          // Mock Prisma to return empty array (we're testing error handling, not data)
          prisma.expense.findMany.mockResolvedValue([]);

          // Create mock request with invalid period parameter
          const mockRequest = {
            url: `http://localhost:3000/api/dashboard/incentive-recipients?period=${testCase.period}`,
          };

          // Call the API handler
          const response = await GET(mockRequest);
          const responseData = await response.json();

          // Verify the response does NOT have a success field set to true
          if (responseData.hasOwnProperty("success")) {
            expect(responseData.success).not.toBe(true);
          }

          // Verify the response has an error field with a string message
          expect(responseData).toHaveProperty("error");
          expect(typeof responseData.error).toBe("string");
          expect(responseData.error.length).toBeGreaterThan(0);

          // Verify the response has a details field (can be null or object)
          expect(responseData).toHaveProperty("details");
          if (responseData.details !== null) {
            expect(typeof responseData.details).toBe("object");
          }

          // Verify the response has a timestamp field
          expect(responseData).toHaveProperty("timestamp");
          expect(typeof responseData.timestamp).toBe("string");

          // Verify the timestamp is a valid ISO 8601 date string
          const timestamp = new Date(responseData.timestamp);
          expect(timestamp.toString()).not.toBe("Invalid Date");

          // Verify the timestamp is recent (within the last 5 seconds)
          const now = new Date();
          const timeDiff = Math.abs(now.getTime() - timestamp.getTime());
          expect(timeDiff).toBeLessThan(5000);

          // Verify the response has the expected top-level fields
          const expectedFields = ["error", "details", "timestamp"];
          const actualFields = Object.keys(responseData);

          // Check that all expected fields are present
          expectedFields.forEach((field) => {
            expect(actualFields).toContain(field);
          });

          // Verify no unexpected fields (should only have error, details, timestamp)
          actualFields.forEach((field) => {
            expect(expectedFields).toContain(field);
          });

          // Verify the response does not have success or data fields
          expect(responseData).not.toHaveProperty("success");
          expect(responseData).not.toHaveProperty("data");
          expect(responseData).not.toHaveProperty("message");
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional test: Verify error response format for database errors
   */
  it("should return consistent error response format when database query fails", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom("today", "month", "year"),
        async (period) => {
          // Mock Prisma to throw a database error
          const dbError = new Error("Database connection failed");
          prisma.expense.findMany.mockRejectedValue(dbError);

          // Create mock request with valid period parameter
          const mockRequest = {
            url: `http://localhost:3000/api/dashboard/incentive-recipients?period=${period}`,
          };

          // Call the API handler
          const response = await GET(mockRequest);
          const responseData = await response.json();

          // Verify the response has an error field
          expect(responseData).toHaveProperty("error");
          expect(typeof responseData.error).toBe("string");
          expect(responseData.error.length).toBeGreaterThan(0);

          // Verify the response has a details field
          expect(responseData).toHaveProperty("details");

          // Verify the response has a timestamp field
          expect(responseData).toHaveProperty("timestamp");
          expect(typeof responseData.timestamp).toBe("string");

          // Verify the timestamp is valid
          const timestamp = new Date(responseData.timestamp);
          expect(timestamp.toString()).not.toBe("Invalid Date");

          // Verify the response structure matches error format
          const expectedFields = ["error", "details", "timestamp"];
          const actualFields = Object.keys(responseData);

          expectedFields.forEach((field) => {
            expect(actualFields).toContain(field);
          });

          // Verify no success-related fields are present
          expect(responseData).not.toHaveProperty("success");
          expect(responseData).not.toHaveProperty("data");
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: incentive-recipients-dashboard-widget, Property 12: Period parameter acceptance
   * Validates: Requirements 7.3
   *
   * For any valid period value (today, month, year), the API should accept the parameter
   * and return data filtered by that period without errors.
   */
  it("should accept all valid period parameters without errors", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom("today", "month", "year"),
        fc.array(approvedIncentiveExpenseArbitrary(), {
          minLength: 0,
          maxLength: 10,
        }),
        async (period, incentiveExpenses) => {
          // Mock Prisma to return incentive expenses
          prisma.expense.findMany.mockResolvedValue(
            incentiveExpenses.map((e) => ({
              ...e,
              driver: null,
              staff: null,
              armada: null,
            }))
          );

          // Create mock request with valid period parameter
          const mockRequest = {
            url: `http://localhost:3000/api/dashboard/incentive-recipients?period=${period}`,
          };

          // Call the API handler
          const response = await GET(mockRequest);
          const responseData = await response.json();

          // Verify the API accepts the period parameter without errors
          // A successful response should have success: true
          expect(responseData).toHaveProperty("success");
          expect(responseData.success).toBe(true);

          // Verify no error fields are present
          expect(responseData).not.toHaveProperty("error");

          // Verify the response contains data
          expect(responseData).toHaveProperty("data");
          expect(responseData.data).toBeDefined();
          expect(typeof responseData.data).toBe("object");

          // Verify the period is echoed back in the response
          expect(responseData.data).toHaveProperty("period");
          expect(responseData.data.period).toBe(period);

          // Verify the response has the expected structure
          expect(responseData.data).toHaveProperty("recipients");
          expect(Array.isArray(responseData.data.recipients)).toBe(true);
          expect(responseData.data).toHaveProperty("summary");
          expect(typeof responseData.data.summary).toBe("object");

          // Verify the API was called with the correct period-based date filter
          expect(prisma.expense.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
              where: expect.objectContaining({
                category: "INSENTIF_BONUS",
                approval_status: "APPROVED",
                date: expect.objectContaining({
                  gte: expect.any(Date),
                  lte: expect.any(Date),
                }),
              }),
            })
          );

          // Verify the response has a message field
          expect(responseData).toHaveProperty("message");
          expect(typeof responseData.message).toBe("string");

          // Verify the response has a timestamp field
          expect(responseData).toHaveProperty("timestamp");
          expect(typeof responseData.timestamp).toBe("string");

          // Verify the timestamp is valid
          const timestamp = new Date(responseData.timestamp);
          expect(timestamp.toString()).not.toBe("Invalid Date");
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional test: Verify invalid period parameters are rejected
   */
  it("should reject invalid period parameters with error response", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom("invalid", "week", "quarter", "daily", "yesterday"),
        async (invalidPeriod) => {
          // Mock Prisma (should not be called for invalid parameters)
          prisma.expense.findMany.mockResolvedValue([]);

          // Create mock request with invalid period parameter
          const mockRequest = {
            url: `http://localhost:3000/api/dashboard/incentive-recipients?period=${invalidPeriod}`,
          };

          // Call the API handler
          const response = await GET(mockRequest);
          const responseData = await response.json();

          // Verify the API rejects the invalid period parameter
          expect(responseData).toHaveProperty("error");
          expect(typeof responseData.error).toBe("string");
          expect(responseData.error.length).toBeGreaterThan(0);

          // Verify the error message mentions the invalid period
          expect(responseData.error.toLowerCase()).toContain("period");

          // Verify no success field is present or it's false
          if (responseData.hasOwnProperty("success")) {
            expect(responseData.success).not.toBe(true);
          }

          // Verify no data field is present
          expect(responseData).not.toHaveProperty("data");

          // Verify the response has error format fields
          expect(responseData).toHaveProperty("timestamp");
          expect(typeof responseData.timestamp).toBe("string");
        }
      ),
      { numRuns: 100 }
    );
  });
});
