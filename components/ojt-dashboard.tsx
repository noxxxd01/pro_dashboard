'use client';

import React, { useState, useTransition } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { Button } from './ui/button';
import { Scan, Trash, X } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Field } from './ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './ui/alert-dialog';
import { toast } from 'sonner';
import { Bar, BarChart, CartesianGrid, LabelList, XAxis } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from './ui/chart';
import { format } from 'date-fns';
import { clearAllAttendanceLogs } from '@/app/actions/attendance-actions';
import { ScanDialog } from './scan-dialog';
import { useRouter } from 'next/navigation';

interface OJTMetric {
  id: string;
  title: string;
  value: number | string;
  description: string;
}

interface AttendanceLogItem {
  id: string;
  student: { fullName: string; school: string; studentNumber: string };
  timeIn: Date | null;
  breakIn: Date | null;
  breakOut: Date | null;
  timeOut: Date | null;
  hoursRendered: number;
  status: string;
}

interface OJTDashboardProps {
  logs: AttendanceLogItem[];
}

function getStatusVariant(status: string) {
  switch (status) {
    case 'Present':
      return 'default';
    case 'On Break':
      return 'outline';
    case 'Absent':
      return 'destructive';
    default:
      return 'outline';
  }
}

function formatTime(date: Date | null) {
  return date ? format(date, 'h:mm a') : '—';
}

const chartConfig = {
  hours: {
    label: 'Hours Rendered',
    color: 'var(--chart-1)',
  },
} satisfies ChartConfig;

export default function OJTDashboard({ logs: initialLogs }: OJTDashboardProps) {
  const [scanOpen, setScanOpen] = useState(false);
  const router = useRouter();

  const [logs, setLogs] = useState(initialLogs);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isPending, startTransition] = useTransition();

  const totalStudents = new Set(logs.map((l) => l.student.studentNumber)).size;
  const presentToday = logs.filter(
    (l) => l.status === 'Present' || l.status === 'On Break',
  ).length;
  const completedToday = logs.filter((l) => l.timeOut !== null).length;

  const ojtMetrics: OJTMetric[] = [
    {
      id: 'total-students',
      title: 'Total OJT Students',
      value: totalStudents,
      description: 'Students with logged attendance.',
    },
    {
      id: 'present-today',
      title: 'Present Today',
      value: presentToday,
      description: 'Students who have timed in today.',
    },
    {
      id: 'completed-students',
      title: "Completed Today's Log",
      value: completedToday,
      description: 'Students who have timed out today.',
    },
  ];

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      search.trim() === '' ||
      log.student.fullName.toLowerCase().includes(search.toLowerCase()) ||
      log.student.studentNumber.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleClearAll = () => {
    startTransition(async () => {
      const result = await clearAllAttendanceLogs();
      if (result.success) {
        setLogs([]);
        toast.success('All logs cleared');
      } else {
        toast.error(result.error ?? 'Something went wrong');
      }
    });
  };

  const hasActiveFilters = search.trim() !== '' || statusFilter !== 'all';

  const chartData = logs.map((log) => ({
    student: log.student.fullName.split(' ')[0], // first name for compact x-axis labels
    hours: log.hoursRendered,
  }));

  const handleScanSuccess = () => {
    router.refresh(); // re-fetch server data so the table/chart update with the new log
  };

  return (
    <main className='flex flex-col gap-4'>
      <div className='flex flex-row justify-between items-end'>
        <div>
          <h2 className='text-xl font-semibold'>OJT Dashboard</h2>
          <p className='text-sm text-muted-foreground'>
            Monitor student attendance and rendered hours.
          </p>
        </div>
        <Button onClick={() => setScanOpen(true)}>
          <Scan className='w-4 h-4' /> Scan
        </Button>
      </div>

      <div className='grid grid-cols-3 gap-4'>
        {ojtMetrics.map((item) => (
          <Card key={item.id} className='col-span-1'>
            <CardHeader>
              <CardTitle>{item.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardTitle className='text-3xl'>{item.value}</CardTitle>
              <CardDescription>{item.description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className='flex flex-row items-center justify-between gap-2'>
        <div className='flex flex-row items-center gap-2'>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className='w-36'>
              <SelectValue placeholder='Status' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Status</SelectItem>
              <SelectItem value='Present'>Present</SelectItem>
              <SelectItem value='On Break'>On Break</SelectItem>
              <SelectItem value='Absent'>Absent</SelectItem>
            </SelectContent>
          </Select>

          <Field orientation='horizontal' className='w-64'>
            <Input
              type='search'
              placeholder='Search student name or number...'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </Field>

          {hasActiveFilters && (
            <Button
              variant='ghost'
              size='sm'
              onClick={() => {
                setSearch('');
                setStatusFilter('all');
              }}
            >
              <X className='w-4 h-4' /> Clear filters
            </Button>
          )}
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant='outline'
              className='text-destructive'
              disabled={isPending}
            >
              <Trash className='w-4 h-4' /> Clear All Logs
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Clear all attendance logs?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently remove all
                attendance records shown in this table.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleClearAll}
                className='bg-destructive text-white hover:bg-destructive/90'
              >
                Clear All
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className='w-full min-w-0 overflow-x-auto border rounded-base custom-scrollbar'>
        <Table className='w-max min-w-full'>
          <TableHeader className='bg-gray-100'>
            <TableRow>
              <TableHead className='w-25'>Stu ID</TableHead>
              <TableHead>Student Name</TableHead>
              <TableHead>School</TableHead>
              <TableHead>Time In</TableHead>
              <TableHead>Break In</TableHead>
              <TableHead>Break Out</TableHead>
              <TableHead>Time Out</TableHead>
              <TableHead>Hours Rendered</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className='text-center text-muted-foreground py-8'
                >
                  {logs.length === 0
                    ? 'No attendance logs.'
                    : 'No logs match your search/filter.'}
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className='font-medium py-4'>
                    {log.student.studentNumber}
                  </TableCell>
                  <TableCell>{log.student.fullName}</TableCell>
                  <TableCell>{log.student.school}</TableCell>
                  <TableCell>{formatTime(log.timeIn)}</TableCell>
                  <TableCell>{formatTime(log.breakIn)}</TableCell>
                  <TableCell>{formatTime(log.breakOut)}</TableCell>
                  <TableCell>{formatTime(log.timeOut)}</TableCell>
                  <TableCell>
                    {log.hoursRendered > 0 ? `${log.hoursRendered}h` : '—'}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={getStatusVariant(log.status)}
                      className='rounded-full'
                    >
                      {log.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Hours Rendered per Student</CardTitle>
          <CardDescription>Cumulative OJT hours logged so far</CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <p className='text-sm text-muted-foreground text-center py-8'>
              No data available.
            </p>
          ) : (
            <ChartContainer config={chartConfig} className='h-60 w-full'>
              <BarChart
                accessibilityLayer
                data={chartData}
                margin={{ top: 20 }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey='student'
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Bar dataKey='hours' fill='var(--color-hours)'>
                  <LabelList
                    position='top'
                    offset={12}
                    className='fill-foreground'
                    fontSize={12}
                    formatter={(value: React.ReactNode) => {
                      const num =
                        typeof value === 'number' ? value : Number(value);
                      return num > 0 ? `${num}h` : '';
                    }}
                  />
                </Bar>
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      <ScanDialog
        open={scanOpen}
        onOpenChange={setScanOpen}
        onScanSuccess={handleScanSuccess}
      />
    </main>
  );
}
