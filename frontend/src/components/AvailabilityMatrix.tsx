import { useEffect, useMemo, useRef } from 'react';
import type { AvailabilityValue, User } from '../lib/api.models';

interface AvailabilityMatrixProps {
  currentUserId: number;
  employees: User[];
  filteredDays: string[];
  statusFor: (userId: number, day: string) => AvailabilityValue | null;
  holidayLookup: Map<number, Set<string>>;
  openKey: string | null;
  pendingKey: string | null;
  onOpenPopup: (key: string | null) => void;
  onStatusUpdate: (date: string, status: AvailabilityValue) => Promise<void>;
  onStatusClear: (date: string) => Promise<void>;
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
  onOpenPopup,
  onStatusUpdate,
  onStatusClear
}: AvailabilityMatrixProps): JSX.Element {
  const popupRef = useRef<HTMLDivElement | null>(null);
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
      }
    };

    const onDocumentClick = (event: MouseEvent) => {
      if (!openKey) {
        return;
      }

      if (popupRef.current && event.target instanceof Node && popupRef.current.contains(event.target)) {
        return;
      }

      onOpenPopup(null);
    };

    document.addEventListener('keydown', onEscape);
    document.addEventListener('click', onDocumentClick);

    return () => {
      document.removeEventListener('keydown', onEscape);
      document.removeEventListener('click', onDocumentClick);
    };
  }, [openKey, onOpenPopup]);

  const cellKey = (userId: number, date: string): string => `${userId}:${date}`;

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

  return (
    <section className="matrix-card">
      <div className="matrix-wrapper">
        <table>
          <thead>
            <tr>
              <th className="sticky-column sticky-header">Date</th>
              {employees.map((employee) => (
                <th key={employee.id} className="sticky-header">
                  <div className="employee-name">{employee.displayName}</div>
                  <div className="employee-email">{employee.email}</div>
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

                  return (
                    <td key={key} className={isHolidayCell ? 'holiday-cell' : undefined}>
                      <div className={`cell-wrapper ${editable ? 'editable' : ''}`}>
                        <button
                          type="button"
                          className={`status-pill ${effectiveStatusClass}`}
                          onClick={(event) => {
                            if (!editable) {
                              return;
                            }
                            event.stopPropagation();
                            onOpenPopup(isOpen ? null : key);
                          }}
                          tabIndex={editable ? 0 : -1}
                          aria-disabled={!editable}
                          aria-label={ariaLabel}
                        >
                          {displayContent}
                        </button>

                        {isOpen && editable && openPosition?.date === day && openPosition.userId === employee.id && (
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
    </section>
  );
}
