"use client";

import React, { useEffect, useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Plus, Upload } from "lucide-react";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
  FieldSet,
} from "./ui/field";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar } from "./ui/calendar";
import { type DateRange } from "react-day-picker";
import { addDays, format } from "date-fns";
import { Input } from "./ui/input";
import type { Label as LabelType, OptionSummary } from "@/lib/types";
import { getLabels } from "@/app/actions/label-action";
import { getOptionsForLabel } from "@/lib/label-utils";
import { useDependentOptions } from "@/hooks/use-dependent-options";
import { LabelSelectField } from "./label-select-field";
import { MultiSelectField } from "./multi-select-field";
import { toast } from "sonner";
import { addActivity } from "@/app/actions/activity-actions";
import { getIndicatorsForBureauProject } from "@/app/actions/target-actions";

export default function AddDialog() {
  const [open, setOpen] = useState(false);
  const [labels, setLabels] = useState<LabelType[]>([]);

  useEffect(() => {
    if (open) getLabels().then(setLabels);
  }, [open]);

  // --- Static (non-dependent) label-backed selects ---
  const bureauOptions = getOptionsForLabel(labels, "bureau");
  const districtOptions = getOptionsForLabel(labels, "district");
  const requestingAgencyOptions = getOptionsForLabel(
    labels,
    "requesting agency",
  );
  const targetSectorOptions = getOptionsForLabel(labels, "target sector");
  const modeOfImplementationOptions = getOptionsForLabel(
    labels,
    "mode of implementation",
  );
  const responsiblePersonOptions = getOptionsForLabel(
    labels,
    "responsible person",
  );
  const statusOptions = getOptionsForLabel(labels, "status");

  // --- Simple field state ---
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(),
    to: addDays(new Date(), 20),
  });
  const [activityName, setActivityName] = useState("");
  const [activityVenue, setActivityVenue] = useState("");
  const [barangay, setBarangay] = useState("");
  const [femaleCount, setFemaleCount] = useState("");
  const [maleCount, setMaleCount] = useState("");
  const totalCount = (Number(femaleCount) || 0) + (Number(maleCount) || 0);

  // --- Single selects ---
  const [bureauOptionId, setBureauOptionId] = useState("");
  const [districtOptionId, setDistrictOptionId] = useState("");
  const [requestingAgencyId, setRequestingAgencyId] = useState("");
  const [modeOfImplementationId, setModeOfImplementationId] = useState("");
  const [statusId, setStatusId] = useState("");

  // --- Dependent selects (Bureau → Project, District → Municipality) ---
  const project = useDependentOptions(bureauOptionId);
  const municipality = useDependentOptions(districtOptionId);

  // --- Indicator options depend on Bureau + Project ---
  const [indicatorOptions, setIndicatorOptions] = useState<OptionSummary[]>(
    [],
  );

  useEffect(() => {
    if (!bureauOptionId) {
      setIndicatorOptions([]);
      return;
    }
    getIndicatorsForBureauProject(bureauOptionId, project.selectedId).then(
      setIndicatorOptions,
    );
  }, [bureauOptionId, project.selectedId]);

  // --- Multi-selects ---
  const [selectedTargetSectors, setSelectedTargetSectors] = useState<string[]>(
    [],
  );
  const [selectedResponsiblePerson, setSelectedResponsiblePerson] = useState<
    string[]
  >([]);
  const [selectedIndicators, setSelectedIndicators] = useState<string[]>([]);

  const toggleInArray =
    (setter: React.Dispatch<React.SetStateAction<string[]>>) =>
    (id: string) => {
      setter((prev) =>
        prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
      );
    };

  const toggleTargetSector = toggleInArray(setSelectedTargetSectors);
  const toggleResponsiblePerson = toggleInArray(setSelectedResponsiblePerson);
  const toggleIndicator = toggleInArray(setSelectedIndicators);

  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!activityName.trim()) {
      toast.error("Activity name is required");
      return;
    }

    startTransition(async () => {
      const result = await addActivity({
        activityName,
        activityVenue,
        selectedIndicators,
        barangay,
        dateFrom: date?.from,
        dateTo: date?.to,
        femaleCount: Number(femaleCount) || 0,
        maleCount: Number(maleCount) || 0,
        totalCount,
        bureauOptionId,
        projectOptionId: project.selectedId,
        districtOptionId,
        municipalityOptionId: municipality.selectedId,
        requestingAgencyId,
        modeOfImplementationId,
        statusId,
        selectedTargetSectors,
        selectedResponsiblePerson,
      });

      if (result.success) {
        toast.success("Activity added");
        resetForm();
        setOpen(false);
      } else {
        toast.error(result.error ?? "Something went wrong");
      }
    });
  };

  // Clear every field so the next "Add Data" starts blank — otherwise the
  // previous activity's selections (indicators, sectors, persons, etc.)
  // silently carry over into the next record.
  const resetForm = () => {
    setDate({ from: new Date(), to: addDays(new Date(), 20) });
    setActivityName("");
    setActivityVenue("");
    setBarangay("");
    setFemaleCount("");
    setMaleCount("");
    setBureauOptionId("");
    setDistrictOptionId("");
    setRequestingAgencyId("");
    setModeOfImplementationId("");
    setStatusId("");
    project.setSelectedId("");
    municipality.setSelectedId("");
    setSelectedTargetSectors([]);
    setSelectedResponsiblePerson([]);
    setSelectedIndicators([]);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" />
          Add Data
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl bg-neutral-50 overflow-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Data</DialogTitle>
            <DialogDescription>
              Fill in the details below to add new data.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="mt-4">
            <FieldSet>
              <FieldGroup className="grid grid-cols-3 gap-4">
                <Field>
                  <FieldLabel htmlFor="date-picker-range">
                    Date Picker Range
                  </FieldLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        id="date-picker-range"
                        className="justify-start px-2.5 font-normal"
                      >
                        <CalendarIcon />
                        {date?.from ? (
                          date.to ? (
                            <>
                              {format(date.from, "LLL dd, y")} -{" "}
                              {format(date.to, "LLL dd, y")}
                            </>
                          ) : (
                            format(date.from, "LLL dd, y")
                          )
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="range"
                        defaultMonth={date?.from}
                        selected={date}
                        onSelect={setDate}
                        numberOfMonths={2}
                      />
                    </PopoverContent>
                  </Popover>
                </Field>

                <Field>
                  <FieldLabel htmlFor="bureau">
                    Bureau <span className="text-destructive">*</span>
                  </FieldLabel>
                  <LabelSelectField
                    id="bureau"
                    value={bureauOptionId}
                    onValueChange={setBureauOptionId}
                    options={bureauOptions}
                    placeholder="Select a bureau"
                    emptyLabel="No bureaus available"
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="project">
                    Project <span className="text-destructive">*</span>
                  </FieldLabel>
                  <LabelSelectField
                    id="project"
                    value={project.selectedId}
                    onValueChange={project.setSelectedId}
                    options={project.options}
                    placeholder={
                      bureauOptionId
                        ? "Select a project"
                        : "Select a bureau first"
                    }
                    emptyLabel="No related projects"
                    disabled={!bureauOptionId}
                  />
                </Field>
              </FieldGroup>

              <FieldGroup className="grid grid-cols-3 gap-4">
                <Field>
                  <FieldLabel htmlFor="indicator">Indicator</FieldLabel>
                  <MultiSelectField
                    options={indicatorOptions}
                    selectedIds={selectedIndicators}
                    onToggle={toggleIndicator}
                    placeholder={
                      bureauOptionId
                        ? "Select indicators"
                        : "Select a bureau first"
                    }
                    emptyLabel="No indicators available"
                  />
                </Field>
                <Field className="col-span-2">
                  <FieldLabel htmlFor="activity-name">
                    Activity Name <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Input
                    id="activity-name"
                    placeholder="Enter activity name"
                    className="bg-white"
                    value={activityName}
                    onChange={(e) => setActivityName(e.target.value)}
                  />
                </Field>
              </FieldGroup>

              <FieldSeparator />

              <FieldGroup className="grid grid-cols-3 gap-4">
                <Field>
                  <FieldLabel htmlFor="activity-venue">
                    Activity Venue
                  </FieldLabel>
                  <Input
                    id="activity-venue"
                    placeholder="Enter activity venue"
                    className="bg-white"
                    value={activityVenue}
                    onChange={(e) => setActivityVenue(e.target.value)}
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="district">
                    District <span className="text-destructive">*</span>
                  </FieldLabel>
                  <LabelSelectField
                    id="district"
                    value={districtOptionId}
                    onValueChange={setDistrictOptionId}
                    options={districtOptions}
                    placeholder="Select a district"
                    emptyLabel="No districts available"
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="city-municipality">
                    City/Municipality{" "}
                    <span className="text-destructive">*</span>
                  </FieldLabel>
                  <LabelSelectField
                    id="city-municipality"
                    value={municipality.selectedId}
                    onValueChange={municipality.setSelectedId}
                    options={municipality.options}
                    placeholder={
                      districtOptionId
                        ? "Select a city/municipality"
                        : "Select a district first"
                    }
                    emptyLabel="No municipalities available"
                    disabled={!districtOptionId}
                  />
                </Field>
              </FieldGroup>

              <FieldGroup className="grid grid-cols-3 gap-4">
                <Field>
                  <FieldLabel htmlFor="barangay">Barangay</FieldLabel>
                  <Input
                    id="barangay"
                    placeholder={
                      municipality.selectedId
                        ? "Enter a barangay"
                        : "Select a city/municipality first"
                    }
                    className="bg-white"
                    disabled={!municipality.selectedId}
                    value={barangay}
                    onChange={(e) => setBarangay(e.target.value)}
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="requesting-agency">
                    Requesting Agency
                  </FieldLabel>
                  <LabelSelectField
                    id="requesting-agency"
                    value={requestingAgencyId}
                    onValueChange={setRequestingAgencyId}
                    options={requestingAgencyOptions}
                    placeholder="Select a requesting agency"
                    emptyLabel="No agencies available"
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="target-sector">Target Sector</FieldLabel>
                  <MultiSelectField
                    options={targetSectorOptions}
                    selectedIds={selectedTargetSectors}
                    onToggle={toggleTargetSector}
                    placeholder="Select target sectors"
                    emptyLabel="No sectors available"
                  />
                </Field>
              </FieldGroup>

              <FieldSeparator />

              <FieldGroup className="grid grid-cols-3 gap-4">
                <Field>
                  <FieldLabel htmlFor="mode-of-implementation">
                    Mode of Implementation{" "}
                    <span className="text-destructive">*</span>
                  </FieldLabel>
                  <LabelSelectField
                    id="mode-of-implementation"
                    value={modeOfImplementationId}
                    onValueChange={setModeOfImplementationId}
                    options={modeOfImplementationOptions}
                    placeholder="Select a mode of implementation"
                    emptyLabel="No mode available"
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="responsible-person">
                    Responsible Person
                  </FieldLabel>
                  <MultiSelectField
                    options={responsiblePersonOptions}
                    selectedIds={selectedResponsiblePerson}
                    onToggle={toggleResponsiblePerson}
                    placeholder="Select responsible person"
                    emptyLabel="No people available"
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="status">
                    Status <span className="text-destructive">*</span>
                  </FieldLabel>
                  <LabelSelectField
                    id="status"
                    value={statusId}
                    onValueChange={setStatusId}
                    options={statusOptions}
                    placeholder="Select a status"
                    emptyLabel="No status available"
                  />
                </Field>
              </FieldGroup>

              <FieldGroup className="grid grid-cols-3 gap-4">
                <Field>
                  <FieldLabel htmlFor="female">
                    Female <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Input
                    id="female"
                    type="number"
                    placeholder="0"
                    className="bg-white"
                    value={femaleCount}
                    onChange={(e) => setFemaleCount(e.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="male">
                    Male <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Input
                    id="male"
                    type="number"
                    placeholder="0"
                    className="bg-white"
                    value={maleCount}
                    onChange={(e) => setMaleCount(e.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="total">
                    Total <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Input
                    id="total"
                    type="number"
                    placeholder="0"
                    disabled
                    className="bg-white"
                    value={
                      femaleCount || maleCount ? totalCount.toString() : ""
                    }
                  />
                </Field>
              </FieldGroup>
            </FieldSet>

            <FieldSeparator />

            <FieldGroup className="flex flex-row justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                <Upload className="w-4 h-4" />
                {isPending ? "Saving..." : "Submit"}
              </Button>
            </FieldGroup>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  );
}
