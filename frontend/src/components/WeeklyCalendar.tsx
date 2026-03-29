import { useEffect, useRef, useState } from 'react';
import type { AvailabilityValue } from '../lib/api.models';

interface WeeklyCalendarDay {
  date: string;
  dayName: string;
  dayNumber: number;
  monthName: string;
}

interface WeeklyCalendarProps {
  days: WeeklyCalendarDay[];
  statusFor: (date: string) => AvailabilityValue;
  isExplicit: (date: string) => boolean;
  isWeekend: (date: string) => boolean;
  isToday: (date: string) => boolean;
  holidayName: (date: string) => string | null;
  onSetStatus: (date: string, status: AvailabilityValue) => void;
  onClearStatus: (date: string) => void;
  pendingDate: string | null;
}

export default function WeeklyCalendar({
  days,
  statusFor,
  isExplicit,
  isWeekend,
  isToday,
  holidayName,
  onSetStatus,
  onClearStatus,
  pendingDate,
}: WeeklyCalendarProps): JSX.Element {
  const [openDate, setOpenDate] = useState<string | null>(null);
  const pickerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenDate(null);
      }
    };

    const onClickOutside = (event: MouseEvent) => {
      if (!openDate) {
        return;
      }

      if (pickerRef.current && event.target instanceof Node && pickerRef.current.contains(event.target)) {
        return;
      }

      setOpenDate(null);
    };

    document.addEventListener('keydown', onEscape);
    document.addEventListener('mousedown', onClickOutside);

    return () => {
      document.removeEventListener('keydown', onEscape);
      document.removeEventListener('mousedown', onClickOutside);
    };
  }, [openDate]);

  const handleSetStatus = (date: string, status: AvailabilityValue) => {
    onSetStatus(date, status);
    setOpenDate(null);
  };

  const handleClearStatus = (date: string) => {
    onClearStatus(date);
    setOpenDate(null);
  };

  return (
    <section className="calendar-grid" aria-label="Weekly calendar">
      {days.map((day) => {
        const status = statusFor(day.date);
        const explicit = isExplicit(day.date);
        const holiday = holidayName(day.date);
        const isPending = pendingDate === day.date;
        const cellClassName = [
          'calendar-cell',
          isWeekend(day.date) ? 'calendar-cell-weekend' : '',
          isToday(day.date) ? 'calendar-cell-today' : '',
        ]
          .filter(Boolean)
          .join(' ');
        const badgeClassName = [
          'calendar-status-badge',
          explicit ? `status-${status.toLowerCase()}` : 'status-default',
        ].join(' ');

        return (
          <article
            key={day.date}
            className={cellClassName}
            role="button"
            tabIndex={0}
            onClick={() => setOpenDate(day.date)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                setOpenDate(day.date);
              }
            }}
            aria-label={`${day.dayName} ${day.monthName} ${day.dayNumber}`}
          >
            <div className="calendar-cell-header">
              <span className="calendar-cell-day">{day.dayName}</span>
              <span className="calendar-cell-date">{day.dayNumber}</span>
            </div>

            <div className="calendar-cell-body">
              <span className={badgeClassName}>{isPending ? '...' : status}</span>
            </div>

            {holiday ? <div className="calendar-cell-footer">{holiday}</div> : null}

            {openDate === day.date ? (
              <div
                className="calendar-picker"
                ref={pickerRef}
                onClick={(event) => event.stopPropagation()}
              >
                <button
                  type="button"
                  className="pick-w"
                  disabled={isPending}
                  onClick={() => handleSetStatus(day.date, 'W')}
                >
                  W
                </button>
                <button
                  type="button"
                  className="pick-v"
                  disabled={isPending}
                  onClick={() => handleSetStatus(day.date, 'V')}
                >
                  V
                </button>
                <button
                  type="button"
                  className="pick-a"
                  disabled={isPending}
                  onClick={() => handleSetStatus(day.date, 'A')}
                >
                  A
                </button>
                <button
                  type="button"
                  className="pick-clear"
                  disabled={isPending}
                  onClick={() => handleClearStatus(day.date)}
                >
                  Clear
                </button>
              </div>
            ) : null}
          </article>
        );
      })}
    </section>
  );
}