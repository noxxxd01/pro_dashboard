"use client";

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Upload } from "lucide-react";
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
import { format } from "date-fns";
import { Input } from "./ui/input";
import type { Label as LabelType, OptionSummary } from "@/lib/types";
import { getLabels } from "@/app/actions/label-action";
import { getOptionsForLabel } from "@/lib/label-utils";
import { useDependentOptions } from "@/hooks/use-dependent-options";
import { LabelSelectField } from "./label-select-field";
import { MultiSelectField } from "./multi-select-field";
import {
  getActivityById,
  updateActivity,
} from "@/app/actions/activity-actions";
import { getIndicatorsForBureauProject } from "@/app/actions/target-actions";
import { toast } from "sonner";
import { useTransition } from "react";

interface EditActivityDialogProps {
  activityId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditActivityDialog({
  activityId,
  open,
  onOpenChange,
}: EditActivityDialogProps) {
  const [labels, setLabels] = useState<LabelType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const [date, setDate] = useState<DateRange | undefined>(undefined);
  const [activityName, setActivityName] = useState("");
  const [activityVenue, setActivityVenue] = useState("");
  const [barangay, setBarangay] = useState("");
  const [femaleCount, setFemaleCount] = useState("");
  const [maleCount, setMaleCount] = useState("");
  const totalCount = (Number(femaleCount) || 0) + (Number(maleCount) || 0);

  const [bureauOptionId, setBureauOptionId] = useState("");
  const [districtOptionId, setDistrictOptionId] = useState("");
  const [requestingAgencyId, setRequestingAgencyId] = useState("");
  const [modeOfImplementationId, setModeOfImplementationId] = useState("");
  const [statusId, setStatusId] = useState("");
  const [selectedTargetSectors, setSelectedTargetSectors] = useState<string[]>(
    [],
  );
  const [selectedResponsiblePerson, setSelectedResponsiblePerson] = useState<
    string[]
  >([]);
  const [selectedIndicators, setSelectedIndicators] = useState<string[]>([]);

  const project = useDependentOptions(bureauOptionId);
  const municipality = useDependentOptions(districtOptionId);

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

  // Load labels + the activity's current values whenever the dialog opens
  useEffect(() => {
    if (!open) return;
    setLoading(true);

    Promise.all([getLabels(), getActivityById(activityId)]).then(
      ([labelsData, activity]) => {
        setLabels(labelsData);

        if (activity) {
          setDate({
            from: activity.dateFrom ?? undefined,
            to: activity.dateTo ?? undefined,
          });
          setSelectedIndicators(activity.indicators.map((i) => i.name));
          setActivityName(activity.activityName);
          setActivityVenue(activity.activityVenue ?? "");
          setBarangay(activity.barangay ?? "");
          setFemaleCount(String(activity.femaleCount ?? ""));
          setMaleCount(String(activity.maleCount ?? ""));
          setBureauOptionId(activity.bureauOptionId ?? "");
          setDistrictOptionId(activity.districtOptionId ?? "");
          setRequestingAgencyId(activity.requestingAgencyId ?? "");
          setModeOfImplementationId(activity.modeOfImplementationId ?? "");
          setStatusId(activity.statusId ?? "");
          setSelectedTargetSectors(
            activity.targetSectors.map((t) => t.optionId),
          );
          setSelectedResponsiblePerson(
            activity.responsiblePersons.map((r) => r.optionId),
          );

          // project/municipality selects populate once their dependent options load;
          // we set the id now, and useDependentOptions will fetch options for bureauOptionId/districtOptionId,
          // after which we still need to set the actual selected id manually:
          project.setSelectedId(activity.projectOptionId ?? "");
          municipality.setSelectedId(activity.municipalityOptionId ?? "");
        }

        setLoading(false);
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, activityId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      const result = await updateActivity({
        id: activityId,
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
        toast.success("Activity updated");
        onOpenChange(false);
      } else {
        toast.error(result.error ?? "Something went wrong");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl bg-neutral-50 overflow-auto">
        {loading ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            Loading...
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Edit Activity</DialogTitle>
              <DialogDescription>Update the details below.</DialogDescription>
            </DialogHeader>

            <FieldGroup>
              <FieldSet>
                <FieldGroup className="grid grid-cols-3 gap-4">
                  <Field>
                    <FieldLabel htmlFor="edit-date-picker-range">
                      Date Picker Range
                    </FieldLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          id="edit-date-picker-range"
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
                    <FieldLabel htmlFor="edit-bureau">Bureau</FieldLabel>
                    <LabelSelectField
                      id="edit-bureau"
                      value={bureauOptionId}
                      onValueChange={setBureauOptionId}
                      options={bureauOptions}
                      placeholder="Select a bureau"
                      emptyLabel="No bureaus available"
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="edit-project">Project</FieldLabel>
                    <LabelSelectField
                      id="edit-project"
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
                    <FieldLabel htmlFor="edit-indicator">Indicator</FieldLabel>
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
                    <FieldLabel htmlFor="edit-activity-name">
                      Activity Name
                    </FieldLabel>
                    <Input
                      id="edit-activity-name"
                      value={activityName}
                      onChange={(e) => setActivityName(e.target.value)}
                      className="bg-white"
                    />
                  </Field>
                </FieldGroup>

                <FieldSeparator />

                <FieldGroup className="grid grid-cols-3 gap-4">
                  <Field>
                    <FieldLabel htmlFor="edit-activity-venue">
                      Activity Venue
                    </FieldLabel>
                    <Input
                      id="edit-activity-venue"
                      value={activityVenue}
                      onChange={(e) => setActivityVenue(e.target.value)}
                      className="bg-white"
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="edit-district">District</FieldLabel>
                    <LabelSelectField
                      id="edit-district"
                      value={districtOptionId}
                      onValueChange={setDistrictOptionId}
                      options={districtOptions}
                      placeholder="Select a district"
                      emptyLabel="No districts available"
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="edit-city-municipality">
                      City/Municipality
                    </FieldLabel>
                    <LabelSelectField
                      id="edit-city-municipality"
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
                    <FieldLabel htmlFor="edit-barangay">Barangay</FieldLabel>
                    <Input
                      id="edit-barangay"
                      value={barangay}
                      onChange={(e) => setBarangay(e.target.value)}
                      className="bg-white"
                      disabled={!municipality.selectedId}
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="edit-requesting-agency">
                      Requesting Agency
                    </FieldLabel>
                    <LabelSelectField
                      id="edit-requesting-agency"
                      value={requestingAgencyId}
                      onValueChange={setRequestingAgencyId}
                      options={requestingAgencyOptions}
                      placeholder="Select a requesting agency"
                      emptyLabel="No agencies available"
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="edit-target-sector">
                      Target Sector
                    </FieldLabel>
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
                    <FieldLabel htmlFor="edit-mode-of-implementation">
                      Mode of Implementation
                    </FieldLabel>
                    <LabelSelectField
                      id="edit-mode-of-implementation"
                      value={modeOfImplementationId}
                      onValueChange={setModeOfImplementationId}
                      options={modeOfImplementationOptions}
                      placeholder="Select a mode of implementation"
                      emptyLabel="No mode available"
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="edit-responsible-person">
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
                    <FieldLabel htmlFor="edit-status">Status</FieldLabel>
                    <LabelSelectField
                      id="edit-status"
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
                    <FieldLabel htmlFor="edit-female">Female</FieldLabel>
                    <Input
                      id="edit-female"
                      type="number"
                      value={femaleCount}
                      onChange={(e) => setFemaleCount(e.target.value)}
                      className="bg-white"
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="edit-male">Male</FieldLabel>
                    <Input
                      id="edit-male"
                      type="number"
                      value={maleCount}
                      onChange={(e) => setMaleCount(e.target.value)}
                      className="bg-white"
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="edit-total">Total</FieldLabel>
                    <Input
                      id="edit-total"
                      type="number"
                      disabled
                      value={
                        femaleCount || maleCount ? totalCount.toString() : ""
                      }
                      className="bg-white"
                    />
                  </Field>
                </FieldGroup>
              </FieldSet>

              <FieldSeparator />

              <FieldGroup className="flex flex-row justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  <Upload className="w-4 h-4" />
                  {isPending ? "Saving..." : "Save changes"}
                </Button>
              </FieldGroup>
            </FieldGroup>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
