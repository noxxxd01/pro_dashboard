'use client';

import { useEffect, useState, useTransition } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Field, FieldGroup } from './ui/field';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { getLabels } from '@/app/actions/label-action';
import { getOptionsForLabel } from '@/lib/label-utils';
import { useDependentOptions } from '@/hooks/use-dependent-options';
import type { Label as LabelType } from '@/lib/types';
import { getTargetById, updateTarget } from '@/app/actions/target-actions';
import { toast } from 'sonner';

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 4 }, (_, i) => CURRENT_YEAR - 2 + i);

interface EditTargetDialogProps {
  targetId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export function EditTargetDialog({
  targetId,
  open,
  onOpenChange,
  onSaved,
}: EditTargetDialogProps) {
  const [labels, setLabels] = useState<LabelType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState('');
  const [target1stDistrict, setTarget1stDistrict] = useState('');
  const [target2ndDistrict, setTarget2ndDistrict] = useState('');
  const [semester, setSemester] = useState('');
  const [year, setYear] = useState(String(CURRENT_YEAR));
  const [measurementType, setMeasurementType] = useState('activities');
  const [bureauOptionId, setBureauOptionId] = useState('');

  const project = useDependentOptions(bureauOptionId);
  const bureauOptions = getOptionsForLabel(labels, 'bureau');

  useEffect(() => {
    if (!open) return;
    setLoading(true);

    Promise.all([getLabels(), getTargetById(targetId)]).then(
      ([labelsData, target]) => {
        setLabels(labelsData);

        if (target) {
          setName(target.name);
          setTarget1stDistrict(String(target.target1stDistrict));
          setTarget2ndDistrict(String(target.target2ndDistrict));
          setSemester(target.semester);
          setYear(String(target.year));
          setMeasurementType(target.measurementType);
          setBureauOptionId(target.bureauOptionId);
          project.setSelectedId(target.projectOptionId ?? '');
        }

        setLoading(false);
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, targetId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      const result = await updateTarget({
        id: targetId,
        name,
        target1stDistrict: Number(target1stDistrict) || 0,
        target2ndDistrict: Number(target2ndDistrict) || 0,
        semester,
        year: Number(year) || CURRENT_YEAR,
        measurementType,
        bureauOptionId,
        projectOptionId: project.selectedId || undefined,
      });

      if (result.success) {
        toast.success('Target updated');
        onOpenChange(false);
        onSaved();
      } else {
        toast.error(result.error ?? 'Something went wrong');
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        {loading ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            Loading...
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Edit Target</DialogTitle>
              <DialogDescription>Update the details below.</DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-3 py-4">
              <Field>
                <Label htmlFor="edit-target-name">Indicator</Label>
                <Input
                  id="edit-target-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </Field>

              <div className="grid grid-cols-7 gap-2 items-end">
                <Field>
                  <Label htmlFor="edit-target-1st">1st District</Label>
                  <Input
                    id="edit-target-1st"
                    type="number"
                    value={target1stDistrict}
                    onChange={(e) => setTarget1stDistrict(e.target.value)}
                  />
                </Field>

                <Field>
                  <Label htmlFor="edit-target-2nd">2nd District</Label>
                  <Input
                    id="edit-target-2nd"
                    type="number"
                    value={target2ndDistrict}
                    onChange={(e) => setTarget2ndDistrict(e.target.value)}
                  />
                </Field>

                <Field>
                  <Label htmlFor="edit-target-semester">Semester</Label>
                  <Select value={semester} onValueChange={setSemester}>
                    <SelectTrigger id="edit-target-semester">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1st">1st Semester</SelectItem>
                      <SelectItem value="2nd">2nd Semester</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>

                <Field>
                  <Label htmlFor="edit-target-year">Year</Label>
                  <Select value={year} onValueChange={setYear}>
                    <SelectTrigger id="edit-target-year">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {YEAR_OPTIONS.map((y) => (
                        <SelectItem key={y} value={String(y)}>
                          {y}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field>
                  <Label htmlFor="edit-target-measurement">Measured By</Label>
                  <Select
                    value={measurementType}
                    onValueChange={setMeasurementType}
                  >
                    <SelectTrigger id="edit-target-measurement">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="activities">Activities</SelectItem>
                      <SelectItem value="participants">
                        Participants
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </Field>

                <Field>
                  <Label htmlFor="edit-target-bureau">Bureau</Label>
                  <Select
                    value={bureauOptionId}
                    onValueChange={setBureauOptionId}
                  >
                    <SelectTrigger id="edit-target-bureau">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {bureauOptions.length === 0 ? (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                          No bureaus available
                        </div>
                      ) : (
                        bureauOptions.map((option) => (
                          <SelectItem key={option.id} value={option.id}>
                            {option.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </Field>

                <Field>
                  <Label htmlFor="edit-target-project">Project</Label>
                  <Select
                    value={project.selectedId}
                    onValueChange={project.setSelectedId}
                    disabled={!bureauOptionId}
                  >
                    <SelectTrigger id="edit-target-project">
                      <SelectValue
                        placeholder={
                          bureauOptionId ? 'Select' : 'Select bureau first'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {project.options.length === 0 ? (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                          No related projects
                        </div>
                      ) : (
                        project.options.map((option) => (
                          <SelectItem key={option.id} value={option.id}>
                            {option.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Saving...' : 'Save changes'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
