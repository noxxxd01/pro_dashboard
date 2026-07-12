'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
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
import { getLabels } from '@/app/actions/label-action';
import { getOptionsForLabel } from '@/lib/label-utils';
import type { Label as LabelType } from '@/lib/types';
import { LabelSelectField } from './label-select-field';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  getInGoingLetterOptions,
  addOutGoingLetter,
} from '@/app/actions/letter-actions';

interface LetterOption {
  id: string;
  name: string;
}

export default function AddOutGoingLetterDialog() {
  const [open, setOpen] = useState(false);
  const [labels, setLabels] = useState<LabelType[]>([]);
  const [inGoingLetters, setInGoingLetters] = useState<LetterOption[]>([]);
  const [requestLetterId, setRequestLetterId] = useState('');
  const [responseLetterName, setResponseLetterName] = useState('');
  const [bureauOptionId, setBureauOptionId] = useState('');
  const [sentDate, setSentDate] = useState<Date | undefined>(new Date());
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (open) {
      getLabels().then(setLabels);
      getInGoingLetterOptions().then(setInGoingLetters);
    }
  }, [open]);

  const bureauOptions = getOptionsForLabel(labels, 'bureau');

  const resetForm = () => {
    setRequestLetterId('');
    setResponseLetterName('');
    setBureauOptionId('');
    setSentDate(new Date());
    setFile(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!requestLetterId) {
      toast.error('Please select a request letter');
      return;
    }
    if (!responseLetterName.trim()) {
      toast.error('Response letter name is required');
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.set('requestLetterId', requestLetterId);
      formData.set('responseLetterName', responseLetterName);
      formData.set('bureauOptionId', bureauOptionId);
      formData.set('sentDate', sentDate ? sentDate.toISOString() : '');
      if (file) {
        formData.set('file', file);
      }

      const result = await addOutGoingLetter(formData);

      if (result.success) {
        toast.success('Outgoing letter saved');
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
          <Plus className='w-4 h-4' /> Add Out-Going Letter
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-lg'>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Out-Going Letter</DialogTitle>
            <DialogDescription>
              Record a response to an existing in-going letter.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className='py-4'>
            <Field>
              <FieldLabel htmlFor='request-letter'>Request Letter</FieldLabel>
              <Select
                value={requestLetterId}
                onValueChange={setRequestLetterId}
              >
                <SelectTrigger id='request-letter'>
                  <SelectValue placeholder='Please select the request letter' />
                </SelectTrigger>
                <SelectContent>
                  {inGoingLetters.length === 0 ? (
                    <SelectItem value=''>
                      No in-going letters available
                    </SelectItem>
                  ) : (
                    inGoingLetters.map((letter) => (
                      <SelectItem key={letter.id} value={letter.id}>
                        {letter.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel htmlFor='response-letter-name'>
                Response Letter Name
              </FieldLabel>
              <Input
                id='response-letter-name'
                value={responseLetterName}
                onChange={(e) => setResponseLetterName(e.target.value)}
                placeholder='e.g. Approval for Training Support'
              />
            </Field>

            <Field>
              <FieldLabel htmlFor='letter-bureau'>Bureau</FieldLabel>
              <LabelSelectField
                id='letter-bureau'
                value={bureauOptionId}
                onValueChange={setBureauOptionId}
                options={bureauOptions}
                placeholder='Select a bureau'
                emptyLabel='No bureaus available'
              />
            </Field>

            <Field>
              <FieldLabel htmlFor='letter-sent'>Sent</FieldLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant='outline'
                    id='letter-sent'
                    className='justify-start px-2.5 font-normal'
                  >
                    <CalendarIcon />
                    {sentDate ? (
                      format(sentDate, 'LLL dd, y')
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className='w-auto p-0' align='start'>
                  <Calendar
                    mode='single'
                    selected={sentDate}
                    onSelect={setSentDate}
                  />
                </PopoverContent>
              </Popover>
            </Field>

            <Field>
              <FieldLabel htmlFor='response-file'>Response File</FieldLabel>
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
                id='response-file'
                ref={fileInputRef}
                type='file'
                accept='image/*,application/pdf'
                className='hidden'
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              <FieldDescription>
                Select a picture or pdf to upload.
              </FieldDescription>
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
