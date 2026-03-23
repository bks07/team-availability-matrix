import { useCallback, useEffect, useMemo, useState } from 'react';
import AvailabilityMatrix from '../components/AvailabilityMatrix';
import { useAuth } from '../context/AuthContext';
import type { AvailabilityValue, User } from '../lib/api.models';
import { getMatrix, updateStatus } from '../services/matrix.service';

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function defaultPeriod(): { start: string; end: string } {
  const today = new Date();
  const dow = today.getDay();
  const toMonday = dow === 0 ? -6 : 1 - dow;

  const thisMonday = new Date(today);
  thisMonday.setDate(today.getDate() + toMonday);

  const start = new Date(thisMonday);
  start.setDate(thisMonday.getDate() - 7);

  const end = new Date(thisMonday);
  end.setDate(thisMonday.getDate() + 14);

  return { start: toIsoDate(start), end: toIsoDate(end) };
}

export default function WorkspaceLayout(): JSX.Element {
  const { currentUser } = useAuth();
  const initialPeriod = useMemo(() => defaultPeriod(), []);

  const [employees, setEmployees] = useState<User[]>([]);
  const [filteredDays, setFilteredDays] = useState<string[]>([]);
  const [entryMap, setEntryMap] = useState<Map<string, AvailabilityValue>>(new Map());
  const [periodStart, setPeriodStart] = useState(initialPeriod.start);
  const [periodEnd, setPeriodEnd] = useState(initialPeriod.end);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  const [matrixLoading, setMatrixLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const cellKey = (userId: number, date: string): string => `${userId}:${date}`;

  const statusFor = useCallback(
    (userId: number, date: string): AvailabilityValue => entryMap.get(cellKey(userId, date)) ?? 'W',
    [entryMap]
  );

  const refreshMatrix = useCallback(async () => {
    if (!currentUser || !periodStart || !periodEnd) {
      return;
    }

    if (periodStart > periodEnd) {
      setErrorMessage('Start date must be before end date.');
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');
    setMatrixLoading(true);

    try {
      const startYear = Number(periodStart.slice(0, 4));
      const endYear = Number(periodEnd.slice(0, 4));
      const years = startYear === endYear ? [startYear] : [startYear, endYear];

      const matrixResults = await Promise.all(years.map((year) => getMatrix(year)));
      setEmployees(matrixResults[0]?.employees ?? []);

      const days = matrixResults
        .flatMap((result) => result.days)
        .filter((day) => day >= periodStart && day <= periodEnd);

      setFilteredDays(days);

      const nextMap = new Map<string, AvailabilityValue>();
      matrixResults.flatMap((result) => result.entries).forEach((entry) => {
        nextMap.set(cellKey(entry.userId, entry.statusDate), entry.status);
      });

      setEntryMap(nextMap);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load the availability matrix.');
    } finally {
      setMatrixLoading(false);
    }
  }, [currentUser, periodStart, periodEnd]);

  useEffect(() => {
    if (currentUser) {
      void refreshMatrix();
    }
  }, [currentUser, periodStart, periodEnd, refreshMatrix]);

  const handleStatusUpdate = async (date: string, status: AvailabilityValue) => {
    if (!currentUser) {
      return;
    }

    const key = cellKey(currentUser.id, date);
    setOpenKey(null);
    setPendingKey(key);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const saved = await updateStatus(date, status);
      setEntryMap((prev) => {
        const next = new Map(prev);
        next.set(cellKey(saved.userId, saved.statusDate), saved.status);
        return next;
      });
      setSuccessMessage(`Saved ${status} for ${date}.`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to save the status change.');
    } finally {
      setPendingKey(null);
    }
  };

  if (!currentUser) {
    return <main className="workspace-layout page-shell" />;
  }

  return (
    <main className="workspace-layout page-shell">
      <section className="toolbar-card">
        <div className="toolbar-actions">
          <div className="period-controls">
            <label className="period-label">
              From
              <input type="date" value={periodStart} onChange={(event) => setPeriodStart(event.target.value)} />
            </label>
            <label className="period-label">
              To
              <input type="date" value={periodEnd} onChange={(event) => setPeriodEnd(event.target.value)} />
            </label>
          </div>
          <button type="button" onClick={() => void refreshMatrix()} disabled={matrixLoading}>
            Refresh
          </button>
        </div>
      </section>

      {errorMessage && <p className="message error">{errorMessage}</p>}
      {successMessage && <p className="message success">{successMessage}</p>}
      {matrixLoading && <p className="message">Loading matrix...</p>}

      <div className="matrix-legend">
        <span className="legend-hint">You can only edit your own column</span>
        <div className="legend-items">
          <span className="legend-item"><span className="legend-dot legend-dot-w"></span>Working</span>
          <span className="legend-item"><span className="legend-dot legend-dot-v"></span>Vacation</span>
          <span className="legend-item"><span className="legend-dot legend-dot-a"></span>Absence</span>
        </div>
      </div>

      {!!filteredDays.length && !!employees.length && (
        <AvailabilityMatrix
          currentUserId={currentUser.id}
          employees={employees}
          filteredDays={filteredDays}
          statusFor={statusFor}
          openKey={openKey}
          pendingKey={pendingKey}
          onOpenPopup={setOpenKey}
          onStatusUpdate={handleStatusUpdate}
        />
      )}
    </main>
  );
}
