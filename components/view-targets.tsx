'use client';

import React, { useEffect, useState, useTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Eye, Pencil, Trash } from 'lucide-react';
import { getTargets, deleteTarget } from '@/app/actions/target-actions';
import { getCurrentTerm } from '@/lib/term';
import { EditTargetDialog } from './edit-target-dialog';
import { toast } from 'sonner';

type TargetItem = Awaited<ReturnType<typeof getTargets>>[number];

interface ViewTargetsProps {
  bureauName: string;
}

export default function ViewTargets({ bureauName }: ViewTargetsProps) {
  const searchParams = useSearchParams();
  const currentTerm = getCurrentTerm();
  const yearFilter = searchParams.get('year') ?? String(currentTerm.year);
  const semesterFilter = searchParams.get('semester') ?? currentTerm.semester;

  const [open, setOpen] = useState(false);
  const [targets, setTargets] = useState<TargetItem[]>([]);
  const [isPending, startTransition] = useTransition();
  const [editingTargetId, setEditingTargetId] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const refreshTargets = () => {
    getTargets(bureauName, yearFilter, semesterFilter).then(setTargets);
  };

  useEffect(() => {
    if (open) {
      refreshTargets();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, bureauName, yearFilter, semesterFilter]);

  const handleDelete = (id: string, name: string) => {
    startTransition(async () => {
      const result = await deleteTarget(id);
      if (result.success) {
        toast.success(`"${name}" removed`);
        setTargets((prev) => prev.filter((t) => t.id !== id));
      } else {
        toast.error(result.error ?? 'Something went wrong');
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant='outline'>
          <Eye className='w-4 h-4' /> View Targets
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-2xl max-h-[80vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Targets</DialogTitle>
          <DialogDescription>
            Targets currently set for {bureauName} bureau.
          </DialogDescription>
        </DialogHeader>

        <div className='flex flex-col gap-4'>
          {targets.length === 0 ? (
            <p className='text-sm text-muted-foreground text-center py-6'>
              No targets have been added yet.
            </p>
          ) : (
            <div className='grid grid-cols-1 gap-2'>
              {targets.map((target) => (
                <div
                  key={target.id}
                  className='flex items-center justify-between border px-3 py-2'
                >
                  <div className='flex flex-col gap-2'>
                    <span className='text-xs font-medium'>{target.name}</span>
                    <div className='flex items-center gap-2 flex-wrap'>
                      {target.measurementType === 'percentage' ? (
                        <Badge variant='secondary'>Target: 100%</Badge>
                      ) : (
                        <>
                          <Badge variant='secondary'>
                            1st District: {target.target1stDistrict}
                          </Badge>
                          <Badge variant='secondary'>
                            2nd District: {target.target2ndDistrict}
                          </Badge>
                        </>
                      )}
                      <Badge variant='outline'>
                        {target.semester === '1st'
                          ? '1st Semester'
                          : '2nd Semester'}
                      </Badge>
                      <Badge variant='outline'>{target.year}</Badge>
                      <Badge variant='outline'>
                        {target.measurementType === 'participants'
                          ? 'Participants'
                          : target.measurementType === 'percentage'
                            ? 'Percentage (100%)'
                            : 'Activities'}
                      </Badge>
                      {target.project && <Badge>{target.project.name}</Badge>}
                    </div>
                  </div>
                  <div className='flex items-center gap-1'>
                    <Button
                      variant='ghost'
                      size='icon'
                      disabled={isPending}
                      onClick={() => {
                        setEditingTargetId(target.id);
                        setEditOpen(true);
                      }}
                    >
                      <Pencil className='h-4 w-4' />
                    </Button>
                    <Button
                      variant='ghost'
                      size='icon'
                      disabled={isPending}
                      onClick={() => handleDelete(target.id, target.name)}
                    >
                      <Trash className='h-4 w-4 text-destructive' />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>

      {editingTargetId && (
        <EditTargetDialog
          targetId={editingTargetId}
          open={editOpen}
          onOpenChange={(next) => {
            setEditOpen(next);
            if (!next) setEditingTargetId(null);
          }}
          onSaved={refreshTargets}
        />
      )}
    </Dialog>
  );
}
