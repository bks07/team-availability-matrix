import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AvailabilityMatrix from '../components/AvailabilityMatrix';
import TeamSelector from '../components/TeamSelector';
import { TeamlessNotification } from '../components/TeamlessNotification';
import { useAuth } from '../context/AuthContext';
import type { AvailabilityValue, Team, User, WorkSchedule } from '../lib/api.models';
import {
  getMatrix,
  updateStatus,
  deleteStatus,
  bulkUpdateStatuses,
  exportMatrixCsv,
  importMatrixCsv,
} from '../services/matrix.service';
import { teamService } from '../services/team.service';

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
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [isLoadingTeams, setIsLoadingTeams] = useState(false);
  const [hasLoadedTeams, setHasLoadedTeams] = useState(false);
  const [filteredDays, setFilteredDays] = useState<string[]>([]);
  const [entryMap, setEntryMap] = useState<Map<string, AvailabilityValue>>(new Map());
  const [holidayLookup, setHolidayLookup] = useState<Map<number, Set<string>>>(new Map());
  const [scheduleLookup, setScheduleLookup] = useState<Map<number, WorkSchedule>>(new Map());
  const [periodStart, setPeriodStart] = useState(initialPeriod.start);
  const [periodEnd, setPeriodEnd] = useState(initialPeriod.end);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [selectionAnchor, setSelectionAnchor] = useState<string | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<AvailabilityValue | null>(null);
  const [bulkPending, setBulkPending] = useState(false);
  const [, setBulkSkipWeekends] = useState(false);
  const [, setBulkSkipPublicHolidays] = useState(false);

  const [matrixLoading, setMatrixLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedRange = useMemo((): string[] => {
    if (!selectionAnchor || !selectionEnd) {
      return [];
    }

    const start = selectionAnchor < selectionEnd ? selectionAnchor : selectionEnd;
    const end = selectionAnchor < selectionEnd ? selectionEnd : selectionAnchor;

    return filteredDays.filter((day) => day >= start && day <= end);
  }, [selectionAnchor, selectionEnd, filteredDays]);

  const cellKey = (userId: number, date: string): string => `${userId}:${date}`;

  const statusFor = useCallback(
    (userId: number, date: string): AvailabilityValue | null => {
      const explicit = entryMap.get(cellKey(userId, date));
      if (explicit) {
        return explicit;
      }

      const schedule = scheduleLookup.get(userId);
      const dateObj = new Date(`${date}T00:00:00`);
      const dayOfWeek = dateObj.getDay();

      const weekdayFlags = schedule
        ? [
            schedule.sunday,
            schedule.monday,
            schedule.tuesday,
            schedule.wednesday,
            schedule.thursday,
            schedule.friday,
            schedule.saturday,
          ]
        : [false, true, true, true, true, true, false];
      const isWorkingWeekday = weekdayFlags[dayOfWeek];

      if (!isWorkingWeekday) {
        return null;
      }

      const ignoreWeekends = schedule?.ignoreWeekends ?? true;
      if (ignoreWeekends && (dayOfWeek === 0 || dayOfWeek === 6)) {
        return null;
      }

      const ignorePublicHolidays = schedule?.ignorePublicHolidays ?? true;
      if (ignorePublicHolidays) {
        const employee = employees.find((e) => e.id === userId);
        if (employee?.locationId != null && holidayLookup.get(employee.locationId)?.has(date)) {
          return null;
        }
      }

      return 'W';
    },
    [entryMap, scheduleLookup, employees, holidayLookup]
  );

  useEffect(() => {
    if (!currentUser) {
      setTeams([]);
      setSelectedTeamId(null);
      setHasLoadedTeams(false);
      return;
    }

    let isMounted = true;

    const loadTeams = async () => {
      setIsLoadingTeams(true);
      setHasLoadedTeams(false);

      try {
        const nextTeams = await teamService.getMyTeams();
        if (!isMounted) {
          return;
        }

        setTeams(nextTeams);

        if (nextTeams.length === 0) {
          setSelectedTeamId(null);
          return;
        }

        const defaultTeamId = currentUser.defaultTeamId ?? null;
        const hasDefaultTeam = defaultTeamId != null && nextTeams.some((team) => team.id === defaultTeamId);
        setSelectedTeamId(hasDefaultTeam ? defaultTeamId : nextTeams[0].id);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setTeams([]);
        setSelectedTeamId(null);
        setErrorMessage(error instanceof Error ? error.message : 'Failed to load your teams.');
      } finally {
        if (!isMounted) {
          return;
        }

        setIsLoadingTeams(false);
        setHasLoadedTeams(true);
      }
    };

    void loadTeams();

    return () => {
      isMounted = false;
    };
  }, [currentUser]);

  const refreshMatrix = useCallback(async () => {
    if (!currentUser || !periodStart || !periodEnd || isLoadingTeams || !hasLoadedTeams) {
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

      const matrixResults = await Promise.all(
        years.map((year) => (selectedTeamId != null ? getMatrix(year, selectedTeamId) : getMatrix(year)))
      );
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

      const nextHolidayLookup = new Map<number, Set<string>>();
      matrixResults
        .flatMap((result) => result.publicHolidays)
        .forEach((holiday) => {
          const byLocation = nextHolidayLookup.get(holiday.locationId) ?? new Set<string>();
          byLocation.add(holiday.holidayDate);
          nextHolidayLookup.set(holiday.locationId, byLocation);
        });

      setHolidayLookup(nextHolidayLookup);

      const nextScheduleLookup = new Map<number, WorkSchedule>();
      matrixResults
        .flatMap((result) => result.workSchedules)
        .forEach((schedule) => {
          nextScheduleLookup.set(schedule.userId, schedule);
        });
      setScheduleLookup(nextScheduleLookup);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load the availability matrix.');
    } finally {
      setMatrixLoading(false);
    }
  }, [currentUser, periodStart, periodEnd, selectedTeamId, isLoadingTeams, hasLoadedTeams]);

  useEffect(() => {
    if (currentUser && hasLoadedTeams) {
      void refreshMatrix();
    }
  }, [currentUser, periodStart, periodEnd, selectedTeamId, hasLoadedTeams, refreshMatrix]);

  const handleTeamChange = useCallback((teamId: number) => {
    setSelectedTeamId(teamId);
    setErrorMessage('');
    setSuccessMessage('');
  }, []);

  const handleFilterToggle = useCallback((status: AvailabilityValue) => {
    setStatusFilter((prev) => (prev === status ? null : status));
  }, []);

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

  const handleStatusClear = async (date: string) => {
    if (!currentUser) {
      return;
    }

    const key = cellKey(currentUser.id, date);
    setOpenKey(null);
    setPendingKey(key);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await deleteStatus(date);
      setEntryMap((prev) => {
        const next = new Map(prev);
        next.delete(key);
        return next;
      });
      setSuccessMessage(`Cleared status for ${date}.`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to clear the status.');
    } finally {
      setPendingKey(null);
    }
  };

  const handleCellClick = useCallback(
    (day: string, shiftKey: boolean) => {
      if (shiftKey && selectionAnchor) {
        setSelectionEnd(day);
        setOpenKey(null);
      } else {
        setSelectionAnchor(day);
        setSelectionEnd(null);
      }
    },
    [selectionAnchor]
  );

  const clearSelection = useCallback(() => {
    setSelectionAnchor(null);
    setSelectionEnd(null);
    setBulkSkipWeekends(false);
    setBulkSkipPublicHolidays(false);
  }, [setBulkSkipWeekends, setBulkSkipPublicHolidays]);

  const handleBulkAction = useCallback(
    async (status: AvailabilityValue | null, skipWeekends: boolean, skipPublicHolidays: boolean) => {
      if (!currentUser || selectedRange.length === 0) {
        return;
      }

      setErrorMessage('');
      setSuccessMessage('');
      setBulkSkipWeekends(skipWeekends);
      setBulkSkipPublicHolidays(skipPublicHolidays);
      setBulkPending(true);

      try {
        const result = await bulkUpdateStatuses({
          dates: selectedRange,
          status,
          skipWeekends,
          skipPublicHolidays,
        });

        let affectedDates = [...selectedRange];
        if (skipWeekends) {
          affectedDates = affectedDates.filter((date) => {
            const dayOfWeek = new Date(`${date}T00:00:00`).getDay();
            return dayOfWeek !== 0 && dayOfWeek !== 6;
          });
        }

        if (skipPublicHolidays && currentUser.locationId != null) {
          const holidays = holidayLookup.get(currentUser.locationId);
          if (holidays) {
            affectedDates = affectedDates.filter((date) => !holidays.has(date));
          }
        }

        setEntryMap((prev) => {
          const next = new Map(prev);
          for (const date of affectedDates) {
            const key = cellKey(currentUser.id, date);
            if (status) {
              next.set(key, status);
            } else {
              next.delete(key);
            }
          }
          return next;
        });

        const action = status ? `Set ${result.updatedCount} day(s) to ${status}` : `Cleared ${result.updatedCount} day(s)`;
        setSuccessMessage(`${action}.`);
        clearSelection();
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Failed to apply bulk status change.');
      } finally {
        setBulkPending(false);
      }
    },
    [currentUser, selectedRange, holidayLookup, clearSelection]
  );

  const handleExportCsv = async () => {
    if (!currentUser) {
      return;
    }

    setErrorMessage('');
    try {
      const year = Number(periodStart.slice(0, 4));
      await exportMatrixCsv(year, selectedTeamId ?? undefined);
      setSuccessMessage('Matrix exported successfully.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to export matrix.');
    }
  };

  const handleImportCsv = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');

    try {
      const result = await importMatrixCsv(file);
      let message = `Imported ${result.updatedCount} status entries.`;
      if (result.skippedCount > 0) {
        message += ` ${result.skippedCount} skipped.`;
      }
      if (result.warnings.length > 0) {
        message += ` Warnings: ${result.warnings.slice(0, 3).join('; ')}`;
        if (result.warnings.length > 3) {
          message += `... and ${result.warnings.length - 3} more.`;
        }
      }

      await refreshMatrix();
      setSuccessMessage(message);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to import matrix.');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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
            <TeamSelector
              teams={teams}
              selectedTeamId={selectedTeamId}
              defaultTeamId={currentUser.defaultTeamId}
              onTeamChange={handleTeamChange}
            />
            <label className="period-label">
              From
              <input type="date" value={periodStart} onChange={(event) => setPeriodStart(event.target.value)} />
            </label>
            <label className="period-label">
              To
              <input type="date" value={periodEnd} onChange={(event) => setPeriodEnd(event.target.value)} />
            </label>
          </div>
          <div className="filter-controls">
            <span className="filter-label">Filter:</span>
            <button
              type="button"
              className={`filter-btn filter-w ${statusFilter === 'W' ? 'active' : ''}`}
              onClick={() => handleFilterToggle('W')}
            >
              W
            </button>
            <button
              type="button"
              className={`filter-btn filter-v ${statusFilter === 'V' ? 'active' : ''}`}
              onClick={() => handleFilterToggle('V')}
            >
              V
            </button>
            <button
              type="button"
              className={`filter-btn filter-a ${statusFilter === 'A' ? 'active' : ''}`}
              onClick={() => handleFilterToggle('A')}
            >
              A
            </button>
            {statusFilter && (
              <button
                type="button"
                className="filter-btn filter-reset"
                onClick={() => setStatusFilter(null)}
              >
                Reset
              </button>
            )}
          </div>
          <button type="button" onClick={() => void refreshMatrix()} disabled={matrixLoading}>
            Refresh
          </button>
          <button
            type="button"
            onClick={() => void handleExportCsv()}
            disabled={matrixLoading || !filteredDays.length}
          >
            Export CSV
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={(event) => void handleImportCsv(event)}
            style={{ display: 'none' }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={matrixLoading}
          >
            Import CSV
          </button>
        </div>
      </section>

      {errorMessage && <p className="message error">{errorMessage}</p>}
      {successMessage && <p className="message success">{successMessage}</p>}
      {isLoadingTeams && <p className="message">Loading teams...</p>}
      {matrixLoading && <p className="message">Loading matrix...</p>}
      {!isLoadingTeams && hasLoadedTeams && teams.length === 0 && <TeamlessNotification />}

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
          holidayLookup={holidayLookup}
          openKey={openKey}
          pendingKey={pendingKey}
          selectedRange={selectedRange}
          bulkPending={bulkPending}
          statusFilter={statusFilter}
          onOpenPopup={setOpenKey}
          onCellClick={handleCellClick}
          onStatusUpdate={handleStatusUpdate}
          onStatusClear={handleStatusClear}
          onBulkAction={handleBulkAction}
          onClearSelection={clearSelection}
        />
      )}
    </main>
  );
}
