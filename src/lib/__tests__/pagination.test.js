/**
 * Unit Tests for Pagination Component
 * Tests the pagination component functionality including page navigation and display
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Pagination } from "../../components/ui/pagination";

// Mock UI components
jest.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    onClick,
    disabled,
    variant,
    size,
    className,
    ...props
  }) => (
    <button
      data-testid={`button-${variant || "outline"}`}
      onClick={onClick}
      disabled={disabled}
      className={className}
      {...props}
    >
      {children}
    </button>
  ),
}));

// Mock lucide-react icons
jest.mock("lucide-react", () => ({
  ChevronLeft: () => <span data-testid="chevron-left">←</span>,
  ChevronRight: () => <span data-testid="chevron-right">→</span>,
  MoreHorizontal: () => <span data-testid="more-horizontal">⋯</span>,
  Loader2: () => <span data-testid="loader">⟳</span>,
}));

// Mock Spinner component
jest.mock("@/components/ui/spinner", () => ({
  Spinner: ({ size, className }) => (
    <span data-testid="spinner" className={className}>
      ⟳
    </span>
  ),
}));

// Mock utils
jest.mock("@/lib/utils", () => ({
  cn: (...classes) => classes.filter(Boolean).join(" "),
}));

describe("Pagination Component", () => {
  const mockOnPageChange = jest.fn();

  beforeEach(() => {
    mockOnPageChange.mockClear();
  });

  describe("Basic Rendering", () => {
    it("should not render when totalPages is 1 or less", () => {
      const { container } = render(
        <Pagination
          currentPage={1}
          totalPages={1}
          onPageChange={mockOnPageChange}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it("should render pagination when totalPages > 1", () => {
      render(
        <Pagination
          currentPage={1}
          totalPages={5}
          onPageChange={mockOnPageChange}
        />
      );

      expect(screen.getByText("Halaman 1 dari 5")).toBeInTheDocument();
      expect(screen.getByTestId("chevron-left")).toBeInTheDocument();
      expect(screen.getByTestId("chevron-right")).toBeInTheDocument();
    });

    it("should hide info when showInfo is false", () => {
      render(
        <Pagination
          currentPage={1}
          totalPages={5}
          onPageChange={mockOnPageChange}
          showInfo={false}
        />
      );

      expect(screen.queryByText("Halaman 1 dari 5")).not.toBeInTheDocument();
    });
  });

  describe("Page Number Generation", () => {
    it("should show all pages when totalPages <= 7", () => {
      render(
        <Pagination
          currentPage={3}
          totalPages={5}
          onPageChange={mockOnPageChange}
        />
      );

      expect(screen.getByText("1")).toBeInTheDocument();
      expect(screen.getByText("2")).toBeInTheDocument();
      expect(screen.getByText("3")).toBeInTheDocument();
      expect(screen.getByText("4")).toBeInTheDocument();
      expect(screen.getByText("5")).toBeInTheDocument();
    });

    it("should show ellipsis for large page ranges", () => {
      render(
        <Pagination
          currentPage={5}
          totalPages={20}
          onPageChange={mockOnPageChange}
        />
      );

      expect(screen.getByText("1")).toBeInTheDocument();
      expect(screen.getAllByTestId("more-horizontal")).toHaveLength(2);
      expect(screen.getByText("20")).toBeInTheDocument();
    });

    it("should highlight current page", () => {
      render(
        <Pagination
          currentPage={3}
          totalPages={5}
          onPageChange={mockOnPageChange}
        />
      );

      const currentPageButton = screen.getByTestId("button-default");
      expect(currentPageButton).toHaveTextContent("3");
    });
  });

  describe("Navigation", () => {
    it("should call onPageChange when page number is clicked", () => {
      render(
        <Pagination
          currentPage={1}
          totalPages={5}
          onPageChange={mockOnPageChange}
        />
      );

      const page2Button = screen.getByText("2");
      fireEvent.click(page2Button);

      expect(mockOnPageChange).toHaveBeenCalledWith(2);
    });

    it("should call onPageChange when previous button is clicked", () => {
      render(
        <Pagination
          currentPage={3}
          totalPages={5}
          onPageChange={mockOnPageChange}
        />
      );

      const prevButton = screen.getByTestId("chevron-left").closest("button");
      fireEvent.click(prevButton);

      expect(mockOnPageChange).toHaveBeenCalledWith(2);
    });

    it("should call onPageChange when next button is clicked", () => {
      render(
        <Pagination
          currentPage={3}
          totalPages={5}
          onPageChange={mockOnPageChange}
        />
      );

      const nextButton = screen.getByTestId("chevron-right").closest("button");
      fireEvent.click(nextButton);

      expect(mockOnPageChange).toHaveBeenCalledWith(4);
    });
  });

  describe("Button States", () => {
    it("should disable previous button on first page", () => {
      render(
        <Pagination
          currentPage={1}
          totalPages={5}
          onPageChange={mockOnPageChange}
        />
      );

      const prevButton = screen.getByTestId("chevron-left").closest("button");
      expect(prevButton).toBeDisabled();
    });

    it("should disable next button on last page", () => {
      render(
        <Pagination
          currentPage={5}
          totalPages={5}
          onPageChange={mockOnPageChange}
        />
      );

      const nextButton = screen.getByTestId("chevron-right").closest("button");
      expect(nextButton).toBeDisabled();
    });

    it("should enable both buttons on middle pages", () => {
      render(
        <Pagination
          currentPage={3}
          totalPages={5}
          onPageChange={mockOnPageChange}
        />
      );

      const prevButton = screen.getByTestId("chevron-left").closest("button");
      const nextButton = screen.getByTestId("chevron-right").closest("button");

      expect(prevButton).not.toBeDisabled();
      expect(nextButton).not.toBeDisabled();
    });
  });

  describe("Edge Cases", () => {
    it("should handle currentPage = 1 correctly", () => {
      render(
        <Pagination
          currentPage={1}
          totalPages={10}
          onPageChange={mockOnPageChange}
        />
      );

      expect(screen.getByText("Halaman 1 dari 10")).toBeInTheDocument();
      expect(screen.getByText("1")).toBeInTheDocument();
      expect(screen.getByText("2")).toBeInTheDocument();
      expect(screen.getByText("3")).toBeInTheDocument();
    });

    it("should handle currentPage = totalPages correctly", () => {
      render(
        <Pagination
          currentPage={10}
          totalPages={10}
          onPageChange={mockOnPageChange}
        />
      );

      expect(screen.getByText("Halaman 10 dari 10")).toBeInTheDocument();
      expect(screen.getByText("8")).toBeInTheDocument();
      expect(screen.getByText("9")).toBeInTheDocument();
      expect(screen.getByText("10")).toBeInTheDocument();
    });

    it("should handle small totalPages correctly", () => {
      render(
        <Pagination
          currentPage={2}
          totalPages={4}
          onPageChange={mockOnPageChange}
        />
      );

      expect(screen.getByText("1")).toBeInTheDocument();
      expect(screen.getByText("2")).toBeInTheDocument();
      expect(screen.getByText("3")).toBeInTheDocument();
      expect(screen.getByText("4")).toBeInTheDocument();
      expect(screen.queryByTestId("more-horizontal")).not.toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have screen reader text for navigation buttons", () => {
      render(
        <Pagination
          currentPage={2}
          totalPages={5}
          onPageChange={mockOnPageChange}
        />
      );

      expect(screen.getByText("Halaman sebelumnya")).toBeInTheDocument();
      expect(screen.getByText("Halaman berikutnya")).toBeInTheDocument();
    });
  });

  describe("Custom ClassName", () => {
    it("should apply custom className", () => {
      const { container } = render(
        <Pagination
          currentPage={1}
          totalPages={5}
          onPageChange={mockOnPageChange}
          className="custom-pagination"
        />
      );

      expect(container.firstChild).toHaveClass("custom-pagination");
    });
  });
});
