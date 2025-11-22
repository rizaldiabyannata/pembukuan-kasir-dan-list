"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  showInfo = true,
  className,
  isLoading = false,
}) {
  const [isChangingPage, setIsChangingPage] = useState(false);
  const generatePageNumbers = () => {
    const pages = [];
    const delta = 2; // Jumlah halaman di sekitar halaman aktif

    // Selalu tampilkan halaman pertama
    if (1 < currentPage - delta) {
      pages.push(1);
      if (2 < currentPage - delta) {
        pages.push("...");
      }
    }

    // Tampilkan halaman di sekitar halaman aktif
    for (
      let i = Math.max(1, currentPage - delta);
      i <= Math.min(totalPages, currentPage + delta);
      i++
    ) {
      pages.push(i);
    }

    // Selalu tampilkan halaman terakhir
    if (totalPages > currentPage + delta) {
      if (totalPages - 1 > currentPage + delta) {
        pages.push("...");
      }
      pages.push(totalPages);
    }

    return pages;
  };

  const pageNumbers = generatePageNumbers();

  // Handle page change with loading state
  const handlePageChange = async (page) => {
    // Prevent multiple simultaneous page changes
    if (isChangingPage || isLoading) {
      return;
    }

    // Don't change if already on the page
    if (page === currentPage) {
      return;
    }

    setIsChangingPage(true);
    try {
      await onPageChange(page);
    } finally {
      // Reset loading state after a short delay to ensure smooth transition
      setTimeout(() => {
        setIsChangingPage(false);
      }, 100);
    }
  };

  // Determine if pagination is in loading state
  const isPaginationLoading = isLoading || isChangingPage;

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div
      className={cn("flex items-center justify-between", className)}
      aria-busy={isPaginationLoading}
      aria-live="polite"
    >
      {showInfo && (
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          <span>
            Halaman {currentPage} dari {totalPages}
          </span>
          {isPaginationLoading && (
            <Spinner size="sm" className="text-muted-foreground" />
          )}
        </div>
      )}

      <div className="flex items-center space-x-2">
        {/* Previous Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage <= 1 || isPaginationLoading}
          className="h-8 w-8 p-0"
          aria-label="Halaman sebelumnya"
        >
          {isPaginationLoading && currentPage > 1 ? (
            <Spinner size="sm" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
          <span className="sr-only">Halaman sebelumnya</span>
        </Button>

        {/* Page Numbers */}
        <div className="flex items-center space-x-1">
          {pageNumbers.map((page, index) => (
            <React.Fragment key={index}>
              {page === "..." ? (
                <div className="flex h-8 w-8 items-center justify-center">
                  <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                </div>
              ) : (
                <Button
                  variant={page === currentPage ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(page)}
                  disabled={isPaginationLoading}
                  className="h-8 w-8 p-0"
                  aria-label={`Halaman ${page}`}
                  aria-current={page === currentPage ? "page" : undefined}
                >
                  {isPaginationLoading && page === currentPage ? (
                    <Spinner size="sm" />
                  ) : (
                    page
                  )}
                </Button>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Next Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage >= totalPages || isPaginationLoading}
          className="h-8 w-8 p-0"
          aria-label="Halaman berikutnya"
        >
          {isPaginationLoading && currentPage < totalPages ? (
            <Spinner size="sm" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
          <span className="sr-only">Halaman berikutnya</span>
        </Button>
      </div>
    </div>
  );
}

export default Pagination;
