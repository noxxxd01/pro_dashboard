'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Target } from 'lucide-react';
import { useEffect, useState, useTransition } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { getLabels } from '@/app/actions/label-action';
import { getOptionsForLabel } from '@/lib/label-utils';
import { getRelatedOptions } from '@/app/actions/option-actions';
import type { Label as LabelType, OptionSummary } from '@/lib/types';
import { addTargets } from '@/app/actions/target-actions';
import { toast } from 'sonner';

interface TargetField {
  id: string;
  name: string;
  target1stDistrict: string;
  target2ndDistrict: string;
  semester: string;
  year: string;
  measurementType: string;
  bureau: string;
  project: string;
}

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 4 }, (_, i) => CURRENT_YEAR - 2 + i);

export function TargetsDialog() {
  const [open, setOpen] = useState(false);
  const [labels, setLabels] = useState<LabelType[]>([]);
  const [targets, setTargets] = useState<TargetField[]>([]);
  const [projectOptionsByTarget, setProjectOptionsByTarget] = useState<
    Record<string, OptionSummary[]>
  >({});
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (open) {
      getLabels().then(setLabels);
    }
  }, [open]);

  const bureauOptions = getOptionsForLabel(labels, 'bureau');

  const addTarget = () => {
    if (targets.length > 0) return;
    setTargets([
      {
        id: crypto.randomUUID(),
        name: '',
        target1stDistrict: '',
        target2ndDistrict: '',
        semester: '',
        year: String(CURRENT_YEAR),
        measurementType: 'activities',
        bureau: '',
        project: '',
      },
    ]);
  };

  const updateTarget = (
    id: string,
    key: keyof Omit<TargetField, 'id'>,
    newValue: string,
  ) => {
    setTargets((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [key]: newValue } : t)),
    );
  };

  const handleBureauChange = (targetId: string, bureauOptionId: string) => {
    updateTarget(targetId, 'bureau', bureauOptionId);
    updateTarget(targetId, 'project', '');

    if (!bureauOptionId) {
      setProjectOptionsByTarget((prev) => ({ ...prev, [targetId]: [] }));
      return;
    }

    getRelatedOptions(bureauOptionId).then((related) => {
      setProjectOptionsByTarget((prev) => ({ ...prev, [targetId]: related }));
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (targets.length === 0) {
      toast.error('Add a target');
      return;
    }

    startTransition(async () => {
      const result = await addTargets(
        targets.map((t) => ({
          name: t.name,
          target1stDistrict: Number(t.target1stDistrict) || 0,
          target2ndDistrict: Number(t.target2ndDistrict) || 0,
          semester: t.semester,
          year: Number(t.year) || CURRENT_YEAR,
          measurementType: t.measurementType || 'activities',
          bureauOptionId: t.bureau,
          projectOptionId: t.project || undefined,
        })),
      );

      if (result.success) {
        toast.success('Targets saved');
        setTargets([]);
        setProjectOptionsByTarget({});
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
          <Target className='h-4 w-4' /> Targets
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-3xl'>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Targets</DialogTitle>
            <DialogDescription>
              Add a target for the project analytics, broken down by district.
            </DialogDescription>
          </DialogHeader>

          <div className='py-4'>
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={addTarget}
              disabled={targets.length > 0}
            >
              <Plus className='size-4' />
              Add Target
            </Button>
          </div>

          {targets.length > 0 && (
            <div className='flex flex-col gap-3'>
              {targets.map((target) => {
                const projectOptions = projectOptionsByTarget[target.id] ?? [];

                return (
                  <div key={target.id} className='flex flex-col gap-3'>
                    <Field>
                      <Label htmlFor={`target-name-${target.id}`}>
                        Indicator
                      </Label>
                      <Input
                        id={`target-name-${target.id}`}
                        type='text'
                        placeholder='e.g. Activity'
                        value={target.name}
                        onChange={(e) =>
                          updateTarget(target.id, 'name', e.target.value)
                        }
                      />
                    </Field>

                    <div className='grid grid-cols-7 gap-2 items-end'>
                      <Field>
                        <Label htmlFor={`target-1st-${target.id}`}>
                          1st District
                        </Label>
                        <Input
                          id={`target-1st-${target.id}`}
                          type='number'
                          placeholder='0'
                          value={target.target1stDistrict}
                          onChange={(e) =>
                            updateTarget(
                              target.id,
                              'target1stDistrict',
                              e.target.value,
                            )
                          }
                        />
                      </Field>

                      <Field>
                        <Label htmlFor={`target-2nd-${target.id}`}>
                          2nd District
                        </Label>
                        <Input
                          id={`target-2nd-${target.id}`}
                          type='number'
                          placeholder='0'
                          value={target.target2ndDistrict}
                          onChange={(e) =>
                            updateTarget(
                              target.id,
                              'target2ndDistrict',
                              e.target.value,
                            )
                          }
                        />
                      </Field>

                      <Field>
                        <Label htmlFor={`target-semester-${target.id}`}>
                          Semester
                        </Label>
                        <Select
                          value={target.semester}
                          onValueChange={(value) =>
                            updateTarget(target.id, 'semester', value)
                          }
                        >
                          <SelectTrigger id={`target-semester-${target.id}`}>
                            <SelectValue placeholder='Select' />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value='1st'>1st Semester</SelectItem>
                            <SelectItem value='2nd'>2nd Semester</SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>

                      <Field>
                        <Label htmlFor={`target-year-${target.id}`}>Year</Label>
                        <Select
                          value={target.year}
                          onValueChange={(value) =>
                            updateTarget(target.id, 'year', value)
                          }
                        >
                          <SelectTrigger id={`target-year-${target.id}`}>
                            <SelectValue placeholder='Select' />
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
                        <Label htmlFor={`target-measurement-${target.id}`}>
                          Measured By
                        </Label>
                        <Select
                          value={target.measurementType}
                          onValueChange={(value) =>
                            updateTarget(target.id, 'measurementType', value)
                          }
                        >
                          <SelectTrigger id={`target-measurement-${target.id}`}>
                            <SelectValue placeholder='Select' />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value='activities'>
                              Activities
                            </SelectItem>
                            <SelectItem value='participants'>
                              Participants
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>

                      <Field>
                        <Label htmlFor={`target-bureau-${target.id}`}>
                          Bureau
                        </Label>
                        <Select
                          value={target.bureau}
                          onValueChange={(value) =>
                            handleBureauChange(target.id, value)
                          }
                        >
                          <SelectTrigger id={`target-bureau-${target.id}`}>
                            <SelectValue placeholder='Select' />
                          </SelectTrigger>
                          <SelectContent>
                            {bureauOptions.length === 0 ? (
                              <div className='px-2 py-1.5 text-sm text-muted-foreground'>
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
                        <Label htmlFor={`target-project-${target.id}`}>
                          Project
                        </Label>
                        <Select
                          value={target.project}
                          onValueChange={(value) =>
                            updateTarget(target.id, 'project', value)
                          }
                          disabled={!target.bureau}
                        >
                          <SelectTrigger id={`target-project-${target.id}`}>
                            <SelectValue
                              placeholder={
                                target.bureau ? 'Select' : 'Select bureau first'
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {projectOptions.length === 0 ? (
                              <div className='px-2 py-1.5 text-sm text-muted-foreground'>
                                No related projects
                              </div>
                            ) : (
                              projectOptions.map((option) => (
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
                );
              })}
            </div>
          )}

          <DialogFooter className='mt-4'>
            <Button
              type='button'
              variant='outline'
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type='submit' disabled={isPending}>
              {isPending ? 'Saving...' : 'Save changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
