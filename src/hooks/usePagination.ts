
import { useCallback, useState } from "react";

interface UsePaginationProps {
  totalItems: number;
  initialPageSize?: number;
  initialPage?: number;
}

export const usePagination = ({
  totalItems,
  initialPageSize = 25,
  initialPage = 1
}: UsePaginationProps) => {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;

  const handlePageSizeChange = useCallback((value: string) => {
    const newSize = parseInt(value);
    setPageSize(newSize);
    setCurrentPage(1); // Reset to first page when changing page size
  }, []);

  const handlePreviousPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  }, []);

  const handleNextPage = useCallback(() => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  }, [totalPages]);

  return {
    currentPage,
    pageSize,
    totalPages,
    startIndex,
    endIndex,
    handlePageSizeChange,
    handlePreviousPage,
    handleNextPage,
    setCurrentPage
  };
};
