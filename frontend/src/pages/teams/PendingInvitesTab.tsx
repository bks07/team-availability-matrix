import { useEffect, useMemo, useRef, useState } from 'react';
import type { SentInvitation } from '../../lib/api.models';
import { teamService } from '../../services/team.service';

const PAGE_SIZES = [10, 25, 50] as const;

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
}

interface PendingInvitesTabProps {
  onDataChanged: () => void;
}

export default function PendingInvitesTab({ onDataChanged }: PendingInvitesTabProps): JSX.Element {
  const [invitations, setInvitations] = useState<SentInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [confirmInvitation, setConfirmInvitation] = useState<SentInvitation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const searchTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);

  const loadData = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const data = await teamService.getSentInvitations();
      setInvitations(data);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load sent invitations.');
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

  const processedData = useMemo(() => {
    if (!debouncedSearch.trim()) return invitations;
    const q = debouncedSearch.trim().toLowerCase();
    return invitations.filter(
      (inv) =>
        inv.inviteeName.toLowerCase().includes(q) ||
        inv.teamName.toLowerCase().includes(q),
    );
  }, [invitations, debouncedSearch]);

  const totalPages = Math.max(1, Math.ceil(processedData.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedData = processedData.slice((safePage - 1) * pageSize, safePage * pageSize);

  const handleConfirmCancel = async () => {
    if (!confirmInvitation) return;

    setPendingId(confirmInvitation.id);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await teamService.cancelInvitation(confirmInvitation.id);
      setSuccessMessage('Invitation cancelled.');
      setConfirmInvitation(null);
      await loadData();
      onDataChanged();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to cancel invitation.');
    } finally {
      setPendingId(null);
    }
  };

  if (isLoading) return <p className="teams-page__loading">Loading sent invitations...</p>;

  return (
    <>
      {successMessage ? <p className="alert alert-success">{successMessage}</p> : null}
      {errorMessage ? <p className="alert alert-error">{errorMessage}</p> : null}

      <div className="teams-toolbar" role="search">
        <div className="teams-search-wrapper">
          <input
            type="text"
            className="teams-search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by user or team..."
            aria-label="Search pending invitations"
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
      </div>

      {processedData.length === 0 && !isLoading ? (
        invitations.length === 0 ? (
          <p className="empty-state">You have no pending outbound invitations.</p>
        ) : (
          <p className="empty-state">No invitations match your search</p>
        )
      ) : null}

      {processedData.length > 0 ? (
        <>
          <div className="matrix-wrapper">
            <table className="permission-table teams-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Team</th>
                  <th>Date invited</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((inv) => (
                  <tr key={inv.id}>
                    <td>{inv.inviteeName}</td>
                    <td>{inv.teamName}</td>
                    <td>{formatDate(inv.createdAt)}</td>
                    <td>
                      <div className="entity-actions">
                        <button
                          type="button"
                          className="icon-btn danger"
                          onClick={() => setConfirmInvitation(inv)}
                          title="Cancel invitation"
                          aria-label={`Cancel invitation for ${inv.inviteeName}`}
                          disabled={pendingId === inv.id}
                        >
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M2 4h12M5.333 4V2.667a1.333 1.333 0 011.334-1.334h2.666a1.333 1.333 0 011.334 1.334V4m2 0v9.333a1.333 1.333 0 01-1.334 1.334H4.667a1.333 1.333 0 01-1.334-1.334V4h9.334z" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pagination-bar">
            <div className="pagination-bar__info">
              Page {safePage} of {totalPages} ({processedData.length} total)
            </div>
            <div className="pagination-bar__controls">
              <button type="button" disabled={safePage <= 1} onClick={() => setCurrentPage(1)} aria-label="First page">«</button>
              <button type="button" disabled={safePage <= 1} onClick={() => setCurrentPage((p) => p - 1)} aria-label="Previous page">‹</button>
              <button type="button" disabled={safePage >= totalPages} onClick={() => setCurrentPage((p) => p + 1)} aria-label="Next page">›</button>
              <button type="button" disabled={safePage >= totalPages} onClick={() => setCurrentPage(totalPages)} aria-label="Last page">»</button>
            </div>
            <div className="pagination-bar__size">
              <label>Rows per page:
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                >
                  {PAGE_SIZES.map((size) => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        </>
      ) : null}

      {confirmInvitation ? (
        <div
          className="ds-modal-overlay teams-modal-overlay"
          role="presentation"
          onClick={() => {
            if (pendingId === confirmInvitation.id) return;
            setConfirmInvitation(null);
          }}
        >
          <section
            className="ds-modal teams-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Confirm invitation cancellation"
            onClick={(event) => event.stopPropagation()}
          >
            <h2>Cancel Invitation</h2>
            <p>Cancel invitation for {confirmInvitation.inviteeName} to {confirmInvitation.teamName}?</p>
            <div className="teams-modal__actions">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setConfirmInvitation(null)}
                disabled={pendingId === confirmInvitation.id}
              >
                Keep
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => void handleConfirmCancel()}
                disabled={pendingId === confirmInvitation.id}
              >
                {pendingId === confirmInvitation.id ? 'Cancelling...' : 'Cancel invitation'}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
