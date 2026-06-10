import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import type { ButtonHTMLAttributes, KeyboardEvent, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { formatNumber } from "@/i18n/utils";
import { useDataTablePagination } from "./hooks/useDataTablePagination";

interface DataTablePaginationProps {
  page: number;
  pageSize: number;
  totalRows: number;
  onPageChange: (page: number) => void;
}

export function DataTablePagination({
  page,
  pageSize,
  totalRows,
  onPageChange,
}: DataTablePaginationProps) {
  const { t } = useTranslation();
  const { totalPages, hasPrev, hasNext, goToFirst, goToPrev, goToNext, goToLast, goToPage } =
    useDataTablePagination({ page, pageSize, totalRows, onPageChange });

  const handleInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const val = parseInt(e.currentTarget.value, 10);
      if (!isNaN(val)) goToPage(val);
    }
  };

  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const val = parseInt(e.currentTarget.value, 10);
    if (!isNaN(val)) goToPage(val);
  };

  return (
    <div className="flex items-center justify-end gap-4 py-1">
      <span className="text-sm text-neutral-500">
        {t("common.rows", { count: totalRows, value: formatNumber(totalRows) })}
      </span>

      <div className="flex items-center gap-1">
        <PaginationButton onClick={goToFirst} disabled={!hasPrev} aria-label={t("common.firstPage")}>
          <ChevronsLeft size={15} />
        </PaginationButton>
        <PaginationButton onClick={goToPrev} disabled={!hasPrev} aria-label={t("common.previousPage")}>
          <ChevronLeft size={15} />
        </PaginationButton>

        <div className="flex items-center gap-1.5 px-1 text-sm text-neutral-600">
          <input
            type="number"
            min={1}
            max={totalPages}
            defaultValue={page}
            key={page}
            onKeyDown={handleInputKeyDown}
            onBlur={handleInputBlur}
            className="h-8 w-14 rounded border border-neutral-200 bg-white text-center text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
            aria-label={t("common.pageNumber")}
          />
          <span className="text-neutral-400">/</span>
          <span className="min-w-6 text-center">{totalPages}</span>
        </div>

        <PaginationButton onClick={goToNext} disabled={!hasNext} aria-label={t("common.nextPage")}>
          <ChevronRight size={15} />
        </PaginationButton>
        <PaginationButton onClick={goToLast} disabled={!hasNext} aria-label={t("common.lastPage")}>
          <ChevronsRight size={15} />
        </PaginationButton>
      </div>
    </div>
  );
}

interface PaginationButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

function PaginationButton({ children, className, ...props }: PaginationButtonProps) {
  return (
    <button
      type="button"
      className={[
        "flex h-8 w-8 items-center justify-center rounded border border-neutral-200 text-neutral-500 transition-colors",
        "hover:border-neutral-300 hover:bg-neutral-100 hover:text-neutral-900",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-1",
        "disabled:cursor-not-allowed disabled:opacity-40",
        className,
      ].filter(Boolean).join(" ")}
      {...props}
    >
      {children}
    </button>
  );
}
