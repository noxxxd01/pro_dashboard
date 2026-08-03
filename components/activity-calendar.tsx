'use client';

import { useState } from 'react';
import {
  addMonths,
  eachDayOfInterval,
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  getDay,
  getYear,
  isSameMonth,
  isToday,
  isWithinInterval,
  startOfDay,
  startOfMonth,
  startOfWeek,
  setYear,
  subMonths,
} from 'date-fns';
import {
  CalendarRange,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { getStatusBadgeColor } from '@/lib/badge-colors';
import { cn } from '@/lib/utils';

interface CalendarActivity {
  id: string;
  activityName: string;
  dateFrom: Date | null;
  dateTo: Date | null;
  status: string | null;
  projectName: string | null;
}

interface ActivityCalendarProps {
  activities: CalendarActivity[];
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MAX_LANES = 3;
const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 6 }, (_, i) => CURRENT_YEAR - 3 + i);

function isCompleted(status: string | null) {
  const s = status?.toLowerCase().trim();
  return s === 'completed' || s === 'done';
}

function isCancelled(status: string | null) {
  const s = status?.toLowerCase().trim();
  return s === 'cancelled' || s === 'canceled' || s === 'postponed';
}

function pillClasses(status: string | null) {
  if (isCompleted(status)) {
    return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-900';
  }
  if (isCancelled(status)) {
    return 'bg-red-100 text-red-800 border-red-200 line-through dark:bg-red-950 dark:text-red-300 dark:border-red-900';
  }
  return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-900';
}

function activityRange(activity: CalendarActivity) {
  if (!activity.dateFrom) return null;
  const start = startOfDay(activity.dateFrom);
  const end = endOfDay(activity.dateTo ?? activity.dateFrom);
  if (end < start) return null;
  return { start, end };
}

function activitiesOnDay(activities: CalendarActivity[], day: Date) {
  return activities.filter((a) => {
    const range = activityRange(a);
    return range && isWithinInterval(day, range);
  });
}

function formatActivityDates(activity: CalendarActivity) {
  if (!activity.dateFrom) return '—';
  const from = format(activity.dateFrom, 'MMM d, yyyy');
  const to = activity.dateTo ? format(activity.dateTo, 'MMM d, yyyy') : null;
  return to && to !== from ? `${from} – ${to}` : from;
}

function chunkIntoWeeks(days: Date[]): Date[][] {
  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }
  return weeks;
}

interface PlacedBar {
  activity: CalendarActivity;
  startCol: number;
  span: number;
  lane: number;
}

// Places each activity that overlaps this week into a lane (row) so a
// multi-day event renders as ONE element spanning its columns — a
// continuous bar — instead of a separate pill repeated in each day cell.
// Lanes beyond MAX_LANES overflow into a per-day "+N more" popover.
function placeBarsForWeek(activities: CalendarActivity[], week: Date[]) {
  const weekStart = week[0];
  const weekEnd = endOfDay(week[6]);

  const spans = activities
    .map((activity) => {
      const range = activityRange(activity);
      if (!range || range.end < weekStart || range.start > weekEnd) {
        return null;
      }
      const clampedStart = range.start < weekStart ? weekStart : range.start;
      const clampedEnd = range.end > weekEnd ? weekEnd : range.end;
      const startCol = getDay(clampedStart);
      const endCol = getDay(clampedEnd);
      return { activity, startCol, endCol, span: endCol - startCol + 1 };
    })
    .filter((s): s is NonNullable<typeof s> => s !== null)
    // Longer bars first so multi-day events claim a lane before single-day
    // ones fragment the packing.
    .sort((a, b) => b.span - a.span || a.startCol - b.startCol);

  const lanes: Array<Array<{ startCol: number; endCol: number }>> = [];
  const placed: PlacedBar[] = [];
  const visibleIdsByDay: Array<Set<string>> = Array.from(
    { length: 7 },
    () => new Set<string>(),
  );

  for (const item of spans) {
    let laneIndex = lanes.findIndex(
      (lane) =>
        !lane.some(
          (b) => item.startCol <= b.endCol && item.endCol >= b.startCol,
        ),
    );
    if (laneIndex === -1) {
      laneIndex = lanes.length;
      lanes.push([]);
    }
    if (laneIndex >= MAX_LANES) continue;

    lanes[laneIndex].push({ startCol: item.startCol, endCol: item.endCol });
    placed.push({
      activity: item.activity,
      startCol: item.startCol,
      span: item.span,
      lane: laneIndex,
    });
    for (let d = item.startCol; d <= item.endCol; d++) {
      visibleIdsByDay[d].add(item.activity.id);
    }
  }

  return { placed, visibleIdsByDay };
}

function EventBar({
  activity,
  startCol,
  span,
  lane,
}: PlacedBar) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type='button'
          style={{ gridColumn: `${startCol + 1} / span ${span}`, gridRow: lane + 2 }}
          className={cn(
            'flex items-center gap-1 border px-1.5 py-0.5 text-xs text-left cursor-pointer hover:opacity-80 mx-0.5',
            pillClasses(activity.status),
          )}
        >
          {isCompleted(activity.status) && (
            <CheckCircle2 className='h-3 w-3 shrink-0' />
          )}
          <span className='truncate'>{activity.activityName}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className='w-80 p-0' align='start'>
        <div className='flex flex-col items-start justify-between gap-2 border-b px-4 py-3'>
          <p className='text-sm font-semibold leading-snug'>
            {activity.activityName}
          </p>
          {activity.status && (
            <Badge
              variant='outline'
              className={cn('shrink-0', getStatusBadgeColor(activity.status))}
            >
              {activity.status}
            </Badge>
          )}
        </div>
        <div className='flex flex-col gap-2.5 px-4 py-3 text-xs'>
          <div className='flex items-center gap-2'>
            <CalendarRange className='h-3.5 w-3.5 shrink-0 text-muted-foreground' />
            <span>{formatActivityDates(activity)}</span>
          </div>
          {activity.projectName && (
            <div className='flex items-center gap-2'>
              <FolderOpen className='h-3.5 w-3.5 shrink-0 text-muted-foreground' />
              <span>{activity.projectName}</span>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function OverflowActivityRow({ activity }: { activity: CalendarActivity }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type='button'
          className={cn(
            'flex w-full items-center gap-1 border px-1.5 py-0.5 text-xs text-left cursor-pointer hover:opacity-80',
            pillClasses(activity.status),
          )}
        >
          {isCompleted(activity.status) && (
            <CheckCircle2 className='h-3 w-3 shrink-0' />
          )}
          <span className='truncate'>{activity.activityName}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className='w-80 p-0' align='start'>
        <div className='flex flex-col items-start justify-between gap-2 border-b px-4 py-3'>
          <p className='text-sm font-semibold leading-snug'>
            {activity.activityName}
          </p>
          {activity.status && (
            <Badge
              variant='outline'
              className={cn('shrink-0', getStatusBadgeColor(activity.status))}
            >
              {activity.status}
            </Badge>
          )}
        </div>
        <div className='flex flex-col gap-2.5 px-4 py-3 text-xs'>
          <div className='flex items-center gap-2'>
            <CalendarRange className='h-3.5 w-3.5 shrink-0 text-muted-foreground' />
            <span>{formatActivityDates(activity)}</span>
          </div>
          {activity.projectName && (
            <div className='flex items-center gap-2'>
              <FolderOpen className='h-3.5 w-3.5 shrink-0 text-muted-foreground' />
              <span>{activity.projectName}</span>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function WeekRow({
  week,
  activities,
  currentMonth,
}: {
  week: Date[];
  activities: CalendarActivity[];
  currentMonth: Date;
}) {
  const { placed, visibleIdsByDay } = placeBarsForWeek(activities, week);

  const hiddenByDay = week.map((day, i) =>
    activitiesOnDay(activities, day).filter(
      (a) => !visibleIdsByDay[i].has(a.id),
    ),
  );

  return (
    <div
      className='grid grid-cols-7 border-l'
      style={{
        gridTemplateRows: `22px repeat(${MAX_LANES}, 22px) auto`,
      }}
    >
      {week.map((day, i) => {
        const inMonth = isSameMonth(day, currentMonth);
        return (
          <div
            key={day.toISOString()}
            style={{ gridColumn: i + 1, gridRow: '1 / -1' }}
            className={cn(
              'border-r border-b',
              !inMonth && 'bg-muted/40',
            )}
          />
        );
      })}

      {week.map((day, i) => (
        <span
          key={`num-${day.toISOString()}`}
          style={{ gridColumn: i + 1, gridRow: 1 }}
          className={cn(
            'self-start justify-self-end text-xs px-1 mr-1 mt-0.5',
            !isSameMonth(day, currentMonth) && 'text-muted-foreground',
            isToday(day) &&
              'bg-primary text-primary-foreground font-semibold',
          )}
        >
          {format(day, 'd')}
        </span>
      ))}

      {placed.map((bar) => (
        <EventBar key={bar.activity.id} {...bar} />
      ))}

      {hiddenByDay.map((hidden, i) => {
        if (hidden.length === 0) return null;
        return (
          <Popover key={`more-${week[i].toISOString()}`}>
            <PopoverTrigger asChild>
              <button
                type='button'
                style={{ gridColumn: i + 1, gridRow: MAX_LANES + 2 }}
                className='mx-0.5 px-1 text-left text-xs text-muted-foreground cursor-pointer hover:text-foreground'
              >
                +{hidden.length} more
              </button>
            </PopoverTrigger>
            <PopoverContent className='w-72 p-0' align='start'>
              <div className='border-b px-4 py-2.5'>
                <p className='text-sm font-semibold'>
                  {format(week[i], 'MMMM d, yyyy')}
                </p>
                <p className='text-xs text-muted-foreground'>
                  {hidden.length} more{' '}
                  {hidden.length === 1 ? 'activity' : 'activities'}
                </p>
              </div>
              <div className='flex flex-col gap-1 p-2 max-h-64 overflow-y-auto'>
                {hidden.map((activity) => (
                  <OverflowActivityRow key={activity.id} activity={activity} />
                ))}
              </div>
            </PopoverContent>
          </Popover>
        );
      })}
    </div>
  );
}

export function ActivityCalendar({ activities }: ActivityCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(() => new Date());

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentMonth)),
    end: endOfWeek(endOfMonth(currentMonth)),
  });
  const weeks = chunkIntoWeeks(days);

  return (
    <Card className='py-4'>
      <CardContent className='flex flex-col gap-3 px-4'>
        <div className='flex items-center justify-between'>
          <h2 className='text-lg font-semibold'>
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <div className='flex items-center gap-1'>
            <div className='flex items-center gap-3 mr-4 text-xs text-muted-foreground'>
              <span className='flex items-center gap-1'>
                <span className='inline-block h-2.5 w-2.5 bg-emerald-500' />
                Completed
              </span>
              <span className='flex items-center gap-1'>
                <span className='inline-block h-2.5 w-2.5 bg-blue-500' />
                Scheduled
              </span>
              <span className='flex items-center gap-1'>
                <span className='inline-block h-2.5 w-2.5 bg-red-500' />
                Cancelled
              </span>
            </div>

            <Select
              value={String(getYear(currentMonth))}
              onValueChange={(value) =>
                setCurrentMonth((m) => setYear(m, Number(value)))
              }
            >
              <SelectTrigger size='sm' className='w-24'>
                <SelectValue placeholder='Year' />
              </SelectTrigger>
              <SelectContent>
                {YEAR_OPTIONS.map((year) => (
                  <SelectItem key={year} value={String(year)}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant='outline'
              size='sm'
              onClick={() => setCurrentMonth(new Date())}
            >
              Today
            </Button>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
              aria-label='Previous month'
            >
              <ChevronLeft className='h-4 w-4' />
            </Button>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
              aria-label='Next month'
            >
              <ChevronRight className='h-4 w-4' />
            </Button>
          </div>
        </div>

        <div className='flex flex-col'>
          <div className='grid grid-cols-7 border-t border-l'>
            {WEEKDAYS.map((day) => (
              <div
                key={day}
                className='border-r border-b bg-muted px-2 py-1.5 text-xs font-medium text-muted-foreground'
              >
                {day}
              </div>
            ))}
          </div>

          {weeks.map((week) => (
            <WeekRow
              key={week[0].toISOString()}
              week={week}
              activities={activities}
              currentMonth={currentMonth}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
