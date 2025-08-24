
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format, subDays, subMonths, subWeeks, endOfDay, startOfDay } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface DateRangePickerProps {
  dateRange?: {
    from: Date;
    to: Date;
  };
  onUpdate?: (dateRange: { from: Date; to: Date; }) => void;
  onDateRangeChange?: (startDate: Date, endDate: Date) => void;
}

type PresetRange = 'today' | 'yesterday' | 'last7days' | 'last30days' | 'thisMonth' | 'lastMonth' | 'custom';

export const DateRangePicker = ({ 
  dateRange, 
  onUpdate,
  onDateRangeChange 
}: DateRangePickerProps) => {
  const initialFrom = dateRange?.from || subDays(new Date(), 6);
  const initialTo = dateRange?.to || new Date();
  
  const [startDate, setStartDate] = useState<Date>(initialFrom);
  const [endDate, setEndDate] = useState<Date>(initialTo);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [selectedRange, setSelectedRange] = useState<PresetRange>('last7days');

  const applyDateRange = (start: Date, end: Date) => {
    const normalizedStart = startOfDay(start);
    const normalizedEnd = endOfDay(end);
    setStartDate(normalizedStart);
    setEndDate(normalizedEnd);
    
    // Update using the new interface
    if (onUpdate) {
      onUpdate({ from: normalizedStart, to: normalizedEnd });
    }
    
    // Support the legacy interface for backward compatibility
    if (onDateRangeChange) {
      onDateRangeChange(normalizedStart, normalizedEnd);
    }
  };

  const handleRangeSelect = (value: PresetRange) => {
    setSelectedRange(value);
    const now = new Date();
    
    switch (value) {
      case 'today':
        applyDateRange(now, now);
        break;
      case 'yesterday':
        const yesterday = subDays(now, 1);
        applyDateRange(yesterday, yesterday);
        break;
      case 'last7days':
        applyDateRange(subDays(now, 6), now);
        break;
      case 'last30days':
        applyDateRange(subDays(now, 29), now);
        break;
      case 'thisMonth':
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        applyDateRange(thisMonth, now);
        break;
      case 'lastMonth':
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        applyDateRange(lastMonth, lastDayOfLastMonth);
        break;
      case 'custom':
        setIsCalendarOpen(true);
        break;
    }
  };

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <Select value={selectedRange} onValueChange={handleRangeSelect}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select date range" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="today">Today</SelectItem>
          <SelectItem value="yesterday">Yesterday</SelectItem>
          <SelectItem value="last7days">Last 7 days</SelectItem>
          <SelectItem value="last30days">Last 30 days</SelectItem>
          <SelectItem value="thisMonth">This month</SelectItem>
          <SelectItem value="lastMonth">Last month</SelectItem>
          <SelectItem value="custom">Custom range</SelectItem>
        </SelectContent>
      </Select>

      <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="flex justify-start text-left font-normal w-full sm:w-auto"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {format(startDate, "MMM dd, yyyy")} — {format(endDate, "MMM dd, yyyy")}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex">
            <Calendar
              mode="single"
              selected={startDate}
              onSelect={(date) => date && setStartDate(date)}
              initialFocus
            />
            <Calendar
              mode="single"
              selected={endDate}
              onSelect={(date) => date && setEndDate(date)}
            />
          </div>
          <div className="p-3 border-t border-border flex justify-end">
            <Button 
              variant="default" 
              size="sm"
              onClick={() => {
                applyDateRange(startDate, endDate);
                setIsCalendarOpen(false);
              }}
            >
              Apply Range
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};
