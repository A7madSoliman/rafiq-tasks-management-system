'use client';

import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import RangePrevious from '@/assets/icons/statistics/range-previous.svg';
import RangeNext from '@/assets/icons/statistics/range-next.svg';
import MonthPrevious from '@/assets/icons/statistics/month-previous.svg';
import MonthNext from '@/assets/icons/statistics/month-next.svg';
import CalendarIcon from '@/assets/icons/statistics/mobile-calendar.svg';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { statisticsDateRangeSchema, type StatisticsDateRange } from '../schemas/statistics-schema';
import {
  calendarDate,
  formatStatisticsRange,
  monthDays,
  selectRangeDay,
  shiftCalendarDate,
  shiftCalendarMonth,
  shiftStatisticsWeek,
} from '../utils/statistics-dates';

type Props = { value: StatisticsDateRange; onChange: (range: StatisticsDateRange) => void };
const focusStyle =
  'focus-visible:outline-primary focus-visible:outline-2 focus-visible:outline-offset-2';
const selectableDay = (day: string) =>
  statisticsDateRangeSchema.safeParse({ p_start_date: day, p_end_date: day }).success;

export function StatisticsDateRange({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const id = useId();
  const close = useCallback((restoreFocus = true) => {
    setOpen(false);
    if (restoreFocus) triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    function dismissOutside(event: Event) {
      if (event.target instanceof Node && !wrapperRef.current?.contains(event.target)) close(false);
    }
    document.addEventListener('pointerdown', dismissOutside);
    document.addEventListener('focusin', dismissOutside);
    return () => {
      document.removeEventListener('pointerdown', dismissOutside);
      document.removeEventListener('focusin', dismissOutside);
    };
  }, [open, close]);

  function shift(direction: -1 | 1) {
    const next = shiftStatisticsWeek(value, direction);
    close(false);
    if (next) onChange(next);
  }

  return (
    <div ref={wrapperRef} className="order-3 min-w-0 lg:order-1">
      <div className="bg-surface-low flex min-w-0 items-center gap-1 rounded-md lg:gap-3 lg:bg-transparent">
        <button
          type="button"
          aria-label="Previous week"
          onClick={() => shift(-1)}
          disabled={!shiftStatisticsWeek(value, -1)}
          className={cn(
            'hidden h-6 w-5 shrink-0 items-center justify-center rounded-xs disabled:opacity-40 lg:flex',
            focusStyle,
          )}
        >
          <RangePrevious aria-hidden="true" />
        </button>
        <button
          ref={triggerRef}
          type="button"
          aria-expanded={open}
          aria-controls={id}
          aria-haspopup="dialog"
          aria-label={`Choose date range: ${formatStatisticsRange(value)}`}
          onClick={() => (open ? close() : setOpen(true))}
          className={cn(
            'text-foreground flex min-h-11 w-full min-w-0 items-center gap-2 rounded-md px-4 text-xs font-bold lg:min-h-9 lg:w-auto lg:px-0 lg:text-sm',
            focusStyle,
          )}
        >
          <span className="shrink-0 lg:hidden">
            <CalendarIcon aria-hidden="true" />
          </span>
          <span className="truncate lg:hidden">{formatStatisticsRange(value, false)}</span>
          <span className="hidden lg:inline">{formatStatisticsRange(value)}</span>
        </button>
        <button
          type="button"
          aria-label="Next week"
          onClick={() => shift(1)}
          disabled={!shiftStatisticsWeek(value, 1)}
          className={cn(
            'hidden h-6 w-5 shrink-0 items-center justify-center rounded-xs disabled:opacity-40 lg:flex',
            focusStyle,
          )}
        >
          <RangeNext aria-hidden="true" />
        </button>
      </div>
      {open && (
        <RangeCalendar
          id={id}
          value={value}
          anchorRef={wrapperRef}
          onClose={close}
          onApply={(range) => {
            onChange(range);
            close();
          }}
        />
      )}
    </div>
  );
}

export function RangeCalendar({
  id,
  value,
  anchorRef,
  onClose,
  onApply,
}: {
  id: string;
  value: StatisticsDateRange;
  anchorRef: { current: HTMLElement | null };
  onClose: (restoreFocus?: boolean) => void;
  onApply: (range: StatisticsDateRange) => void;
}) {
  const [draft, setDraft] = useState(value);
  const [focusedDay, setFocusedDay] = useState(value.p_start_date);
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const days = monthDays(focusedDay);
  const month = focusedDay.slice(0, 7);
  const previousMonth = shiftCalendarMonth(focusedDay, -1);
  const nextMonth = shiftCalendarMonth(focusedDay, 1);
  const positioned = position !== null;
  const parsed = statisticsDateRangeSchema.safeParse(draft);
  const validationMessage = parsed.success
    ? null
    : !draft.p_end_date
      ? 'Select an end date.'
      : 'Choose 1-7 days, with the end on or after the start.';
  const label = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(calendarDate(focusedDay));

  useEffect(() => {
    if (positioned)
      popupRef.current?.querySelector<HTMLButtonElement>(`[data-day="${focusedDay}"]`)?.focus();
  }, [focusedDay, positioned]);

  useEffect(() => {
    function reposition() {
      const anchor = anchorRef.current?.getBoundingClientRect();
      const popup = popupRef.current?.getBoundingClientRect();
      if (!anchor || !popup) return;
      const below = anchor.bottom + 8;
      setPosition({
        left: Math.max(16, Math.min(anchor.left, window.innerWidth - popup.width - 16)),
        top: Math.max(
          16,
          Math.min(
            below + popup.height <= window.innerHeight - 16 ? below : anchor.top - popup.height - 8,
            window.innerHeight - popup.height - 16,
          ),
        ),
      });
    }
    const frame = requestAnimationFrame(reposition);
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, true);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', reposition);
      window.removeEventListener('scroll', reposition, true);
    };
  }, [anchorRef, month, validationMessage]);

  function navigate(event: KeyboardEvent<HTMLButtonElement>, day: string) {
    const weekday = (calendarDate(day).getUTCDay() + 6) % 7;
    const offsets: Record<string, number> = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -7,
      ArrowDown: 7,
      Home: -weekday,
      End: 6 - weekday,
    };
    const next =
      event.key === 'PageUp'
        ? shiftCalendarMonth(day, -1)
        : event.key === 'PageDown'
          ? shiftCalendarMonth(day, 1)
          : event.key in offsets
            ? shiftCalendarDate(day, offsets[event.key])
            : null;
    if (!next) return;
    event.preventDefault();
    if (selectableDay(next)) setFocusedDay(next);
  }

  return (
    <div
      ref={popupRef}
      id={id}
      role="dialog"
      aria-labelledby={`${id}-month`}
      aria-describedby={`${id}-help`}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          event.stopPropagation();
          onClose();
        }
      }}
      style={{
        left: position?.left ?? 16,
        top: position?.top ?? 16,
        visibility: position ? 'visible' : 'hidden',
      }}
      className="bg-surface/70 border-surface/40 fixed z-50 flex max-h-[calc(100dvh-32px)] w-[320px] max-w-[calc(100vw-32px)] flex-col gap-4 overflow-y-auto rounded-md border p-[21px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] backdrop-blur-[10px]"
    >
      <div className="flex items-center justify-between">
        <h2 id={`${id}-month`} aria-live="polite" className="text-foreground text-base font-bold">
          {label}
        </h2>
        <div className="flex gap-1">
          <button
            type="button"
            aria-label="Previous month"
            disabled={!selectableDay(previousMonth)}
            onClick={() => setFocusedDay(previousMonth)}
            className={cn(
              'flex size-11 items-center justify-center rounded-xs lg:h-6 lg:w-5',
              focusStyle,
            )}
          >
            <MonthPrevious aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Next month"
            disabled={!selectableDay(nextMonth)}
            onClick={() => setFocusedDay(nextMonth)}
            className={cn(
              'flex size-11 items-center justify-center rounded-xs lg:h-6 lg:w-5',
              focusStyle,
            )}
          >
            <MonthNext aria-hidden="true" />
          </button>
        </div>
      </div>
      <p id={`${id}-help`} className="sr-only">
        Select a start date, then an end date, up to seven days inclusive. Use arrow keys to move by
        day or week, Home and End for the week, Page Up and Page Down for the month. Escape cancels.
      </p>
      <div role="grid" aria-label="Choose date range" aria-multiselectable="true">
        <div role="row" className="mb-1 grid grid-cols-7 gap-1">
          {['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'].map((day) => (
            <span
              key={day}
              role="columnheader"
              className="text-task-status-todo text-center text-[10px] font-bold"
            >
              {day}
            </span>
          ))}
        </div>
        {Array.from({ length: days.length / 7 }, (_, row) => (
          <div role="row" key={row} className="grid grid-cols-7 gap-1">
            {days.slice(row * 7, row * 7 + 7).map((day) => {
              const selected =
                day === draft.p_start_date ||
                day === draft.p_end_date ||
                (day >= draft.p_start_date && day <= draft.p_end_date);
              return (
                <button
                  key={day}
                  type="button"
                  role="gridcell"
                  data-day={day}
                  aria-selected={selected}
                  disabled={!selectableDay(day)}
                  aria-label={new Intl.DateTimeFormat('en-US', {
                    dateStyle: 'full',
                    timeZone: 'UTC',
                  }).format(calendarDate(day))}
                  tabIndex={focusedDay === day ? 0 : -1}
                  onKeyDown={(event) => navigate(event, day)}
                  onClick={() => {
                    setFocusedDay(day);
                    setDraft((current) => selectRangeDay(current, day));
                  }}
                  className={cn(
                    'text-foreground my-0.5 min-h-11 min-w-0 rounded-xs text-xs lg:min-h-8',
                    focusStyle,
                    day.slice(0, 7) !== month && 'text-outline',
                    selected && 'bg-primary-container/20 text-primary font-bold',
                  )}
                >
                  {calendarDate(day).getUTCDate()}
                </button>
              );
            })}
          </div>
        ))}
      </div>
      {validationMessage && (
        <p role="alert" className="text-error text-xs">
          {validationMessage}
        </p>
      )}
      <div className="border-outline/20 flex gap-2 border-t pt-4">
        <Button
          variant="secondary"
          className="text-foreground-muted min-h-11 flex-1 px-2 py-2 text-xs leading-4 font-medium lg:min-h-8"
          onClick={() => onClose()}
        >
          Cancel
        </Button>
        <Button
          className="min-h-11 flex-1 bg-[linear-gradient(135deg,var(--color-primary),var(--color-primary-container))] px-2 py-2 text-xs leading-4 disabled:cursor-not-allowed disabled:opacity-50 lg:min-h-8"
          disabled={!parsed.success}
          onClick={() => {
            if (parsed.success) onApply(parsed.data);
          }}
        >
          Apply Range
        </Button>
      </div>
    </div>
  );
}
