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
import { Field, FieldGroup, FieldLabel, FieldSeparator } from './ui/field';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { GitPullRequest, Plus, X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { getSupplies } from '@/app/actions/supply-actions';
import { getLabels } from '@/app/actions/label-action';
import { getOptionsForLabel } from '@/lib/label-utils';
import {
  generateRIS,
  releaseSupplyBatch,
} from '@/app/actions/released-supply-actions';
import { toast } from 'sonner';
import type { Label as LabelType } from '@/lib/types';

interface SupplySummary {
  id: string;
  name: string;
  stockQuantity: number;
  unit: string | null;
}

interface LineItem {
  key: string;
  supplyId: string;
  unitOfMeasure: string;
  quantity: string;
  remarks: string;
}

const OFFICE_OPTIONS = ['DICT Surigao del Norte Provincial Office'];

// CARAGA (Region XIII) provinces
const PROVINCE_OPTIONS = [
  'Agusan del Norte',
  'Agusan del Sur',
  'Dinagat Islands',
  'Surigao del Norte',
  'Surigao del Sur',
];

function emptyLineItem(key: string): LineItem {
  return { key, supplyId: '', unitOfMeasure: '', quantity: '', remarks: '' };
}

function openPdf(pdfBase64: string) {
  const byteCharacters = atob(pdfBase64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const blob = new Blob([new Uint8Array(byteNumbers)], {
    type: 'application/pdf',
  });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
  URL.revokeObjectURL(url);
}

export default function RequestSupplyDialog() {
  const [open, setOpen] = useState(false);
  const [supplies, setSupplies] = useState<SupplySummary[]>([]);
  const [labels, setLabels] = useState<LabelType[]>([]);
  const [requesteeName, setRequesteeName] = useState('');
  const [requesteeDesignation, setRequesteeDesignation] = useState('');
  const [office, setOffice] = useState(OFFICE_OPTIONS[0]);
  const [division, setDivision] = useState('');
  const [city, setCity] = useState('Surigao City');
  const [province, setProvince] = useState('Surigao del Norte');
  const [purpose, setPurpose] = useState('');
  const [approvedByName, setApprovedByName] = useState('');
  const [approvedByDesignation, setApprovedByDesignation] = useState('');
  const [issuedByName, setIssuedByName] = useState('');
  const [issuedByDesignation, setIssuedByDesignation] = useState('');
  const [items, setItems] = useState<LineItem[]>([emptyLineItem('item-0')]);
  const [isPending, startTransition] = useTransition();
  const nextKey = useRef(1);

  useEffect(() => {
    if (open) {
      getSupplies().then((result) => setSupplies(result.supplies));
      getLabels().then(setLabels);
    }
  }, [open]);

  const responsiblePersonOptions = getOptionsForLabel(
    labels,
    'responsible person',
  );

  const resetForm = () => {
    setRequesteeName('');
    setRequesteeDesignation('');
    setOffice(OFFICE_OPTIONS[0]);
    setDivision('');
    setCity('Surigao City');
    setProvince('Surigao del Norte');
    setPurpose('');
    setApprovedByName('');
    setApprovedByDesignation('');
    setIssuedByName('');
    setIssuedByDesignation('');
    setItems([emptyLineItem('item-0')]);
    nextKey.current = 1;
  };

  const addItem = () => {
    setItems((prev) => [...prev, emptyLineItem(`item-${nextKey.current++}`)]);
  };

  const removeItem = (key: string) => {
    setItems((prev) => prev.filter((item) => item.key !== key));
  };

  const updateItem = <K extends keyof LineItem>(
    key: string,
    field: K,
    value: LineItem[K],
  ) => {
    setItems((prev) =>
      prev.map((item) =>
        item.key === key ? { ...item, [field]: value } : item,
      ),
    );
  };

  // Selecting a supply auto-fills its configured unit of measure, so the
  // requester doesn't have to type "pcs"/"ream" by hand each time.
  const handleSupplySelect = (key: string, supplyId: string) => {
    const supply = supplies.find((s) => s.id === supplyId);
    setItems((prev) =>
      prev.map((item) =>
        item.key === key
          ? { ...item, supplyId, unitOfMeasure: supply?.unit ?? '' }
          : item,
      ),
    );
  };

  const hasValidItem = items.some(
    (item) => item.supplyId && Number(item.quantity) > 0,
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      const result = await releaseSupplyBatch({
        requesteeName,
        requesteeDesignation,
        office,
        division,
        city,
        province,
        purpose,
        approvedByName,
        approvedByDesignation,
        issuedByName,
        issuedByDesignation,
        items: items.map((item) => ({
          supplyId: item.supplyId,
          quantity: Number(item.quantity) || 0,
          unitOfMeasure: item.unitOfMeasure,
          remarks: item.remarks,
        })),
      });

      if (result.success) {
        toast.success('Supplies released');
        setOpen(false);

        if (result.batchId) {
          const ris = await generateRIS(result.batchId);
          if (ris.success && ris.pdfBase64) {
            openPdf(ris.pdfBase64);
          } else {
            toast.error(ris.error ?? 'Failed to generate RIS');
          }
        }

        resetForm();
      } else {
        toast.error(result.error ?? 'Something went wrong');
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <GitPullRequest className='w-4 h-4' /> Request for Supply
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-4xl overflow-y-auto max-h-[90vh]'>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Request for Supply</DialogTitle>
            <DialogDescription>
              Fill out a Requisition and Issue Slip (RIS). A PDF will be
              generated on submit.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className='py-4'>
            <div className='grid grid-cols-2 gap-4'>
              <Field>
                <FieldLabel htmlFor='release-office'>Office</FieldLabel>
                <Select value={office} onValueChange={setOffice}>
                  <SelectTrigger id='release-office'>
                    <SelectValue placeholder='Select an office' />
                  </SelectTrigger>
                  <SelectContent>
                    {OFFICE_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor='release-division'>Division</FieldLabel>
                <Select value={division} onValueChange={setDivision}>
                  <SelectTrigger id='release-division'>
                    <SelectValue placeholder='Select a division' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='Technical Operation Division (TOD)'>
                      Technical Operation Division (TOD)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <div className='grid grid-cols-2 gap-4'>
              <Field>
                <FieldLabel htmlFor='release-city'>
                  City/Municipality
                </FieldLabel>
                <Input
                  id='release-city'
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder='e.g. Surigao City'
                />
              </Field>
              <Field>
                <FieldLabel htmlFor='release-province'>Province</FieldLabel>
                <Select value={province} onValueChange={setProvince}>
                  <SelectTrigger id='release-province'>
                    <SelectValue placeholder='Select a province' />
                  </SelectTrigger>
                  <SelectContent>
                    {PROVINCE_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <FieldSeparator />

            <div className='flex flex-col gap-2'>
              <div className='flex items-center justify-between'>
                <FieldLabel>Requisition / Issuance</FieldLabel>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={addItem}
                >
                  <Plus className='w-4 h-4' /> Add item
                </Button>
              </div>

              <div className='grid grid-cols-[2fr_1fr_0.8fr_1.2fr_auto] gap-2 px-1 text-xs text-muted-foreground'>
                <span>Description</span>
                <span>Unit</span>
                <span>Qty</span>
                <span>Remarks</span>
                <span className='w-8' />
              </div>

              {items.map((item) => {
                const selectedSupply = supplies.find(
                  (s) => s.id === item.supplyId,
                );
                return (
                  <div
                    key={item.key}
                    className='grid grid-cols-[2fr_1fr_0.8fr_1.2fr_auto] gap-2 items-start'
                  >
                    <div>
                      <Select
                        value={item.supplyId}
                        onValueChange={(value) =>
                          handleSupplySelect(item.key, value)
                        }
                      >
                        <SelectTrigger className='w-full'>
                          <SelectValue placeholder='Select a supply' />
                        </SelectTrigger>
                        <SelectContent>
                          {supplies.length === 0 ? (
                            <div className='px-2 py-1.5 text-sm text-muted-foreground'>
                              No supplies available
                            </div>
                          ) : (
                            supplies.map((supply) => (
                              <SelectItem key={supply.id} value={supply.id}>
                                {supply.name} ({supply.stockQuantity} in stock)
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      {selectedSupply && (
                        <p className='text-xs text-muted-foreground mt-1'>
                          {selectedSupply.stockQuantity} available
                        </p>
                      )}
                    </div>
                    <Input
                      value={item.unitOfMeasure}
                      onChange={(e) =>
                        updateItem(item.key, 'unitOfMeasure', e.target.value)
                      }
                      placeholder='pcs, ream'
                    />
                    <Input
                      type='number'
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(item.key, 'quantity', e.target.value)
                      }
                      placeholder='0'
                      max={selectedSupply?.stockQuantity}
                    />
                    <Input
                      value={item.remarks}
                      onChange={(e) =>
                        updateItem(item.key, 'remarks', e.target.value)
                      }
                      placeholder='Optional'
                    />
                    <Button
                      type='button'
                      variant='ghost'
                      size='icon'
                      className='w-8'
                      disabled={items.length === 1}
                      onClick={() => removeItem(item.key)}
                    >
                      <X className='w-4 h-4' />
                    </Button>
                  </div>
                );
              })}
            </div>

            <FieldSeparator />

            <Field>
              <FieldLabel htmlFor='release-purpose'>Purpose</FieldLabel>
              <Textarea
                id='release-purpose'
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder='e.g. Office supplies for Q3 activities'
                rows={3}
              />
            </Field>

            <FieldSeparator />

            <div className='flex flex-col gap-2'>
              <FieldLabel>Signatories (as printed on the RIS)</FieldLabel>
              <div className='grid grid-cols-4 border text-xs'>
                {[
                  {
                    label: 'Requested by:',
                    name: requesteeName,
                    setName: setRequesteeName,
                    designation: requesteeDesignation,
                    setDesignation: setRequesteeDesignation,
                  },
                  {
                    label: 'Approved by:',
                    name: approvedByName,
                    setName: setApprovedByName,
                    designation: approvedByDesignation,
                    setDesignation: setApprovedByDesignation,
                  },
                  {
                    label: 'Issued by:',
                    name: issuedByName,
                    setName: setIssuedByName,
                    designation: issuedByDesignation,
                    setDesignation: setIssuedByDesignation,
                  },
                  {
                    label: 'Received by:',
                    name: requesteeName,
                    setName: setRequesteeName,
                    designation: requesteeDesignation,
                    setDesignation: setRequesteeDesignation,
                  },
                ].map((sig) => (
                  <div
                    key={sig.label}
                    className='flex flex-col gap-1.5 border-r p-2 last:border-r-0'
                  >
                    <span className='font-medium'>{sig.label}</span>
                    <Select value={sig.name} onValueChange={sig.setName}>
                      <SelectTrigger className='h-7 text-xs w-full'>
                        <SelectValue placeholder='Select a person' />
                      </SelectTrigger>
                      <SelectContent>
                        {responsiblePersonOptions.length === 0 ? (
                          <div className='px-2 py-1.5 text-sm text-muted-foreground'>
                            No responsible persons available
                          </div>
                        ) : (
                          responsiblePersonOptions.map((option) => (
                            <SelectItem key={option.id} value={option.name}>
                              {option.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <Input
                      value={sig.designation}
                      onChange={(e) => sig.setDesignation(e.target.value)}
                      placeholder='Designation'
                      className='h-7 text-xs'
                    />
                    <span className='border-t pt-1 text-muted-foreground'>
                      Signature
                    </span>
                    <span className='border-t pt-1 text-muted-foreground'>
                      Date
                    </span>
                  </div>
                ))}
              </div>
              <p className='text-xs text-muted-foreground'>
                Requested by and Received by share the same name/designation.
                Signature and Date are left blank for the physical printout.
              </p>
            </div>
          </FieldGroup>

          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type='submit'
              disabled={isPending || !hasValidItem || !requesteeName.trim()}
            >
              {isPending ? 'Releasing...' : 'Release'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
