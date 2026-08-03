"use client";

import { useEffect, useState, useTransition } from "react";
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
import { format } from "date-fns";
import { getLabels } from "@/app/actions/label-action";
import { getOptionsForLabel } from "@/lib/label-utils";
import type { Label as LabelType } from "@/lib/types";
import { addSupply } from "@/app/actions/supply-actions";
import { toast } from "sonner";
import { LabelSelectField } from "./label-select-field";

export default function AddSupplyDialog() {
  const [open, setOpen] = useState(false);
  const [labels, setLabels] = useState<LabelType[]>([]);
  const [name, setName] = useState("");
  const [size, setSize] = useState("");
  const [unit, setUnit] = useState("");
  const [categoryOptionId, setCategoryOptionId] = useState("");
  const [stockQuantity, setStockQuantity] = useState("");
  const [stockInDate, setStockInDate] = useState<Date | undefined>(new Date());
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (open) {
      getLabels().then(setLabels);
    }
  }, [open]);

  const categoryOptions = getOptionsForLabel(labels, "category");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      const result = await addSupply({
        name,
        size,
        unit,
        categoryOptionId: categoryOptionId || undefined,
        stockQuantity: Number(stockQuantity) || 0,
        stockInDate,
      });

      if (result.success) {
        toast.success(
          result.merged
            ? "Existing supply updated — stock quantity increased"
            : "Supply added",
        );
        setName("");
        setSize("");
        setUnit("");
        setCategoryOptionId("");
        setStockQuantity("");
        setStockInDate(new Date());
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
          <Plus className="w-4 h-4" /> Add a Supply
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Supply</DialogTitle>
            <DialogDescription>
              Add a new supply item to inventory.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="py-4">
            <Field>
              <FieldLabel htmlFor="supply-name">Supply Name</FieldLabel>
              <Input
                id="supply-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Bond Paper"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="supply-size">Size</FieldLabel>
              <Input
                id="supply-size"
                value={size}
                onChange={(e) => setSize(e.target.value)}
                placeholder="e.g. A4, Long, 500ml"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="supply-unit">Unit</FieldLabel>
              <Input
                id="supply-unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="e.g. pcs, ream, box"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="supply-category">Category</FieldLabel>
              <LabelSelectField
                id="supply-category"
                value={categoryOptionId}
                onValueChange={setCategoryOptionId}
                options={categoryOptions}
                placeholder="Select a category"
                emptyLabel="No categories available"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="supply-stock">Stock Quantity</FieldLabel>
              <Input
                id="supply-stock"
                type="number"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(e.target.value)}
                placeholder="0"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="supply-stock-in-date">
                Stock In Date
              </FieldLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    id="supply-stock-in-date"
                    className="justify-start px-2.5 font-normal"
                  >
                    <CalendarIcon />
                    {stockInDate ? (
                      format(stockInDate, "LLL dd, y")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={stockInDate}
                    onSelect={setStockInDate}
                  />
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
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
