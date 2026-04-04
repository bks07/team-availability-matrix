import { useEffect, useRef, useState } from 'react';
import type { AvailabilityValue } from '../lib/api.models';

export interface CalendarDay {
  date: string;
  dayOfMonth: number;
  isCurrentMonth: boolean;
}

export interface CalendarWeek {
  weekNumber: number;
  days: CalendarDay[];
}

interface MonthlyCalendarProps {
  monthLabel: string;
  weeks: CalendarWeek[];
  statusFor: (date: string) => AvailabilityValue;
  isExplicit: (date: string) => boolean;
  isWeekend: (date: string) => boolean;
  isToday: (date: string) => boolean;
  isHoliday: (date: string) => boolean;
  holidayNameFor: (date: string) => string | null;
  onSetStatus: (date: string, status: AvailabilityValue) => void;
  onClearStatus: (date: string) => void;
  pendingDate: string | null;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  onShowLegend: () => void;
}

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function MonthlyCalendar({
  monthLabel,
  weeks,
  statusFor,
  isExplicit,
  isWeekend,
  isToday,
  isHoliday,
  holidayNameFor,
  onSetStatus,
  onClearStatus,
  pendingDate,
  onPreviousMonth,
  onNextMonth,
  onToday,
  onShowLegend,
}: MonthlyCalendarProps): JSX.Element {
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
    <section aria-label="Monthly calendar">
      <div className="my-calendar-nav my-calendar-nav-monthly">
        <button type="button" onClick={onShowLegend} className="my-calendar-nav-today">
          Legend
        </button>
        <button type="button" onClick={onPreviousMonth} aria-label="Previous month">
          {'<'}
        </button>
        <h2>{monthLabel}</h2>
        <button type="button" onClick={onNextMonth} aria-label="Next month">
          {'>'}
        </button>
        <button type="button" onClick={onToday} className="my-calendar-nav-today">
          Today
        </button>
      </div>

      <div className="monthly-calendar-wrapper">
        <div className="monthly-calendar-grid has-week-nums">
          <div className="monthly-header-row" role="row">
            <div className="monthly-header-cell monthly-header-cell-weeknum" aria-hidden="true" />
            {DAY_NAMES.map((dayName) => (
              <div key={dayName} className="monthly-header-cell" role="columnheader">
                {dayName}
              </div>
            ))}
          </div>

          {weeks.map((week) => [
            <div key={`week-num-${week.days[0]?.date ?? week.weekNumber}`} className="monthly-week-num" aria-hidden="true">
              {week.weekNumber}
            </div>,
            ...week.days.map((day) => {
              const status = statusFor(day.date);
              const explicit = isExplicit(day.date);
              const holidayName = holidayNameFor(day.date);
              const holiday = isHoliday(day.date);
              const pending = pendingDate === day.date;

              const cellClassName = [
                'calendar-cell',
                'monthly-cell',
                !day.isCurrentMonth ? 'calendar-cell-filler' : '',
                isWeekend(day.date) ? 'calendar-cell-weekend' : '',
                holiday ? 'calendar-cell-holiday' : '',
                isToday(day.date) ? 'calendar-cell-today' : '',
              ]
                .filter(Boolean)
                .join(' ');

              const badgeClassName = [
                'calendar-status-badge',
                `status-${status.toLowerCase()}`,
                explicit ? '' : 'status-default',
              ]
                .filter(Boolean)
                .join(' ');

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
                  aria-label={day.date}
                >
                  <div className="calendar-cell-header">
                    <span className="calendar-cell-date">{day.dayOfMonth}</span>
                  </div>

                  <div className="calendar-cell-body">
                    <span className={badgeClassName}>{pending ? '...' : status}</span>
                  </div>

                  {holidayName ? <div className="calendar-cell-holiday-text">{holidayName}</div> : null}

                  {openDate === day.date ? (
                    <div
                      className="calendar-picker"
                      ref={pickerRef}
                      onClick={(event) => event.stopPropagation()}
                    >
                      <button
                        type="button"
                        className="pick-w"
                        disabled={pending}
                        onClick={() => handleSetStatus(day.date, 'W')}
                      >
                        W
                      </button>
                      <button
                        type="button"
                        className="pick-v"
                        disabled={pending}
                        onClick={() => handleSetStatus(day.date, 'V')}
                      >
                        V
                      </button>
                      <button
                        type="button"
                        className="pick-a"
                        disabled={pending}
                        onClick={() => handleSetStatus(day.date, 'A')}
                      >
                        A
                      </button>
                      <button
                        type="button"
                        className="pick-clear"
                        disabled={pending}
                        onClick={() => handleClearStatus(day.date)}
                      >
                        Clear
                      </button>
                    </div>
                  ) : null}
                </article>
              );
            }),
          ])}
        </div>
      </div>
    </section>
  );
}
