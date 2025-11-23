/**
 * Authorization Tests for Incentive Recipients API
 * Tests that non-admin users receive 403 Forbidden response
 *
 * Feature: incentive-recipients-dashboard-widget
 * Validates: Requirements 6.4
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals";

// Mock the middleware to simulate authorization checks
jest.mock("@/lib/middleware", () => ({
  protectedRoute: (handler, options) => {
    // Return a wrapper that simulates the authorization check
    return async (request, context) => {
      // Check if this endpoint requires ADMIN role
      if (options?.roles && options.roles.includes("ADMIN")) {
        // Simulate an OPERATOR user trying to access an ADMIN-only endpoint
        // In a real scenario, this would come from the session
        const userRole = request.mockUserRole || "OPERATOR";

        if (userRole !== "ADMIN") {
          // Return 403 Forbidden response matching the errorResponse format
          return {
            json: async () => ({
              error: `Forbidden - Requires one of: ${options.roles.join(", ")}`,
              details: null,
              timestamp: new Date().toISOString(),
            }),
          };
        }
      }

      // If authorized, call the handler
      return handler(request, context);
    };
  },
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

// Mock Prisma
jest.mock("@/lib/prisma", () => ({
  prisma: {
    expense: {
      findMany: jest.fn(),
    },
  },
}));

describe("Incentive Recipients API - Authorization", () => {
  let GET;

  beforeEach(async () => {
    jest.clearAllMocks();
    // Dynamically import the route handler after mocks are set up
    const routeModule = await import("../route.js");
    GET = routeModule.GET;
  });

  /**
   * Unit test for operator 403 error
   * Validates: Requirements 6.4
   *
   * Test that non-admin users (OPERATOR) receive 403 Forbidden response
   * when attempting to access the incentive recipients endpoint
   */
  it("should return 403 Forbidden when OPERATOR user attempts to access endpoint", async () => {
    // Create mock request from an OPERATOR user
    const mockRequest = {
      url: "http://localhost:3000/api/dashboard/incentive-recipients?period=month",
      method: "GET",
      mockUserRole: "OPERATOR", // Simulate OPERATOR role
    };

    // Call the API handler
    const response = await GET(mockRequest);
    const responseData = await response.json();

    // Verify the response contains a 403 error
    expect(responseData).toHaveProperty("error");
    expect(responseData.error).toContain("Forbidden");
    expect(responseData.error).toContain("ADMIN");

    // Verify the response has the standard error format
    expect(responseData).toHaveProperty("timestamp");
    expect(typeof responseData.timestamp).toBe("string");

    // Verify the timestamp is a valid ISO 8601 date string
    const timestamp = new Date(responseData.timestamp);
    expect(timestamp.toString()).not.toBe("Invalid Date");

    // Verify no success-related fields are present
    expect(responseData).not.toHaveProperty("success");
    expect(responseData).not.toHaveProperty("data");
    expect(responseData).not.toHaveProperty("message");

    // Verify the response has the expected error structure
    const expectedFields = ["error", "details", "timestamp"];
    const actualFields = Object.keys(responseData);

    expectedFields.forEach((field) => {
      expect(actualFields).toContain(field);
    });
  });

  /**
   * Additional test: Verify ADMIN users can access the endpoint
   */
  it("should allow ADMIN users to access the endpoint", async () => {
    // Mock Prisma to return empty array
    const { prisma } = await import("@/lib/prisma");
    prisma.expense.findMany.mockResolvedValue([]);

    // Create mock request from an ADMIN user
    const mockRequest = {
      url: "http://localhost:3000/api/dashboard/incentive-recipients?period=month",
      method: "GET",
      mockUserRole: "ADMIN", // Simulate ADMIN role
    };

    // Call the API handler
    const response = await GET(mockRequest);
    const responseData = await response.json();

    // Verify the response is successful (not a 403 error)
    expect(responseData).toHaveProperty("success");
    expect(responseData.success).toBe(true);
    expect(responseData).toHaveProperty("data");

    // Verify no error fields are present
    expect(responseData).not.toHaveProperty("error");
  });

  /**
   * Test with different periods to ensure authorization is consistent
   */
  it.each(["today", "month", "year"])(
    "should return 403 Forbidden for OPERATOR user regardless of period parameter (%s)",
    async (period) => {
      // Create mock request from an OPERATOR user
      const mockRequest = {
        url: `http://localhost:3000/api/dashboard/incentive-recipients?period=${period}`,
        method: "GET",
        mockUserRole: "OPERATOR",
      };

      // Call the API handler
      const response = await GET(mockRequest);
      const responseData = await response.json();

      // Verify the response contains a 403 error
      expect(responseData).toHaveProperty("error");
      expect(responseData.error).toContain("Forbidden");
      expect(responseData.error).toContain("ADMIN");

      // Verify no success-related fields are present
      expect(responseData).not.toHaveProperty("success");
      expect(responseData).not.toHaveProperty("data");
    }
  );
});
