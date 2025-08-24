
import React from 'react';
import { CHART_STYLES } from '../utils/chartStyles';

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  formatter?: (value: any, name?: string) => string | number;
}

export const CustomTooltip: React.FC<CustomTooltipProps> = ({ 
  active, 
  payload, 
  label, 
  formatter 
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="backdrop-blur-md bg-white/90 shadow-lg rounded-xl p-3 border border-gray-100">
        <p className="text-sm font-medium mb-1.5 text-gray-800">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} className="flex items-center gap-2 my-1">
            <div 
              className="w-2.5 h-2.5 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <p className="text-xs text-gray-700">
              <span className="font-medium">{entry.name}: </span>
              {formatter ? formatter(entry.value, entry.name) : entry.value}
            </p>
          </div>
        ))}
      </div>
    );
  }
  return null;
};
