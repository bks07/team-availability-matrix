export interface PaginationBarProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

export default function PaginationBar({
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
}: PaginationBarProps): JSX.Element {
  return (
    <nav className="pagination" aria-label="Pagination">
      <button
        type="button"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(1)}
        aria-label="First page"
      >
        «
      </button>
      <button
        type="button"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
        aria-label="Previous page"
      >
        ‹
      </button>
      <span className="pagination__info">
        Page {currentPage} of {totalPages} ({totalItems} {totalItems === 1 ? 'item' : 'items'})
      </span>
      <button
        type="button"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        aria-label="Next page"
      >
        ›
      </button>
      <button
        type="button"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(totalPages)}
        aria-label="Last page"
      >
        »
      </button>
    </nav>
  );
}
