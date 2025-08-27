import * as React from 'react';
import { Calendar } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface DatePickerWithRangeProps {
  className?: string;
  date?: DateRange;
  onDateChange?: (date: DateRange | undefined) => void;
}

export function DatePickerWithRange({
  className,
  date,
  onDateChange,
}: DatePickerWithRangeProps) {
  return (
    <div className={cn('grid gap-2', className)}>
      <Button
        id="date"
        variant={'outline'}
        className={cn(
          'w-[300px] justify-start text-left font-normal',
          !date && 'text-muted-foreground'
        )}
      >
        <Calendar className="mr-2 h-4 w-4" />
        {date?.from ? (
          date.to ? (
            <>
              {date.from.toLocaleDateString()} - {date.to.toLocaleDateString()}
            </>
          ) : (
            date.from.toLocaleDateString()
          )
        ) : (
          <span>Pick a date range</span>
        )}
      </Button>
    </div>
  );
}
