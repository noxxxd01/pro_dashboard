'use client';

import { useEffect, useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { toast } from 'sonner';
import { Card } from './ui/card';
import { AddLabelDialog } from './add-label-dialog';
import { LabelCard } from './label-card';
import { reorderLabels } from '@/app/actions/label-action';
import { Label } from '@/lib/types';

function SortableLabelCard({ label }: { label: Label }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: label.id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={isDragging ? 'z-10 opacity-70 cursor-grabbing' : 'cursor-grab'}
      {...attributes}
      {...listeners}
    >
      <LabelCard label={label} />
    </div>
  );
}

export default function OptionTable({ labels }: { labels: Label[] }) {
  const [items, setItems] = useState(labels);

  useEffect(() => {
    setItems(labels);
  }, [labels]);

  const sensors = useSensors(
    // The distance threshold keeps clicks on buttons/dialogs inside the
    // cards working — a drag only starts after the pointer moves 8px.
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((l) => l.id === active.id);
    const newIndex = items.findIndex((l) => l.id === over.id);
    const reordered = arrayMove(items, oldIndex, newIndex);
    setItems(reordered);

    reorderLabels(reordered.map((l) => l.id)).then((result) => {
      if (!result.success) {
        setItems(items);
        toast.error(result.error ?? 'Something went wrong');
      }
    });
  };

  return (
    <DndContext
      // Stable id keeps dnd-kit's generated aria-describedby identical
      // between server and client renders (avoids a hydration mismatch).
      id='option-table-dnd'
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items.map((l) => l.id)}
        strategy={rectSortingStrategy}
      >
        <main className='grid grid-cols-4 gap-4'>
          {items.map((label) => (
            <SortableLabelCard key={label.id} label={label} />
          ))}
          <Card className='flex justify-center items-center border-dashed border mb-auto'>
            <div className='flex justify-center items-center'>
              <AddLabelDialog />{' '}
            </div>
          </Card>
        </main>
      </SortableContext>
    </DndContext>
  );
}
