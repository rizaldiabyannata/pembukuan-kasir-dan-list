import React from "react";
import { render, screen } from "@testing-library/react";
import { LoadingButton } from "../loading-button";
import { TableSkeleton } from "../table-skeleton";
import { CardSkeleton } from "../card-skeleton";

describe("Loading Components", () => {
  describe("LoadingButton", () => {
    it("renders children when not loading", () => {
      render(<LoadingButton isLoading={false}>Submit</LoadingButton>);
      expect(screen.getByRole("button")).toHaveTextContent("Submit");
    });

    it("shows loading text when loading", () => {
      render(
        <LoadingButton isLoading={true} loadingText="Menyimpan...">
          Submit
        </LoadingButton>
      );
      expect(screen.getByRole("button")).toHaveTextContent("Menyimpan...");
    });

    it("is disabled when loading", () => {
      render(<LoadingButton isLoading={true}>Submit</LoadingButton>);
      expect(screen.getByRole("button")).toBeDisabled();
    });

    it("has aria-busy attribute when loading", () => {
      render(<LoadingButton isLoading={true}>Submit</LoadingButton>);
      expect(screen.getByRole("button")).toHaveAttribute("aria-busy", "true");
    });
  });

  describe("TableSkeleton", () => {
    it("renders specified number of rows", () => {
      const { container } = render(<TableSkeleton rows={3} columns={4} />);
      const rows = container.querySelectorAll('[class*="flex items-center"]');
      // 3 body rows + 1 header row = 4 total
      expect(rows.length).toBe(4);
    });

    it("renders without header when showHeader is false", () => {
      const { container } = render(
        <TableSkeleton rows={3} columns={4} showHeader={false} />
      );
      const rows = container.querySelectorAll('[class*="flex items-center"]');
      // Only 3 body rows, no header
      expect(rows.length).toBe(3);
    });

    it("has accessibility attributes", () => {
      render(<TableSkeleton rows={3} columns={4} />);
      const skeleton = screen.getByRole("status");
      expect(skeleton).toHaveAttribute("aria-label", "Memuat data tabel...");
      expect(skeleton).toHaveAttribute("aria-busy", "true");
    });
  });

  describe("CardSkeleton", () => {
    it("renders specified number of cards", () => {
      const { container } = render(<CardSkeleton count={4} />);
      const cards = container.querySelectorAll('[class*="rounded-lg border"]');
      expect(cards.length).toBe(4);
    });

    it("renders compact variant", () => {
      const { container } = render(
        <CardSkeleton count={2} variant="compact" />
      );
      const cards = container.querySelectorAll('[class*="rounded-lg border"]');
      expect(cards.length).toBe(2);
    });

    it("renders detailed variant", () => {
      const { container } = render(
        <CardSkeleton count={2} variant="detailed" />
      );
      const cards = container.querySelectorAll('[class*="rounded-lg border"]');
      expect(cards.length).toBe(2);
    });

    it("has accessibility attributes", () => {
      render(<CardSkeleton count={3} />);
      const skeleton = screen.getByRole("status");
      expect(skeleton).toHaveAttribute("aria-label", "Memuat data kartu...");
      expect(skeleton).toHaveAttribute("aria-busy", "true");
    });
  });
});
