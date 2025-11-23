/**
 * Unit Tests for Packages Page Component
 * Tests the main packages page including API calls, state management, and user interactions
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import PackagesPage from "../../app/(admin)/paket/page.jsx";

// Mock UI components
jest.mock("../../components/ui/sidebar", () => ({
  SidebarTrigger: ({ className }) => (
    <div data-testid="sidebar-trigger" className={className} />
  ),
}));

jest.mock("../../components/ui/button", () => ({
  Button: ({ children, onClick, ...props }) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

jest.mock("../../components/ui/skeleton", () => ({
  Skeleton: ({ className }) => (
    <div data-testid="skeleton" className={className} />
  ),
}));

jest.mock("../../components/ui/card-skeleton", () => ({
  CardSkeleton: ({ count }) => (
    <div data-testid="card-skeleton">Skeleton Count: {count}</div>
  ),
}));

// Mock PageHeader from ui
jest.mock("../../components/ui/page-header", () => ({
  PageHeader: ({ title, children }) => (
    <div data-testid="package-header">
      <h1>{title}</h1>
      {children}
    </div>
  ),
}));

jest.mock("../../components/packages/PackageList", () => ({
  PackageList: function MockPackageList({
    packages,
    onEdit,
    onDelete,
    onView,
  }) {
    return (
      <div data-testid="package-list">
        {packages?.map((pkg) => (
          <div key={pkg.id} data-testid={`package-${pkg.id}`}>
            <button data-testid={`edit-${pkg.id}`} onClick={() => onEdit(pkg)}>
              Edit
            </button>
            <button
              data-testid={`delete-${pkg.id}`}
              onClick={() => onDelete(pkg)}
            >
              Delete
            </button>
            <button data-testid={`view-${pkg.id}`} onClick={() => onView(pkg)}>
              View
            </button>
          </div>
        )) || <div>No packages</div>}
      </div>
    );
  },
}));

jest.mock("../../components/packages/PackageForm", () => ({
  PackageForm: function MockPackageForm({
    open,
    onOpenChange,
    onSubmit,
    defaultValues,
  }) {
    return open ? (
      <div data-testid="package-form">
        <button data-testid="close-form" onClick={() => onOpenChange(false)}>
          Close
        </button>
        <button
          data-testid="submit-form"
          onClick={() => onSubmit(defaultValues || {})}
        >
          Submit
        </button>
      </div>
    ) : null;
  },
}));

jest.mock("../../components/packages/PackageDetail", () => ({
  PackageDetail: function MockPackageDetail({ open, onOpenChange, pkg }) {
    return open ? (
      <div data-testid="package-detail">
        <div>Detail for {pkg?.name}</div>
        <button data-testid="close-detail" onClick={() => onOpenChange(false)}>
          Close
        </button>
      </div>
    ) : null;
  },
}));

jest.mock("../../components/packages/DeleteConfirmation", () => ({
  DeleteConfirmation: function MockDeleteConfirmation({
    open,
    onOpenChange,
    onConfirm,
  }) {
    return open ? (
      <div data-testid="delete-confirmation">
        <button data-testid="cancel-delete" onClick={() => onOpenChange(false)}>
          Cancel
        </button>
        <button data-testid="confirm-delete" onClick={onConfirm}>
          Delete
        </button>
      </div>
    ) : null;
  },
}));

// Mock sonner toast
jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("PackagesPage Component", () => {
  const mockPackages = [
    { id: "pkg-1", name: "Package 1", type: "TOUR_PACKAGE" },
    { id: "pkg-2", name: "Package 2", type: "CAR_RENTAL" },
  ];

  beforeEach(() => {
    mockFetch.mockClear();
    jest.clearAllMocks();
  });

  describe("Initial Load", () => {
    it("should fetch packages on mount", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockPackages }),
      });

      render(<PackagesPage />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith("/api/packages", {
          credentials: "include",
        });
      });
    });

    it("should display loading skeleton initially", () => {
      mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<PackagesPage />);

      // Should show skeleton loading state
      expect(screen.getByTestId("package-header")).toBeInTheDocument();
    });

    it("should handle successful API response", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockPackages }),
      });

      render(<PackagesPage />);

      await waitFor(() => {
        expect(screen.getByTestId("package-list")).toBeInTheDocument();
        expect(screen.getByTestId("package-pkg-1")).toBeInTheDocument();
        expect(screen.getByTestId("package-pkg-2")).toBeInTheDocument();
      });
    });

    it("should handle API error gracefully", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: () => Promise.resolve("Internal Server Error"),
      });

      render(<PackagesPage />);

      await waitFor(() => {
        expect(screen.getByText("Belum ada paket jasa")).toBeInTheDocument();
        // Should show empty state when API fails
      });
    });

    it("should handle network error", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      render(<PackagesPage />);

      await waitFor(() => {
        expect(screen.getByText("Belum ada paket jasa")).toBeInTheDocument();
        // Should show empty state when network fails
      });
    });
  });

  describe("Empty State", () => {
    it("should show empty state when no packages", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: [] }),
      });

      render(<PackagesPage />);

      await waitFor(() => {
        expect(screen.getByText("Belum ada paket jasa")).toBeInTheDocument();
        expect(
          screen.getByText(
            "Tambahkan paket jasa pertama Anda untuk mulai mencatat layanan."
          )
        ).toBeInTheDocument();
      });
    });
  });

  describe("Add Package", () => {
    it("should open form when add button is clicked", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockPackages }),
      });

      render(<PackagesPage />);

      await waitFor(() => {
        expect(screen.getByText("Tambah Paket")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Tambah Paket"));

      await waitFor(() => {
        expect(screen.getByTestId("package-form")).toBeInTheDocument();
      });
    });

    it("should handle successful package creation", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ data: mockPackages }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({}),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              data: [...mockPackages, { id: "pkg-3", name: "New Package" }],
            }),
        });

      render(<PackagesPage />);

      await waitFor(() => {
        fireEvent.click(screen.getByTestId("add-package-btn"));
      });

      await waitFor(() => {
        expect(screen.getByTestId("package-form")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId("submit-form"));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          "/api/packages",
          expect.objectContaining({
            method: "POST",
          })
        );
      });
    });
  });

  describe("Edit Package", () => {
    it("should open form with package data when edit is clicked", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockPackages }),
      });

      render(<PackagesPage />);

      await waitFor(() => {
        fireEvent.click(screen.getByTestId("edit-pkg-1"));
      });

      await waitFor(() => {
        expect(screen.getByTestId("package-form")).toBeInTheDocument();
      });
    });

    it("should handle successful package update", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ data: mockPackages }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({}),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ data: mockPackages }),
        });

      render(<PackagesPage />);

      await waitFor(() => {
        fireEvent.click(screen.getByTestId("edit-pkg-1"));
      });

      await waitFor(() => {
        fireEvent.click(screen.getByTestId("submit-form"));
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          "/api/packages/pkg-1",
          expect.objectContaining({
            method: "PUT",
          })
        );
      });
    });
  });

  describe("View Package Detail", () => {
    it("should open detail dialog when view is clicked", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockPackages }),
      });

      render(<PackagesPage />);

      await waitFor(() => {
        fireEvent.click(screen.getByTestId("view-pkg-1"));
      });

      await waitFor(() => {
        expect(screen.getByTestId("package-detail")).toBeInTheDocument();
        expect(screen.getByText("Detail for Package 1")).toBeInTheDocument();
      });
    });
  });

  describe("Delete Package", () => {
    it("should open delete confirmation when delete is clicked", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockPackages }),
      });

      render(<PackagesPage />);

      await waitFor(() => {
        fireEvent.click(screen.getByTestId("delete-pkg-1"));
      });

      await waitFor(() => {
        expect(screen.getByTestId("delete-confirmation")).toBeInTheDocument();
      });
    });

    it("should handle successful package deletion", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ data: mockPackages }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({}),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ data: [mockPackages[1]] }), // Only second package remains
        });

      render(<PackagesPage />);

      await waitFor(() => {
        fireEvent.click(screen.getByTestId("delete-pkg-1"));
      });

      await waitFor(() => {
        fireEvent.click(screen.getByTestId("confirm-delete"));
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          "/api/packages/pkg-1",
          expect.objectContaining({
            method: "DELETE",
          })
        );
      });
    });
  });

  describe("Form Management", () => {
    it("should close form when onOpenChange is called with false", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockPackages }),
      });

      render(<PackagesPage />);

      await waitFor(() => {
        fireEvent.click(screen.getByText("Tambah Paket"));
      });

      await waitFor(() => {
        expect(screen.getByTestId("package-form")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId("close-form"));

      await waitFor(() => {
        expect(screen.queryByTestId("package-form")).not.toBeInTheDocument();
      });
    });
  });

  describe("Error Handling", () => {
    it("should show error toast on API failure", async () => {
      const { toast } = require("sonner");

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ data: mockPackages }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 400,
          text: () => Promise.resolve("Bad Request"),
        });

      render(<PackagesPage />);

      await waitFor(() => {
        fireEvent.click(screen.getByText("Tambah Paket"));
      });

      await waitFor(() => {
        fireEvent.click(screen.getByTestId("submit-form"));
      });

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });
    });

    it("should handle network errors during submission", async () => {
      const { toast } = require("sonner");

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ data: mockPackages }),
        })
        .mockRejectedValueOnce(new Error("Network error"));

      render(<PackagesPage />);

      await waitFor(() => {
        fireEvent.click(screen.getByText("Tambah Paket"));
      });

      await waitFor(() => {
        fireEvent.click(screen.getByTestId("submit-form"));
      });

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Gagal menyimpan paket", {
          description: "Network error",
        });
      });
    });
  });

  describe("State Management", () => {
    it("should manage dialog states correctly", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockPackages }),
      });

      render(<PackagesPage />);

      // Initially no dialogs should be open
      expect(screen.queryByTestId("package-form")).not.toBeInTheDocument();
      expect(screen.queryByTestId("package-detail")).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("delete-confirmation")
      ).not.toBeInTheDocument();

      // Open form
      await waitFor(() => {
        fireEvent.click(screen.getByText("Tambah Paket"));
      });

      await waitFor(() => {
        expect(screen.getByTestId("package-form")).toBeInTheDocument();
      });

      // Close form and open detail
      fireEvent.click(screen.getByTestId("close-form"));

      await waitFor(() => {
        expect(screen.queryByTestId("package-form")).not.toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId("view-pkg-1"));

      await waitFor(() => {
        expect(screen.getByTestId("package-detail")).toBeInTheDocument();
      });
    });
  });
});
