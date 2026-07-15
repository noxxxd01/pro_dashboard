'use client';

import { useRef, useState, useTransition } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Button } from './ui/button';
import { Field, FieldDescription, FieldGroup, FieldLabel } from './ui/field';
import { Input } from './ui/input';
import { CalendarIcon, Plus, Upload } from 'lucide-react';
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
import { addBill } from '@/app/actions/bill-actions';
import { toast } from 'sonner';

export default function AddBillDialog() {
  const [open, setOpen] = useState(false);
  const [billName, setBillName] = useState('');
  const [billingType, setBillingType] = useState('Electricity Bill');
  const [amount, setAmount] = useState('');
  const [location, setLocation] = useState('');
  const [dateReceived, setDateReceived] = useState<Date | undefined>(
    new Date(),
  );
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [disconnectionDate, setDisconnectionDate] = useState<
    Date | undefined
  >(undefined);
  const [remarks, setRemarks] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();

  const resetForm = () => {
    setBillName('');
    setBillingType('Electricity Bill');
    setAmount('');
    setLocation('');
    setDateReceived(new Date());
    setDueDate(undefined);
    setDisconnectionDate(undefined);
    setRemarks('');
    setFile(null);
  };

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
      formData.set('billName', billName);
      formData.set('billingType', billingType);
      formData.set('amount', amount);
      formData.set('location', location);
      formData.set(
        'dateReceived',
        dateReceived ? dateReceived.toISOString() : '',
      );
      formData.set('dueDate', dueDate ? dueDate.toISOString() : '');
      formData.set(
        'disconnectionDate',
        disconnectionDate ? disconnectionDate.toISOString() : '',
      );
      formData.set('remarks', remarks);
      if (file) {
        formData.set('file', file);
      }

      const result = await addBill(formData);

      if (result.success) {
        toast.success('Bill added');
        resetForm();
        setOpen(false);
      } else {
        toast.error(result.error ?? 'Something went wrong');
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className='w-4 h-4' /> Add Bill
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-lg max-h-[85vh] overflow-y-auto'>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Bill</DialogTitle>
            <DialogDescription>
              Record a new bill for tracking.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className='py-4'>
            <Field>
              <FieldLabel htmlFor='bill-file'>Bill File</FieldLabel>
              <div className='flex items-center gap-2'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className='w-4 h-4' /> Browse file
                </Button>
                <span className='text-xs text-muted-foreground truncate'>
                  {file ? file.name : 'No file selected'}
                </span>
              </div>
              <Input
                id='bill-file'
                ref={fileInputRef}
                type='file'
                accept='image/*,application/pdf'
                className='hidden'
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              <FieldDescription>
                Select a picture or pdf of the bill.
              </FieldDescription>
            </Field>

            <Field>
              <FieldLabel htmlFor='bill-name'>Bill Name</FieldLabel>
              <Input
                id='bill-name'
                value={billName}
                onChange={(e) => setBillName(e.target.value)}
                placeholder='e.g. PLDT SDN Billing'
              />
            </Field>

            <Field>
              <FieldLabel htmlFor='bill-type'>Type of Billing</FieldLabel>
              <Select value={billingType} onValueChange={setBillingType}>
                <SelectTrigger id='bill-type'>
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
              <FieldLabel htmlFor='bill-amount'>Amount</FieldLabel>
              <Input
                id='bill-amount'
                type='number'
                step='0.01'
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder='0.00'
              />
            </Field>

            <Field>
              <FieldLabel htmlFor='bill-location'>Location/Office</FieldLabel>
              <Input
                id='bill-location'
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder='e.g. SDN Provincial Office'
              />
            </Field>

            <Field>
              <FieldLabel htmlFor='bill-received'>Date Received</FieldLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant='outline'
                    id='bill-received'
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
              <FieldLabel htmlFor='bill-due'>Due Date</FieldLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant='outline'
                    id='bill-due'
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
              <FieldLabel htmlFor='bill-disconnection'>
                Disconnection Date
              </FieldLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant='outline'
                    id='bill-disconnection'
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
              <FieldLabel htmlFor='bill-remarks'>Remarks</FieldLabel>
              <Input
                id='bill-remarks'
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder='e.g. forwarded to RO'
              />
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type='submit' disabled={isPending}>
              {isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
