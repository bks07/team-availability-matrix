import { useContext, useEffect, useMemo, useState } from 'react';
import MonthlyCalendar, { type CalendarWeek } from '../components/MonthlyCalendar';
import { AuthContext } from '../context/AuthContext';
import type { AvailabilityValue, PublicHoliday, WorkSchedule } from '../lib/api.models';
import * as matrixService from '../services/matrix.service';

interface CurrentMonth {
  year: number;
  month: number;
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function startOfWeekMonday(date: Date): Date {
  const monday = new Date(date);
  monday.setHours(0, 0, 0, 0);

  const day = monday.getDay();
  const delta = day === 0 ? -6 : 1 - day;
  monday.setDate(monday.getDate() + delta);
  return monday;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
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
  const [currentMonth, setCurrentMonth] = useState<CurrentMonth>(() => {
    const today = new Date();
    return { year: today.getFullYear(), month: today.getMonth() };
  });
  const [entryMap, setEntryMap] = useState<Map<string, AvailabilityValue>>(new Map());
  const [userSchedule, setUserSchedule] = useState<WorkSchedule | null>(null);
  const [holidayNameMap, setHolidayNameMap] = useState<Map<string, string>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [pendingDate, setPendingDate] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const weeks = useMemo<CalendarWeek[]>(() => {
    const firstOfMonth = new Date(currentMonth.year, currentMonth.month, 1);
    firstOfMonth.setHours(0, 0, 0, 0);

    const lastOfMonth = new Date(currentMonth.year, currentMonth.month + 1, 0);
    lastOfMonth.setHours(0, 0, 0, 0);

    const gridStart = startOfWeekMonday(firstOfMonth);
    const gridEnd = new Date(lastOfMonth);
    const endDay = gridEnd.getDay();
    const daysUntilSunday = endDay === 0 ? 0 : 7 - endDay;
    gridEnd.setDate(gridEnd.getDate() + daysUntilSunday);

    const computedWeeks: CalendarWeek[] = [];
    let cursor = new Date(gridStart);

    while (cursor <= gridEnd) {
      const days = Array.from({ length: 7 }, (_, index) => {
        const dayDate = addDays(cursor, index);
        return {
          date: toIsoDate(dayDate),
          dayOfMonth: dayDate.getDate(),
          isCurrentMonth: dayDate.getMonth() === currentMonth.month,
        };
      });

      computedWeeks.push({ days });
      cursor = addDays(cursor, 7);
    }

    return computedWeeks;
  }, [currentMonth]);

  const visibleDates = useMemo(
    () => weeks.flatMap((week) => week.days.map((day) => day.date)),
    [weeks]
  );

  const monthLabel = useMemo(
    () => `${MONTH_NAMES[currentMonth.month]} ${currentMonth.year}`,
    [currentMonth]
  );

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    let cancelled = false;

    const fetchMonthData = async () => {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const years = Array.from(new Set(visibleDates.map((date) => Number(date.slice(0, 4)))));
        const matrices = await Promise.all(years.map((year) => matrixService.getMatrix(year)));

        if (cancelled) {
          return;
        }

        const visibleDateSet = new Set(visibleDates);
        const nextEntryMap = new Map<string, AvailabilityValue>();

        matrices
          .flatMap((matrix) => matrix.entries)
          .filter((entry) => entry.userId === currentUser.id && visibleDateSet.has(entry.statusDate))
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
                .filter((holiday) => holiday.locationId === locationId && visibleDateSet.has(holiday.holidayDate));

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

    void fetchMonthData();

    return () => {
      cancelled = true;
    };
  }, [currentUser, visibleDates]);

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

  const holidayNameFor = (date: string): string | null => holidayNameMap.get(date) ?? null;

  const isHoliday = (date: string): boolean => holidayNameMap.has(date);

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

  const goToPreviousMonth = () => {
    setCurrentMonth((prev) => {
      const monthDate = new Date(prev.year, prev.month - 1, 1);
      return { year: monthDate.getFullYear(), month: monthDate.getMonth() };
    });
  };

  const goToNextMonth = () => {
    setCurrentMonth((prev) => {
      const monthDate = new Date(prev.year, prev.month + 1, 1);
      return { year: monthDate.getFullYear(), month: monthDate.getMonth() };
    });
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth({ year: today.getFullYear(), month: today.getMonth() });
  };

  return (
    <main className="my-calendar-page">
      <header className="my-calendar-header">
        <h1>My Calendar</h1>
      </header>

      {errorMessage ? <p className="message error">{errorMessage}</p> : null}
      {successMessage ? <p className="message success">{successMessage}</p> : null}
      {isLoading ? <p className="message">Loading calendar...</p> : null}

      <MonthlyCalendar
        monthLabel={monthLabel}
        weeks={weeks}
        statusFor={statusFor}
        isExplicit={isExplicit}
        isWeekend={isWeekend}
        isToday={isToday}
        isHoliday={isHoliday}
        holidayNameFor={holidayNameFor}
        onSetStatus={handleSetStatus}
        onClearStatus={handleClearStatus}
        pendingDate={pendingDate}
        onPreviousMonth={goToPreviousMonth}
        onNextMonth={goToNextMonth}
        onToday={goToToday}
      />
    </main>
  );
}