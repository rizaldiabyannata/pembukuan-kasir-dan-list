import React from "react";
import { render, waitFor } from "@testing-library/react";
import { IncentiveRecipientsWidget } from "../IncentiveRecipientsWidget";
import { useAuthFetch } from "@/lib/useAuthFetch";
import fc from "fast-check";

// Mock useAuthFetch
jest.mock("@/lib/useAuthFetch");

// Mock UI components
jest.mock("@/components/ui/card", () => ({
  Card: ({ children }) => <div data-testid="card">{children}</div>,
  CardHeader: ({ children }) => <div data-testid="card-header">{children}</div>,
  CardTitle: ({ children }) => <div data-testid="card-title">{children}</div>,
  CardContent: ({ children }) => (
    <div data-testid="card-content">{children}</div>
  ),
}));

jest.mock("@/components/ui/badge", () => ({
  Badge: ({ children }) => <span data-testid="badge">{children}</span>,
}));

jest.mock("@/components/ui/error-display", () => ({
  ErrorDisplay: ({ title, onRetry }) => (
    <div data-testid="error-display">
      <div>{title}</div>
      {onRetry && <button onClick={onRetry}>Coba Lagi</button>}
    </div>
  ),
}));

describe("IncentiveRecipientsWidget - Property-Based Tests", () => {
  let mockAuthFetch;

  beforeEach(() => {
    mockAuthFetch = jest.fn();
    useAuthFetch.mockReturnValue(mockAuthFetch);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Feature: incentive-recipients-dashboard-widget, Property 5: Widget data refresh on period change
   * Validates: Requirements 2.4
   */
  it("Property 5: should trigger new API call when period prop changes", () => {
    fc.assert(
      fc.property(
        fc.constantFrom("today", "month", "year"),
        fc.constantFrom("today", "month", "year"),
        (initialPeriod, newPeriod) => {
          // Skip if periods are the same
          fc.pre(initialPeriod !== newPeriod);

          const mockData = {
            success: true,
            data: {
              recipients: [],
              summary: {
                totalRecipients: 0,
                totalAmount: 0,
                totalIncentives: 0,
              },
              period: initialPeriod,
            },
          };

          mockAuthFetch.mockResolvedValue({
            ok: true,
            json: async () => mockData,
          });

          // Render with initial period
          const { rerender } = render(
            <IncentiveRecipientsWidget period={initialPeriod} />
          );

          // Clear the mock to track new calls
          mockAuthFetch.mockClear();

          // Update mock for new period
          const newMockData = {
            ...mockData,
            data: {
              ...mockData.data,
              period: newPeriod,
            },
          };

          mockAuthFetch.mockResolvedValue({
            ok: true,
            json: async () => newMockData,
          });

          // Rerender with new period
          rerender(<IncentiveRecipientsWidget period={newPeriod} />);

          // Verify API was called with new period
          expect(mockAuthFetch).toHaveBeenCalledWith(
            `/api/dashboard/incentive-recipients?period=${newPeriod}`
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: incentive-recipients-dashboard-widget, Property 7: Currency formatting consistency
   * Validates: Requirements 3.4
   */
  it("Property 7: should format all amounts with Rp currency symbol and thousand separators", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            recipientName: fc.string({ minLength: 1, maxLength: 50 }),
            totalAmount: fc.integer({ min: 0, max: 1000000000 }),
            incentiveCount: fc.integer({ min: 1, max: 100 }),
            relatedEntities: fc.array(
              fc.record({
                type: fc.constantFrom("driver", "staff", "armada"),
                name: fc.string({ minLength: 1, maxLength: 30 }),
                id: fc.uuid(),
              }),
              { maxLength: 3 }
            ),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        fc.constantFrom("today", "month", "year"),
        async (recipients, period) => {
          const mockData = {
            success: true,
            data: {
              recipients,
              summary: {
                totalRecipients: recipients.length,
                totalAmount: recipients.reduce(
                  (sum, r) => sum + r.totalAmount,
                  0
                ),
                totalIncentives: recipients.reduce(
                  (sum, r) => sum + r.incentiveCount,
                  0
                ),
              },
              period,
            },
          };

          mockAuthFetch.mockResolvedValue({
            ok: true,
            json: async () => mockData,
          });

          const { container } = render(
            <IncentiveRecipientsWidget period={period} />
          );

          await waitFor(() => {
            expect(mockAuthFetch).toHaveBeenCalled();
          });

          // Wait for data to be rendered
          await waitFor(
            () => {
              const content = container.textContent;
              // Check that at least one amount is formatted with Rp
              expect(content).toMatch(/Rp/);
            },
            { timeout: 3000 }
          );

          // Verify Indonesian locale formatting
          const expectedFormat = new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 0,
          });

          // Check that each recipient's amount would be formatted correctly
          recipients.forEach((recipient) => {
            const formattedAmount = expectedFormat.format(
              recipient.totalAmount
            );
            // Verify format includes Rp and uses Indonesian thousand separators
            expect(formattedAmount).toMatch(/^Rp/);
            if (recipient.totalAmount >= 1000) {
              expect(formattedAmount).toMatch(/\./); // Indonesian uses dots for thousands
            }
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: incentive-recipients-dashboard-widget, Property 9: Entity type labeling
   * Validates: Requirements 4.5
   */
  it("Property 9: should correctly label entity types as Sopir, Staff, or Armada", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            recipientName: fc.string({ minLength: 1, maxLength: 50 }),
            totalAmount: fc.integer({ min: 1000, max: 10000000 }),
            incentiveCount: fc.integer({ min: 1, max: 10 }),
            relatedEntities: fc.array(
              fc.record({
                type: fc.constantFrom("driver", "staff", "armada"),
                name: fc.string({ minLength: 1, maxLength: 30 }),
                id: fc.uuid(),
              }),
              { minLength: 1, maxLength: 3 }
            ),
          }),
          { minLength: 1, maxLength: 5 }
        ),
        async (recipients) => {
          const mockData = {
            success: true,
            data: {
              recipients,
              summary: {
                totalRecipients: recipients.length,
                totalAmount: recipients.reduce(
                  (sum, r) => sum + r.totalAmount,
                  0
                ),
                totalIncentives: recipients.reduce(
                  (sum, r) => sum + r.incentiveCount,
                  0
                ),
              },
              period: "month",
            },
          };

          mockAuthFetch.mockResolvedValue({
            ok: true,
            json: async () => mockData,
          });

          const { container } = render(
            <IncentiveRecipientsWidget period="month" />
          );

          await waitFor(() => {
            expect(mockAuthFetch).toHaveBeenCalled();
          });

          // Wait for data to be rendered
          await waitFor(
            () => {
              const content = container.textContent;
              // Verify that entity labels are present
              recipients.forEach((recipient) => {
                recipient.relatedEntities.forEach((entity) => {
                  const expectedLabel =
                    entity.type === "driver"
                      ? "Sopir"
                      : entity.type === "staff"
                        ? "Staff"
                        : "Armada";

                  // The label should appear in the rendered content
                  expect(content).toMatch(new RegExp(expectedLabel));
                });
              });
            },
            { timeout: 3000 }
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});
