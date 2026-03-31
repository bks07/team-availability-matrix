import { useEffect, useMemo, useRef, useState } from 'react';
import type { AvailabilityValue, User } from '../lib/api.models';
import { getDisplayLabel, getInitials } from '../lib/name.utils';

interface AvailabilityMatrixProps {
  currentUserId: number;
  employees: User[];
  filteredDays: string[];
  statusFor: (userId: number, day: string) => AvailabilityValue | null;
  holidayLookup: Map<number, Set<string>>;
  openKey: string | null;
  pendingKey: string | null;
  selectedRange: string[];
  bulkPending: boolean;
  onOpenPopup: (key: string | null) => void;
  onCellClick: (day: string, shiftKey: boolean) => void;
  onStatusUpdate: (date: string, status: AvailabilityValue) => Promise<void>;
  onStatusClear: (date: string) => Promise<void>;
  onBulkAction: (
    status: AvailabilityValue | null,
    skipWeekends: boolean,
    skipPublicHolidays: boolean
  ) => Promise<void>;
  onClearSelection: () => void;
}

function formatDay(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00`);
  const dow = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
  return `${dow} ${dateStr}`;
}

export default function AvailabilityMatrix({
  currentUserId,
  employees,
  filteredDays,
  statusFor,
  holidayLookup,
  openKey,
  pendingKey,
  selectedRange,
  bulkPending,
  onOpenPopup,
  onCellClick,
  onStatusUpdate,
  onStatusClear,
  onBulkAction,
  onClearSelection
}: AvailabilityMatrixProps): JSX.Element {
  const popupRef = useRef<HTMLDivElement | null>(null);
  const bulkOverlayRef = useRef<HTMLDivElement | null>(null);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [skipWeekends, setSkipWeekends] = useState(true);
  const [skipPublicHolidays, setSkipPublicHolidays] = useState(true);
  const [hoveredEmployeeId, setHoveredEmployeeId] = useState<number | null>(null);
  const todayStr = useMemo(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  useEffect(() => {
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onOpenPopup(null);
        onClearSelection();
      }
    };

    const onDocumentClick = (event: MouseEvent) => {
      if (!openKey && selectedRange.length === 0) {
        return;
      }

      if (popupRef.current && event.target instanceof Node && popupRef.current.contains(event.target)) {
        return;
      }

      if (bulkOverlayRef.current && event.target instanceof Node && bulkOverlayRef.current.contains(event.target)) {
        return;
      }

      onOpenPopup(null);
      onClearSelection();
    };

    document.addEventListener('keydown', onEscape);
    document.addEventListener('click', onDocumentClick);

    return () => {
      document.removeEventListener('keydown', onEscape);
      document.removeEventListener('click', onDocumentClick);
    };
  }, [openKey, onOpenPopup, onClearSelection, selectedRange.length]);

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  const cellKey = (userId: number, date: string): string => `${userId}:${date}`;

  const handleMouseEnter = (employeeId: number) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredEmployeeId(employeeId);
    }, 150);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = null;
    setHoveredEmployeeId(null);
  };

  const openPosition = useMemo(() => {
    if (!openKey) {
      return null;
    }
    const [rawUserId, date] = openKey.split(':');
    const userId = Number(rawUserId);
    if (!Number.isFinite(userId) || !date) {
      return null;
    }
    return { userId, date };
  }, [openKey]);

  const bulkMode = selectedRange.length > 1;
  const selectedSet = useMemo(() => new Set(selectedRange), [selectedRange]);

  return (
    <section className="matrix-card">
      <div className="matrix-wrapper">
        <table>
          <thead>
            <tr>
              <th className="sticky-column sticky-header">Date</th>
              {employees.map((employee) => (
                <th
                  key={employee.id}
                  className="sticky-header matrix-header-cell"
                  onMouseEnter={() => handleMouseEnter(employee.id)}
                  onMouseLeave={handleMouseLeave}
                  tabIndex={0}
                  onFocus={() => handleMouseEnter(employee.id)}
                  onBlur={handleMouseLeave}
                >
                  <div className="matrix-header-content">
                    {employee.photoUrl ? (
                      <img src={employee.photoUrl} className="avatar-sm" alt={getDisplayLabel(employee)} />
                    ) : (
                      <div className="avatar-placeholder avatar-sm">{getInitials(employee)}</div>
                    )}
                    <span className="matrix-header-name">{getDisplayLabel(employee)}</span>
                  </div>
                  {hoveredEmployeeId === employee.id && (
                    <div className="profile-hover-card">
                      <div className="profile-hover-card-avatar">
                        {employee.photoUrl ? (
                          <img src={employee.photoUrl} className="avatar-md" alt={employee.displayName} />
                        ) : (
                          <div className="avatar-placeholder avatar-md">{getInitials(employee)}</div>
                        )}
                      </div>
                      <div className="profile-hover-card-name">{employee.displayName}</div>
                      <div className="profile-hover-card-email">{employee.email}</div>
                      <div className="profile-hover-card-location">
                        {employee.locationName || <em>No location</em>}
                      </div>
                    </div>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredDays.map((day) => {
              const dateObj = new Date(`${day}T00:00:00`);
              const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
              const isToday = day === todayStr;
              const rowClass = [isToday ? 'today-row' : '', isWeekend ? 'weekend-row' : ''].filter(Boolean).join(' ');

              return (
                <tr key={day} className={rowClass || undefined}>
                <th className="sticky-column date-cell">{formatDay(day)}</th>
                {employees.map((employee) => {
                  const key = cellKey(employee.id, day);
                  const status = statusFor(employee.id, day);
                  const effectiveStatusClass = status ? `status-${status.toLowerCase()}` : 'status-none';
                  const editable = employee.id === currentUserId;
                  const isOpen = openKey === key;
                  const isPending = pendingKey === key;
                  const displayContent = isPending ? '…' : (status ?? '–');
                  const ariaLabel = status ? `Set status for ${day}` : `Non-working day. Set status for ${day}`;
                  const isHolidayCell =
                    typeof employee.locationId === 'number' && holidayLookup.get(employee.locationId)?.has(day) === true;
                  const isBulkSelected = editable && selectedSet.has(day);
                  const isFirstSelected = isBulkSelected && day === selectedRange[0];
                  const isLastSelected = isBulkSelected && day === selectedRange[selectedRange.length - 1];
                  const tdClasses = [
                    isHolidayCell ? 'holiday-cell' : '',
                    isBulkSelected ? 'bulk-selected' : '',
                    isFirstSelected ? 'bulk-selected-first' : '',
                    isLastSelected ? 'bulk-selected-last' : ''
                  ].filter(Boolean).join(' ') || undefined;

                  return (
                    <td key={key} className={tdClasses}>
                      <div className={`cell-wrapper ${editable ? 'editable' : ''}`}>
                        <button
                          type="button"
                          className={`status-pill ${effectiveStatusClass}`}
                          onClick={(event) => {
                            if (!editable) {
                              return;
                            }
                            event.stopPropagation();
                            if (event.shiftKey) {
                              onCellClick(day, true);
                            } else {
                              onCellClick(day, false);
                              onOpenPopup(isOpen ? null : key);
                            }
                          }}
                          tabIndex={editable ? 0 : -1}
                          aria-disabled={!editable}
                          aria-label={ariaLabel}
                        >
                          {displayContent}
                        </button>

                        {isOpen && editable && !bulkMode && openPosition?.date === day && openPosition.userId === employee.id && (
                          <div
                            className="status-overlay"
                            ref={popupRef}
                            onClick={(event) => event.stopPropagation()}
                          >
                            <button className="overlay-btn status-w" onClick={() => void onStatusUpdate(day, 'W')}>
                              W
                            </button>
                            <button className="overlay-btn status-v" onClick={() => void onStatusUpdate(day, 'V')}>
                              V
                            </button>
                            <button className="overlay-btn status-a" onClick={() => void onStatusUpdate(day, 'A')}>
                              A
                            </button>
                            <button
                              className="overlay-btn clear-btn"
                              onClick={() => void onStatusClear(day)}
                              title="Clear status"
                              aria-label="Clear status"
                            >
                              –
                            </button>
                            <button className="overlay-btn close-btn" onClick={() => onOpenPopup(null)} title="Close">
                              ✕
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  );
                })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {bulkMode && (
        <div className="bulk-overlay" ref={bulkOverlayRef} role="dialog" aria-modal="true" aria-labelledby="bulk-title">
          <div className="bulk-header">
            <span id="bulk-title">{selectedRange.length} days selected</span>
            <button
              type="button"
              className="overlay-btn close-btn"
              onClick={onClearSelection}
              aria-label="Cancel selection"
            >
              ✕
            </button>
          </div>
          <div className="bulk-modifiers">
            <label>
              <input
                type="checkbox"
                checked={skipWeekends}
                onChange={(event) => setSkipWeekends(event.target.checked)}
              />
              Skip weekends
            </label>
            <label>
              <input
                type="checkbox"
                checked={skipPublicHolidays}
                onChange={(event) => setSkipPublicHolidays(event.target.checked)}
              />
              Skip public holidays
            </label>
          </div>
          <div className="bulk-actions">
            <button
              type="button"
              className="overlay-btn status-w"
              disabled={bulkPending}
              onClick={() => void onBulkAction('W', skipWeekends, skipPublicHolidays)}
            >
              W
            </button>
            <button
              type="button"
              className="overlay-btn status-v"
              disabled={bulkPending}
              onClick={() => void onBulkAction('V', skipWeekends, skipPublicHolidays)}
            >
              V
            </button>
            <button
              type="button"
              className="overlay-btn status-a"
              disabled={bulkPending}
              onClick={() => void onBulkAction('A', skipWeekends, skipPublicHolidays)}
            >
              A
            </button>
            <button
              type="button"
              className="overlay-btn clear-btn"
              disabled={bulkPending}
              onClick={() => void onBulkAction(null, skipWeekends, skipPublicHolidays)}
              title="Clear status"
              aria-label="Clear status"
            >
              –
            </button>
          </div>
          {bulkPending && <span className="bulk-pending">Applying…</span>}
        </div>
      )}
    </section>
  );
}
