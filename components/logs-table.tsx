'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { Badge } from './ui/badge';
import { PaginationComponent } from './pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { format } from 'date-fns';

interface LogItem {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  summary: string;
  createdAt: Date;
}

interface LogsTableProps {
  logs: LogItem[];
  currentPage: number;
  totalPages: number;
  entityTypes: string[];
}

const ACTION_STYLES: Record<string, string> = {
  created: 'bg-green-100 text-green-800 border-green-200',
  updated: 'bg-amber-100 text-amber-800 border-amber-200',
  deleted: 'bg-red-100 text-red-800 border-red-200',
};

export default function LogsTable({
  logs,
  currentPage,
  totalPages,
  entityTypes,
}: LogsTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateFilter = (key: 'entityType' | 'action', value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'all') {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    params.set('page', '1');
    router.push(`?${params.toString()}`);
  };

  return (
    <div className='flex flex-col gap-4'>
      <div className='flex flex-row items-center gap-2'>
        <Select
          value={searchParams.get('entityType') ?? 'all'}
          onValueChange={(value) => updateFilter('entityType', value)}
        >
          <SelectTrigger className='w-56'>
            <SelectValue placeholder='Entity Type' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Entity Types</SelectItem>
            {entityTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={searchParams.get('action') ?? 'all'}
          onValueChange={(value) => updateFilter('action', value)}
        >
          <SelectTrigger className='w-40'>
            <SelectValue placeholder='Action' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Actions</SelectItem>
            <SelectItem value='created'>Created</SelectItem>
            <SelectItem value='updated'>Updated</SelectItem>
            <SelectItem value='deleted'>Deleted</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className='w-full min-w-0 overflow-x-auto border rounded-base custom-scrollbar'>
        <Table className='w-max min-w-full'>
          <TableHeader className='bg-gray-100'>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Entity Type</TableHead>
              <TableHead>Summary</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className='text-center text-muted-foreground py-8'
                >
                  No activity recorded yet.
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    {format(log.createdAt, 'MMM d, yyyy h:mm a')}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant='outline'
                      className={
                        ACTION_STYLES[log.action] ??
                        'bg-gray-100 text-gray-800 border-gray-200'
                      }
                    >
                      {log.action}
                    </Badge>
                  </TableCell>
                  <TableCell>{log.entityType}</TableCell>
                  <TableCell>{log.summary}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className='flex justify-end w-full min-w-0'>
        <PaginationComponent
          currentPage={currentPage}
          totalPages={totalPages}
        />
      </div>
    </div>
  );
}
