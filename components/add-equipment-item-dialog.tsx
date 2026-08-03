"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Field, FieldGroup, FieldLabel, FieldSeparator } from "./ui/field";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Checkbox } from "./ui/checkbox";
import { CalendarIcon, Plus, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar } from "./ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { format } from "date-fns";
import {
  addEquipmentItems,
  getNextPropertyNumberSeed,
} from "@/app/actions/equipment-actions";
import { toast } from "sonner";

interface AddEquipmentItemDialogProps {
  icsId: string;
}

interface UnitRow {
  key: string;
  serialNumber: string;
  propertyNumber: string;
}

const USEFUL_LIFE_OPTIONS = [
  "1 year",
  "2 years",
  "3 years",
  "5 years",
  "7 years",
  "10 years",
  "15 years",
  "20 years",
];

function formatPropertyNumber(seed: number) {
  return `PN-${new Date().getFullYear()}-${String(seed).padStart(4, "0")}`;
}

export default function AddEquipmentItemDialog({
  icsId,
}: AddEquipmentItemDialogProps) {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState("");
  const [unitCost, setUnitCost] = useState("");
  const [dateAcquired, setDateAcquired] = useState<Date | undefined>();
  const [estimatedUsefulLife, setEstimatedUsefulLife] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [remarks, setRemarks] = useState("");

  const [trackSerials, setTrackSerials] = useState(false);
  const [propertyNumber, setPropertyNumber] = useState("");
  const [unitRows, setUnitRows] = useState<UnitRow[]>([]);
  const [seed, setSeed] = useState<number | null>(null);
  const nextKey = useRef(0);

  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (open) {
      getNextPropertyNumberSeed().then(setSeed);
    }
  }, [open]);

  // Pre-fill the single Property No. field once a seed is available.
  useEffect(() => {
    if (seed != null && !trackSerials && !propertyNumber) {
      setPropertyNumber(formatPropertyNumber(seed));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed, trackSerials]);

  // Start serial tracking with one row — further units are added manually
  // via "Add unit" below, since a bulk shipment's serials rarely match a
  // simple headcount typed into a Quantity field.
  useEffect(() => {
    if (trackSerials && unitRows.length === 0 && seed != null) {
      setUnitRows([
        {
          key: `unit-${nextKey.current++}`,
          serialNumber: "",
          propertyNumber: formatPropertyNumber(seed),
        },
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackSerials, seed]);

  const addUnitRow = () => {
    setUnitRows((prev) => [
      ...prev,
      {
        key: `unit-${nextKey.current++}`,
        serialNumber: "",
        propertyNumber: formatPropertyNumber((seed ?? 1) + prev.length),
      },
    ]);
  };

  const removeUnitRow = (key: string) => {
    setUnitRows((prev) => prev.filter((row) => row.key !== key));
  };

  const resetForm = () => {
    setDescription("");
    setQuantity("1");
    setUnit("");
    setUnitCost("");
    setDateAcquired(undefined);
    setEstimatedUsefulLife("");
    setAssignedTo("");
    setRemarks("");
    setTrackSerials(false);
    setPropertyNumber("");
    setUnitRows([]);
  };

  const updateUnitRow = (
    key: string,
    field: "serialNumber" | "propertyNumber",
    value: string,
  ) => {
    setUnitRows((prev) =>
      prev.map((row) => (row.key === key ? { ...row, [field]: value } : row)),
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const rows = trackSerials
      ? unitRows.map((row) => ({
          quantity: 1,
          serialNumber: row.serialNumber || undefined,
          propertyNumber: row.propertyNumber || undefined,
        }))
      : [
          {
            quantity: Number(quantity) || 0,
            propertyNumber: propertyNumber || undefined,
          },
        ];

    startTransition(async () => {
      const result = await addEquipmentItems(icsId, {
        unit,
        description,
        unitCost: unitCost ? Number(unitCost) : undefined,
        dateAcquired,
        estimatedUsefulLife,
        assignedTo,
        remarks,
        rows,
      });

      if (result.success) {
        toast.success("Equipment item added");
        resetForm();
        setOpen(false);
      } else {
        toast.error(result.error ?? "Something went wrong");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className='w-4 h-4' /> Add Equipment
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-2xl overflow-y-auto max-h-[90vh]'>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Equipment Item</DialogTitle>
            <DialogDescription>
              Add an equipment item to this ICS.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className='py-4'>
            <Field>
              <FieldLabel htmlFor='equipment-description'>
                Description
              </FieldLabel>
              <Input
                id='equipment-description'
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder='e.g. Laptop, Dell Latitude 5420'
              />
            </Field>

            <div className={trackSerials ? '' : 'grid grid-cols-2 gap-4'}>
              {!trackSerials && (
                <Field>
                  <FieldLabel htmlFor='equipment-quantity'>
                    Quantity
                  </FieldLabel>
                  <Input
                    id='equipment-quantity'
                    type='number'
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder='0'
                  />
                </Field>
              )}
              <Field>
                <FieldLabel htmlFor='equipment-unit'>Unit</FieldLabel>
                <Input
                  id='equipment-unit'
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder='e.g. unit, pcs'
                />
              </Field>
            </div>

            <div className='grid grid-cols-2 gap-4'>
              <Field>
                <FieldLabel htmlFor='equipment-unit-cost'>Unit Cost</FieldLabel>
                <Input
                  id='equipment-unit-cost'
                  type='number'
                  step='0.01'
                  value={unitCost}
                  onChange={(e) => setUnitCost(e.target.value)}
                  placeholder='0.00'
                />
              </Field>
              <Field>
                <FieldLabel htmlFor='equipment-date-acquired'>
                  Date Acquired
                </FieldLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant='outline'
                      id='equipment-date-acquired'
                      className='justify-start px-2.5 font-normal'
                    >
                      <CalendarIcon />
                      {dateAcquired ? (
                        format(dateAcquired, 'LLL dd, y')
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className='w-auto p-0' align='start'>
                    <Calendar
                      mode='single'
                      selected={dateAcquired}
                      onSelect={setDateAcquired}
                    />
                  </PopoverContent>
                </Popover>
              </Field>
            </div>

            <FieldSeparator />

            <div className='flex items-center gap-2'>
              <Checkbox
                id='equipment-track-serials'
                checked={trackSerials}
                onCheckedChange={(checked) => setTrackSerials(checked === true)}
              />
              <FieldLabel
                htmlFor='equipment-track-serials'
                className='cursor-pointer font-normal'
              >
                Track a serial number and property number per unit (for bulk
                items received with individual serial numbers)
              </FieldLabel>
            </div>

            {trackSerials ? (
              <div className='flex flex-col gap-2'>
                <div className='grid grid-cols-[1fr_1fr_auto] gap-2 px-1 text-xs text-muted-foreground'>
                  <span>Serial No.</span>
                  <span>Property No.</span>
                  <span className='w-8' />
                </div>
                {unitRows.map((row) => (
                  <div
                    key={row.key}
                    className='grid grid-cols-[1fr_1fr_auto] gap-2 items-center'
                  >
                    <Input
                      value={row.serialNumber}
                      onChange={(e) =>
                        updateUnitRow(row.key, 'serialNumber', e.target.value)
                      }
                      placeholder='Optional'
                    />
                    <Input
                      value={row.propertyNumber}
                      onChange={(e) =>
                        updateUnitRow(row.key, 'propertyNumber', e.target.value)
                      }
                    />
                    <Button
                      type='button'
                      variant='ghost'
                      size='icon'
                      className='w-8'
                      disabled={unitRows.length === 1}
                      onClick={() => removeUnitRow(row.key)}
                    >
                      <X className='w-4 h-4' />
                    </Button>
                  </div>
                ))}
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  className='self-start'
                  onClick={addUnitRow}
                >
                  <Plus className='w-4 h-4' /> Add unit
                </Button>
              </div>
            ) : (
              <Field>
                <FieldLabel htmlFor='equipment-property-number'>
                  Property No.
                </FieldLabel>
                <Input
                  id='equipment-property-number'
                  value={propertyNumber}
                  onChange={(e) => setPropertyNumber(e.target.value)}
                />
              </Field>
            )}

            <FieldSeparator />

            <Field>
              <FieldLabel htmlFor='equipment-useful-life'>
                Estimated Useful Life
              </FieldLabel>
              <Select
                value={estimatedUsefulLife}
                onValueChange={setEstimatedUsefulLife}
              >
                <SelectTrigger id='equipment-useful-life'>
                  <SelectValue placeholder='Select a duration' />
                </SelectTrigger>
                <SelectContent>
                  {USEFUL_LIFE_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel htmlFor='equipment-assigned-to'>
                Assigned/Deployed
              </FieldLabel>
              <Input
                id='equipment-assigned-to'
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                placeholder='e.g. Juan Dela Cruz, ILCDB Office'
              />
            </Field>
            <Field>
              <FieldLabel htmlFor='equipment-remarks'>Remarks</FieldLabel>
              <Textarea
                id='equipment-remarks'
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder='Optional'
                rows={2}
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
            <Button
              type='submit'
              disabled={
                isPending ||
                !description.trim() ||
                (trackSerials ? unitRows.length === 0 : !quantity)
              }
            >
              {isPending ? 'Adding...' : 'Add'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
