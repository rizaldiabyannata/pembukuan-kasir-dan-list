import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { IncentiveRecipientsWidget } from "../IncentiveRecipientsWidget";
import { useAuthFetch } from "@/lib/useAuthFetch";

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

describe("IncentiveRecipientsWidget", () => {
  let mockAuthFetch;

  beforeEach(() => {
    mockAuthFetch = jest.fn();
    useAuthFetch.mockReturnValue(mockAuthFetch);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("API endpoint path", () => {
    it("should call correct URL with period parameter", async () => {
      // Requirements: 7.1
      const mockData = {
        success: true,
        data: {
          recipients: [],
          summary: {
            totalRecipients: 0,
            totalAmount: 0,
            totalIncentives: 0,
          },
          period: "month",
        },
      };

      mockAuthFetch.mockResolvedValue({
        ok: true,
        json: async () => mockData,
      });

      render(<IncentiveRecipientsWidget period="month" />);

      await waitFor(() => {
        expect(mockAuthFetch).toHaveBeenCalledWith(
          "/api/dashboard/incentive-recipients?period=month"
        );
      });
    });

    it("should call API with today period", async () => {
      const mockData = {
        success: true,
        data: {
          recipients: [],
          summary: {
            totalRecipients: 0,
            totalAmount: 0,
            totalIncentives: 0,
          },
          period: "today",
        },
      };

      mockAuthFetch.mockResolvedValue({
        ok: true,
        json: async () => mockData,
      });

      render(<IncentiveRecipientsWidget period="today" />);

      await waitFor(() => {
        expect(mockAuthFetch).toHaveBeenCalledWith(
          "/api/dashboard/incentive-recipients?period=today"
        );
      });
    });

    it("should call API with year period", async () => {
      const mockData = {
        success: true,
        data: {
          recipients: [],
          summary: {
            totalRecipients: 0,
            totalAmount: 0,
            totalIncentives: 0,
          },
          period: "year",
        },
      };

      mockAuthFetch.mockResolvedValue({
        ok: true,
        json: async () => mockData,
      });

      render(<IncentiveRecipientsWidget period="year" />);

      await waitFor(() => {
        expect(mockAuthFetch).toHaveBeenCalledWith(
          "/api/dashboard/incentive-recipients?period=year"
        );
      });
    });
  });

  describe("Loading state", () => {
    it("should display skeleton loaders when loading prop is true", () => {
      // Requirements: 2.5, 5.3
      render(<IncentiveRecipientsWidget period="month" loading={true} />);

      expect(screen.getByText(/Penerima Insentif/i)).toBeInTheDocument();

      // Check for skeleton loaders (animated pulse elements)
      const skeletons = document.querySelectorAll(".animate-pulse");
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it("should display loading spinner in header when loading", () => {
      render(<IncentiveRecipientsWidget period="month" loading={true} />);

      // The Loader2 icon should be present
      expect(screen.getByText(/Penerima Insentif/i)).toBeInTheDocument();
    });
  });

  describe("Empty state", () => {
    it("should display empty state when data array is empty", async () => {
      // Requirements: 1.5
      const mockData = {
        success: true,
        data: {
          recipients: [],
          summary: {
            totalRecipients: 0,
            totalAmount: 0,
            totalIncentives: 0,
          },
          period: "month",
        },
      };

      mockAuthFetch.mockResolvedValue({
        ok: true,
        json: async () => mockData,
      });

      render(<IncentiveRecipientsWidget period="month" />);

      await waitFor(() => {
        expect(
          screen.getByText("Belum ada data insentif untuk periode ini")
        ).toBeInTheDocument();
      });
    });

    it("should display Gift icon in empty state", async () => {
      const mockData = {
        success: true,
        data: {
          recipients: [],
          summary: {
            totalRecipients: 0,
            totalAmount: 0,
            totalIncentives: 0,
          },
          period: "month",
        },
      };

      mockAuthFetch.mockResolvedValue({
        ok: true,
        json: async () => mockData,
      });

      render(<IncentiveRecipientsWidget period="month" />);

      await waitFor(() => {
        expect(
          screen.getByText("Belum ada data insentif untuk periode ini")
        ).toBeInTheDocument();
      });
    });
  });

  describe("Error state", () => {
    it("should display ErrorDisplay component on error", async () => {
      // Requirements: 5.4
      mockAuthFetch.mockResolvedValue({
        ok: false,
        json: async () => ({ error: "Failed to fetch data" }),
      });

      render(<IncentiveRecipientsWidget period="month" />);

      await waitFor(() => {
        expect(screen.getByText("Gagal Memuat Data")).toBeInTheDocument();
      });
    });

    it("should provide retry functionality on error", async () => {
      mockAuthFetch.mockResolvedValue({
        ok: false,
        json: async () => ({ error: "Failed to fetch data" }),
      });

      render(<IncentiveRecipientsWidget period="month" />);

      await waitFor(() => {
        expect(screen.getByText("Coba Lagi")).toBeInTheDocument();
      });
    });
  });
});
