'use client';

import { useState, useTransition } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { Button } from './ui/button';
import { EllipsisVertical, FileText, Pencil, Trash } from 'lucide-react';
import { PaginationComponent } from './pagination';
import AddBillDialog from './add-bill-dialog';
import { EditBillDialog } from './edit-bill-dialog';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { deleteBill, toggleBillStatus } from '@/app/actions/bill-actions';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface BillItem {
  id: string;
  billName: string;
  billingType: string;
  fileUrl: string | null;
  amount: number;
  location: string;
  dateReceived: Date | null;
  dueDate: Date | null;
  disconnectionDate: Date | null;
  status: boolean;
  datePaid: Date | null;
  remarks: string | null;
  orLabel: string | null;
  orFileUrl: string | null;
}

interface BillsTableProps {
  bills: BillItem[];
  currentPage: number;
  totalPages: number;
}

const BILLING_TYPE_STYLES: Record<string, string> = {
  'Internet Bill': 'bg-red-100 text-red-800 border-red-200',
  'Electricity Bill': 'bg-amber-100 text-amber-800 border-amber-200',
  'Water Bill': 'bg-blue-100 text-blue-800 border-blue-200',
};

const currencyFormatter = new Intl.NumberFormat('en-PH', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function FileLink({ label, url }: { label: string | null; url: string | null }) {
  if (!url) return <span>{label ?? '—'}</span>;
  return (
    <a
      href={url}
      target='_blank'
      rel='noopener noreferrer'
      className='flex items-center gap-1 text-primary hover:underline'
    >
      <FileText className='w-4 h-4 shrink-0' />
      <span className='truncate max-w-40'>{label ?? 'View'}</span>
    </a>
  );
}

export default function BillsTable({
  bills,
  currentPage,
  totalPages,
}: BillsTableProps) {
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleDelete = (id: string, name: string) => {
    startTransition(async () => {
      const result = await deleteBill(id);
      if (result.success) {
        toast.success(`"${name}" deleted`);
      } else {
        toast.error(result.error ?? 'Something went wrong');
      }
    });
  };

  const handleToggleStatus = (id: string, checked: boolean) => {
    startTransition(async () => {
      const result = await toggleBillStatus(id, checked);
      if (!result.success) {
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
              <TableHead>Date Received</TableHead>
              <TableHead>Type of Billing</TableHead>
              <TableHead>Link to File</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Location/Office</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Disconnection Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date Paid</TableHead>
              <TableHead>Remarks</TableHead>
              <TableHead>Link to OR</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bills.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={12}
                  className='text-center text-muted-foreground py-8'
                >
                  No bills yet. Click "Add Bill" to create one.
                </TableCell>
              </TableRow>
            ) : (
              bills.map((bill) => (
                <TableRow key={bill.id}>
                  <TableCell>
                    {bill.dateReceived
                      ? format(bill.dateReceived, 'MM/dd/yyyy')
                      : '—'}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant='outline'
                      className={
                        BILLING_TYPE_STYLES[bill.billingType] ??
                        'bg-gray-100 text-gray-800 border-gray-200'
                      }
                    >
                      {bill.billingType}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <FileLink label={bill.billName} url={bill.fileUrl} />
                  </TableCell>
                  <TableCell>{currencyFormatter.format(bill.amount)}</TableCell>
                  <TableCell>
                    <span className='truncate max-w-40 block'>
                      {bill.location}
                    </span>
                  </TableCell>
                  <TableCell>
                    {bill.dueDate ? format(bill.dueDate, 'MM/dd/yyyy') : '—'}
                  </TableCell>
                  <TableCell>
                    {bill.disconnectionDate
                      ? format(bill.disconnectionDate, 'MM/dd/yyyy')
                      : '—'}
                  </TableCell>
                  <TableCell>
                    <Checkbox
                      checked={bill.status}
                      disabled={isPending}
                      onCheckedChange={(checked) =>
                        handleToggleStatus(bill.id, checked === true)
                      }
                    />
                  </TableCell>
                  <TableCell>
                    {bill.datePaid ? format(bill.datePaid, 'MM/dd/yyyy') : '—'}
                  </TableCell>
                  <TableCell>
                    <span className='truncate max-w-48 block'>
                      {bill.remarks ?? '—'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <FileLink label={bill.orLabel} url={bill.orFileUrl} />
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
                            onClick={() => setEditingId(bill.id)}
                          >
                            <Pencil className='w-4 h-4' /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className='text-destructive'
                            onClick={() => handleDelete(bill.id, bill.billName)}
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
          <AddBillDialog />
        </div>
        <PaginationComponent
          currentPage={currentPage}
          totalPages={totalPages}
        />
      </div>

      {editingId && (
        <EditBillDialog
          billId={editingId}
          open={!!editingId}
          onOpenChange={(open) => !open && setEditingId(null)}
        />
      )}
    </div>
  );
}
