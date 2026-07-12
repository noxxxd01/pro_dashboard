'use client';

import { useTransition } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { Button } from './ui/button';
import { EllipsisVertical, FileText, Trash } from 'lucide-react';
import { PaginationComponent } from './pagination';
import AddOutGoingLetterDialog from './add-out-going-dialog';
import { Badge } from './ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { deleteOutGoingLetter } from '@/app/actions/letter-actions';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface OutGoingLetterItem {
  id: string;
  responseLetterName: string;
  fileUrl: string | null;
  status: string;
  sentDate: Date | null;
  bureau: { id: string; name: string } | null;
  requestLetter: {
    id: string;
    name: string;
    fileUrl: string | null;
  };
}

interface OutGoingLettersProps {
  letters: OutGoingLetterItem[];
  currentPage: number;
  totalPages: number;
}

export default function OutGoingLetters({
  letters,
  currentPage,
  totalPages,
}: OutGoingLettersProps) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = (id: string, name: string) => {
    startTransition(async () => {
      const result = await deleteOutGoingLetter(id);
      if (result.success) {
        toast.success(`"${name}" deleted`);
      } else {
        toast.error(result.error ?? 'Something went wrong');
      }
    });
  };

  return (
    <div className='flex flex-col gap-2'>
      <div className='w-full min-w-0 overflow-x-auto border rounded-base custom-scrollbar'>
        <Table className='w-max min-w-full'>
          <TableHeader className='bg-gray-100'>
            <TableRow>
              <TableHead>Response ID</TableHead>
              <TableHead>Response File</TableHead>
              <TableHead>Response Name</TableHead>
              <TableHead>Bureau</TableHead>
              <TableHead>Sent Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Request File</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {letters.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className='text-center text-muted-foreground py-8'
                >
                  No outgoing letters yet.
                </TableCell>
              </TableRow>
            ) : (
              letters.map((letter) => (
                <TableRow key={letter.id}>
                  <TableCell className='font-medium py-4'>
                    {letter.id.slice(0, 8)}
                  </TableCell>
                  <TableCell>
                    {letter.fileUrl ? (
                      <a
                        href={letter.fileUrl}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='flex items-center gap-1 text-primary hover:underline'
                      >
                        <FileText className='w-4 h-4' /> View
                      </a>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell>{letter.responseLetterName}</TableCell>
                  <TableCell>
                    {letter.bureau ? (
                      <Badge className='rounded-full' variant='outline'>
                        {letter.bureau.name}
                      </Badge>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell>
                    {letter.sentDate
                      ? format(letter.sentDate, 'MMM d, yyyy')
                      : '—'}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className='rounded-full'
                      variant={letter.status === 'Sent' ? 'default' : 'outline'}
                    >
                      {letter.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {letter.requestLetter.fileUrl ? (
                      <a
                        href={letter.requestLetter.fileUrl}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='flex items-center gap-1 text-primary hover:underline'
                      >
                        <FileText className='w-4 h-4' />{' '}
                        {letter.requestLetter.name}
                      </a>
                    ) : (
                      letter.requestLetter.name
                    )}
                  </TableCell>
                  <TableCell className='text-right'>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant='ghost' disabled={isPending}>
                          <EllipsisVertical className='w-4 h-4' />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuGroup>
                          <DropdownMenuItem
                            className='text-destructive'
                            onClick={() =>
                              handleDelete(letter.id, letter.responseLetterName)
                            }
                          >
                            <Trash className='w-4 h-4 text-destructive' />{' '}
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <div className='flex justify-between items-center w-full min-w-0'>
        <div className='flex flex-row items-center gap-2'>
          <AddOutGoingLetterDialog />
        </div>
        <PaginationComponent
          currentPage={currentPage}
          totalPages={totalPages}
        />
      </div>
    </div>
  );
}
