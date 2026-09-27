'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  itemLabel?: string;
  className?: string;
}

export function Pagination({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  itemLabel = 'items',
  className = '',
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  const fromIndex = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const toIndex = Math.min(safePage * pageSize, totalItems);

  // Generate page numbers with ellipses
  const getVisiblePages = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | string)[] = [];
    pages.push(1);

    const start = Math.max(2, safePage - 1);
    const end = Math.min(totalPages - 1, safePage + 1);

    if (start > 2) {
      pages.push('...');
    }
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    if (end < totalPages - 1) {
      pages.push('...');
    }
    pages.push(totalPages);
    return pages;
  };

  const visiblePages = getVisiblePages();

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-[#faf9f8] border-t border-[#edebe9] text-xs text-[#605e5c] select-none rounded-b-[4px] ${className}`}
    >
      {/* Left: Size picker & range info */}
      <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
        {onPageSizeChange && (
          <div className="flex items-center gap-1.5">
            <span className="text-[#8a8886]">Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                onPageSizeChange(Number(e.target.value));
                onPageChange(1);
              }}
              className="bg-white border border-[#d2d0ce] rounded-[4px] px-2 py-1 text-xs text-[#201f1e] font-medium focus:bg-white focus:outline-none focus:border-[#0078d4] shadow-2xs cursor-pointer"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="text-[11px] text-[#605e5c]">
          Showing <strong className="text-[#201f1e] font-semibold">{fromIndex}</strong>–
          <strong className="text-[#201f1e] font-semibold">{toIndex}</strong> of{' '}
          <strong className="text-[#201f1e] font-semibold">{totalItems}</strong> {itemLabel}
        </div>
      </div>

      {/* Right: Page Navigation */}
      <div className="flex items-center gap-1">
        {/* First Page */}
        <button
          onClick={() => onPageChange(1)}
          disabled={safePage <= 1}
          title="First Page"
          className="p-1.5 rounded-[4px] border border-transparent hover:border-[#edebe9] hover:bg-white text-[#605e5c] disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
        >
          <ChevronsLeft className="h-3.5 w-3.5" />
        </button>

        {/* Previous Page */}
        <button
          onClick={() => onPageChange(safePage - 1)}
          disabled={safePage <= 1}
          className="px-2 py-1 rounded-[4px] border border-[#edebe9] bg-white hover:bg-[#f3f2f1] text-[#201f1e] font-medium text-xs disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1 shadow-2xs transition cursor-pointer"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Prev</span>
        </button>

        {/* Page Number Buttons */}
        <div className="flex items-center gap-1 mx-1">
          {visiblePages.map((p, idx) => {
            if (p === '...') {
              return (
                <span key={`ellipsis-${idx}`} className="px-1 text-[#8a8886]">
                  …
                </span>
              );
            }
            const pageNum = p as number;
            const isActive = pageNum === safePage;
            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={`min-w-7 h-7 px-1.5 rounded-[4px] text-xs font-semibold transition cursor-pointer ${
                  isActive
                    ? 'bg-[#0078d4] text-white shadow-2xs'
                    : 'border border-transparent hover:border-[#edebe9] hover:bg-white text-[#605e5c]'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        {/* Next Page */}
        <button
          onClick={() => onPageChange(safePage + 1)}
          disabled={safePage >= totalPages}
          className="px-2 py-1 rounded-[4px] border border-[#edebe9] bg-white hover:bg-[#f3f2f1] text-[#201f1e] font-medium text-xs disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1 shadow-2xs transition cursor-pointer"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </button>

        {/* Last Page */}
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={safePage >= totalPages}
          title="Last Page"
          className="p-1.5 rounded-[4px] border border-transparent hover:border-[#edebe9] hover:bg-white text-[#605e5c] disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
        >
          <ChevronsRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
