import { useCallback, useEffect, useMemo, useState } from 'react';
import AvailabilityMatrix from './components/AvailabilityMatrix';
import AuthCard from './components/AuthCard';
import HeroCard from './components/HeroCard';
import type { AuthResponse, AvailabilityStatus, AvailabilityValue, User } from './lib/api.models';
import { clearSession, loadSession, saveSession } from './lib/storage';
import { me } from './services/auth.service';
import { getMatrix, updateStatus } from './services/matrix.service';

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

export default function App(): JSX.Element {
  const initialPeriod = useMemo(() => defaultPeriod(), []);

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [employees, setEmployees] = useState<User[]>([]);
  const [filteredDays, setFilteredDays] = useState<string[]>([]);
  const [entryMap, setEntryMap] = useState<Map<string, AvailabilityValue>>(new Map());
  const [periodStart, setPeriodStart] = useState(initialPeriod.start);
  const [periodEnd, setPeriodEnd] = useState(initialPeriod.end);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  const [matrixLoading, setMatrixLoading] = useState(false);
  const [bootLoading, setBootLoading] = useState(true);
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
      matrixResults.flatMap((result) => result.entries).forEach((entry: AvailabilityStatus) => {
        const date = entry.statusDate ?? entry.date;
        if (!date) {
          return;
        }
        nextMap.set(cellKey(entry.userId, date), entry.status);
      });

      setEntryMap(nextMap);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load the availability matrix.');
    } finally {
      setMatrixLoading(false);
    }
  }, [currentUser, periodStart, periodEnd]);

  useEffect(() => {
    const bootstrap = async () => {
      const session = loadSession();
      if (!session) {
        setBootLoading(false);
        return;
      }

      try {
        const user = await me();
        saveSession({ ...session, user });
        setCurrentUser(user);
      } catch {
        clearSession();
        setErrorMessage('Your session expired. Please log in again.');
      } finally {
        setBootLoading(false);
      }
    };

    void bootstrap();
  }, []);

  useEffect(() => {
    if (currentUser) {
      void refreshMatrix();
    }
  }, [currentUser, periodStart, periodEnd, refreshMatrix]);

  const handleAuthSuccess = (session: AuthResponse, mode: 'login' | 'register') => {
    saveSession(session);
    setCurrentUser(session.user);
    setErrorMessage('');
    setSuccessMessage(mode === 'login' ? 'Welcome back.' : 'Account created successfully.');
  };

  const handleLogout = () => {
    clearSession();
    setCurrentUser(null);
    setEmployees([]);
    setFilteredDays([]);
    setEntryMap(new Map());
    setOpenKey(null);
    setPendingKey(null);
    setErrorMessage('');
    setSuccessMessage('');
  };

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
      const savedDate = saved.statusDate ?? saved.date;
      if (!savedDate) {
        throw new Error('Invalid status response from server.');
      }

      setEntryMap((prev) => {
        const next = new Map(prev);
        next.set(cellKey(saved.userId, savedDate), saved.status);
        return next;
      });
      setSuccessMessage(`Saved ${status} for ${date}.`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to save the status change.');
    } finally {
      setPendingKey(null);
    }
  };

  if (bootLoading) {
    return (
      <main className="page-shell">
        <p className="message">Loading...</p>
      </main>
    );
  }

  return (
    <main className="page-shell">
      {currentUser ? (
        <>
          <HeroCard />

          <section className="toolbar-card">
            <div>
              <p className="toolbar-title">Signed in as {currentUser.displayName}</p>
              <p className="toolbar-subtitle">You can edit only your own column. Click a cell to change its status.</p>
            </div>
            <div className="toolbar-actions">
              <label className="period-label">
                From
                <input type="date" value={periodStart} onChange={(event) => setPeriodStart(event.target.value)} />
              </label>
              <label className="period-label">
                To
                <input type="date" value={periodEnd} onChange={(event) => setPeriodEnd(event.target.value)} />
              </label>
              <button type="button" onClick={() => void refreshMatrix()} disabled={matrixLoading}>
                Refresh
              </button>
              <button type="button" onClick={handleLogout}>
                Log out
              </button>
            </div>
          </section>

          {errorMessage && <p className="message error">{errorMessage}</p>}
          {successMessage && <p className="message success">{successMessage}</p>}
          {matrixLoading && <p className="message">Loading matrix...</p>}

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
        </>
      ) : (
        <>
          {errorMessage && <p className="message error">{errorMessage}</p>}
          {successMessage && <p className="message success">{successMessage}</p>}
          <AuthCard onAuthSuccess={handleAuthSuccess} />
        </>
      )}
    </main>
  );
}
