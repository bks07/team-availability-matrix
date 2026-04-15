import { useEffect, useMemo, useRef, useState } from 'react';
import type { TeamInvitation } from '../../lib/api.models';
import { teamService } from '../../services/team.service';

const PAGE_SIZES = [10, 25, 50] as const;

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
}

interface ReceivedInvitesTabProps {
  onDataChanged: () => void;
}

export default function ReceivedInvitesTab({ onDataChanged }: ReceivedInvitesTabProps): JSX.Element {
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const searchTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);

  const loadData = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const data = await teamService.getMyInvitations();
      setInvitations(data.filter((i) => i.status.toLowerCase() === 'pending'));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load invitations.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { void loadData(); }, []);

  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 300);
    return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current); };
  }, [searchQuery]);

  const processedData = useMemo(() => {
    if (!debouncedSearch.trim()) return invitations;
    const q = debouncedSearch.trim().toLowerCase();
    return invitations.filter(
      (inv) => inv.teamName.toLowerCase().includes(q) || inv.inviterName.toLowerCase().includes(q),
    );
  }, [invitations, debouncedSearch]);

  const totalPages = Math.max(1, Math.ceil(processedData.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedData = processedData.slice((safePage - 1) * pageSize, safePage * pageSize);

  const handleAction = async (id: number, action: 'accept' | 'reject') => {
    setPendingId(id);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      if (action === 'accept') {
        await teamService.acceptInvitation(id);
        setSuccessMessage('Invitation accepted.');
      } else {
        await teamService.rejectInvitation(id);
        setSuccessMessage('Invitation rejected.');
      }
      await loadData();
      onDataChanged();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to update invitation.');
    } finally {
      setPendingId(null);
    }
  };

  if (isLoading) return <p className="teams-page__loading">Loading invitations...</p>;

  return (
    <>
      {successMessage ? <p className="alert alert-success">{successMessage}</p> : null}
      {errorMessage ? <p className="alert alert-error">{errorMessage}</p> : null}

      <div className="teams-toolbar" role="search">
        <div className="teams-search-wrapper">
          <input type="text" className="teams-search" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by team or inviter..." aria-label="Search invitations" />
          {searchQuery ? (
            <button type="button" className="teams-search-clear" onClick={() => setSearchQuery('')} aria-label="Clear search">&times;</button>
          ) : null}
        </div>
      </div>

      {processedData.length === 0 && !isLoading ? (
        invitations.length === 0
          ? <p className="empty-state">You have no pending invitations.</p>
          : <p className="empty-state">No invitations match your search</p>
      ) : null}

      {processedData.length > 0 ? (
        <>
          <div className="matrix-wrapper">
            <table className="permission-table teams-table">
              <thead>
                <tr>
                  <th>Team</th>
                  <th>Invited by</th>
                  <th>Date invited</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((inv) => (
                  <tr key={inv.id}>
                    <td>{inv.teamName}</td>
                    <td>{inv.inviterName}</td>
                    <td>{formatDate(inv.createdAt)}</td>
                    <td>
                      <div className="entity-actions">
                        <button type="button" className="btn btn-primary btn-sm" disabled={pendingId === inv.id} onClick={() => void handleAction(inv.id, 'accept')}>Accept</button>
                        <button type="button" className="btn btn-danger btn-sm" disabled={pendingId === inv.id} onClick={() => void handleAction(inv.id, 'reject')}>Reject</button>
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
                <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}>
                  {PAGE_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}
