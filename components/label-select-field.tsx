import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import type { OptionSummary } from '@/lib/types';

interface LabelSelectFieldProps {
  id: string;
  value: string;
  onValueChange: (value: string) => void;
  options: OptionSummary[];
  placeholder: string;
  emptyLabel: string;
  disabled?: boolean;
}

export function LabelSelectField({
  id,
  value,
  onValueChange,
  options,
  placeholder,
  emptyLabel,
  disabled,
}: LabelSelectFieldProps) {
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className='bg-white' id={id}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.length === 0 ? (
          <SelectItem value=''>{emptyLabel}</SelectItem>
        ) : (
          options.map((option) => (
            <SelectItem key={option.id} value={option.id}>
              {option.name}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}
