'use client';

import { Card } from './ui/card';
import { AddLabelDialog } from './add-label-dialog';
import { LabelCard } from './label-card';
import { Label } from '@/lib/types';

export default function OptionTable({ labels }: { labels: Label[] }) {
  return (
    <main className='grid grid-cols-4 gap-4'>
      {labels.map((label) => (
        <LabelCard key={label.id} label={label} />
      ))}
      <Card className='flex justify-center items-center border-dashed border mb-auto'>
        <div className='flex justify-center items-center'>
          <AddLabelDialog />{' '}
        </div>
      </Card>
    </main>
  );
}
