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
import AddInGoingLetterDialog from './add-in-going-dialog';
import { Badge } from './ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { deleteLetter } from '@/app/actions/letter-actions';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface OutGoingResponse {
  id: string;
  responseLetterName: string;
  fileUrl: string | null;
}

interface LetterItem {
  id: string;
  name: string;
  type: string;
  fileUrl: string | null;
  bureau: { id: string; name: string } | null;
  receivedDate: Date | null;
  status: string;
  response: string;
  outGoingResponses: OutGoingResponse[];
}

interface InGoingLettersProps {
  letters: LetterItem[];
  currentPage: number;
  totalPages: number;
}

export default function InGoingLetters({
  letters,
  currentPage,
  totalPages,
}: InGoingLettersProps) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = (id: string, name: string) => {
    startTransition(async () => {
      const result = await deleteLetter(id);
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
              <TableHead>Letter ID</TableHead>
              <TableHead>Letter File</TableHead>
              <TableHead>Letter Name</TableHead>
              <TableHead>Letter Type</TableHead>
              <TableHead>Bureau</TableHead>
              <TableHead>Received</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Response</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {letters.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className='text-center text-muted-foreground py-8'
                >
                  No letters yet. Click "Add In-Going Letter" to create one.
                </TableCell>
              </TableRow>
            ) : (
              letters.map((letter) => {
                const latestResponse = letter.outGoingResponses[0];

                return (
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
                    <TableCell>{letter.name}</TableCell>
                    <TableCell className='capitalize'>{letter.type}</TableCell>
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
                      {letter.receivedDate
                        ? format(letter.receivedDate, 'MMM d, yyyy')
                        : '—'}
                    </TableCell>
                    <TableCell>
                      <Badge className='rounded-full'>{letter.status}</Badge>
                    </TableCell>
                    <TableCell>
                      {latestResponse?.fileUrl ? (
                        <a
                          href={latestResponse.fileUrl}
                          target='_blank'
                          rel='noopener noreferrer'
                          className='flex items-center gap-1 text-primary hover:underline'
                        >
                          <FileText className='w-4 h-4' />{' '}
                          {latestResponse.responseLetterName}
                        </a>
                      ) : (
                        letter.response
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
                                handleDelete(letter.id, letter.name)
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
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
      <div className='flex justify-between items-center w-full min-w-0'>
        <div className='flex flex-row items-center gap-2'>
          <AddInGoingLetterDialog />
        </div>
        <PaginationComponent
          currentPage={currentPage}
          totalPages={totalPages}
        />
      </div>
    </div>
  );
}
