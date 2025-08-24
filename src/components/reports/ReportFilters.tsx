
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TIME_RANGES } from "./constants/timeRanges";
import { SalesReportFilters } from "@/types/reports";
import { Download } from "lucide-react";

interface ReportFiltersProps {
  filters?: SalesReportFilters;
  setFilters?: (filters: SalesReportFilters) => void;
  onChange?: (filters: SalesReportFilters) => void;
  initialValues?: SalesReportFilters;
  shifts?: Array<{ id: number; name: string }>;
  onExport?: () => void;
  isExporting?: boolean;
}

export const ReportFilters = ({
  filters,
  setFilters,
  onChange,
  initialValues,
  shifts,
  onExport,
  isExporting = false,
}: ReportFiltersProps) => {
  // Use the provided filters or fallback to initialValues
  const actualFilters = filters || initialValues;
  
  // Use the provided setFilters function or fallback to onChange
  const updateFilters = (newFilters: SalesReportFilters) => {
    if (setFilters) {
      setFilters(newFilters);
    } else if (onChange) {
      onChange(newFilters);
    }
  };

  const handleTimeRangeChange = (value: string) => {
    if (value === "custom" || !actualFilters) {
      return;
    }
    const range = TIME_RANGES[value as keyof typeof TIME_RANGES];
    if (range) {
      const { startDate, endDate } = range.getDates();
      updateFilters({ ...actualFilters, startDate, endDate });
    }
  };

  if (!actualFilters) return null;

  return (
    <div className="flex flex-wrap gap-4">
      <Select
        value="custom"
        onValueChange={handleTimeRangeChange}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select time range" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="custom">Custom Range</SelectItem>
          {Object.entries(TIME_RANGES).map(([key, { label }]) => (
            <SelectItem key={key} value={key}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">
              {format(actualFilters.startDate, 'PP')}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={actualFilters.startDate}
              onSelect={(date) => date && updateFilters({ ...actualFilters, startDate: date })}
            />
          </PopoverContent>
        </Popover>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">
              {format(actualFilters.endDate, 'PP')}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={actualFilters.endDate}
              onSelect={(date) => date && updateFilters({ ...actualFilters, endDate: date })}
            />
          </PopoverContent>
        </Popover>
      </div>

      <Select
        value={actualFilters.paymentMethod || "all"}
        onValueChange={(value) => updateFilters({ 
          ...actualFilters, 
          paymentMethod: value === "all" ? undefined : value 
        })}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Payment Method" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Methods</SelectItem>
          <SelectItem value="cash">Cash</SelectItem>
          <SelectItem value="credit">Credit Card</SelectItem>
          <SelectItem value="gift_card">Gift Card</SelectItem>
        </SelectContent>
      </Select>

      {shifts && (
        <Select
          value={actualFilters.shiftId?.toString() || "all"}
          onValueChange={(value) => updateFilters({ 
            ...actualFilters, 
            shiftId: value === "all" ? undefined : parseInt(value) 
          })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select Shift" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Shifts</SelectItem>
            {shifts.map((shift) => (
              <SelectItem key={shift.id} value={shift.id.toString()}>
                {shift.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {onExport && (
        <Button 
          className="ml-auto" 
          onClick={onExport}
          disabled={isExporting}
        >
          <Download className="mr-2 h-4 w-4" />
          {isExporting ? 'Exporting...' : 'Export CSV'}
        </Button>
      )}
    </div>
  );
};
