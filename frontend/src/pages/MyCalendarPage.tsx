import { useContext, useEffect, useMemo, useState } from 'react';
import WeeklyCalendar from '../components/WeeklyCalendar';
import { AuthContext } from '../context/AuthContext';
import type { AvailabilityValue, PublicHoliday, WorkSchedule } from '../lib/api.models';
import * as matrixService from '../services/matrix.service';

interface WeekDayView {
  date: string;
  dayName: string;
  dayNumber: number;
  monthName: string;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function startOfWeekMonday(baseDate: Date): Date {
  const monday = new Date(baseDate);
  const day = monday.getDay();
  const delta = day === 0 ? -6 : 1 - day;
  monday.setDate(monday.getDate() + delta);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function weekDatesFromStart(start: Date): string[] {
  return Array.from({ length: 7 }, (_, index) => toIsoDate(addDays(start, index)));
}

function isWorkingDay(schedule: WorkSchedule | null, date: string): boolean {
  const dayOfWeek = new Date(`${date}T00:00:00`).getDay();
  const fallback = [false, true, true, true, true, true, false];

  if (!schedule) {
    return fallback[dayOfWeek];
  }

  const flags = [
    schedule.sunday,
    schedule.monday,
    schedule.tuesday,
    schedule.wednesday,
    schedule.thursday,
    schedule.friday,
    schedule.saturday,
  ];

  return flags[dayOfWeek];
}

export default function MyCalendarPage(): JSX.Element {
  const { currentUser } = useContext(AuthContext);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => startOfWeekMonday(new Date()));
  const [entryMap, setEntryMap] = useState<Map<string, AvailabilityValue>>(new Map());
  const [userSchedule, setUserSchedule] = useState<WorkSchedule | null>(null);
  const [holidayNameMap, setHolidayNameMap] = useState<Map<string, string>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [pendingDate, setPendingDate] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const weekDates = useMemo(() => weekDatesFromStart(currentWeekStart), [currentWeekStart]);

  const days = useMemo<WeekDayView[]>(
    () =>
      weekDates.map((date) => {
        const parsed = new Date(`${date}T00:00:00`);
        return {
          date,
          dayName: DAY_NAMES[parsed.getDay()],
          dayNumber: parsed.getDate(),
          monthName: MONTH_NAMES[parsed.getMonth()],
        };
      }),
    [weekDates]
  );

  const weekLabel = useMemo(() => {
    const first = new Date(`${weekDates[0]}T00:00:00`);
    const last = new Date(`${weekDates[6]}T00:00:00`);
    const startLabel = `${MONTH_NAMES[first.getMonth()]} ${first.getDate()}`;
    const endLabel = `${MONTH_NAMES[last.getMonth()]} ${last.getDate()}, ${last.getFullYear()}`;
    return `${startLabel} - ${endLabel}`;
  }, [weekDates]);

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    let cancelled = false;

    const fetchWeekData = async () => {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const years = Array.from(new Set(weekDates.map((date) => Number(date.slice(0, 4)))));
        const matrices = await Promise.all(years.map((year) => matrixService.getMatrix(year)));

        if (cancelled) {
          return;
        }

        const weekSet = new Set(weekDates);
        const nextEntryMap = new Map<string, AvailabilityValue>();

        matrices
          .flatMap((matrix) => matrix.entries)
          .filter((entry) => entry.userId === currentUser.id && weekSet.has(entry.statusDate))
          .forEach((entry) => {
            nextEntryMap.set(entry.statusDate, entry.status);
          });

        setEntryMap(nextEntryMap);

        const schedule =
          matrices
            .flatMap((matrix) => matrix.workSchedules)
            .find((workSchedule) => workSchedule.userId === currentUser.id) ?? null;

        setUserSchedule(schedule);

        const locationId = currentUser.locationId;
        const holidays =
          locationId == null
            ? []
            : matrices
                .flatMap((matrix) => matrix.publicHolidays)
                .filter((holiday) => holiday.locationId === locationId && weekSet.has(holiday.holidayDate));

        const nextHolidayMap = new Map<string, string>();
        holidays.forEach((holiday: PublicHoliday) => {
          nextHolidayMap.set(holiday.holidayDate, holiday.name);
        });
        setHolidayNameMap(nextHolidayMap);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Failed to load calendar data.');
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void fetchWeekData();

    return () => {
      cancelled = true;
    };
  }, [currentUser, weekDates]);

  if (!currentUser) {
    return <main className="my-calendar-page" />;
  }

  const statusFor = (date: string): AvailabilityValue => {
    const explicit = entryMap.get(date);
    if (explicit) {
      return explicit;
    }

    const isHoliday = holidayNameMap.has(date);
    if (isHoliday) {
      return 'A';
    }

    return isWorkingDay(userSchedule, date) ? 'W' : 'A';
  };

  const isExplicit = (date: string): boolean => entryMap.has(date);

  const isWeekend = (date: string): boolean => {
    const day = new Date(`${date}T00:00:00`).getDay();
    return day === 0 || day === 6;
  };

  const todayIso = toIsoDate(new Date());
  const isToday = (date: string): boolean => date === todayIso;

  const holidayName = (date: string): string | null => holidayNameMap.get(date) ?? null;

  const handleSetStatus = async (date: string, status: AvailabilityValue) => {
    const previous = entryMap.get(date);

    setPendingDate(date);
    setErrorMessage('');
    setSuccessMessage('');
    setEntryMap((prev) => {
      const next = new Map(prev);
      next.set(date, status);
      return next;
    });

    try {
      await matrixService.updateStatus(date, status);
      setSuccessMessage(`Saved ${status} for ${date}.`);
    } catch (error) {
      setEntryMap((prev) => {
        const next = new Map(prev);
        if (previous) {
          next.set(date, previous);
        } else {
          next.delete(date);
        }
        return next;
      });
      setErrorMessage(error instanceof Error ? error.message : 'Failed to save status.');
    } finally {
      setPendingDate(null);
    }
  };

  const handleClearStatus = async (date: string) => {
    const previous = entryMap.get(date);

    setPendingDate(date);
    setErrorMessage('');
    setSuccessMessage('');
    setEntryMap((prev) => {
      const next = new Map(prev);
      next.delete(date);
      return next;
    });

    try {
      await matrixService.deleteStatus(date);
      setSuccessMessage(`Cleared status for ${date}.`);
    } catch (error) {
      setEntryMap((prev) => {
        const next = new Map(prev);
        if (previous) {
          next.set(date, previous);
        }
        return next;
      });
      setErrorMessage(error instanceof Error ? error.message : 'Failed to clear status.');
    } finally {
      setPendingDate(null);
    }
  };

  const showPreviousWeek = () => {
    setCurrentWeekStart((prev) => addDays(prev, -7));
  };

  const showNextWeek = () => {
    setCurrentWeekStart((prev) => addDays(prev, 7));
  };

  return (
    <main className="my-calendar-page">
      <header className="my-calendar-header">
        <h1>My Calendar</h1>
        <div className="my-calendar-nav">
          <button type="button" onClick={showPreviousWeek}>
            Previous
          </button>
          <span>{weekLabel}</span>
          <button type="button" onClick={showNextWeek}>
            Next
          </button>
        </div>
      </header>

      {errorMessage ? <p className="message error">{errorMessage}</p> : null}
      {successMessage ? <p className="message success">{successMessage}</p> : null}
      {isLoading ? <p className="message">Loading calendar...</p> : null}

      <WeeklyCalendar
        days={days}
        statusFor={statusFor}
        isExplicit={isExplicit}
        isWeekend={isWeekend}
        isToday={isToday}
        holidayName={holidayName}
        onSetStatus={handleSetStatus}
        onClearStatus={handleClearStatus}
        pendingDate={pendingDate}
      />
    </main>
  );
}