'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Field, FieldGroup } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Target, X } from 'lucide-react';
import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

interface TargetField {
  id: string;
  name: string;
  value: number | string;
  semester: string;
}

export function TargetsDialog() {
  const [targets, setTargets] = useState<TargetField[]>([]);

  const addTarget = () => {
    setTargets((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name: '', value: '', semester: '' },
    ]);
  };

  const removeTarget = (id: string) => {
    setTargets((prev) => prev.filter((target) => target.id !== id));
  };

  const updateTarget = (
    id: string,
    key: 'name' | 'value' | 'semester',
    newValue: string,
  ) => {
    setTargets((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [key]: newValue } : t)),
    );
  };

  return (
    <Dialog>
      <form>
        <DialogTrigger asChild>
          <Button>
            <Target className='h-4 w-4' /> Targets
          </Button>
        </DialogTrigger>
        <DialogContent className='sm:max-w-lg'>
          <DialogHeader>
            <DialogTitle>Add Targets</DialogTitle>
            <DialogDescription>
              Add targets for the project metrics. You can add multiple
            </DialogDescription>
          </DialogHeader>
          <div>
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={addTarget}
            >
              <Plus className='size-4' />
              Add Target
            </Button>
          </div>
          {targets.length > 0 && (
            <div className='flex flex-col gap-3'>
              {targets.map((target, index) => (
                <div key={target.id} className='flex items-end gap-2'>
                  <Field className='flex-1'>
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
                  <Field className='flex-1'>
                    <Label htmlFor={`target-value-${target.id}`}>Target</Label>
                    <Input
                      id={`target-value-${target.id}`}
                      type='number'
                      placeholder='0'
                      value={target.value}
                      onChange={(e) =>
                        updateTarget(target.id, 'value', e.target.value)
                      }
                    />
                  </Field>
                  <Field className='flex-1'>
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
                  <Button
                    type='button'
                    variant='ghost'
                    size='icon'
                    onClick={() => removeTarget(target.id)}
                  >
                    <X className='size-4' />
                  </Button>
                </div>
              ))}
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant='outline'>Cancel</Button>
            </DialogClose>
            <Button type='submit'>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  );
}
