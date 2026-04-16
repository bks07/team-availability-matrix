import { useEffect, useMemo, useRef, useState } from 'react';
import type { InvitationResponse } from '../../lib/api.models';
import { teamService } from '../../services/team.service';
import PaginationBar from '../../components/PaginationBar';

const PAGE_SIZES = [10, 25, 50, 100] as const;

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
}

function formatStatus(value: string): string {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return value;
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

type StatusFilter = 'all' | 'accepted' | 'rejected';

export default function InvitationResponsesTab(): JSX.Element {
  const [responses, setResponses] = useState<InvitationResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const searchTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);

  const loadData = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const data = await teamService.getInvitationResponses();
      setResponses(data);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load invitation responses.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 300);
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);

  const processedData = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();

    return responses.filter((response) => {
      const matchesSearch = !query
        || response.inviteeName.toLowerCase().includes(query)
        || response.teamName.toLowerCase().includes(query);
      const normalizedStatus = response.status.toLowerCase();
      const matchesStatus = statusFilter === 'all' || normalizedStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [responses, debouncedSearch, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(processedData.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedData = processedData.slice((safePage - 1) * pageSize, safePage * pageSize);

  const resetFilters = () => {
    setSearchQuery('');
    setDebouncedSearch('');
    setStatusFilter('all');
    setCurrentPage(1);
  };

  if (isLoading) return <p className="teams-page__loading">Loading responses...</p>;

  return (
    <>
      {errorMessage ? <p className="alert alert-error">{errorMessage}</p> : null}

      <div className="teams-toolbar" role="search">
        <div className="teams-search-wrapper">
          <input
            type="text"
            className="teams-search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by user or team..."
            aria-label="Search invitation responses"
          />
          {searchQuery ? (
            <button
              type="button"
              className="teams-search-clear"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
            >
              ×
            </button>
          ) : null}
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          aria-label="Filter by response status"
        >
          <option value="all">All</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
        </select>

        <button
          type="button"
          className="btn btn-ghost"
          onClick={resetFilters}
          disabled={!searchQuery && statusFilter === 'all'}
        >
          Reset
        </button>
      
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
          Rows per page:
          <select
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
            aria-label="Rows per page"
          >
            {PAGE_SIZES.map((size) => <option key={size} value={size}>{size}</option>)}
          </select>
        </label>
      </div>

      {processedData.length === 0 ? (
        responses.length === 0
          ? <p className="empty-state">No invitation responses yet.</p>
          : <p className="empty-state">No responses match your filters</p>
      ) : null}

      {processedData.length > 0 ? (
        <>
          <PaginationBar currentPage={safePage} totalPages={totalPages} totalItems={processedData.length} onPageChange={setCurrentPage} />
          <div className="matrix-wrapper">
            <table className="permission-table teams-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Team</th>
                  <th>Date invited</th>
                  <th>Date responded</th>
                  <th>Response</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((response) => (
                  <tr key={response.id}>
                    <td>{response.inviteeName}</td>
                    <td>{response.teamName}</td>
                    <td>{formatDate(response.createdAt)}</td>
                    <td>{formatDate(response.respondedAt)}</td>
                    <td>
                      <span
                        className={response.status.toLowerCase() === 'accepted'
                          ? 'badge status-tag status-tag--accepted'
                          : 'badge status-tag status-tag--rejected'}
                      >
                        {formatStatus(response.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <PaginationBar currentPage={safePage} totalPages={totalPages} totalItems={processedData.length} onPageChange={setCurrentPage} />
          </>
      ) : null}
    </>
  );
}