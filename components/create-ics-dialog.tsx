"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
import { Field, FieldGroup, FieldLabel } from "./ui/field";
import { Input } from "./ui/input";
import { CalendarIcon, Plus } from "lucide-react";
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
import { createICS } from "@/app/actions/equipment-actions";
import { toast } from "sonner";

// CARAGA (Region XIII) provinces
const PROVINCE_OPTIONS = [
  "Agusan del Norte",
  "Agusan del Sur",
  "Dinagat Islands",
  "Surigao del Norte",
  "Surigao del Sur",
];

export default function CreateIcsDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [office, setOffice] = useState("");
  const [poNumber, setPoNumber] = useState("");
  const [province, setProvince] = useState("Surigao del Norte");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isPending, startTransition] = useTransition();

  const resetForm = () => {
    setOffice("");
    setPoNumber("");
    setProvince("Surigao del Norte");
    setDate(new Date());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      const result = await createICS({
        office,
        poNumber,
        province,
        date,
      });

      if (result.success && result.id) {
        toast.success("ICS created");
        setOpen(false);
        resetForm();
        router.push(`/equipment-monitoring/${result.id}`);
      } else {
        toast.error(result.error ?? "Something went wrong");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4" /> Create ICS
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Inventory Custodian Slip</DialogTitle>
            <DialogDescription>
              An ICS No. will be generated automatically. You can add
              equipment items on the next screen.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="py-4">
            <Field>
              <FieldLabel htmlFor="ics-office">Office</FieldLabel>
              <Input
                id="ics-office"
                value={office}
                onChange={(e) => setOffice(e.target.value)}
                placeholder="e.g. LGU Bacuag"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="ics-po-number">PO No.</FieldLabel>
              <Input
                id="ics-po-number"
                value={poNumber}
                onChange={(e) => setPoNumber(e.target.value)}
                placeholder="e.g. PO-2026-001"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="ics-province">Province</FieldLabel>
              <Select value={province} onValueChange={setProvince}>
                <SelectTrigger id="ics-province">
                  <SelectValue placeholder="Select a province" />
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
            <Field>
              <FieldLabel htmlFor="ics-date">Date</FieldLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    id="ics-date"
                    className="justify-start px-2.5 font-normal"
                  >
                    <CalendarIcon />
                    {date ? format(date, "LLL dd, y") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={date} onSelect={setDate} />
                </PopoverContent>
              </Popover>
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !office.trim()}>
              {isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
