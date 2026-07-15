'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Field, FieldGroup, FieldLabel, FieldSeparator } from './ui/field';
import { Input } from './ui/input';
import { CalendarIcon, Upload } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import { format } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { getBillById, updateBill } from '@/app/actions/bill-actions';
import { toast } from 'sonner';

interface EditBillDialogProps {
  billId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditBillDialog({
  billId,
  open,
  onOpenChange,
}: EditBillDialogProps) {
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const [billName, setBillName] = useState('');
  const [billingType, setBillingType] = useState('Electricity Bill');
  const [amount, setAmount] = useState('');
  const [location, setLocation] = useState('');
  const [dateReceived, setDateReceived] = useState<Date | undefined>(
    undefined,
  );
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [disconnectionDate, setDisconnectionDate] = useState<
    Date | undefined
  >(undefined);
  const [remarks, setRemarks] = useState('');
  const [orLabel, setOrLabel] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [orFile, setOrFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const orFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);

    getBillById(billId).then((bill) => {
      if (bill) {
        setBillName(bill.billName);
        setBillingType(bill.billingType);
        setAmount(String(bill.amount));
        setLocation(bill.location);
        setDateReceived(bill.dateReceived ?? undefined);
        setDueDate(bill.dueDate ?? undefined);
        setDisconnectionDate(bill.disconnectionDate ?? undefined);
        setRemarks(bill.remarks ?? '');
        setOrLabel(bill.orLabel ?? '');
      }
      setFile(null);
      setOrFile(null);
      setLoading(false);
    });
  }, [open, billId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!billName.trim()) {
      toast.error('Bill name is required');
      return;
    }
    if (!location.trim()) {
      toast.error('Location/Office is required');
      return;
    }
    if (!amount || Number.isNaN(Number(amount))) {
      toast.error('A valid amount is required');
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      if (file) formData.set('file', file);
      if (orFile) formData.set('orFile', orFile);

      const result = await updateBill(
        {
          id: billId,
          billName,
          billingType,
          amount: Number(amount),
          location,
          dateReceived,
          dueDate,
          disconnectionDate,
          remarks,
          orLabel,
        },
        formData,
      );

      if (result.success) {
        toast.success('Bill updated');
        onOpenChange(false);
      } else {
        toast.error(result.error ?? 'Something went wrong');
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-lg max-h-[85vh] overflow-y-auto'>
        {loading ? (
          <div className='py-12 text-center text-sm text-muted-foreground'>
            Loading...
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Edit Bill</DialogTitle>
              <DialogDescription>Update the details below.</DialogDescription>
            </DialogHeader>

            <FieldGroup className='py-4'>
              <Field>
                <FieldLabel htmlFor='edit-bill-name'>Bill Name</FieldLabel>
                <Input
                  id='edit-bill-name'
                  value={billName}
                  onChange={(e) => setBillName(e.target.value)}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor='edit-bill-type'>
                  Type of Billing
                </FieldLabel>
                <Select value={billingType} onValueChange={setBillingType}>
                  <SelectTrigger id='edit-bill-type'>
                    <SelectValue placeholder='Select a type' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value='Internet Bill'>
                        Internet Bill
                      </SelectItem>
                      <SelectItem value='Electricity Bill'>
                        Electricity Bill
                      </SelectItem>
                      <SelectItem value='Water Bill'>Water Bill</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel htmlFor='edit-bill-amount'>Amount</FieldLabel>
                <Input
                  id='edit-bill-amount'
                  type='number'
                  step='0.01'
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor='edit-bill-location'>
                  Location/Office
                </FieldLabel>
                <Input
                  id='edit-bill-location'
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor='edit-bill-received'>
                  Date Received
                </FieldLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant='outline'
                      id='edit-bill-received'
                      className='justify-start px-2.5 font-normal'
                    >
                      <CalendarIcon />
                      {dateReceived ? (
                        format(dateReceived, 'LLL dd, y')
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className='w-auto p-0' align='start'>
                    <Calendar
                      mode='single'
                      selected={dateReceived}
                      onSelect={setDateReceived}
                    />
                  </PopoverContent>
                </Popover>
              </Field>

              <Field>
                <FieldLabel htmlFor='edit-bill-due'>Due Date</FieldLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant='outline'
                      id='edit-bill-due'
                      className='justify-start px-2.5 font-normal'
                    >
                      <CalendarIcon />
                      {dueDate ? (
                        format(dueDate, 'LLL dd, y')
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className='w-auto p-0' align='start'>
                    <Calendar
                      mode='single'
                      selected={dueDate}
                      onSelect={setDueDate}
                    />
                  </PopoverContent>
                </Popover>
              </Field>

              <Field>
                <FieldLabel htmlFor='edit-bill-disconnection'>
                  Disconnection Date
                </FieldLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant='outline'
                      id='edit-bill-disconnection'
                      className='justify-start px-2.5 font-normal'
                    >
                      <CalendarIcon />
                      {disconnectionDate ? (
                        format(disconnectionDate, 'LLL dd, y')
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className='w-auto p-0' align='start'>
                    <Calendar
                      mode='single'
                      selected={disconnectionDate}
                      onSelect={setDisconnectionDate}
                    />
                  </PopoverContent>
                </Popover>
              </Field>

              <Field>
                <FieldLabel htmlFor='edit-bill-file'>
                  Replace Bill File
                </FieldLabel>
                <div className='flex items-center gap-2'>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className='w-4 h-4' /> Browse file
                  </Button>
                  <span className='text-xs text-muted-foreground truncate'>
                    {file ? file.name : 'Keep current file'}
                  </span>
                </div>
                <Input
                  id='edit-bill-file'
                  ref={fileInputRef}
                  type='file'
                  accept='image/*,application/pdf'
                  className='hidden'
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor='edit-bill-remarks'>Remarks</FieldLabel>
                <Input
                  id='edit-bill-remarks'
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder='e.g. forwarded to RO'
                />
              </Field>

              <FieldSeparator />

              <Field>
                <FieldLabel htmlFor='edit-bill-or-label'>
                  Official Receipt Label
                </FieldLabel>
                <Input
                  id='edit-bill-or-label'
                  value={orLabel}
                  onChange={(e) => setOrLabel(e.target.value)}
                  placeholder='e.g. [electric] OR - Hill Relay'
                />
              </Field>

              <Field>
                <FieldLabel htmlFor='edit-bill-or-file'>
                  Official Receipt File
                </FieldLabel>
                <div className='flex items-center gap-2'>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={() => orFileInputRef.current?.click()}
                  >
                    <Upload className='w-4 h-4' /> Browse file
                  </Button>
                  <span className='text-xs text-muted-foreground truncate'>
                    {orFile ? orFile.name : 'Keep current file'}
                  </span>
                </div>
                <Input
                  id='edit-bill-or-file'
                  ref={orFileInputRef}
                  type='file'
                  accept='image/*,application/pdf'
                  className='hidden'
                  onChange={(e) => setOrFile(e.target.files?.[0] ?? null)}
                />
              </Field>
            </FieldGroup>

            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type='submit' disabled={isPending}>
                {isPending ? 'Saving...' : 'Save changes'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
