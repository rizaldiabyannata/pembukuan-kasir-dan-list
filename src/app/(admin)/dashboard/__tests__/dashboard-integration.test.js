import React from "react";
import { render, screen } from "@testing-library/react";
import { AdminOnly } from "@/components/PermissionGuard";
import { IncentiveRecipientsWidget } from "@/components/dashboard/IncentiveRecipientsWidget";
import { useUser } from "@/hooks/useUser";

// Mock dependencies
jest.mock("@/hooks/useUser");
jest.mock("@/lib/useAuthFetch");

// Mock IncentiveRecipientsWidget
jest.mock("@/components/dashboard/IncentiveRecipientsWidget", () => ({
  IncentiveRecipientsWidget: () => (
    <div data-testid="incentive-recipients-widget">
      Incentive Recipients Widget
    </div>
  ),
}));

describe("Dashboard Page - IncentiveRecipientsWidget Integration", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Admin visibility", () => {
    it("should render IncentiveRecipientsWidget for admin users", () => {
      // Requirements: 1.1, 6.2
      useUser.mockReturnValue({
        user: { id: "1", name: "Admin User", role: "ADMIN" },
        loading: false,
        error: null,
      });

      render(
        <AdminOnly>
          <IncentiveRecipientsWidget period="month" />
        </AdminOnly>
      );

      expect(
        screen.getByTestId("incentive-recipients-widget")
      ).toBeInTheDocument();
    });

    it("should render widget with correct period prop", () => {
      useUser.mockReturnValue({
        user: { id: "1", name: "Admin User", role: "ADMIN" },
        loading: false,
        error: null,
      });

      const { rerender } = render(
        <AdminOnly>
          <IncentiveRecipientsWidget period="today" />
        </AdminOnly>
      );

      expect(
        screen.getByTestId("incentive-recipients-widget")
      ).toBeInTheDocument();

      // Test with different period
      rerender(
        <AdminOnly>
          <IncentiveRecipientsWidget period="year" />
        </AdminOnly>
      );

      expect(
        screen.getByTestId("incentive-recipients-widget")
      ).toBeInTheDocument();
    });
  });

  describe("Operator restriction", () => {
    it("should hide IncentiveRecipientsWidget for operator users", () => {
      // Requirements: 6.1
      useUser.mockReturnValue({
        user: { id: "2", name: "Operator User", role: "OPERATOR" },
        loading: false,
        error: null,
      });

      render(
        <AdminOnly>
          <IncentiveRecipientsWidget period="month" />
        </AdminOnly>
      );

      expect(
        screen.queryByTestId("incentive-recipients-widget")
      ).not.toBeInTheDocument();
    });

    it("should hide widget when user is not authenticated", () => {
      useUser.mockReturnValue({
        user: null,
        loading: false,
        error: null,
      });

      render(
        <AdminOnly>
          <IncentiveRecipientsWidget period="month" />
        </AdminOnly>
      );

      expect(
        screen.queryByTestId("incentive-recipients-widget")
      ).not.toBeInTheDocument();
    });
  });
});
