'use client';

import { Check, X } from 'lucide-react';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Badge } from './ui/badge';
import type { OptionSummary } from '@/lib/types';
import { CardDescription } from './ui/card';

interface MultiSelectFieldProps {
  options: OptionSummary[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  placeholder: string;
  emptyLabel: string;
}

export function MultiSelectField({
  options,
  selectedIds,
  onToggle,
  placeholder,
  emptyLabel,
}: MultiSelectFieldProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          role='combobox'
          className={`w-full justify-start font-normal overflow-hidden ${
            selectedIds.length === 0 ? 'text-muted-foreground' : ''
          }`}
        >
          {selectedIds.length === 0 && placeholder}
          <div className='flex items-center gap-1 overflow-hidden w-full'>
            {selectedIds.map((id) => {
              const option = options.find((o) => o.id === id);
              if (!option) return null;
              return (
                <Badge
                  key={id}
                  variant='secondary'
                  className='flex-none max-w-37.5'
                >
                  <span className='truncate'>{option.name}</span>
                  <div
                    className='ml-1 cursor-pointer outline-none shrink-0 hover:bg-neutral-200'
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onClick={() => onToggle(id)}
                  >
                    <X className='h-3 w-3' />
                  </div>
                </Badge>
              );
            })}
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-full p-0' align='start'>
        <div className='max-h-60 w-48 overflow-y-auto p-1'>
          {options.length === 0 ? (
            <CardDescription className='p-1'>{emptyLabel}</CardDescription>
          ) : (
            options.map((option) => {
              const isSelected = selectedIds.includes(option.id);
              return (
                <div
                  key={option.id}
                  onClick={() => onToggle(option.id)}
                  className='relative flex w-full p-1.5 justify-between cursor-pointer select-none items-center text-xs outline-none hover:bg-accent hover:text-accent-foreground'
                >
                  <span className='truncate pr-2'>{option.name}</span>
                  <span className='shrink-0 flex items-center justify-center'>
                    {isSelected && <Check className='h-4 w-4' />}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
