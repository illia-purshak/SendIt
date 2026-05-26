interface UseDataTablePaginationProps {
  page: number
  pageSize: number
  totalRows: number
  onPageChange: (page: number) => void
}

export function useDataTablePagination({
  page,
  pageSize,
  totalRows,
  onPageChange,
}: UseDataTablePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize))
  const hasPrev = page > 1
  const hasNext = page < totalPages

  const goToFirst = () => onPageChange(1)
  const goToPrev = () => { if (hasPrev) onPageChange(page - 1) }
  const goToNext = () => { if (hasNext) onPageChange(page + 1) }
  const goToLast = () => onPageChange(totalPages)
  const goToPage = (p: number) => onPageChange(Math.max(1, Math.min(totalPages, p)))

  return { page, totalPages, totalRows, hasPrev, hasNext, goToFirst, goToPrev, goToNext, goToLast, goToPage }
}
